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

// CORS Configuration
const getAllowedOrigins = () => {
  const defaultOrigins = [
    'http://localhost:3000', // Local development
    'http://localhost:4173', // Vite preview
    'https://edutrack-frontend-oodi7bvw7-yug-buhas-projects.vercel.app', // Your Vercel deployment
    'https://edutrack-r3kn.onrender.com', // Your Render backend (for any internal calls)
  ];

  // Add origins from environment variable if provided
  if (process.env.CORS_ORIGINS) {
    const envOrigins = process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
    return [...defaultOrigins, ...envOrigins];
  }

  return defaultOrigins;
};

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow all Vercel preview deployments
    if (origin.match(/^https:\/\/.*\.vercel\.app$/)) {
      return callback(null, true);
    }
    
    // Log and reject unauthorized origins
    console.warn(`CORS blocked origin: ${origin}`);
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true, // Allow cookies and authorization headers
  optionsSuccessStatus: 200, // Support legacy browsers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Authorization']
};

// Middleware
app.use(cors(corsOptions));

// Debug CORS in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`CORS Debug - Origin: ${req.headers.origin}, Method: ${req.method}`);
    next();
  });
}

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
