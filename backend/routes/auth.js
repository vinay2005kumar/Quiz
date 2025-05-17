const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department, year, admissionNumber, isLateral, section } = req.body;

    // Basic validation for all users
    if (!name || !email || !password || !role || !department) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Additional validation for students
    if (role === 'student') {
      if (!year || !admissionNumber || !section) {
        return res.status(400).json({ message: 'Students must provide year, section, and admission number' });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email },
        ...(admissionNumber ? [{ admissionNumber }] : [])
      ]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      department,
      ...(role === 'student' && { 
        year,
        admissionNumber,
        isLateral: isLateral || false,
        section
      })
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        ...(user.role === 'student' && {
          year: user.year,
          admissionNumber: user.admissionNumber,
          isLateral: user.isLateral,
          section: user.section
        })
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Login failed: Invalid password for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token with explicit expiration
    const tokenPayload = {
      userId: user._id,
      role: user.role,
      email: user.email
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Verify token immediately to ensure it's valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    console.log('Login successful:', {
      userId: user._id,
      email: user.email,
      role: user.role,
      tokenExp: new Date(decoded.exp * 1000).toISOString(),
      tokenPreview: `${token.substring(0, 10)}...`
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        ...(user.role === 'student' && {
          year: user.year,
          admissionNumber: user.admissionNumber,
          isLateral: user.isLateral,
          section: user.section
        })
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    // Since auth middleware already fetched the user, we can use it directly
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        ...(user.role === 'student' && {
          year: user.year,
          admissionNumber: user.admissionNumber,
          isLateral: user.isLateral
        })
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/update-profile', auth, async (req, res) => {
  try {
    const { name, email, department, year, section } = req.body;
    const userId = req.user._id;

    // Basic validation
    if (!name || !email || !department) {
      return res.status(400).json({ message: 'Name, email, and department are required' });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already in use' });
    }

    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic fields
    user.name = name;
    user.email = email;
    user.department = department;

    // Update student-specific fields
    if (user.role === 'student') {
      if (!year || !section) {
        return res.status(400).json({ message: 'Year and section are required for students' });
      }
      user.year = year;
      user.section = section;
    }

    await user.save();

    // Return updated user data
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        ...(user.role === 'student' && {
          year: user.year,
          admissionNumber: user.admissionNumber,
          isLateral: user.isLateral,
          section: user.section
        })
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create admin user if not exists
const createAdminIfNotExists = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const admin = new User({
        name: 'System Administrator',
        email: 'admin@quizapp.com',
        password: 'Admin@123',
        role: 'admin',
        department: 'Computer Science'
      });
      await admin.save();
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  }
};

// Call this function when server starts
createAdminIfNotExists();

module.exports = router; 