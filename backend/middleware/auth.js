const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Request path:', req.path);
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth middleware - Token check:', {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 10)}...` : null
    });
    
    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      console.log('Auth middleware - Verifying token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('Auth middleware - Token verified:', {
        userId: decoded.userId,
        exp: new Date(decoded.exp * 1000).toISOString(),
        role: decoded.role
      });

      const user = await User.findById(decoded.userId);
      console.log('Auth middleware - User lookup:', {
        found: !!user,
        userId: decoded.userId
      });

      if (!user) {
        console.log('Auth middleware - User not found for token');
        return res.status(401).json({ message: 'User not found' });
      }

      // Check token expiration
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTimestamp) {
        console.log('Auth middleware - Token expired:', {
          expiry: new Date(decoded.exp * 1000).toISOString(),
          current: new Date().toISOString()
        });
        return res.status(401).json({ message: 'Token has expired' });
      }

      // Set both user and userId for flexibility
      req.user = user;
      req.userId = user._id;
      req.token = token;

      console.log('Auth middleware - Authentication successful:', {
        userId: user._id,
        role: user.role,
        email: user.email,
        tokenExp: new Date(decoded.exp * 1000).toISOString()
      });

      next();
    } catch (jwtError) {
      console.error('Auth middleware - JWT verification failed:', {
        error: jwtError.message,
        name: jwtError.name,
        tokenPreview: token ? `${token.substring(0, 10)}...` : null
      });
      return res.status(401).json({ 
        message: 'Invalid token',
        error: jwtError.name
      });
    }
  } catch (error) {
    console.error('Auth middleware - Unexpected error:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Authorize middleware:', {
      userRole: req.user.role,
      requiredRoles: roles,
      path: req.path
    });

    if (!roles.includes(req.user.role)) {
      console.error('Authorization failed:', {
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path
      });
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