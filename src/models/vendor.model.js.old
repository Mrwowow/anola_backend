const mongoose = require('mongoose');
const User = require('./user.model');
const { VENDOR_TYPES } = require('../utils/constants');

const vendorSchema = new mongoose.Schema({
  // Business Information
  business: {
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: Object.values(VENDOR_TYPES),
      required: true
    },
    registrationNumber: String,
    taxId: String,
    licenses: [{
      type: String,
      number: String,
      issuingAuthority: String,
      validUntil: Date
    }],
    description: String,
    website: String,
    logo: {
      url: String,
      publicId: String
    }
  },
  
  // Locations
  locations: [{
    isPrimary: Boolean,
    name: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    phone: String,
    email: String,
    operatingHours: [{
      day: String,
      openTime: String,
      closeTime: String,
      isOpen: Boolean
    }],
    services: [String],
    deliveryRadius: Number // in km
  }],
  
  // Products/Services Catalog
  catalog: [{
    name: String,
    category: String,
    description: String,
    sku: String,
    price: {
      amount: Number,
      currency: String,
      discountForBulk: Number,
      discountForSponsored: Number
    },
    availability: {
      inStock: Boolean,
      quantity: Number,
      restockDate: Date
    },
    images: [{
      url: String,
      publicId: String
    }],
    requiresPrescription: Boolean,
    manufacturer: String,
    expiryDate: Date
  }],
  
  // Service Capabilities
  serviceCapabilities: {
    delivery: {
      available: Boolean,
      sameDay: Boolean,
      nextDay: Boolean,
      standard: Boolean,
      charges: {
        sameDay: Number,
        nextDay: Number,
        standard: Number,
        freeAbove: Number
      }
    },
    homeService: {
      available: Boolean,
      services: [String],
      charges: Number
    },
    insurance: {
      accepted: Boolean,
      providers: [String]
    },
    emergency: {
      available: Boolean,
      responseTime: Number // in minutes
    }
  },
  
  // Financial
  wallet: {
    type: mongoose.Schema.ObjectId,
    ref: 'Wallet'
  },
  paymentMethods: {
    cash: Boolean,
    card: Boolean,
    mobileMoney: Boolean,
    insurance: Boolean,
    sponsoredWallet: Boolean
  },
  
  // Partnerships
  partnerships: [{
    partner: {
      type: mongoose.Schema.ObjectId,
      ref: 'Provider'
    },
    type: String,
    since: Date,
    terms: String,
    discount: Number
  }],
  
  // Quality & Compliance
  certifications: [{
    name: String,
    issuingBody: String,
    validFrom: Date,
    validUntil: Date,
    documentUrl: String
  }],
  qualityMetrics: {
    orderAccuracy: Number,
    deliveryTime: Number,
    customerSatisfaction: Number
  },
  
  // Ratings and Reviews
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    categories: {
      quality: { type: Number, default: 0 },
      service: { type: Number, default: 0 },
      delivery: { type: Number, default: 0 },
      pricing: { type: Number, default: 0 }
    }
  },
  
  // Statistics
  statistics: {
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    repeatCustomers: { type: Number, default: 0 }
  }
});

// Indexes
vendorSchema.index({ 'business.type': 1 });
vendorSchema.index({ 'locations.address.coordinates': '2dsphere' });
vendorSchema.index({ 'catalog.category': 1 });
vendorSchema.index({ 'catalog.name': 'text', 'catalog.description': 'text' });
vendorSchema.index({ 'ratings.average': -1 });

// Methods
vendorSchema.methods.addProduct = function(productData) {
  this.catalog.push(productData);
  return this.save();
};

vendorSchema.methods.updateInventory = function(sku, quantity) {
  const product = this.catalog.find(p => p.sku === sku);
  if (product) {
    product.availability.quantity = quantity;
    product.availability.inStock = quantity > 0;
  }
  return this.save();
};

vendorSchema.methods.processOrder = function(orderAmount) {
  this.statistics.totalOrders += 1;
  this.statistics.totalRevenue += orderAmount;
  this.statistics.averageOrderValue = this.statistics.totalRevenue / this.statistics.totalOrders;
  return this.save();
};

vendorSchema.methods.completeOrder = function() {
  this.statistics.completedOrders += 1;
  return this.save();
};

vendorSchema.methods.updateRating = function(category, rating) {
  if (this.ratings.categories[category] !== undefined) {
    const currentCount = this.ratings.count;
    const currentAverage = this.ratings.categories[category];
    
    this.ratings.categories[category] = ((currentAverage * currentCount) + rating) / (currentCount + 1);
    this.ratings.count += 1;
    
    // Calculate overall average
    const categories = Object.values(this.ratings.categories);
    this.ratings.average = categories.reduce((sum, val) => sum + val, 0) / categories.length;
  }
  return this.save();
};

vendorSchema.methods.checkDeliveryAvailability = function(address) {
  const primaryLocation = this.locations.find(loc => loc.isPrimary);
  if (!primaryLocation || !primaryLocation.deliveryRadius) return false;
  
  // Simple distance check (you might want to use a more sophisticated geolocation service)
  // This is a placeholder implementation
  return true;
};

vendorSchema.methods.calculateDeliveryCharge = function(orderAmount, deliveryType = 'standard') {
  const delivery = this.serviceCapabilities.delivery;
  
  if (!delivery.available) return 0;
  if (orderAmount >= delivery.charges.freeAbove) return 0;
  
  return delivery.charges[deliveryType] || delivery.charges.standard;
};

const Vendor = User.discriminator('vendor', vendorSchema);
module.exports = Vendor;