const express = require('express');
const router = express.Router();
const Semester = require('../models/Semester');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/semesters
// @desc    Get all semesters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const semesters = await Semester.find({ isActive: true }).sort({ number: 1 });
    res.json(semesters);
  } catch (error) {
    console.error('Error fetching semesters:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/semesters/current
// @desc    Get current semester
// @access  Public
router.get('/current', async (req, res) => {
  try {
    const currentSemester = await Semester.findOne({ isCurrent: true, isActive: true });
    if (!currentSemester) {
      return res.status(404).json({ message: 'No current semester found' });
    }
    res.json(currentSemester);
  } catch (error) {
    console.error('Error fetching current semester:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/semesters
// @desc    Create a new semester
// @access  Admin only
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { number, name, academicYear, isActive, isCurrent } = req.body;

    // Check if semester number already exists
    const existingSemester = await Semester.findOne({ number });
    if (existingSemester) {
      return res.status(400).json({ message: 'Semester with this number already exists' });
    }

    const semester = new Semester({
      number,
      name,
      academicYear,
      isActive,
      isCurrent
    });

    await semester.save();
    res.status(201).json(semester);
  } catch (error) {
    console.error('Error creating semester:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/semesters/:id
// @desc    Update a semester
// @access  Admin only
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, academicYear, isActive, isCurrent } = req.body;
    
    const semester = await Semester.findById(req.params.id);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    semester.name = name || semester.name;
    semester.academicYear = academicYear || semester.academicYear;
    semester.isActive = isActive !== undefined ? isActive : semester.isActive;
    semester.isCurrent = isCurrent !== undefined ? isCurrent : semester.isCurrent;

    await semester.save();
    res.json(semester);
  } catch (error) {
    console.error('Error updating semester:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/semesters/:id/set-current
// @desc    Set a semester as current
// @access  Admin only
router.put('/:id/set-current', auth, authorize('admin'), async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    // Set all other semesters as not current
    await Semester.updateMany({ _id: { $ne: req.params.id } }, { isCurrent: false });
    
    // Set this semester as current
    semester.isCurrent = true;
    await semester.save();

    res.json({ message: 'Semester set as current', semester });
  } catch (error) {
    console.error('Error setting current semester:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/semesters/:id
// @desc    Delete a semester (soft delete)
// @access  Admin only
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    semester.isActive = false;
    await semester.save();

    res.json({ message: 'Semester deleted successfully' });
  } catch (error) {
    console.error('Error deleting semester:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
