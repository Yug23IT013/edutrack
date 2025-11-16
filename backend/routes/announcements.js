const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Announcement = require('../models/Announcement');
const Semester = require('../models/Semester');
const User = require('../models/User');
const auth = require('../middleware/auth').auth;
const authorize = require('../middleware/auth').authorize;

// @route   GET /api/announcements/count
// @desc    Get total announcements count for admin dashboard
// @access  Private/Admin
router.get('/count', auth, authorize('admin'), async (req, res) => {
  try {
    const total = await Announcement.countDocuments();
    res.json({ total });
  } catch (error) {
    console.error('Get announcements count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/announcements');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'announcement-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per announcement
  },
  fileFilter: function (req, file, cb) {
    // Allow common document and image types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|ppt|pptx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and document files are allowed!'));
    }
  }
});

// @route   GET /api/announcements
// @desc    Get announcements based on user role
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { role } = req.user;
    const { semester, priority, type, limit = 10, page = 1 } = req.query;
    
    let query = { isActive: true };
    
    if (role === 'student') {
      // Students see announcements for their enrolled semesters
      const student = await User.findById(req.user._id).populate('enrolledCourses');
      if (!student || !student.enrolledCourses || student.enrolledCourses.length === 0) {
        return res.json([]);
      }
      
      // Get unique semesters from enrolled courses
      const enrolledSemesters = [...new Set(
        student.enrolledCourses.map(course => course.semester?.toString()).filter(Boolean)
      )];
      
      query.semester = { $in: enrolledSemesters };
      query.isPublished = true;
      query.$or = [
        { expiryDate: { $gt: new Date() } },
        { expiryDate: null }
      ];
    } else if (role === 'teacher') {
      // Teachers can see announcements for semesters they teach in
      const teacher = await User.findById(req.user._id).populate('teachingCourses');
      if (teacher && teacher.teachingCourses && teacher.teachingCourses.length > 0) {
        const teachingSemesters = [...new Set(
          teacher.teachingCourses.map(course => course.semester?.toString()).filter(Boolean)
        )];
        query.semester = { $in: teachingSemesters };
      }
      query.isPublished = true;
    }
    // Admin sees all announcements (no additional filtering)
    
    // Apply filters
    if (semester) {
      query.semester = semester;
    }
    if (priority) {
      query.priority = priority;
    }
    if (type) {
      query.type = type;
    }
    
    const skip = (page - 1) * limit;
    
    const announcements = await Announcement.find(query)
      .populate('author', 'name email role')
      .populate('semester', 'number name academicYear')
      .sort({ priority: 1, publishDate: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    // For students, mark which announcements they've read
    if (role === 'student') {
      const processedAnnouncements = announcements.map(announcement => {
        const announcementObj = announcement.toObject();
        announcementObj.isReadByUser = announcement.readBy.some(
          read => read.student.toString() === req.user._id.toString()
        );
        return announcementObj;
      });
      
      console.log('Processed announcements for student:', processedAnnouncements.length);
      res.json(processedAnnouncements);
    } else {
      res.json(announcements);
    }
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/announcements/semester/:semesterId
// @desc    Get announcements for a specific semester
// @access  Private
router.get('/semester/:semesterId', auth, async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { role } = req.user;
    
    let announcements;
    
    if (role === 'student') {
      announcements = await Announcement.getActiveBySemester(semesterId);
      // Mark read status for student
      const processedAnnouncements = announcements.map(announcement => {
        const announcementObj = announcement.toObject();
        announcementObj.isReadByUser = announcement.readBy.some(
          read => read.student.toString() === req.user._id.toString()
        );
        return announcementObj;
      });
      
      res.json(processedAnnouncements);
    } else {
      // Teachers and admins see all announcements for the semester
      announcements = await Announcement.find({
        semester: semesterId,
        isActive: true,
        isPublished: true
      })
        .populate('author', 'name email role')
        .populate('semester', 'number name academicYear')
        .sort({ priority: 1, publishDate: -1 });
      
      res.json(announcements);
    }
  } catch (error) {
    console.error('Get semester announcements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/announcements/unread
// @desc    Get unread announcements for current student
// @access  Private/Student
router.get('/unread', auth, authorize('student'), async (req, res) => {
  try {
    const student = await User.findById(req.user._id).populate('enrolledCourses');
    if (!student || !student.enrolledCourses || student.enrolledCourses.length === 0) {
      return res.json([]);
    }
    
    const enrolledSemesters = [...new Set(
      student.enrolledCourses.map(course => course.semester?.toString()).filter(Boolean)
    )];
    
    const unreadAnnouncements = await Announcement.find({
      semester: { $in: enrolledSemesters },
      isActive: true,
      isPublished: true,
      'readBy.student': { $ne: req.user._id },
      $or: [
        { expiryDate: { $gt: new Date() } },
        { expiryDate: null }
      ]
    })
      .populate('author', 'name email role')
      .populate('semester', 'number name academicYear')
      .sort({ priority: 1, publishDate: -1 });
    
    res.json(unreadAnnouncements);
  } catch (error) {
    console.error('Get unread announcements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/announcements
// @desc    Create a new announcement
// @access  Private/Teacher/Admin
router.post('/', auth, authorize('teacher', 'admin'), upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      title,
      content,
      semester,
      priority = 'medium',
      type = 'general',
      publishDate,
      expiryDate
    } = req.body;
    
    // Validate required fields
    if (!title || !content || !semester) {
      return res.status(400).json({ 
        message: 'Title, content, and semester are required' 
      });
    }
    
    // Validate semester exists
    const semesterDoc = await Semester.findById(semester);
    if (!semesterDoc) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    // Process attachments
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size
    })) : [];
    
    const announcement = new Announcement({
      title,
      content,
      semester,
      author: req.user._id,
      priority,
      type,
      publishDate: publishDate ? new Date(publishDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      attachments
    });
    
    await announcement.save();
    await announcement.populate('author', 'name email role');
    await announcement.populate('semester', 'number name academicYear');
    
    res.status(201).json(announcement);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/announcements/:id
// @desc    Update an announcement
// @access  Private/Teacher/Admin (own announcements only for teachers)
router.put('/:id', auth, authorize('teacher', 'admin'), upload.array('newAttachments', 5), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Teachers can only edit their own announcements
    if (req.user.role === 'teacher' && announcement.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const {
      title,
      content,
      semester,
      priority,
      type,
      publishDate,
      expiryDate,
      isActive,
      isPublished
    } = req.body;
    
    // Update fields
    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (semester) announcement.semester = semester;
    if (priority) announcement.priority = priority;
    if (type) announcement.type = type;
    if (publishDate) announcement.publishDate = new Date(publishDate);
    if (expiryDate) announcement.expiryDate = new Date(expiryDate);
    if (typeof isActive !== 'undefined') announcement.isActive = isActive;
    if (typeof isPublished !== 'undefined') announcement.isPublished = isPublished;
    
    // Handle new attachments
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size
      }));
      announcement.attachments = [...announcement.attachments, ...newAttachments];
    }
    
    await announcement.save();
    await announcement.populate('author', 'name email role');
    await announcement.populate('semester', 'number name academicYear');
    
    res.json(announcement);
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/announcements/:id/read
// @desc    Mark announcement as read by student
// @access  Private/Student
router.post('/:id/read', auth, authorize('student'), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    await announcement.markAsRead(req.user._id);
    
    res.json({ message: 'Announcement marked as read' });
  } catch (error) {
    console.error('Mark announcement as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete an announcement
// @access  Private/Admin or Teacher (own announcements only)
router.delete('/:id', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Teachers can only delete their own announcements
    if (req.user.role === 'teacher' && announcement.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete attached files
    if (announcement.attachments && announcement.attachments.length > 0) {
      announcement.attachments.forEach(attachment => {
        if (fs.existsSync(attachment.path)) {
          fs.unlinkSync(attachment.path);
        }
      });
    }
    
    await Announcement.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/announcements/:id/download/:filename
// @desc    Download announcement attachment
// @access  Private
router.get('/:id/download/:filename', auth, async (req, res) => {
  try {
    const { id, filename } = req.params;
    
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    const attachment = announcement.attachments.find(att => att.filename === filename);
    if (!attachment) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const filePath = attachment.path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;