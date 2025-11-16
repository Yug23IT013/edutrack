const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isCurrent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure only one semester can be current at a time
semesterSchema.pre('save', async function(next) {
  if (this.isCurrent) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isCurrent: false }
    );
  }
  next();
});

// Index for efficient queries
semesterSchema.index({ number: 1 });
semesterSchema.index({ isActive: 1, isCurrent: 1 });

module.exports = mongoose.model('Semester', semesterSchema);
