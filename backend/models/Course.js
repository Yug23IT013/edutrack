const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
    default: 3
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  isCore: {
    type: Boolean,
    default: true
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  maxEnrollment: {
    type: Number,
    default: 60,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for unique course code per semester
courseSchema.index({ code: 1, semester: 1 }, { unique: true });
courseSchema.index({ semester: 1, department: 1 });
courseSchema.index({ teacher: 1, semester: 1 });

module.exports = mongoose.model('Course', courseSchema);
