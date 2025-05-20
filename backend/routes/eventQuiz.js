const express = require('express');
const router = express.Router();
const EventQuiz = require('../models/EventQuiz');
const { auth, isEventAdmin } = require('../middleware/auth');

// Create a new event quiz
router.post('/', auth, isEventAdmin, async (req, res) => {
  try {
    const quiz = new EventQuiz({
      ...req.body,
      createdBy: req.user._id
    });
    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all event quizzes (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, participantType } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (participantType) query.participantType = participantType;

    const quizzes = await EventQuiz.find(query)
      .populate('createdBy', 'name email')
      .sort('-createdAt');
    
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific event quiz
router.get('/:id', async (req, res) => {
  try {
    const quiz = await EventQuiz.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('questions');
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update an event quiz
router.put('/:id', auth, isEventAdmin, async (req, res) => {
  try {
    const quiz = await EventQuiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Only allow updates if quiz is in draft status or by the creator
    if (quiz.status !== 'draft' && !quiz.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Cannot modify published quiz' });
    }

    Object.assign(quiz, req.body);
    await quiz.save();
    res.json(quiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Register for an event quiz
router.post('/:id/register', auth, async (req, res) => {
  try {
    const quiz = await EventQuiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if registration is enabled
    if (!quiz.registrationEnabled && !quiz.spotRegistrationEnabled) {
      return res.status(400).json({ message: 'Registration is closed' });
    }

    // Check if quiz is full
    if (quiz.maxParticipants > 0 && quiz.registrations.length >= quiz.maxParticipants) {
      return res.status(400).json({ message: 'Quiz is full' });
    }

    // Check if user is already registered
    if (quiz.registrations.some(reg => reg.student.equals(req.user._id))) {
      return res.status(400).json({ message: 'Already registered' });
    }

    // Add registration
    quiz.registrations.push({
      student: req.user._id,
      name: req.user.name,
      email: req.user.email,
      college: req.body.college,
      department: req.body.department,
      year: req.body.year,
      isSpotRegistration: req.body.isSpotRegistration || false
    });

    await quiz.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get registrations for an event quiz
router.get('/:id/registrations', auth, isEventAdmin, async (req, res) => {
  try {
    const quiz = await EventQuiz.findById(req.params.id)
      .populate('registrations.student', 'name email');
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json(quiz.registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update quiz status
router.patch('/:id/status', auth, isEventAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const quiz = await EventQuiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    quiz.status = status;
    await quiz.save();
    res.json(quiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 