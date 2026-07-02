const express = require('express');
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 50, unreadOnly = false } = req.query;
    
    const query = { userId: req.user.id };
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ sentAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      read: false
    });
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error counting notifications',
      error: error.message
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: error.message
    });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );
    
    res.json({
      success: true,
      updated: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notifications',
      error: error.message
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
});

module.exports = router;

