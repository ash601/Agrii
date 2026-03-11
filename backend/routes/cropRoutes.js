const express = require('express');
const router = express.Router();
const CropListing = require('../models/CropListing');

// POST a new crop listing
router.post('/', async (req, res) => {
  try {
    const { cropName, quantity, price, sellerRole } = req.body;
    
    const newListing = new CropListing({
      cropName,
      quantity,
      price,
      sellerRole
    });

    const savedListing = await newListing.save();
    res.status(201).json(savedListing);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET all available crops
router.get('/', async (req, res) => {
  try {
    const listings = await CropListing.find().sort({ createdAt: -1 });
    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
