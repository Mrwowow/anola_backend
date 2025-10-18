const MedicalRecord = require('../models/medicalRecord.model');

// Create medical record
exports.create = async (req, res) => {
  try {
    const { patientId, diagnosis, treatment, prescription, notes, attachments } = req.body;
    const providerId = req.user._id;

    // Providers create records, patients view them
    if (req.user.userType !== 'provider') {
      return res.status(403).json({
        success: false,
        message: 'Only providers can create medical records'
      });
    }

    const medicalRecord = await MedicalRecord.create({
      patient: patientId,
      provider: providerId,
      date: new Date(),
      diagnosis,
      treatment,
      prescription,
      notes,
      attachments
    });

    res.status(201).json({
      success: true,
      data: medicalRecord,
      message: 'Medical record created successfully'
    });
  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create medical record',
      error: error.message
    });
  }
};

// Get medical records
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, patientId } = req.query;
    const userId = req.user._id;

    let query = {};

    // Patients can only see their own records
    if (req.user.userType === 'patient') {
      query.patient = userId;
    }
    // Providers can see records they created
    else if (req.user.userType === 'provider') {
      if (patientId) {
        query.patient = patientId;
        query.provider = userId;
      } else {
        query.provider = userId;
      }
    }

    const skip = (page - 1) * limit;

    const records = await MedicalRecord.find(query)
      .populate('patient', 'profile.firstName profile.lastName email')
      .populate('provider', 'profile.firstName profile.lastName specialization')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MedicalRecord.countDocuments(query);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get medical records',
      error: error.message
    });
  }
};

// Get medical record by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const record = await MedicalRecord.findById(id)
      .populate('patient', 'profile.firstName profile.lastName email phone')
      .populate('provider', 'profile.firstName profile.lastName specialization');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check access permissions
    if (req.user.userType === 'patient' && record.patient._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.userType === 'provider' && record.provider._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Get medical record error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get medical record',
      error: error.message
    });
  }
};

// Update medical record
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, treatment, prescription, notes, attachments } = req.body;
    const userId = req.user._id;

    // Only providers can update records
    if (req.user.userType !== 'provider') {
      return res.status(403).json({
        success: false,
        message: 'Only providers can update medical records'
      });
    }

    const record = await MedicalRecord.findOne({
      _id: id,
      provider: userId
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Update fields
    if (diagnosis) record.diagnosis = diagnosis;
    if (treatment) record.treatment = treatment;
    if (prescription) record.prescription = prescription;
    if (notes) record.notes = notes;
    if (attachments) record.attachments = attachments;

    await record.save();

    res.status(200).json({
      success: true,
      data: record,
      message: 'Medical record updated successfully'
    });
  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update medical record',
      error: error.message
    });
  }
};
