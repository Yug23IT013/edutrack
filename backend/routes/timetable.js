const express = require('express');
const mongoose = require('mongoose');
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
      // Teachers see timetables for courses they teach across ALL semesters
      // If no teaching courses assigned, show all timetables so they can see available slots
      const teachingCourses = req.user.teachingCourses || [];
      console.log('Teacher timetable request (semester-independent):', { 
        teacherId: req.user._id, 
        teacherName: req.user.name,
        teachingCourses: teachingCourses.map(c => c._id || c),
        courseCount: teachingCourses.length 
      });
      
      if (teachingCourses.length > 0) {
        // Extract ObjectIds properly - teachers see their courses across ALL semesters
        const courseIds = teachingCourses.map(c => c._id || c);
        query.course = { $in: courseIds };
        console.log('Teacher query with course filter (all semesters):', query);
      } else {
        console.log('Teacher has no teaching courses, showing all timetables');
      }
      // Note: No semester filtering for teachers - they can teach across multiple semesters
    }
    // Admin sees all timetables by default

    console.log('Final timetable query:', JSON.stringify(query, null, 2));
    const timetable = await Timetable.find(query)
      .populate('course', 'name code')
      .populate('teacher', 'name email')
      .sort({ day: 1, startTime: 1 });
    
    console.log(`Found ${timetable.length} timetable entries for query:`, query);
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
    const { role } = req.user;
    const { day } = req.params;
    let query = { isActive: true, day };

    if (role === 'student') {
      // Students see timetables for their enrolled courses
      const enrolledCourses = req.user.enrolledCourses || [];
      if (enrolledCourses.length === 0) {
        return res.json([]);
      }
      query.course = { $in: enrolledCourses };
    } else if (role === 'teacher') {
      // Teachers see timetables for courses they teach across ALL semesters for the specified day
      // If no teaching courses assigned, show all timetables so they can see available slots
      const teachingCourses = req.user.teachingCourses || [];
      console.log('Teacher timetable by day request (semester-independent):', { 
        teacherId: req.user._id, 
        teacherName: req.user.name,
        day: day,
        teachingCourses: teachingCourses.map(c => c._id || c),
        courseCount: teachingCourses.length 
      });
      
      if (teachingCourses.length > 0) {
        // Extract just the ObjectIds from the populated course objects
        const courseIds = teachingCourses.map(c => c._id || c);
        query.course = { $in: courseIds };
        console.log('Teacher day query with course filter (all semesters):', courseIds);
      } else {
        console.log('Teacher has no teaching courses, showing all timetables for this day across all semesters');
      }
      // Teachers can teach across multiple semesters - no semester filtering
    }

    const timetable = await Timetable.find(query)
      .populate('course', 'name code')
      .populate('teacher', 'name email')
      .populate('semester', 'number name academicYear')
      .sort({ startTime: 1 });

    res.json(timetable);
  } catch (error) {
    console.error('Get timetable by day error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/timetable/semester/:semesterNumber/day/:day
// @desc    Get timetable for a specific semester and day
// @access  Private
router.get('/semester/:semesterNumber/day/:day', auth, async (req, res) => {
  try {
    const { semesterNumber, day } = req.params;
    const { role } = req.user;
    
    // First find the semester
    const Semester = require('../models/Semester');
    const semester = await Semester.findOne({ number: parseInt(semesterNumber), isActive: true });
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    let query = { isActive: true, day, semester: semester._id };

    if (role === 'student') {
      // Students see timetables for their enrolled courses in the semester
      const enrolledCourses = req.user.enrolledCourses || [];
      if (enrolledCourses.length === 0) {
        return res.json([]);
      }
      query.course = { $in: enrolledCourses };
    } else if (role === 'teacher') {
      // Teachers see timetables for courses they teach across ALL semesters for the specified day
      // If no teaching courses assigned, show all timetables so they can see available slots
      const teachingCourses = req.user.teachingCourses || [];
      console.log('Teacher timetable semester/day request (semester-independent):', { 
        teacherId: req.user._id, 
        teacherName: req.user.name,
        requestedSemester: semesterNumber,
        day: day,
        teachingCourses: teachingCourses.map(c => c._id || c),
        courseCount: teachingCourses.length 
      });
      
      // Remove semester filter for teachers - they can teach across multiple semesters
      query = { isActive: true, day }; // Only filter by day, not semester
      
      if (teachingCourses.length > 0) {
        // Extract just the ObjectIds from the populated course objects
        const courseIds = teachingCourses.map(c => c._id || c);
        query.course = { $in: courseIds };
        console.log('Teacher has courses, filtering by courses only (all semesters):', courseIds);
      } else {
        console.log('Teacher has no teaching courses, showing all timetables for this day across all semesters');
      }
      // If no teaching courses, show all timetables (don't filter by course or semester)
    }

    console.log('Final semester/day timetable query:', JSON.stringify(query, null, 2));
    
    // DEBUG: Let's see what timetable data actually exists
    const allTimetables = await Timetable.find({ isActive: true })
      .populate('course', 'name code')
      .populate('semester', 'number name')
      .populate('teacher', 'name')
      .limit(5);
    console.log('DEBUG: Sample timetable entries in database:');
    allTimetables.forEach(entry => {
      console.log(`- ${entry.day} ${entry.startTime}-${entry.endTime}: ${entry.course?.name} (${entry.course?.code}) - Semester ${entry.semester?.number} - Teacher: ${entry.teacher?.name}`);
    });
    
    // DEBUG: Check specifically for the course we're looking for
    const courseSpecificEntries = await Timetable.find({ 
      course: '68c3b2791c619be078e773e7',
      isActive: true 
    }).populate('course', 'name code').populate('semester', 'number name');
    console.log(`DEBUG: Found ${courseSpecificEntries.length} entries for Algorithms course specifically:`, 
      courseSpecificEntries.map(e => `${e.day} ${e.startTime}-${e.endTime} Semester ${e.semester?.number}`));
    
    const timetable = await Timetable.find(query)
      .populate('course', 'name code')
      .populate('teacher', 'name email')
      .populate('semester', 'number name academicYear')
      .sort({ startTime: 1 });
    
    console.log(`Found ${timetable.length} timetable entries for semester ${semesterNumber}, day ${day}`);
    res.json(timetable);
  } catch (error) {
    console.error('Get timetable by semester and day error:', error);
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
