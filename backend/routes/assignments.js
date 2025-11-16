const express = require('express');
const multer = require('multer');
const path = require('path');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Semester = require('../models/Semester');
const { auth, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    // Allow all file types for now
    cb(null, true);
  }
});

const router = express.Router();

// @route   GET /api/assignments/semester/:semesterNumber
// @desc    Get assignments by semester number
// @access  Private
router.get('/semester/:semesterNumber', auth, async (req, res) => {
  try {
    const semesterNumber = parseInt(req.params.semesterNumber);
    
    const semester = await Semester.findOne({ number: semesterNumber, isActive: true });
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    const assignments = await Assignment.find({ semester: semester._id, isActive: true })
      .populate('course', 'name code')
      .populate('teacher', 'name email')
      .populate('semester', 'number name academicYear')
      .sort({ dueDate: 1 });
    
    res.json(assignments);
  } catch (error) {
    console.error('Get assignments by semester error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/assignments
// @desc    Create a new assignment
// @access  Private/Teacher
router.post('/', auth, authorize('teacher'), async (req, res) => {
  try {
    const { title, description, courseId, dueDate, dueTime, maxPoints } = req.body;
    const teacherId = req.user.id;

    // Get course to extract semester
    const course = await Course.findById(courseId).populate('semester');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Combine date and time if both provided
    let finalDueDate = dueDate;
    if (dueTime) {
      finalDueDate = new Date(`${dueDate}T${dueTime}`);
    }

    const assignment = new Assignment({
      title,
      description,
      course: courseId,
      semester: course.semester._id,
      teacher: teacherId,
      dueDate: finalDueDate,
      maxPoints
    });

    await assignment.save();

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/assignments
// @desc    Get assignments list
// @access  Private
// - Teachers: assignments they created
// - Admin: all active assignments
// - Students: assignments from their enrolled courses
router.get('/', auth, async (req, res) => {
  try {
    const role = req.user.role;
    let query = { isActive: true };

    if (role === 'teacher') {
      // Teachers see assignments they created OR assignments in courses they teach
      const teachingCourses = Array.isArray(req.user.teachingCourses) ? req.user.teachingCourses : [];
      if (teachingCourses.length > 0) {
        query.$or = [
          { teacher: req.user.id },
          { course: { $in: teachingCourses } }
        ];
      } else {
        query.teacher = req.user.id;
      }
    } else if (role === 'student') {
      // Show assignments from student's enrolled courses
      const enrolled = Array.isArray(req.user.enrolledCourses) ? req.user.enrolledCourses : [];
      if (enrolled.length === 0) {
        return res.json([]);
      }
      query.course = { $in: enrolled };
    }

    const assignments = await Assignment.find(query)
      .select('title description course dueDate teacher maxPoints submissions')
      .populate('submissions.student', 'name email')
      .populate('course', 'name code');
    res.json(assignments);
  } catch (error) {
    console.error('Get assignments list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/assignments/:courseId
// @desc    Get all assignments for a course
// @access  Private
router.get('/:courseId', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId, isActive: true })
      .populate('submissions.student', 'name email');
    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/assignments/single/:id
// @desc    Get a single assignment with submissions
// @access  Private
router.get('/single/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('submissions.student', 'name email')
      .populate('course', 'name code');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Get single assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/assignments/:id/grade
// @desc    Grade an assignment
// @access  Private/Teacher
router.put('/:id/grade', auth, authorize('teacher'), async (req, res) => {
  try {
    const { studentId, grade, feedback } = req.body;
    const assignmentId = req.params.id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const submission = assignment.submissions.find(s => s.student.toString() === studentId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.grade = grade;
    submission.feedback = feedback;
    submission.gradedAt = new Date();
    submission.gradedBy = req.user.id;

    await assignment.save();

    res.json(submission);
  } catch (error) {
    console.error('Grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/assignments/submit
// @desc    Submit an assignment
// @access  Private/Student
router.post('/submit', auth, authorize('student'), upload.single('file'), async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const studentId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if student already submitted
    const existingSubmission = assignment.submissions.find(s => s.student.toString() === studentId);
    if (existingSubmission) {
      return res.status(400).json({ message: 'Assignment already submitted' });
    }

    // Add submission
    assignment.submissions.push({
      student: studentId,
      submissionFile: file.filename,
      originalFileName: file.originalname,
      submittedAt: new Date()
    });

    await assignment.save();

    res.json({ message: 'Assignment submitted successfully' });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/assignments/download/:filename
// @desc    Download a submitted file
// @access  Private
router.get('/download/:filename', auth, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    // Check if file exists
    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Find the assignment and submission to verify access
    const assignment = await Assignment.findOne({
      'submissions.submissionFile': filename
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const submission = assignment.submissions.find(s => s.submissionFile === filename);
    
    // Check if user has access to this file
    const hasAccess = req.user.role === 'admin' || 
                     req.user.role === 'teacher' ||
                     (req.user.role === 'student' && submission.student.toString() === req.user.id);
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Set appropriate headers and send file
    const originalName = submission.originalFileName || submission.submissionFile || filename;
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
