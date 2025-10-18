const Sponsor = require('../models/sponsor.model');
const Sponsorship = require('../models/sponsorship.model');
const User = require('../models/user.model');

// Get sponsor profile
exports.getProfile = async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.user._id);

    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: sponsor
    });
  } catch (error) {
    console.error('Get sponsor profile error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get sponsor profile',
      error: error.message
    });
  }
};

// Update sponsor profile
exports.updateProfile = async (req, res) => {
  try {
    const { organizationName, organizationType, description, website, contactInfo } = req.body;

    const sponsor = await Sponsor.findById(req.user._id);

    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor not found'
      });
    }

    // Update fields if provided
    if (organizationName) sponsor.organizationInfo.name = organizationName;
    if (organizationType) sponsor.organizationInfo.type = organizationType;
    if (description) sponsor.organizationInfo.description = description;
    if (website) sponsor.organizationInfo.website = website;
    if (contactInfo) sponsor.contactInfo = contactInfo;

    await sponsor.save();

    res.status(200).json({
      success: true,
      data: sponsor,
      message: 'Sponsor profile updated successfully'
    });
  } catch (error) {
    console.error('Update sponsor profile error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update sponsor profile',
      error: error.message
    });
  }
};

// Get sponsor's active sponsorships
exports.getSponsorships = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const sponsorId = req.user._id;

    const query = { sponsor: sponsorId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const sponsorships = await Sponsorship.find(query)
      .populate('beneficiary', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Sponsorship.countDocuments(query);

    res.status(200).json({
      success: true,
      data: sponsorships,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get sponsorships error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get sponsorships',
      error: error.message
    });
  }
};
