const mongoose = require('mongoose');

const cropListingSchema = new mongoose.Schema({
  cropName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  sellerRole: {
    type: String,
    required: true,
    enum: ['Farmer', 'Cooperative', 'Supplier']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CropListing', cropListingSchema);
