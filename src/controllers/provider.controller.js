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

    const serviceId = `SRV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const newService = {
      serviceId,
      name,
      category: category || 'Consultation',
      description,
      duration,
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

    const service = provider.services?.find(s => s.serviceId === serviceId);

    if (!service) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Update service fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== 'serviceId') {
        service[key] = req.body[key];
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

    const service = provider.services?.find(s => s.serviceId === serviceId);

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
