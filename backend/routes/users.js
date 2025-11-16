const express = require('express');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/count
// @desc    Get total users count for admin dashboard
// @access  Private/Admin
router.get('/count', auth, authorize('admin'), async (req, res) => {
  try {
    const total = await User.countDocuments({ isActive: true });
    res.json({ total });
  } catch (error) {
    console.error('Get users count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/students
// @desc    Get students based on user role - teachers get their course students, admins get all
// @access  Private/Teacher,Admin
router.get('/students', auth, authorize('teacher','admin'), async (req, res) => {
  try {
    let students;
    
    if (req.user.role === 'admin') {
      // Admins can see all students
      students = await User.find({ role: 'student', isActive: true })
        .populate('currentSemester', 'number name academicYear')
        .populate('enrolledCourses', 'name code credits isCore')
        .select('name email studentId currentSemester enrolledCourses phone createdAt')
        .sort({ name: 1 });
    } else if (req.user.role === 'teacher') {
      // Teachers can only see students enrolled in their courses
      const Course = require('../models/Course');
      
      // Get courses taught by this teacher
      const teacherCourses = await Course.find({ 
        teacher: req.user._id, 
        isActive: true 
      }).select('_id students').populate('students', 'name email studentId currentSemester enrolledCourses phone createdAt');
      
      // Extract unique students from all teacher's courses
      const studentSet = new Set();
      const studentsData = [];
      
      teacherCourses.forEach(course => {
        course.students.forEach(student => {
          if (!studentSet.has(student._id.toString())) {
            studentSet.add(student._id.toString());
            studentsData.push(student);
          }
        });
      });
      
      // Populate the semester and course data for these students
      students = await User.find({ 
        _id: { $in: Array.from(studentSet) },
        isActive: true 
      })
        .populate('currentSemester', 'number name academicYear')
        .populate({
          path: 'enrolledCourses',
          match: { teacher: req.user._id, isActive: true }, // Only show courses taught by this teacher
          select: 'name code credits isCore'
        })
        .select('name email studentId currentSemester enrolledCourses phone createdAt')
        .sort({ name: 1 });
    }

    // Calculate additional data for each student
    const studentsWithStats = students.map(student => {
      const studentObj = student.toObject();
      
      // Add formatted student ID
      studentObj.formattedId = studentObj.studentId || `STU${studentObj._id.toString().slice(-4).toUpperCase()}`;
      
      // Add enrollment count
      studentObj.totalEnrolledCourses = studentObj.enrolledCourses ? studentObj.enrolledCourses.length : 0;
      
      // Add semester info
      studentObj.currentSemesterInfo = studentObj.currentSemester ? 
        `${studentObj.currentSemester.number}${getOrdinalSuffix(studentObj.currentSemester.number)} Semester` : 
        'No Semester';
      
      // Mock attendance for now (this would come from actual attendance records)
      studentObj.attendance = Math.floor(Math.random() * 20) + 80; // Random between 80-99%
      
      return studentObj;
    });

    res.json(studentsWithStats);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to get ordinal suffix
function getOrdinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

// @route   GET /api/users/teachers
// @desc    Get all teachers (admins can access)
// @access  Private/Admin
router.get('/teachers', auth, authorize('admin'), async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', isActive: true }).select('name email department role');
    res.json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Activate/Deactivate user
// @access  Private/Admin
router.put('/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/:id',auth,authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/semester
// @desc    Update student's current semester
// @access  Private/Student
router.put('/semester', auth, async (req, res) => {
  try {
    const { semesterId } = req.body;
    const userId = req.user.id;

    // Check if user is a student
    const user = await User.findById(userId);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can update their semester' });
    }

    // Verify semester exists
    const Semester = require('../models/Semester');
    const semester = await Semester.findById(semesterId);
    if (!semester || !semester.isActive) {
      return res.status(400).json({ message: 'Invalid semester' });
    }

    // Update user's current semester
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { currentSemester: semesterId },
      { new: true }
    ).populate('currentSemester').select('-password');

    res.json({ 
      message: 'Semester updated successfully', 
      user: updatedUser,
      currentSemester: updatedUser.currentSemester
    });
  } catch (error) {
    console.error('Update semester error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile with semester info
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('currentSemester')
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
