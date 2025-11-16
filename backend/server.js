const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const assignmentRoutes = require('./routes/assignments');
const gradeRoutes = require('./routes/grades');
const timetableRoutes = require('./routes/timetable');
const semesterRoutes = require('./routes/semesters');
const announcementRoutes = require('./routes/announcements');
const materialRoutes = require('./routes/materials');
const activitiesRoutes = require('./routes/activities');
const systemRoutes = require('./routes/system');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edutrack', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/system', systemRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploads folder

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
