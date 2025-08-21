const express = require('express');
const router = express.Router();
const Grade = require('../models/Grade');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get all grades for a specific student
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.params.studentId })
      .populate('assignment', 'title description dueDate course maxPoints')
      .populate('student', 'name email');
    
    res.json(grades);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Get all grades for a specific assignment
router.get('/assignment/:assignmentId', auth, async (req, res) => {
  try {
    const grades = await Grade.find({ assignment: req.params.assignmentId })
      .populate('assignment', 'title description dueDate course maxPoints')
      .populate('student', 'name email');
    
    res.json(grades);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Get all grades (for admin/teacher view)
router.get('/', auth, async (req, res) => {
  try {
    const grades = await Grade.find()
      .populate('assignment', 'title description dueDate course maxPoints')
      .populate('student', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(grades);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Create/Update a grade
router.post('/', auth, async (req, res) => {
  try {
    const { assignmentId, studentId, grade } = req.body;

    // Check if grade already exists
    let existingGrade = await Grade.findOne({
      assignment: assignmentId,
      student: studentId,
    });

    if (existingGrade) {
      // Update existing grade
      existingGrade.grade = grade;
      await existingGrade.save();
      
      const updatedGrade = await Grade.findById(existingGrade._id)
        .populate('assignment', 'title description dueDate course maxPoints')
        .populate('student', 'name email');
      
      res.json(updatedGrade);
    } else {
      // Create new grade
      const newGrade = new Grade({
        assignment: assignmentId,
        student: studentId,
        grade,
      });

      await newGrade.save();
      
      const savedGrade = await Grade.findById(newGrade._id)
        .populate('assignment', 'title description dueDate course maxPoints')
        .populate('student', 'name email');
      
      res.json(savedGrade);
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Delete a grade
router.delete('/:id', auth, async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);

    if (!grade) {
      return res.status(404).json({ msg: 'Grade not found' });
    }

    await Grade.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Grade removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
