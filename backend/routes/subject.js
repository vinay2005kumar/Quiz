const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Subject = require('../models/Subject');

// Get all subjects with optional filters
router.get('/', async (req, res) => {
  try {
    const { department, year, semester } = req.query;
    const query = {};

    if (department) query.department = department;
    if (year) query.year = parseInt(year);
    if (semester) query.semester = parseInt(semester);

    const subjects = await Subject.find(query).sort('code');
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects', error: error.message });
  }
});

// Create a new subject (admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const subject = new Subject(req.body);
    await subject.save();
    res.status(201).json(subject);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Subject with this code already exists' });
    } else {
      res.status(500).json({ message: 'Error creating subject', error: error.message });
    }
  }
});

// Get a single subject by ID
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subject', error: error.message });
  }
});

// Update a subject (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json(subject);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Subject with this code already exists' });
    } else {
      res.status(500).json({ message: 'Error updating subject', error: error.message });
    }
  }
});

// Delete a subject (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting subject', error: error.message });
  }
});

// Generate subject code
router.post('/generate-code', auth, authorize('admin'), async (req, res) => {
  try {
    const { department, year, semester, sequence } = req.body;
    
    if (!department || !year || !semester || !sequence) {
      return res.status(400).json({ 
        message: 'Department, year, semester, and sequence are required' 
      });
    }

    const code = Subject.generateSubjectCode(department, year, semester, sequence);
    res.json({ code });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 