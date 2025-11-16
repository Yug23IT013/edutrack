const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Material = require('../models/Material');
const Course = require('../models/Course');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Ensure materials directory exists
const materialsDir = path.join(__dirname, '../uploads/materials');
if (!fs.existsSync(materialsDir)) {
  fs.mkdirSync(materialsDir, { recursive: true });
}

// Configure multer for material uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, materialsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'material-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for materials
  fileFilter: function (req, file, cb) {
    // Allow common document and media file types
    const allowedTypes = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|zip|rar|jpg|jpeg|png|gif|mp4|mp3|avi)$/i;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    } else {
      cb('Error: File type not allowed');
    }
  }
});

// @route   POST /api/materials/upload
// @desc    Upload material file
// @access  Private (Teachers only)
router.post('/upload', auth, authorize('teacher', 'admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, course, semester, tags } = req.body;
    
    console.log('Upload request body:', { title, description, course, semester, tags });
    console.log('Upload file info:', {
      filename: req.file?.filename,
      originalname: req.file?.originalname,
      mimetype: req.file?.mimetype,
      size: req.file?.size,
      path: req.file?.path
    });
    
    if (!title || !course) {
      return res.status(400).json({ 
        error: 'Title and course are required',
        received: { title: !!title, course: !!course, titleValue: title, courseValue: course }
      });
    }

    // Verify course exists and teacher has access
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if teacher teaches this course (only for teachers, admin can upload to any course)
    if (req.user.role === 'teacher' && !courseDoc.teacher.equals(req.user._id)) {
      return res.status(403).json({ error: 'You can only upload materials to courses you teach' });
    }

    // If no semester provided, get it from the course
    let semesterToUse = semester;
    if (!semesterToUse) {
      semesterToUse = courseDoc.semester;
    }
    
    if (!semesterToUse) {
      return res.status(400).json({ error: 'Course must have a semester assigned' });
    }

    const material = new Material({
      title,
      description: description || '',
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      course: course,
      teacher: req.user._id,
      semester: semesterToUse,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await material.save();
    await material.populate(['course', 'teacher', 'semester']);

    res.status(201).json({
      message: 'Material uploaded successfully',
      material
    });
  } catch (error) {
    // Clean up uploaded file if database save failed
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    console.error('Upload material error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/materials
// @desc    Get materials (filtered by role and access)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { course, semester, search, page = 1, limit = 10 } = req.query;
    
    let query = { isActive: true };
    
    // Role-based filtering
    if (req.user.role === 'teacher') {
      // Teachers see their own materials
      query.teacher = req.user._id;
    } else if (req.user.role === 'student') {
      // Students see materials from courses they're enrolled in
      const enrolledCourses = req.user.enrolledCourses || [];
      if (enrolledCourses.length === 0) {
        return res.json({ materials: [], totalPages: 0, currentPage: 1 });
      }
      query.course = { $in: enrolledCourses };
    }
    // Admin sees all materials (no additional filtering)

    // Apply filters
    if (course) {
      query.course = course;
    }
    if (semester) {
      query.semester = semester;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;
    const materials = await Material.find(query)
      .populate('course', 'name code')
      .populate('teacher', 'name email')
      .populate('semester', 'name year')
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Material.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      materials,
      totalPages,
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/materials/teacher/:teacherId
// @desc    Get materials by teacher
// @access  Private (Teachers - own materials only, or Admin)
router.get('/teacher/:teacherId', auth, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Check authorization
    if (req.user.role === 'teacher' && req.user._id.toString() !== teacherId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const query = { 
      teacher: teacherId, 
      isActive: true 
    };
    
    const skip = (page - 1) * limit;
    const materials = await Material.find(query)
      .populate('course', 'name code')
      .populate('teacher', 'name email')
      .populate('semester', 'name year')
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Material.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      materials,
      totalPages,
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get materials by teacher error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/materials/course/:courseId
// @desc    Get materials by course
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Check if user has access to this course
    if (req.user.role === 'student') {
      const enrolledCourses = req.user.enrolledCourses || [];
      if (!enrolledCourses.some(course => course.toString() === courseId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'teacher') {
      // Check if teacher teaches this course
      const Course = require('../models/Course');
      const course = await Course.findById(courseId);
      if (!course || !course.teacher.equals(req.user._id)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const query = { 
      course: courseId, 
      isActive: true 
    };
    
    const skip = (page - 1) * limit;
    const materials = await Material.find(query)
      .populate('course', 'name code')
      .populate('teacher', 'name email')
      .populate('semester', 'name year')
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Material.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      materials,
      totalPages,
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get materials by course error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/materials/semester/:semesterNumber
// @desc    Get materials by semester
// @access  Private
router.get('/semester/:semesterNumber', auth, async (req, res) => {
  try {
    const { semesterNumber } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Find semester by number
    const Semester = require('../models/Semester');
    const semester = await Semester.findOne({ number: parseInt(semesterNumber) });
    if (!semester) {
      return res.status(404).json({ error: 'Semester not found' });
    }
    
    let query = { 
      semester: semester._id, 
      isActive: true 
    };
    
    // Role-based filtering
    if (req.user.role === 'student') {
      const enrolledCourses = req.user.enrolledCourses || [];
      if (enrolledCourses.length === 0) {
        return res.json({ materials: [], totalPages: 0, currentPage: 1, total: 0 });
      }
      query.course = { $in: enrolledCourses };
    } else if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    }
    
    const skip = (page - 1) * limit;
    const materials = await Material.find(query)
      .populate('course', 'name code')
      .populate('teacher', 'name email')
      .populate('semester', 'name year')
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Material.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      materials,
      totalPages,
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get materials by semester error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/materials/:materialId
// @desc    Get single material details
// @access  Private
router.get('/:materialId', auth, async (req, res) => {
  try {
    const { materialId } = req.params;
    
    const material = await Material.findOne({ _id: materialId, isActive: true })
      .populate('course', 'name code')
      .populate('teacher', 'name email')
      .populate('semester', 'name year');
    
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Check access permissions
    if (req.user.role === 'student') {
      const enrolledCourses = req.user.enrolledCourses || [];
      if (!enrolledCourses.some(courseId => courseId.equals(material.course._id))) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'teacher') {
      if (!material.teacher._id.equals(req.user._id)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    // Admin has access to all materials

    res.json({ material });
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/materials/:materialId/download
// @desc    Download material file
// @access  Private
router.get('/:materialId/download', auth, async (req, res) => {
  try {
    const { materialId } = req.params;
    console.log('Download request for material:', materialId);
    
    const material = await Material.findOne({ _id: materialId, isActive: true })
      .populate('course');
    
    if (!material) {
      console.log('Material not found:', materialId);
      return res.status(404).json({ error: 'Material not found' });
    }
    
    console.log('Found material:', material.title, 'for user role:', req.user.role);

    // Check access permissions
    if (req.user.role === 'student') {
      const enrolledCourses = req.user.enrolledCourses || [];
      console.log('Student enrolled courses:', enrolledCourses);
      console.log('Material course:', material.course._id);
      if (!enrolledCourses.some(courseId => courseId.equals(material.course._id))) {
        console.log('Access denied: student not enrolled in course');
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'teacher') {
      console.log('Teacher check - material teacher:', material.teacher, 'user id:', req.user._id);
      if (!material.teacher.equals(req.user._id)) {
        console.log('Access denied: teacher does not own material');
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    // Admin has access to all materials
    console.log('Access granted for download');

    // Check if file exists
    if (!fs.existsSync(material.filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Increment download count
    material.downloadCount += 1;
    await material.save();

    console.log('Material file info:', {
      mimeType: material.mimeType,
      originalName: material.originalName,
      filePath: material.filePath,
      fileExists: fs.existsSync(material.filePath)
    });

    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${material.originalName}"`);
    res.setHeader('Content-Type', material.mimeType || 'application/octet-stream');

    // Stream the file
    const fileStream = fs.createReadStream(material.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download material error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/materials/:materialId
// @desc    Delete material
// @access  Private (Teachers - own materials only, or Admin)
router.delete('/:materialId', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { materialId } = req.params;
    
    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Check if teacher owns this material or is admin
    const teacherId = material.teacher ? material.teacher.toString() : material.teacher;
    if (teacherId && teacherId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Soft delete
    material.isActive = false;
    await material.save();

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/materials/:materialId
// @desc    Update material details
// @access  Private (Teachers - own materials only, or Admin)
router.put('/:materialId', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { materialId } = req.params;
    const { title, description, tags } = req.body;
    
    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Check if teacher owns this material or is admin
    const teacherId = material.teacher ? material.teacher.toString() : material.teacher;
    if (teacherId && teacherId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update fields
    if (title) material.title = title;
    if (description !== undefined) material.description = description;
    if (tags) material.tags = tags.split(',').map(tag => tag.trim());

    await material.save();
    await material.populate(['course', 'teacher', 'semester']);

    res.json({
      message: 'Material updated successfully',
      material
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;