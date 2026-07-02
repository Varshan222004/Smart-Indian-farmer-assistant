const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', protect, async (req, res) => {
  try {
    const { location, landSize, landQuality, soilType, favoriteCrops, preferredLanguage } = req.body;
    
    const updateData = {};
    if (location) updateData.location = location;
    if (landSize !== undefined) updateData.landSize = landSize;
    if (landQuality) updateData.landQuality = landQuality;
    if (soilType) updateData.soilType = soilType;
    if (favoriteCrops) updateData.favoriteCrops = favoriteCrops;
    if (preferredLanguage) updateData.preferredLanguage = preferredLanguage;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

