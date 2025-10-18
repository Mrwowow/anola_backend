const Provider = require('../models/provider.model');
const Appointment = require('../models/appointment.model');
const User = require('../models/user.model');

// Get provider profile
exports.getProfile = async (req, res) => {
  try {
    const provider = await Provider.findById(req.user._id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    res.status(200).json({
      success: true,
      data: provider
    });
  } catch (error) {
    console.error('Get provider profile error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get provider profile',
      error: error.message
    });
  }
};

// Update provider profile
exports.updateProfile = async (req, res) => {
  try {
    const { specialty, licenseNumber, bio, services, availability } = req.body;

    const provider = await Provider.findById(req.user._id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Update fields if provided
    if (specialty) provider.specialization.primary = specialty;
    if (licenseNumber) provider.credentials.licenseNumber = licenseNumber;
    if (bio) provider.profile.bio = bio;
    if (services) provider.services = services;
    if (availability) provider.availability = availability;

    await provider.save();

    res.status(200).json({
      success: true,
      data: provider,
      message: 'Provider profile updated successfully'
    });
  } catch (error) {
    console.error('Update provider profile error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update provider profile',
      error: error.message
    });
  }
};

// Get provider schedule
exports.getSchedule = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const providerId = req.user._id;

    const query = { provider: providerId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'profile.firstName profile.lastName email phone')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Get provider schedule error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get provider schedule',
      error: error.message
    });
  }
};

// Get provider patients
exports.getPatients = async (req, res) => {
  try {
    const providerId = req.user._id;

    // Get unique patients from appointments
    const appointments = await Appointment.find({ provider: providerId })
      .populate('patient', 'profile.firstName profile.lastName email phone')
      .distinct('patient');

    const patients = await User.find({
      _id: { $in: appointments }
    }).select('profile email phone healthCardId');

    res.status(200).json({
      success: true,
      data: patients
    });
  } catch (error) {
    console.error('Get provider patients error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get provider patients',
      error: error.message
    });
  }
};
