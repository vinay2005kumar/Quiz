const mongoose = require('mongoose');
const Subject = require('../models/Subject');

const subjects = [
  {
    code: 'CS101',
    name: 'Introduction to Computer Science',
    department: 'Computer Science',
    year: 1,
    semester: 1,
    credits: 3,
    description: 'Basic concepts of computer science and programming'
  },
  {
    code: 'CS102',
    name: 'Data Structures',
    department: 'Computer Science',
    year: 1,
    semester: 2,
    credits: 4,
    description: 'Fundamental data structures and algorithms'
  },
  {
    code: 'EC101',
    name: 'Basic Electronics',
    department: 'Electronics',
    year: 1,
    semester: 1,
    credits: 3,
    description: 'Introduction to electronic circuits and components'
  },
  {
    code: 'ME101',
    name: 'Engineering Mechanics',
    department: 'Mechanical',
    year: 1,
    semester: 1,
    credits: 4,
    description: 'Basic principles of mechanics and engineering'
  }
];

const seedSubjects = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college_quiz_app');
    console.log('Connected to MongoDB');

    // Clear existing subjects
    await Subject.deleteMany({});
    console.log('Cleared existing subjects');

    // Insert new subjects
    await Subject.insertMany(subjects);
    console.log('Successfully seeded subjects');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error seeding subjects:', error);
    process.exit(1);
  }
};

// Run the seed function
seedSubjects(); 