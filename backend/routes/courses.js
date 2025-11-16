const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const Semester = require('../models/Semester');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/courses/count
// @desc    Get total courses count for admin dashboard
// @access  Private/Admin
router.get('/count', auth, authorize('admin'), async (req, res) => {
  try {
    const total = await Course.countDocuments({ isActive: true });
    res.json({ total });
  } catch (error) {
    console.error('Get courses count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/test-auth
// @desc    Test authentication and authorization
// @access  Private
router.get('/test-auth', auth, async (req, res) => {
  try {
    res.json({
      message: 'Authentication successful',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isActive: req.user.isActive
      }
    });
  } catch (error) {
    console.error('Test auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses
// @desc    Get all courses (with optional semester filter)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { semester } = req.query;
    let filter = { isActive: true };
    
    if (semester) {
      filter.semester = semester;
    }

    // For teachers, show all courses so they can select which ones to teach
    // For students, this would be filtered by their enrollment (handled elsewhere)
    // For admins, show all courses
    const courses = await Course.find(filter)
      .populate('teacher', 'name email department')
      .populate('semester', 'number name academicYear')
      .sort({ semester: 1, name: 1 });
    
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/semester/:semesterNumber
// @desc    Get courses by semester number
// @access  Private
router.get('/semester/:semesterNumber', auth, async (req, res) => {
  try {
    const semesterNumber = parseInt(req.params.semesterNumber);
    
    const semester = await Semester.findOne({ number: semesterNumber, isActive: true });
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    const courses = await Course.find({ semester: semester._id, isActive: true })
      .populate('teacher', 'name email department')
      .populate('semester', 'number name academicYear')
      .sort({ name: 1 });
    
    res.json(courses);
  } catch (error) {
    console.error('Get courses by semester error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/enrolled
// @desc    Get courses enrolled by the current student
// @access  Private (Students only)
router.get('/enrolled', auth, authorize('student'), async (req, res) => {
  try {
    // Get the user and populate their enrolled courses
    const user = await User.findById(req.user._id)
      .populate({
        path: 'enrolledCourses',
        match: { isActive: true },
        populate: [
          {
            path: 'teacher',
            select: 'name email department'
          },
          {
            path: 'semester',
            select: 'number name academicYear isActive isCurrent'
          }
        ]
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter out any null entries (in case of deleted courses)
    const enrolledCourses = user.enrolledCourses.filter(course => course != null);

    res.json(enrolledCourses);
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/teacher
// @desc    Get courses taught by the current teacher
// @access  Private (Teachers only)
router.get('/teacher', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const courses = await Course.find({ 
      teacher: req.user._id, 
      isActive: true 
    })
      .populate('semester', 'number name academicYear')
      .populate('students', 'name email studentId')
      .sort({ semester: 1, name: 1 });
    
    res.json(courses);
  } catch (error) {
    console.error('Get teacher courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/teacher/stats
// @desc    Get teaching statistics for the current teacher
// @access  Private (Teachers only)
router.get('/teacher/stats', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const teacherId = req.user._id;
    
    // Get teacher's courses with student counts
    const courses = await Course.find({ 
      teacher: teacherId, 
      isActive: true 
    }).populate('students');

    const stats = {
      totalCourses: courses.length,
      totalStudents: courses.reduce((sum, course) => sum + course.students.length, 0),
      totalCredits: courses.reduce((sum, course) => sum + (course.credits || 0), 0),
      coreCourses: courses.filter(course => course.isCore).length,
      averageEnrollment: courses.length > 0 
        ? Math.round(courses.reduce((sum, course) => sum + course.students.length, 0) / courses.length)
        : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Get teacher stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/:id
// @desc    Get a single course by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email department')
      .populate('semester', 'number name academicYear isActive isCurrent')
      .populate('students', 'name email studentId');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user has permission to view this course
    if (req.user.role === 'student') {
      // Students can only see courses they're enrolled in
      if (!req.user.enrolledCourses.includes(course._id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'teacher') {
      // Teachers can see courses they teach or all courses (for course selection)
      // No restriction for teachers as they may need to view course details
    }
    // Admins can see all courses

    res.json(course);
  } catch (error) {
    console.error('Get course by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private/Admin
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, code, description, semester, credits, department, isCore, maxEnrollment, teacher } = req.body;

    // Verify semester exists
    const semesterDoc = await Semester.findById(semester);
    if (!semesterDoc) {
      return res.status(400).json({ message: 'Invalid semester' });
    }

    // Verify teacher exists
    const teacherDoc = await User.findById(teacher);
    if (!teacherDoc || teacherDoc.role !== 'teacher') {
      return res.status(400).json({ message: 'Invalid teacher' });
    }

    const course = new Course({ 
      name, 
      code, 
      description, 
      semester,
      teacher, 
      credits,
      department,
      isCore,
      maxEnrollment
    });
    
    await course.save();
    await course.populate('teacher', 'name email department');
    await course.populate('semester', 'number name academicYear');

    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Course code already exists for this semester' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// @route   PUT /api/courses/teaching
// @desc    Update teaching courses for a teacher
// @access  Private/Teacher
router.put('/teaching', auth, authorize('teacher'), async (req, res) => {
  try {
    console.log('📚 Teaching courses update request:', {
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      courseIds: req.body.courseIds
    });
    
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

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private/Admin
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, code, description, semester, credits, department, isCore, maxEnrollment, teacher } = req.body;

    // Verify semester exists
    const semesterDoc = await Semester.findById(semester);
    if (!semesterDoc) {
      return res.status(400).json({ message: 'Invalid semester' });
    }

    // Verify teacher exists
    const teacherDoc = await User.findById(teacher);
    if (!teacherDoc || teacherDoc.role !== 'teacher') {
      return res.status(400).json({ message: 'Invalid teacher' });
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        code, 
        description, 
        semester,
        teacher, 
        credits,
        department,
        isCore,
        maxEnrollment
      },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await course.populate('teacher', 'name email department');
    await course.populate('semester', 'number name academicYear');

    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Course code already exists for this semester' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
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

// @route   GET /api/courses/debug/database-status
// @desc    Check database status (users, semesters, courses)
// @access  Private
router.get('/debug/database-status', auth, async (req, res) => {
  try {
    const users = await User.countDocuments();
    const students = await User.countDocuments({ role: 'student' });
    const teachers = await User.countDocuments({ role: 'teacher' });
    const admins = await User.countDocuments({ role: 'admin' });
    
    const semesters = await Semester.countDocuments();
    const activeSemesters = await Semester.countDocuments({ isActive: true });
    
    const courses = await Course.countDocuments();
    const activeCourses = await Course.countDocuments({ isActive: true });
    
    // Get current user details
    const currentUser = await User.findById(req.user._id)
      .populate('enrolledCourses')
      .populate('teachingCourses')
      .select('-password');

    res.json({
      database: {
        users: { total: users, students, teachers, admins },
        semesters: { total: semesters, active: activeSemesters },
        courses: { total: courses, active: activeCourses }
      },
      currentUser: {
        id: currentUser._id,
        name: currentUser.name,
        role: currentUser.role,
        enrolledCoursesCount: currentUser.enrolledCourses?.length || 0,
        teachingCoursesCount: currentUser.teachingCourses?.length || 0
      }
    });
  } catch (error) {
    console.error('Database status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/courses/sample
// @desc    Create sample courses (for testing)
// @access  Private/Admin
router.post('/sample', auth, authorize('admin'), async (req, res) => {
  try {
    // First, get all semesters
    const semesters = await Semester.find({ isActive: true });
    if (semesters.length === 0) {
      return res.status(400).json({ message: 'No semesters found. Please create semesters first.' });
    }

    // Get all teachers
    const teachers = await User.find({ role: 'teacher', isActive: true });
    if (teachers.length === 0) {
      return res.status(400).json({ message: 'No teachers found. Please create teacher accounts first.' });
    }

    const semester = semesters[0]; // Use first available semester
    const teacher = teachers[0]; // Use first available teacher

    const sampleCourses = [
      {
        name: 'Introduction to Programming',
        code: 'CS101',
        description: 'Learn fundamental programming concepts using modern languages. Cover variables, control structures, functions, and basic data structures.',
        semester: semester._id,
        teacher: teacher._id,
        credits: 4,
        department: 'Computer Science',
        isCore: true,
        maxEnrollment: 60,
        students: []
      },
      {
        name: 'Data Structures and Algorithms',
        code: 'CS102',
        description: 'Study of data structures such as arrays, linked lists, trees, and graphs. Introduction to algorithm analysis and design.',
        semester: semester._id,
        teacher: teacher._id,
        credits: 4,
        department: 'Computer Science',
        isCore: true,
        maxEnrollment: 50,
        students: []
      },
      {
        name: 'Web Development Fundamentals',
        code: 'CS103',
        description: 'Learn HTML, CSS, JavaScript, and modern web development frameworks. Build responsive and interactive websites.',
        semester: semester._id,
        teacher: teacher._id,
        credits: 3,
        department: 'Computer Science',
        isCore: false,
        maxEnrollment: 40,
        students: []
      },
      {
        name: 'Database Management Systems',
        code: 'CS104',
        description: 'Introduction to relational databases, SQL, database design, normalization, and transaction management.',
        semester: semester._id,
        teacher: teacher._id,
        credits: 3,
        department: 'Computer Science',
        isCore: true,
        maxEnrollment: 45,
        students: []
      },
      {
        name: 'Software Engineering Principles',
        code: 'CS105',
        description: 'Learn software development methodologies, project management, testing, and collaborative development practices.',
        semester: semester._id,
        teacher: teacher._id,
        credits: 3,
        department: 'Computer Science',
        isCore: false,
        maxEnrollment: 35,
        students: []
      }
    ];

    // Delete existing sample courses to avoid duplicates
    await Course.deleteMany({ code: { $in: sampleCourses.map(c => c.code) } });

    const courses = await Course.insertMany(sampleCourses);
    
    res.status(201).json({
      message: `Created ${courses.length} sample courses`,
      courses: courses
    });
  } catch (error) {
    console.error('Create sample courses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/courses/enroll-student
// @desc    Enroll current student in sample courses (for testing)
// @access  Private/Student
router.post('/enroll-student', auth, authorize('student'), async (req, res) => {
  try {
    const studentId = req.user._id;
    
    // Get some sample courses to enroll in
    const courses = await Course.find({ isActive: true }).limit(5);
    
    if (courses.length === 0) {
      return res.status(400).json({ message: 'No courses available for enrollment' });
    }

    // Enroll student in these courses
    const courseIds = courses.map(course => course._id);
    
    // Update student's enrolled courses
    await User.findByIdAndUpdate(studentId, {
      $addToSet: { enrolledCourses: { $each: courseIds } }
    });

    // Add student to each course's student list
    await Course.updateMany(
      { _id: { $in: courseIds } },
      { $addToSet: { students: studentId } }
    );

    // Get updated user with populated courses
    const updatedUser = await User.findById(studentId)
      .populate({
        path: 'enrolledCourses',
        populate: [
          { path: 'teacher', select: 'name email' },
          { path: 'semester', select: 'number name academicYear' }
        ]
      });

    res.json({
      message: `Enrolled in ${courses.length} courses`,
      enrolledCourses: updatedUser.enrolledCourses
    });
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
