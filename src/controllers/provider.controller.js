const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const crypto = require('crypto');

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

/**
 * Get provider profile
 */
exports.getProfile = async (req, res) => {
  try {
    const { providerId } = req.params;

    const provider = await User.findById(providerId)
      .select('-password -passwordResetToken -refreshTokens -twoFactorSecret -bankAccount.accountNumber -bankAccount.routingNumber');

    if (!provider) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Provider not found'
      });
    }

    if (provider.userType !== 'provider') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'User is not a provider'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      provider
    });

  } catch (error) {
    console.error('Get provider profile error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get provider profile',
      error: error.message
    });
  }
};

/**
 * Update provider profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { providerId } = req.params;

    // Check authorization
    if (req.user && req.user._id.toString() !== providerId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }

    const provider = await User.findById(providerId);

    if (!provider) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Update allowed fields
    const {
      profile,
      professionalInfo,
      practiceInfo,
      availability,
      preferences
    } = req.body;

    if (profile) {
      provider.profile = { ...provider.profile.toObject(), ...profile };
    }

    if (professionalInfo) {
      provider.professionalInfo = { ...provider.professionalInfo?.toObject(), ...professionalInfo };
    }

    if (practiceInfo) {
      provider.practiceInfo = { ...provider.practiceInfo?.toObject(), ...practiceInfo };
    }

    if (availability) {
      provider.availability = { ...provider.availability?.toObject(), ...availability };
    }

    if (preferences) {
      provider.preferences = { ...provider.preferences.toObject(), ...preferences };
    }

    await provider.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile updated successfully',
      provider
    });

  } catch (error) {
    console.error('Update provider profile error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Upload provider avatar
 */
exports.uploadAvatar = async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const provider = await User.findById(providerId);

    if (!provider) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // In production, upload to cloud storage (Cloudinary/S3)
    const avatarUrl = `https://cdn.anola.com/providers/${providerId}/avatar.jpg`;

    provider.profile.avatar = avatarUrl;
    await provider.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to upload avatar',
      error: error.message
    });
  }
};

/**
 * Get provider appointments
 */
exports.getAppointments = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { status, date, page = 1, limit = 20 } = req.query;

    const query = { provider: providerId };

    if (status) {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      query.scheduledDate = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const appointments = await Appointment.find(query)
      .populate('patient', 'profile.firstName profile.lastName profile.avatar healthCardId age gender')
      .sort({ scheduledDate: 1, 'scheduledTime.startTime': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalAppointments: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get appointments',
      error: error.message
    });
  }
};

/**
 * Get provider services
 */
exports.getServices = async (req, res) => {
  try {
    const { providerId } = req.params;

    const provider = await User.findById(providerId).select('services');

    if (!provider) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Provider not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      services: provider.services || [],
      totalServices: provider.services?.length || 0
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get services',
      error: error.message
    });
  }
};

/**
 * Add new service
 */
