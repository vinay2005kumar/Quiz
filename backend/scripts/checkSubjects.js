const mongoose = require('mongoose');
const Subject = require('../models/Subject');

const checkSubjects = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college_quiz_app');
    console.log('Connected to MongoDB');

    // Get all subjects
    const subjects = await Subject.find({});
    console.log('Found subjects:', subjects);
    console.log('Total subjects:', subjects.length);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error checking subjects:', error);
    process.exit(1);
  }
};

// Run the check function
checkSubjects(); 