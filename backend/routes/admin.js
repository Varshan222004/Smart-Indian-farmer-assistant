const express = require('express');
const { protect } = require('../middleware/auth');
const farmerAdviceService = require('../services/farmerAdviceService');
const scheduler = require('../services/scheduler');

const router = express.Router();

// @route   POST /api/admin/send-advice-now
// @desc    Manually trigger advice notification to all users (admin only)
// @access  Private (should add admin check in production)
router.post('/send-advice-now', protect, async (req, res) => {
  try {
    const result = await farmerAdviceService.sendAdviceToAllUsers();
    
    res.json({
      success: true,
      message: 'Advice notifications sent',
      result
    });
  } catch (error) {
    console.error('Error sending advice:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending advice notifications',
      error: error.message
    });
  }
});

// @route   GET /api/admin/scheduler-status
// @desc    Get scheduler status
// @access  Private
router.get('/scheduler-status', protect, async (req, res) => {
  try {
    const status = scheduler.getStatus();
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting scheduler status',
      error: error.message
    });
  }
});

module.exports = router;