exports.addService = async (req, res) => {
  try {
    const { providerId } = req.params;

    const provider = await User.findById(providerId);

    if (!provider) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Provider not found'
      });
    }

    const {
      name,
      category,
      description,
      duration,
      durationType,
      price,
      insuranceCovered,
      availableModes,
      preparationInstructions
    } = req.body;

    if (!name || !duration || !price) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Name, duration, and price are required'
      });
    }

    // Validate durationType if provided
    const validDurationTypes = ['minutes', 'hours', 'days', 'months', 'years'];
    if (durationType && !validDurationTypes.includes(durationType)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid duration type. Must be one of: minutes, hours, days, months, years'
      });
    }

    const serviceId = `SRV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const newService = {
      serviceId,
      name,
      category: category || 'Consultation',
      description,
      duration,
      durationType: durationType || 'minutes',
      price,
      insuranceCovered: insuranceCovered !== undefined ? insuranceCovered : true,
      availableModes: availableModes || ['in-person'],
      preparationInstructions,
      isActive: true,
      totalBookings: 0,
      createdAt: new Date()
    };

    if (!provider.services) {
      provider.services = [];
    }

    provider.services.push(newService);
    await provider.save();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Service added successfully',
      service: newService
    });

  } catch (error) {
    console.error('Add service error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to add service',
      error: error.message
    });
  }
};

/**
 * Update service
 */
exports.updateService = async (req, res) => {
  try {
    const { providerId, serviceId } = req.params;

    const provider = await User.findById(providerId);

    if (!provider) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Find service by either serviceId (SRV-XXX) or MongoDB _id
    const service = provider.services?.find(s =>
      s.serviceId === serviceId || s._id.toString() === serviceId
    );

    if (!service) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Validate durationType if provided
    if (req.body.durationType) {
      const validDurationTypes = ['minutes', 'hours', 'days', 'months', 'years'];
      if (!validDurationTypes.includes(req.body.durationType)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid duration type. Must be one of: minutes, hours, days, months, years'
        });
      }
    }

    // Map field names (support both serviceName and name)
    const updateData = { ...req.body };
    if (updateData.serviceName) {
      updateData.name = updateData.serviceName;
      delete updateData.serviceName;
    }

    // Update service fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'serviceId') {
        service[key] = updateData[key];
      }
    });

    await provider.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Service updated successfully',
      service
    });

  } catch (error) {
    console.error('Update service error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update service',
      error: error.message
    });
  }
};

/**
 * Delete/deactivate service
 */
exports.deleteService = async (req, res) => {
  try {
    const { providerId, serviceId } = req.params;

    const provider = await User.findById(providerId);

    if (!provider) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Find service by either serviceId (SRV-XXX) or MongoDB _id
    const service = provider.services?.find(s =>
      s.serviceId === serviceId || s._id.toString() === serviceId
    );

    if (!service) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Deactivate instead of delete
    service.isActive = false;
    service.deactivatedAt = new Date();

    await provider.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Service deactivated successfully',
      service
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message
    });
  }
};

// Legacy exports for backwards compatibility
exports.getSchedule = exports.getAppointments;
exports.getPatients = async (req, res) => {
  try {
    const providerId = req.params.providerId || req.user?._id;

    // Get unique patients from appointments
    const appointments = await Appointment.find({ provider: providerId })
      .distinct('patient');

    const patients = await User.find({
      _id: { $in: appointments }
    }).select('profile email phone healthCardId medicalHistory');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      patients,
      totalPatients: patients.length
    });
  } catch (error) {
    console.error('Get provider patients error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get provider patients',
      error: error.message
    });
  }
};

/**
 * Get all providers with filtering and pagination
 */
exports.getAllProviders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      providerType,
      specialization,
      practiceType,
      city,
      state,
      acceptsInsurance,
      consultationMode,
      search
    } = req.query;

    // Build query
    const query = { userType: 'provider' };

    if (providerType) {
      query.providerType = providerType;
    }

    if (specialization) {
      query['professionalInfo.specialization'] = new RegExp(specialization, 'i');
    }

    if (practiceType) {
      query['practiceInfo.practiceType'] = practiceType;
    }

    if (city) {
      query['practiceInfo.practiceAddress.city'] = new RegExp(city, 'i');
    }

    if (state) {
      query['practiceInfo.practiceAddress.state'] = new RegExp(state, 'i');
    }

    if (acceptsInsurance !== undefined) {
      query['practiceInfo.acceptsInsurance'] = acceptsInsurance === 'true';
    }

    if (consultationMode) {
      query['practiceInfo.consultationModes'] = consultationMode;
    }

    // Search across multiple fields
    if (search) {
      query.$or = [
        { 'profile.firstName': new RegExp(search, 'i') },
        { 'profile.lastName': new RegExp(search, 'i') },
        { 'practiceInfo.practiceName': new RegExp(search, 'i') },
        { 'professionalInfo.specialization': new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const providers = await User.find(query)
      .select('-password -passwordResetToken -refreshTokens -twoFactorSecret')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      providers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProviders: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get all providers error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get providers',
      error: error.message
    });
  }
};

/**
 * Search services across all providers
 */
exports.searchServices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      search,
      category,
      minPrice,
      maxPrice,
      durationType,
      city,
      state
    } = req.query;

    // Build query for providers
    const providerQuery = { userType: 'provider', 'services.0': { $exists: true } };

    if (city) {
      providerQuery['practiceInfo.practiceAddress.city'] = new RegExp(city, 'i');
    }

    if (state) {
      providerQuery['practiceInfo.practiceAddress.state'] = new RegExp(state, 'i');
    }

    // Get all providers with services
    const providers = await User.find(providerQuery)
      .select('providerCode profile practiceInfo services professionalInfo statistics');

    // Flatten and filter services
    let allServices = [];

    providers.forEach(provider => {
      if (provider.services && provider.services.length > 0) {
        provider.services.forEach(service => {
          if (service.isActive) {
            // Apply service-level filters
            let includeService = true;

            if (search) {
              const searchLower = search.toLowerCase();
              includeService =
                service.name.toLowerCase().includes(searchLower) ||
                (service.description && service.description.toLowerCase().includes(searchLower));
            }

            if (category && service.category !== category) {
              includeService = false;
            }

            if (minPrice && service.price < parseFloat(minPrice)) {
              includeService = false;
            }

            if (maxPrice && service.price > parseFloat(maxPrice)) {
              includeService = false;
            }

            if (durationType && service.durationType !== durationType) {
              includeService = false;
            }

            if (includeService) {
              allServices.push({
                serviceId: service.serviceId,
                name: service.name,
                category: service.category,
                description: service.description,
                duration: service.duration,
                durationType: service.durationType,
                price: service.price,
                insuranceCovered: service.insuranceCovered,
                availableModes: service.availableModes,
                provider: {
                  id: provider._id,
                  code: provider.providerCode,
                  name: `${provider.profile?.firstName || ''} ${provider.profile?.lastName || ''}`.trim(),
                  practiceName: provider.practiceInfo?.practiceName,
                  specialization: provider.professionalInfo?.specialization,
                  city: provider.practiceInfo?.practiceAddress?.city,
                  state: provider.practiceInfo?.practiceAddress?.state,
                  rating: provider.statistics?.rating || 0,
                  totalReviews: provider.statistics?.totalReviews || 0
                }
              });
            }
          }
        });
      }
    });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedServices = allServices.slice(skip, skip + parseInt(limit));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      services: paginatedServices,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allServices.length / parseInt(limit)),
        totalServices: allServices.length,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Search services error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to search services',
      error: error.message
    });
  }
};

/**
 * Get provider analytics
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { period = 'month' } = req.query; // day, week, month, year, all

    // Verify provider exists
    const provider = await User.findById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Get appointments for the period
    const appointments = await Appointment.find({
      provider: providerId,
      createdAt: { $gte: startDate }
    });

    // Calculate appointment analytics
    const appointmentStats = {
      total: appointments.length,
      scheduled: appointments.filter(a => a.status === 'scheduled').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      noShow: appointments.filter(a => a.status === 'no-show').length,
      byMode: {
        'in-person': appointments.filter(a => a.mode === 'in-person').length,
        video: appointments.filter(a => a.mode === 'video').length,
        audio: appointments.filter(a => a.mode === 'audio').length,
        chat: appointments.filter(a => a.mode === 'chat').length
      },
      byType: {}
    };

    // Count by appointment type
    appointments.forEach(appointment => {
      const type = appointment.type || 'other';
      appointmentStats.byType[type] = (appointmentStats.byType[type] || 0) + 1;
    });

    // Calculate revenue analytics
    const completedAppointments = appointments.filter(a => a.status === 'completed');
    const totalRevenue = completedAppointments.reduce((sum, a) => sum + (a.payment?.amount || 0), 0);
    const pendingPayments = appointments
      .filter(a => a.status === 'completed' && a.payment?.status !== 'paid')
      .reduce((sum, a) => sum + (a.payment?.amount || 0), 0);

    const revenueStats = {
      total: totalRevenue,
      pending: pendingPayments,
      received: totalRevenue - pendingPayments,
      averagePerAppointment: completedAppointments.length > 0
        ? totalRevenue / completedAppointments.length
        : 0
    };

    // Service performance
    const serviceStats = {};
    appointments.forEach(appointment => {
      if (appointment.serviceId) {
        if (!serviceStats[appointment.serviceId]) {
          serviceStats[appointment.serviceId] = {
            bookings: 0,
            revenue: 0
          };
        }
        serviceStats[appointment.serviceId].bookings++;
        if (appointment.status === 'completed') {
          serviceStats[appointment.serviceId].revenue += (appointment.payment?.amount || 0);
        }
      }
    });

    // Get top services from provider's services
    const topServices = provider.services
      .map(service => ({
        serviceId: service.serviceId,
        name: service.name,
        price: service.price,
        bookings: serviceStats[service.serviceId]?.bookings || 0,
        revenue: serviceStats[service.serviceId]?.revenue || 0
      }))
      .sort((a, b) => b.bookings - b.bookings)
      .slice(0, 5);

    // Patient analytics
    const uniquePatients = [...new Set(appointments.map(a => a.patient.toString()))];
    const patientStats = {
      total: uniquePatients.length,
      new: appointments.filter(a => {
        const patientAppointments = appointments.filter(
          ap => ap.patient.toString() === a.patient.toString()
        );
        return patientAppointments.length === 1;
      }).length,
      returning: 0
    };
    patientStats.returning = patientStats.total - patientStats.new;

    // Time-based trends (daily breakdown for the period)
    const dailyStats = [];
    const dayInMs = 24 * 60 * 60 * 1000;
    const periodDays = Math.min(Math.ceil((Date.now() - startDate.getTime()) / dayInMs), 30);

    for (let i = 0; i < periodDays; i++) {
      const dayStart = new Date(startDate.getTime() + (i * dayInMs));
      const dayEnd = new Date(dayStart.getTime() + dayInMs);

      const dayAppointments = appointments.filter(a => {
        const appointmentDate = new Date(a.createdAt);
        return appointmentDate >= dayStart && appointmentDate < dayEnd;
      });

      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        appointments: dayAppointments.length,
        revenue: dayAppointments
          .filter(a => a.status === 'completed')
          .reduce((sum, a) => sum + (a.payment?.amount || 0), 0)
      });
    }

    // Overall performance metrics
    const performanceMetrics = {
      completionRate: appointments.length > 0
        ? (appointmentStats.completed / appointments.length * 100).toFixed(2)
        : 0,
      cancellationRate: appointments.length > 0
        ? (appointmentStats.cancelled / appointments.length * 100).toFixed(2)
        : 0,
      noShowRate: appointments.length > 0
        ? (appointmentStats.noShow / appointments.length * 100).toFixed(2)
        : 0,
      averageRating: provider.statistics?.rating || 0,
      totalReviews: provider.statistics?.totalReviews || 0
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      period,
      startDate,
      endDate: new Date(),
      analytics: {
        appointments: appointmentStats,
        revenue: revenueStats,
        patients: patientStats,
        topServices,
        dailyTrends: dailyStats,
        performance: performanceMetrics
      },
      summary: {
        totalAppointments: appointmentStats.total,
        totalRevenue: revenueStats.total,
        totalPatients: patientStats.total,
        averageRating: performanceMetrics.averageRating
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
};
