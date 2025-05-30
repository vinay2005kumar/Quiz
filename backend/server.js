const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRouter = require('./routes/auth');
const quizRouter = require('./routes/quiz');
const academicDetailsRouter = require('./routes/academicDetails');
const adminRouter = require('./routes/admin');
const eventQuizRouter = require('./routes/eventQuiz');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use routes
app.use('/api/auth', authRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/academic-details', academicDetailsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/event-quiz', eventQuizRouter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

const PORT = process.env.PORT || 5000;
const FALLBACK_PORTS = [5001, 5002, 5003];

const startServer = async (port) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${port} is in use, trying next port...`);
        const nextPort = FALLBACK_PORTS.shift();
        if (nextPort) {
          startServer(nextPort);
        } else {
          console.error('No available ports found');
          process.exit(1);
        }
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

startServer(PORT); 