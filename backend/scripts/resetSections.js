const mongoose = require('mongoose');
const Section = require('../models/Section');

const MONGODB_URI = 'mongodb://localhost:27017/test';

async function resetSections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Drop the sections collection if it exists
    try {
      await db.dropCollection('sections');
      console.log('Sections collection dropped');
    } catch (error) {
      if (error.code !== 26) { // 26 is collection doesn't exist
        throw error;
      }
      console.log('Sections collection did not exist');
    }

    // Create the sections collection
    await db.createCollection('sections');
    console.log('Created sections collection');

    // Create indexes using the Mongoose model
    await Section.createIndexes();
    console.log('Created indexes using Mongoose model');

    // Verify the indexes
    const indexes = await db.collection('sections').indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    // Verify the unique index exists
    const hasUniqueIndex = indexes.some(index => 
      index.unique === true && 
      index.key.name === 1 && 
      index.key.department === 1 && 
      index.key.year === 1 && 
      index.key.semester === 1
    );

    if (hasUniqueIndex) {
      console.log('Unique index verified successfully');
    } else {
      console.error('Unique index not found! Indexes:', indexes);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

resetSections(); 