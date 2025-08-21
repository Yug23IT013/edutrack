const express = require('express');
const Timetable = require('../models/Timetable');
const Course = require('../models/Course');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/timetable
// @desc    Get timetable based on user role
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { role } = req.user;
    let query = { isActive: true };

    if (role === 'student') {
      // Students see timetables for their enrolled courses
      const enrolledCourses = req.user.enrolledCourses || [];
      if (enrolledCourses.length === 0) {
        return res.json([]);
      }
      query.course = { $in: enrolledCourses };
    } else if (role === 'teacher') {
      // Teachers see timetables for courses they teach
      const teachingCourses = req.user.teachingCourses || [];
      if (teachingCourses.length === 0) {
        return res.json([]);
      }
      query.course = { $in: teachingCourses };
    }
    // Admin sees all timetables by default

    const timetable = await Timetable.find(query)
      .populate('course', 'name code')
      .populate('teacher', 'name email')
      .sort({ day: 1, startTime: 1 });

    res.json(timetable);
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/timetable/day/:day
// @desc    Get timetable for a specific day
// @access  Private
router.get('/day/:day', auth, async (req, res) => {
  try {
    const { day } = req.params;
    const { role } = req.user;
    let query = { day, isActive: true };

    if (role === 'student') {
      const enrolledCourses = req.user.enrolledCourses || [];
      if (enrolledCourses.length === 0) {
        return res.json([]);
      }
      query.course = { $in: enrolledCourses };
    } else if (role === 'teacher') {
      const teachingCourses = req.user.teachingCourses || [];
      if (teachingCourses.length === 0) {
        return res.json([]);
      }
      query.course = { $in: teachingCourses };
    }

    const dayTimetable = await Timetable.find(query)
      .populate('course', 'name code')
      .populate('teacher', 'name email')
      .sort({ startTime: 1 });

    res.json(dayTimetable);
  } catch (error) {
    console.error('Get day timetable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/timetable
// @desc    Create a new timetable entry
// @access  Private/Teacher/Admin
router.post('/', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { day, startTime, endTime, courseId, teacherId, room, type } = req.body;

    // Validate that the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Validate that the teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Check for time conflicts
    const conflictQuery = {
      day,
      isActive: true,
      $or: [
        { teacher: teacherId },
        { course: courseId, room }
      ],
      $and: [
        {
          $or: [
            { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
          ]
        }
      ]
    };

    const conflicts = await Timetable.find(conflictQuery);
    if (conflicts.length > 0) {
      return res.status(400).json({ 
        message: 'Time conflict detected. Teacher or room is already booked during this time.' 
      });
    }

    const timetableEntry = new Timetable({
      day,
      startTime,
      endTime,
      course: courseId,
      teacher: teacherId,
      room,
      type: type || 'lecture'
    });

    await timetableEntry.save();

    const populatedEntry = await Timetable.findById(timetableEntry._id)
      .populate('course', 'name code')
      .populate('teacher', 'name email');

    res.status(201).json(populatedEntry);
  } catch (error) {
    console.error('Create timetable entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/timetable/:id
// @desc    Update a timetable entry
// @access  Private/Teacher/Admin
router.put('/:id', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { day, startTime, endTime, courseId, teacherId, room, type } = req.body;
    const entryId = req.params.id;

    const timetableEntry = await Timetable.findById(entryId);
    if (!timetableEntry) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }

    // Check for time conflicts (excluding current entry)
    const conflictQuery = {
      _id: { $ne: entryId },
      day,
      isActive: true,
      $or: [
        { teacher: teacherId },
        { course: courseId, room }
      ],
      $and: [
        {
          $or: [
            { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
          ]
        }
      ]
    };

    const conflicts = await Timetable.find(conflictQuery);
    if (conflicts.length > 0) {
      return res.status(400).json({ 
        message: 'Time conflict detected. Teacher or room is already booked during this time.' 
      });
    }

    // Update the entry
    timetableEntry.day = day || timetableEntry.day;
    timetableEntry.startTime = startTime || timetableEntry.startTime;
    timetableEntry.endTime = endTime || timetableEntry.endTime;
    timetableEntry.course = courseId || timetableEntry.course;
    timetableEntry.teacher = teacherId || timetableEntry.teacher;
    timetableEntry.room = room || timetableEntry.room;
    timetableEntry.type = type || timetableEntry.type;

    await timetableEntry.save();

    const updatedEntry = await Timetable.findById(entryId)
      .populate('course', 'name code')
      .populate('teacher', 'name email');

    res.json(updatedEntry);
  } catch (error) {
    console.error('Update timetable entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/timetable/:id
// @desc    Delete a timetable entry
// @access  Private/Admin
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const timetableEntry = await Timetable.findById(req.params.id);
    if (!timetableEntry) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }

    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (error) {
    console.error('Delete timetable entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/timetable/courses
// @desc    Get all courses for timetable creation
// @access  Private/Teacher/Admin
router.get('/courses', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true }).select('name code');
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/timetable/teachers
// @desc    Get all teachers for timetable creation
// @access  Private/Admin
router.get('/teachers', auth, authorize('admin'), async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', isActive: true }).select('name email');
    res.json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
