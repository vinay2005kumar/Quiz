const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Section name is required'],
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Section name cannot be empty'
    }
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1, 'Year must be between 1 and 4'],
    max: [4, 'Year must be between 1 and 4']
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: [1, 'Semester must be between 1 and 8'],
    max: [8, 'Semester must be between 1 and 8']
  }
}, {
  timestamps: true
});

// Remove all indexes first
sectionSchema.indexes().forEach(index => {
  sectionSchema.index(index[0], { background: true, unique: false });
});

// Create the unique index for name within department, year, semester
sectionSchema.index(
  { name: 1, department: 1, year: 1, semester: 1 },
  { 
    unique: true,
    name: 'unique_section_name_per_dept_year_sem',
    background: true
  }
);

const Section = mongoose.model('Section', sectionSchema);

// Ensure indexes are created
Section.createIndexes().catch(err => {
  console.error('Error creating indexes:', err);
});

module.exports = Section;