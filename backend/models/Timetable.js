const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['lecture', 'lab', 'tutorial', 'exam'],
    default: 'lecture'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
timetableEntrySchema.index({ day: 1, startTime: 1 });
timetableEntrySchema.index({ course: 1, day: 1 });
timetableEntrySchema.index({ teacher: 1, day: 1 });

module.exports = mongoose.model('Timetable', timetableEntrySchema);
