const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/system/events/upcoming
// @desc    Get upcoming system events for admin dashboard
// @access  Private/Admin
router.get('/events/upcoming', auth, authorize('admin'), async (req, res) => {
  try {
    // Mock upcoming events for now
    // In a real application, this would fetch from a system events table
    const events = [
      {
        id: 1,
        title: 'System Maintenance',
        description: 'Scheduled maintenance for database optimization',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        type: 'maintenance',
        priority: 'medium'
      },
      {
        id: 2,
        title: 'Semester End',
        description: 'Current semester ends, prepare for final grades',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        type: 'academic',
        priority: 'high'
      },
      {
        id: 3,
        title: 'New Feature Release',
        description: 'Mobile app update with enhanced notifications',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
        type: 'feature',
        priority: 'low'
      },
      {
        id: 4,
        title: 'Security Audit',
        description: 'Quarterly security assessment and compliance check',
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
        type: 'security',
        priority: 'high'
      }
    ];

    res.json(events);
  } catch (error) {
    console.error('Get upcoming system events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;