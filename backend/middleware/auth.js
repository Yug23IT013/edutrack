const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Support Authorization header and token in query string for direct file downloads
    const headerToken = req.header('Authorization')?.replace('Bearer ', '');
    const queryToken = req.query?.token;
    const token = headerToken || queryToken;
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await User.findById(decoded.id).select('-password');
    
    // Populate teaching courses for teachers and enrolled courses for students
    if (user && user.role === 'teacher') {
      user = await User.findById(decoded.id)
        .populate('teachingCourses', 'name code description')
        .select('-password');
    } else if (user && user.role === 'student') {
      user = await User.findById(decoded.id)
        .populate('enrolledCourses', 'name code description')
        .select('-password');
    }
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    console.log('Authorization check:', { userRole, expectedRoles: roles, userId: req.user._id, userName: req.user.name });
    
    if (!roles.includes(userRole)) {
      console.log('❌ Access denied for user:', { 
        userId: req.user._id, 
        userName: req.user.name, 
        userRole: userRole, 
        expectedRoles: roles 
      });
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        userRole: userRole,
        expectedRoles: roles
      });
    }
    
    console.log('✅ Access granted for user:', req.user.name);
    next();
  };
};

module.exports = { auth, authorize };
