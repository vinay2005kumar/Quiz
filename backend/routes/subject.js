const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Subject = require('../models/Subject');

// Create a new subject (admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const subject = new Subject(req.body);
    await subject.save();
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all subjects
router.get('/', auth, async (req, res) => {
  try {
    const { department, year, semester } = req.query;
    const query = {};

    if (department) query.department = department;
    if (year) query.year = year;
    if (semester) query.semester = semester;

    const subjects = await Subject.find(query);
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific subject
router.get('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a subject (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
    res.status(500).json({ message: 'Server error', error: error.message });
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