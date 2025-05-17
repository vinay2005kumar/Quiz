const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check token expiration
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTimestamp) {
        return res.status(401).json({ message: 'Token has expired' });
      }

      // Set both user and userId for flexibility
      req.user = user;
      req.userId = user._id;
      req.token = token;

      console.log('Auth middleware - User authenticated:', {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        tokenExp: new Date(decoded.exp * 1000).toISOString()
      });

      next();
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(500).json({ message: 'Server error during authentication' });
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