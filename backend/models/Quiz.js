const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: [{
      type: String,
      required: true,
      trim: true
    }],
    validate: {
      validator: function(options) {
        return options.length === 4;
      },
      message: 'Each question must have exactly 4 options'
    },
    required: true
  },
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  marks: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1,
    default: function() {
      return this.questions ? this.questions.reduce((sum, q) => sum + q.marks, 0) : 0;
    }
  },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: function(questions) {
        return questions.length > 0;
      },
      message: 'Quiz must have at least one question'
    }
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(endTime) {
        // Skip validation if startTime is not set (this happens during updates)
        if (!this.startTime) return true;
        return endTime > this.startTime;
      },
      message: 'End time must be after start time'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowedYears: {
    type: [Number],
    required: true,
    validate: {
      validator: function(years) {
        return years.length > 0 && years.every(year => year >= 1 && year <= 4);
      },
      message: 'At least one valid year (1-4) must be selected'
    }
  },
  allowedDepartments: {
    type: [String],
    required: true,
    validate: {
      validator: function(departments) {
        return departments.length > 0;
      },
      message: 'At least one department must be selected'
    }
  },
  allowedSections: {
    type: [String],
    required: true,
    validate: {
      validator: function(sections) {
        return sections.length > 0;
      },
      message: 'At least one section must be selected'
    }
  },
  sectionEndTimes: {
    type: Map,
    of: {
      endTime: {
        type: Date,
        required: true,
        validate: {
          validator: function(endTime) {
            return endTime > this.startTime;
          },
          message: 'Section end time must be after quiz start time'
        }
      },
      isActive: {
        type: Boolean,
        default: true
      }
    },
    default: new Map()
  },
  // New fields for section-specific settings
  sectionSettings: {
    type: Map,
    of: {
      shuffleQuestions: {
        type: Boolean,
        default: false
      },
      shuffleOptions: {
        type: Boolean,
        default: false
      },
      allowedAttempts: {
        type: Number,
        default: 1,
        min: 1
      },
      instructions: {
        type: String,
        trim: true
      }
    },
    default: new Map()
  }
}, {
  timestamps: true
});

// Index for efficient querying of active quizzes by department, year, and section
quizSchema.index({
  isActive: 1,
  allowedDepartments: 1,
  allowedYears: 1,
  allowedSections: 1
});

// Virtual field for submissions
quizSchema.virtual('submissions', {
  ref: 'QuizSubmission',
  localField: '_id',
  foreignField: 'quiz'
});

// Enable virtuals in JSON
quizSchema.set('toJSON', { virtuals: true });
quizSchema.set('toObject', { virtuals: true });

// Method to check if a student can access this quiz
quizSchema.methods.canStudentAccess = function(student) {
  return (
    this.isActive &&
    this.allowedDepartments.includes(student.department) &&
    this.allowedYears.includes(student.year) &&
    this.allowedSections.includes(student.section) &&
    (!this.sectionEndTimes.has(student.section) || 
     (this.sectionEndTimes.get(student.section).isActive &&
      new Date() < this.sectionEndTimes.get(student.section).endTime))
  );
};

// Method to get section-specific settings
quizSchema.methods.getSectionSettings = function(section) {
  return this.sectionSettings.get(section) || {
    shuffleQuestions: false,
    shuffleOptions: false,
    allowedAttempts: 1,
    instructions: ''
  };
};

// Middleware to calculate total marks before saving
quizSchema.pre('save', function(next) {
  if (this.questions) {
    this.totalMarks = this.questions.reduce((sum, question) => sum + question.marks, 0);
  }
  next();
});

// Add a custom method to validate dates
quizSchema.statics.validateDates = function(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  if (isNaN(start.getTime())) {
    throw new Error('Invalid start time');
  }
  
  if (isNaN(end.getTime())) {
    throw new Error('Invalid end time');
  }
  
  if (end <= start) {
    throw new Error('End time must be after start time');
  }
  
  return true;
};

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz; 