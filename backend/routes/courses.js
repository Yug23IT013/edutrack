const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true }).populate('teacher', 'name email');
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private/Teacher
router.post('/', auth, authorize('teacher'), async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const teacher = req.user.id;

    const course = new Course({ name, code, description, teacher });
    await course.save();

    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/courses/:id/enroll
// @desc    Enroll in a course
// @access  Private/Student
router.put('/:id/enroll', auth, authorize('student'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.students.push(studentId);
    await course.save();

    const student = await User.findById(studentId);
    student.enrolledCourses.push(courseId);
    await student.save();

    res.json(course);
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses/sample
// @desc    Create sample courses (for testing)
// @access  Private/Admin
router.post('/sample', auth, authorize('admin'), async (req, res) => {
  try {
    const sampleCourses = [
      {
        name: 'Introduction to Computer Science',
        code: 'CS101',
        description: 'Basic concepts of computer science and programming',
        teacher: req.user.id
      },
      {
        name: 'Web Development Fundamentals',
        code: 'WEB201',
        description: 'HTML, CSS, JavaScript and modern web development',
        teacher: req.user.id
      },
      {
        name: 'Database Management Systems',
        code: 'DB301',
        description: 'Relational databases, SQL, and database design',
        teacher: req.user.id
      }
    ];

    const courses = await Course.insertMany(sampleCourses);
    res.status(201).json(courses);
  } catch (error) {
    console.error('Create sample courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/courses/teaching
// @desc    Update teaching courses for a teacher
// @access  Private/Teacher
router.put('/teaching', auth, authorize('teacher'), async (req, res) => {
  try {
    const { courseIds } = req.body;
    const teacherId = req.user.id;

    // Update teacher's teaching courses
    const user = await User.findById(teacherId);
    user.teachingCourses = courseIds;
    await user.save();

    // Detach teacher from courses they no longer teach
    await Course.updateMany(
      { teacher: teacherId, _id: { $nin: courseIds } },
      { $set: { teacher: null } }
    );

    // Assign teacher to the selected courses
    await Course.updateMany(
      { _id: { $in: courseIds } },
      { $set: { teacher: teacherId } }
    );

    const updatedUser = await User.findById(teacherId)
      .populate('teachingCourses', 'name code description')
      .select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Update teaching courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
