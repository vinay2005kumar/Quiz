const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Set both user and userId for flexibility
    req.user = user;
    req.userId = user._id;
    req.token = token;

    console.log('Auth middleware - User:', {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email
    });

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Please authenticate' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Authorize middleware - User role:', req.user.role);
    console.log('Authorize middleware - Required roles:', roles);

    if (!roles.includes(req.user.role)) {
      console.error('Authorization failed - User role not in allowed roles');
      return res.status(403).json({ 
        message: 'You do not have permission to perform this action',
        userRole: req.user.role,
        requiredRoles: roles
      });
    }
    next();
  };
};

module.exports = { auth, authorize }; 