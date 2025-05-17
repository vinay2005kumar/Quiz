const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        // Format: XX111 where XX is department code, first digit is year (1-4),
        // second digit is semester (1-2), third digit is sequence (1-9)
        return /^[A-Z]{2}[1-4][1-2][1-9]$/i.test(v);
      },
      message: props => `${props.value} is not a valid subject code! Format should be like CS111, CS121, CS211 etc.`
    }
  },
  name: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true,
    enum: {
      values: ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical'],
      message: '{VALUE} is not a valid department'
    }
  },
  year: {
    type: Number,
    required: true,
    min: [1, 'Year must be between 1 and 4'],
    max: [4, 'Year must be between 1 and 4']
  },
  semester: {
    type: Number,
    required: true,
    min: [1, 'Semester must be between 1 and 8'],
    max: [8, 'Semester must be between 1 and 8'],
    validate: {
      validator: function(v) {
        // Ensure semester is valid for the given year
        const validSemesters = {
          1: [1, 2],
          2: [3, 4],
          3: [5, 6],
          4: [7, 8]
        };
        return validSemesters[this.year].includes(v);
      },
      message: props => `Semester ${props.value} is not valid for year ${this.year}!`
    }
  },
  credits: {
    type: Number,
    required: true,
    min: 1
  },
  description: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Static method to get subject code based on department and sequence
subjectSchema.statics.generateSubjectCode = function(department, year, semester, sequence) {
  const deptCode = department.substring(0, 2).toUpperCase();
  // Convert semester (1-8) to year-semester format (1-4, 1-2)
  const actualYear = Math.ceil(semester / 2);
  const actualSemester = semester % 2 === 0 ? 2 : 1;
  return `${deptCode}${actualYear}${actualSemester}${sequence}`;
};

const Subject = mongoose.model('Subject', subjectSchema);
module.exports = Subject; 