const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  grade: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('Grade', GradeSchema);
