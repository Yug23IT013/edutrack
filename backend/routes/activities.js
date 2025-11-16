const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/activities/admin/recent
// @desc    Get recent activities for admin dashboard
// @access  Private/Admin
router.get('/admin/recent', auth, authorize('admin'), async (req, res) => {
  try {
    // Mock recent activities for now
    // In a real application, this would fetch from an activity log table
    const activities = [
      {
        id: 1,
        action: 'User Registration',
        description: 'New student registered: john.doe@university.edu.in',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        type: 'user'
      },
      {
        id: 2,
        action: 'Course Created',
        description: 'New course created: Advanced Mathematics',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        type: 'course'
      },
      {
        id: 3,
        action: 'Announcement Posted',
        description: 'Important notice about upcoming exams',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        type: 'announcement'
      },
      {
        id: 4,
        action: 'Grade Updated',
        description: 'Grades updated for CS101 course',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        type: 'grade'
      },
      {
        id: 5,
        action: 'User Deactivated',
        description: 'User account deactivated: inactive.user@university.edu.in',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        type: 'user'
      }
    ];

    res.json(activities);
  } catch (error) {
    console.error('Get admin recent activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;