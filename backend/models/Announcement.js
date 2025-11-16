const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  type: {
    type: String,
    enum: ['general', 'academic', 'event', 'exam', 'assignment'],
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: function() {
      // Default expiry: 30 days from now
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },
  readBy: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient querying
announcementSchema.index({ semester: 1, isActive: 1, isPublished: 1 });
announcementSchema.index({ publishDate: -1 });
announcementSchema.index({ priority: 1 });
announcementSchema.index({ expiryDate: 1 });

// Virtual for checking if announcement is expired
announcementSchema.virtual('isExpired').get(function() {
  return this.expiryDate && this.expiryDate < new Date();
});

// Method to mark announcement as read by a student
announcementSchema.methods.markAsRead = function(studentId) {
  const existingRead = this.readBy.find(read => 
    read.student.toString() === studentId.toString()
  );
  
  if (!existingRead) {
    this.readBy.push({
      student: studentId,
      readAt: new Date()
    });
  }
  
  return this.save();
};

// Method to get read count
announcementSchema.methods.getReadCount = function() {
  return this.readBy.length;
};

// Static method to get active announcements for a semester
announcementSchema.statics.getActiveBySemester = function(semesterId) {
  return this.find({
    semester: semesterId,
    isActive: true,
    isPublished: true,
    $or: [
      { expiryDate: { $gt: new Date() } },
      { expiryDate: null }
    ]
  }).populate('author', 'name email role')
    .populate('semester', 'number name academicYear')
    .sort({ priority: 1, publishDate: -1 }); // urgent first, then by date
};

// Static method to get unread announcements for a student
announcementSchema.statics.getUnreadForStudent = function(studentId, semesterId) {
  return this.find({
    semester: semesterId,
    isActive: true,
    isPublished: true,
    'readBy.student': { $ne: studentId },
    $or: [
      { expiryDate: { $gt: new Date() } },
      { expiryDate: null }
    ]
  }).populate('author', 'name email role')
    .populate('semester', 'number name academicYear')
    .sort({ priority: 1, publishDate: -1 });
};

module.exports = mongoose.model('Announcement', announcementSchema);