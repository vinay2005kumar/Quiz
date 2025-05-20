const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  originalPassword: {
    type: String,
    required: false // Not required for existing users
  },
  role: {
    type: String,
    enum: ['admin', 'faculty', 'student'],
    default: 'student'
  },
  department: {
    type: String,
    required: function() {
      return this.role === 'student';
    }
  },
  year: {
    type: Number,
    required: function() {
      return this.role === 'student';
    },
    min: 1,
    max: 4
  },
  semester: {
    type: Number,
    required: function() {
      return this.role === 'student';
    },
    min: 1,
    max: 8,
    validate: {
      validator: function(v) {
        if (this.role !== 'student') return true;
        const yearSemesters = {
          1: [1, 2],
          2: [3, 4],
          3: [5, 6],
          4: [7, 8]
        };
        return yearSemesters[this.year]?.includes(v);
      },
      message: 'Semester must be valid for the selected year'
    }
  },
  section: {
    type: String,
    required: function() {
      return this.role === 'student';
    }
  },
  admissionNumber: {
    type: String,
    required: function() {
      return this.role === 'student';
    },
    unique: true,
    sparse: true
  },
  isLateral: {
    type: Boolean,
    default: false
  },
  departments: {
    type: [String],
    required: function() {
      return this.role === 'faculty';
    },
    validate: {
      validator: function(v) {
        if (this.role !== 'faculty') return true;
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Faculty must have at least one department'
    }
  },
  years: {
    type: [String],
    required: function() {
      return this.role === 'faculty';
    },
    validate: {
      validator: function(v) {
        if (this.role !== 'faculty') return true;
        return Array.isArray(v) && v.length > 0 && v.every(year => ['1', '2', '3', '4'].includes(year));
      },
      message: 'Faculty must have at least one valid year (1-4)'
    }
  },
  semesters: {
    type: [String],
    required: function() {
      return this.role === 'faculty';
    },
    validate: {
      validator: function(v) {
        if (this.role !== 'faculty') return true;
        return Array.isArray(v) && v.length > 0 && v.every(sem => ['1', '2', '3', '4', '5', '6', '7', '8'].includes(sem));
      },
      message: 'Faculty must have at least one valid semester (1-8)'
    }
  },
  sections: {
    type: [String],
    required: function() {
      return this.role === 'faculty';
    },
    validate: {
      validator: function(v) {
        if (this.role !== 'faculty') return true;
        return Array.isArray(v) && v.length > 0 && v.every(section => /^[A-Z]$/.test(section));
      },
      message: 'Faculty must have at least one valid section (A-Z)'
    }
  },
  assignments: {
    type: [{
      department: {
        type: String,
        required: true
      },
      year: {
        type: String,
        required: true,
        enum: ['1', '2', '3', '4']
      },
      semester: {
        type: String,
        required: true,
        enum: ['1', '2', '3', '4', '5', '6', '7', '8']
      },
      sections: {
        type: [String],
        required: true,
        validate: {
          validator: function(v) {
            return Array.isArray(v) && v.length > 0 && v.every(section => /^[A-Z]$/.test(section));
          },
          message: 'Each assignment must have at least one valid section (A-Z)'
        }
      }
    }],
    required: function() {
      return this.role === 'faculty';
    },
    validate: {
      validator: function(v) {
        if (this.role !== 'faculty') return true;
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Faculty must have at least one assignment'
    }
  },
  isEventQuizAccount: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Pre-save hook to validate faculty assignments match their permissions
UserSchema.pre('save', function(next) {
  if (this.role === 'faculty') {
    // Validate that assignments only contain allowed departments, years, semesters, and sections
    const validAssignments = this.assignments.every(assignment => {
      return (
        this.departments.includes(assignment.department) &&
        this.years.includes(assignment.year) &&
        this.semesters.includes(assignment.semester) &&
        assignment.sections.every(section => this.sections.includes(section))
      );
    });

    if (!validAssignments) {
      next(new Error('Faculty assignments must match their allowed departments, years, semesters, and sections'));
    }
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);