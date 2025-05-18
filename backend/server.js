const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://vinaybuttala:vinay123@cluster0.za6yh4j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Verify environment variables
if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set in environment variables. Using fallback secret.');
}

// API Routes - these should be handled before the static files
app.use('/api/auth', require('./routes/auth'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/subject', require('./routes/subject'));
app.use('/api/admin', require('./routes/admin'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the frontend build directory
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // Handle any requests that don't match the ones above
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.url.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
} else {
  // In development, just send a simple response for the root route
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 