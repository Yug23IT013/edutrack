# 🎓 EduTrack - Educational Management System

<div align="center">

![EduTrack](https://img.shields.io/badge/EduTrack-Educational%20Management-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-ISC-yellow)

A comprehensive role-based educational management application built with modern web technologies.

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [User Roles & Permissions](#user-roles--permissions)
- [Sample Data](#sample-data)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

EduTrack is a comprehensive full-stack educational management system designed to streamline academic operations for educational institutions. It provides role-based access control with distinct interfaces for administrators, teachers, and students, featuring modern React frontend with routing, real-time notifications, semester management, and a robust Node.js backend with MongoDB.

## ✨ Features

### 🔐 **Authentication & Authorization**
- JWT-based secure authentication
- Role-based access control (Admin, Teacher, Student)
- Password encryption with bcrypt
- Protected routes and middleware
- Admin exception emails (admin@edutrack.com, admin1@edutrack.com)
- Institutional email validation (.edu.in for students, .ac.in for teachers)

### 🔔 **Notification System**
- Real-time announcement notifications
- Auto-refresh notification polling (30-second intervals)
- Persistent read status tracking
- Unread count badges in header
- Global notification context state management

### 🎓 **Student Features**
- Semester-based course enrollment
- Interactive course dashboard with statistics
- Assignment tracking with due dates
- Grade viewing and progress monitoring
- Materials access and download
- Personal timetable viewing
- Announcement notifications

### 👨‍🏫 **Teacher Features**
- Teaching course management dashboard
- Course statistics (students, announcements, materials)
- Assignment creation and grading
- Student progress monitoring
- Course materials upload and management
- Timetable management
- Course announcements

### 👨‍💼 **Admin Features**
- Complete user management (view, activate/deactivate, delete)
- Real-time user count and statistics
- System-wide course management
- Announcement count tracking
- Recent activities monitoring
- Upcoming system events dashboard
- Role-based dashboard with analytics

### 📚 **Course & Semester Management**
- Multi-semester support with semester selection
- Course creation with teacher assignment
- Student enrollment tracking
- Course information and statistics
- Department-wise course organization
- Credit system management

### 📝 **Materials & Content System**
- File upload support with multiple formats
- Course materials organization
- Teacher material management
- Student material access
- File download system

## 🛠 Technology Stack

### **Backend**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs
- **File Upload:** Multer
- **Environment Management:** dotenv
- **CORS:** cors
- **API Endpoints:** RESTful API with role-based authorization

### **Frontend**
- **Framework:** React 18
- **Build Tool:** Vite
- **Routing:** React Router DOM v6 with future flags
- **HTTP Client:** Axios
- **State Management:** React Context API
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Real-time Updates:** Polling-based notifications

## 📁 Project Structure

```
edutrack/
├── backend/                 # Node.js/Express backend
│   ├── middleware/         # Authentication & authorization middleware
│   │   └── auth.js
│   ├── models/            # Mongoose data models
│   │   ├── Announcement.js
│   │   ├── Assignment.js
│   │   ├── Course.js
│   │   ├── Grade.js
│   │   ├── Material.js
│   │   ├── Semester.js
│   │   ├── Timetable.js
│   │   └── User.js
│   ├── routes/            # API route handlers
│   │   ├── activities.js
│   │   ├── announcements.js
│   │   ├── assignments.js
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── grades.js
│   │   ├── materials.js
│   │   ├── semesters.js
│   │   ├── system.js
│   │   ├── timetable.js
│   │   └── users.js
│   ├── uploads/           # User uploaded files
│   │   └── materials/
│   ├── server.js          # Express server entry point
│   ├── package.json
│   └── .env.example
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Layout.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   ├── common/
│   │   │   │   ├── EmptyState.jsx
│   │   │   │   └── ErrorBoundary.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── AnnouncementList.jsx
│   │   │   ├── AnnouncementManager.jsx
│   │   │   ├── CourseManagement.jsx
│   │   │   ├── EnrolledCourses.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── MaterialManager.jsx
│   │   │   ├── SemesterSelector.jsx
│   │   │   ├── TeachingCourses.jsx
│   │   │   └── TimetableManager.jsx
│   │   ├── context/       # React context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── NotificationContext.jsx
│   │   │   └── SemesterContext.jsx
│   │   ├── pages/         # Page components
│   │   │   ├── AnnouncementsPage.jsx
│   │   │   ├── Auth.jsx
│   │   │   ├── CoursesPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── GradesPage.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── MaterialsPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── StudentsPage.jsx
│   │   │   ├── TimetablePage.jsx
│   │   │   └── UsersPage.jsx
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── API_DOCUMENTATION.md
├── MATERIAL_SHARING_GUIDE.md
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd edutrack
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/edutrack
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/edutrack

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters

# Server Configuration
PORT=5000

# Node Environment
NODE_ENV=development
```

### Database Setup

**Option 1: Local MongoDB**
```bash
# Install MongoDB locally and start the service
mongod --dbpath /path/to/your/db
```

**Option 2: MongoDB Atlas**
1. Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Get your connection string
3. Update `MONGODB_URI` in your `.env` file

## 🎯 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - User registration with email validation
- `POST /api/auth/login` - User login with role-based response
- `GET /api/auth/me` - Get current user with populated data

### User Management Endpoints
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/count` - Get total users count (Admin)
- `GET /api/users/students` - Get students (Teacher/Admin)
- `GET /api/users/teachers` - Get all teachers (Admin)
- `PUT /api/users/:id/status` - Toggle user activation status (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)
- `PUT /api/users/semester` - Update student semester (Student)

### Course Endpoints
- `GET /api/courses` - Get all courses with filters
- `GET /api/courses/count` - Get total courses count (Admin)
- `GET /api/courses/semester/:number` - Get courses by semester
- `GET /api/courses/enrolled` - Get student enrolled courses
- `GET /api/courses/teacher` - Get teacher courses
- `POST /api/courses` - Create new course (Admin)
- `PUT /api/courses/:id` - Update course (Admin)
- `DELETE /api/courses/:id` - Delete course (Admin)

### Announcement Endpoints
- `GET /api/announcements` - Get announcements with pagination
- `GET /api/announcements/count` - Get total announcements count (Admin)
- `POST /api/announcements` - Create announcement (Teacher/Admin)
- `PUT /api/announcements/:id/read` - Mark announcement as read
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

### Material Endpoints
- `GET /api/materials/course/:courseId` - Get course materials
- `POST /api/materials/upload` - Upload course material (Teacher)
- `DELETE /api/materials/:id` - Delete material (Teacher)
- `GET /api/materials/download/:id` - Download material file

### Semester Endpoints
- `GET /api/semesters` - Get all semesters
- `GET /api/semesters/active` - Get active semesters
- `POST /api/semesters` - Create semester (Admin)

### Admin Analytics Endpoints
- `GET /api/activities/admin/recent` - Get recent system activities
- `GET /api/system/events/upcoming` - Get upcoming system events

### Timetable Endpoints
- `GET /api/timetable/student` - Get student timetable
- `GET /api/timetable/teacher` - Get teacher timetable
- `GET /api/timetable/course/:courseId` - Get course schedule

## 👥 User Roles & Permissions

### 🎓 Student
- View enrolled courses
- Submit assignments
- View grades and feedback
- Download assignment files
- Track assignment deadlines

### 👨‍🏫 Teacher
- Manage teaching courses
- Create and manage assignments
- Grade student submissions
- Provide feedback
- View student progress

### 👨‍💼 Administrator
- Manage all users
- Activate/deactivate accounts
- View system statistics
- Generate sample data
- System oversight

## 📊 Sample Data

Generate sample users and courses for testing:

```bash
cd backend
npm run seed
```

### Test Credentials

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | admin@edutrack.com | admin123 | System administrator |
| Admin | admin1@edutrack.com | admin123 | Backup administrator |
| Teacher | teacher@university.ac.in | teacher123 | Sample teacher account |
| Student | student@university.edu.in | student123 | Sample student account |

*Note: Admin emails bypass institutional domain validation*

## 💻 Development

### Running the Application

1. **Start the Backend Server:**
   ```bash
   cd backend
   npm run dev          # Development with nodemon
   # OR
   npm start           # Production
   ```

2. **Start the Frontend Development Server:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the Application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Available Scripts

**Backend:**
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Generate sample data

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run serve` - Preview production build

## 🚀 Deployment

### Backend Deployment

1. Set production environment variables
2. Build and deploy to your hosting platform
3. Ensure MongoDB connection is configured

### Frontend Deployment

1. **Build the production bundle:**
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy the `dist` folder to your hosting platform

### Environment Setup

- Set `NODE_ENV=production`
- Configure production MongoDB URI
- Set secure JWT secret
- Configure CORS for production domains

## 📈 Current Features

✅ **Implemented:**
- Role-based authentication and authorization
- Real-time notification system with persistent read status
- Comprehensive admin dashboard with user management
- Teacher course management with statistics
- Student enrollment and course tracking
- Semester-based academic management
- Material upload and sharing system
- Responsive design with modern UI
- Route protection and navigation
- File upload and download system

## 🚧 Future Enhancements

- Assignment submission and grading system
- Advanced analytics and reporting
- Email notification integration
- Mobile app development
- Video conferencing integration
- Advanced search and filtering
- Batch operations for admin tasks
- Export functionality for data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues & Notes

- MongoDB connection warnings (deprecated options) - cosmetic, doesn't affect functionality
- File downloads require authentication token
- Course teacher assignment required for proper display
- Admin panel requires proper role assignment in database
- Real-time notifications use polling (30s intervals) instead of WebSocket

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

<div align="center">
Made with ❤️ for educational institutions
</div>
