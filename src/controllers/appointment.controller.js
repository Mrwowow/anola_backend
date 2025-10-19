const Appointment = require('../models/appointment.model');
const User = require('../models/user.model');

// Create appointment
exports.create = async (req, res) => {
  try {
    const { providerId, date, time, reason, type = 'consultation' } = req.body;
    const patientId = req.user._id;

    if (!providerId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Provider, date, and time are required'
      });
    }

    // Check if provider exists
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient: patientId,
      provider: providerId,
      date: new Date(date),
      time,
      reason,
      type,
      status: 'scheduled'
    });

    res.status(201).json({
      success: true,
      data: appointment,
      message: 'Appointment created successfully'
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create appointment',
      error: error.message
    });
  }
};

// Get appointments
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, upcoming } = req.query;
    const userId = req.user._id;

    const query = {};

    // Check user type to determine query
    if (req.user.userType === 'patient') {
      query.patient = userId;
    } else if (req.user.userType === 'provider') {
      query.provider = userId;
    }

    if (status) query.status = status;

    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    }

    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(query)
      .populate('patient', 'profile.firstName profile.lastName email')
      .populate('provider', 'profile.firstName profile.lastName specialization')
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get appointments',
      error: error.message
    });
  }
};

// Get appointment by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const query = { _id: id };

    // Ensure user can only access their own appointments
    if (req.user.userType === 'patient') {
      query.patient = userId;
    } else if (req.user.userType === 'provider') {
      query.provider = userId;
    }

    const appointment = await Appointment.findOne(query)
      .populate('patient', 'profile.firstName profile.lastName email phone')
      .populate('provider', 'profile.firstName profile.lastName specialization');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get appointment',
      error: error.message
    });
  }
};

// Update appointment
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, status, notes } = req.body;
    const userId = req.user._id;

    const query = { _id: id };

    // Ensure user can only update their own appointments
    if (req.user.userType === 'patient') {
      query.patient = userId;
    } else if (req.user.userType === 'provider') {
      query.provider = userId;
    }

    const appointment = await Appointment.findOne(query);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update fields
    if (date) appointment.date = new Date(date);
    if (time) appointment.time = time;
    if (status) appointment.status = status;
    if (notes) appointment.notes = notes;

    await appointment.save();

    res.status(200).json({
      success: true,
      data: appointment,
      message: 'Appointment updated successfully'
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message
    });
  }
};

// Cancel appointment
exports.cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const query = { _id: id };

    if (req.user.userType === 'patient') {
      query.patient = userId;
    } else if (req.user.userType === 'provider') {
      query.provider = userId;
    }

    const appointment = await Appointment.findOne(query);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = reason || 'Cancelled by user';
    await appointment.save();

    res.status(200).json({
      success: true,
      data: appointment,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
};
