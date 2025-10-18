const Vendor = require('../models/vendor.model');

// Get vendor profile
exports.getProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user._id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error('Get vendor profile error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get vendor profile',
      error: error.message
    });
  }
};

// Update vendor profile
exports.updateProfile = async (req, res) => {
  try {
    const { businessName, businessType, description, products, services } = req.body;

    const vendor = await Vendor.findById(req.user._id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Update fields if provided
    if (businessName) vendor.businessInfo.name = businessName;
    if (businessType) vendor.businessInfo.type = businessType;
    if (description) vendor.businessInfo.description = description;
    if (products) vendor.products = products;
    if (services) vendor.services = services;

    await vendor.save();

    res.status(200).json({
      success: true,
      data: vendor,
      message: 'Vendor profile updated successfully'
    });
  } catch (error) {
    console.error('Update vendor profile error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update vendor profile',
      error: error.message
    });
  }
};
