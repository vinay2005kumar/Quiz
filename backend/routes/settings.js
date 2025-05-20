const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const Section = require('../models/Section');
const { auth, isAdmin } = require('../middleware/auth');
const mongoose = require('mongoose');
const multer = require('multer');
const XLSX = require('xlsx');

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Please upload an Excel file (.xlsx or .xls)'));
    }
  }
});

// Get all departments - Public endpoint
router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.find().sort('name');
    res.json({ departments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching departments' });
  }
});

// Create department - Admin only
router.post('/departments', auth, isAdmin, async (req, res) => {
  try {
    const department = new Department(req.body);
    await department.save();
    res.status(201).json(department);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Department already exists' });
    } else {
      res.status(500).json({ message: 'Error creating department' });
    }
  }
});

// Update department - Admin only
router.put('/departments/:id', auth, isAdmin, async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: 'Error updating department' });
  }
});

// Delete department - Admin only
router.delete('/departments/:id', auth, isAdmin, async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    // Also delete associated sections
    await Section.deleteMany({ department: department.name });
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting department' });
  }
});

// Helper function to check MongoDB state
const checkMongoState = async () => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\n=== MongoDB State ===');
    console.log('Available collections:', collections.map(c => c.name));
    
    if (collections.some(c => c.name === 'sections')) {
      const sectionsCollection = db.collection('sections');
      const count = await sectionsCollection.countDocuments();
      const docs = await sectionsCollection.find({}).toArray();
      console.log('Total sections:', count);
      console.log('All sections:', JSON.stringify(docs, null, 2));
      
      // Check indexes
      const indexes = await sectionsCollection.indexes();
      console.log('Collection indexes:', indexes);
      
      return { count, docs, indexes };
    } else {
      console.log('Sections collection does not exist');
      return { count: 0, docs: [], indexes: [] };
    }
  } catch (error) {
    console.error('Error checking MongoDB state:', error);
    return { error };
  }
};

// Reset sections collection
router.post('/reset-sections', auth, isAdmin, async (req, res) => {
  try {
    console.log('\n=== Resetting Sections Collection ===');
    const db = mongoose.connection.db;
    
    // Drop the collection if it exists
    try {
      await db.collection('sections').drop();
      console.log('Sections collection dropped');
    } catch (error) {
      if (error.code !== 26) { // 26 is collection doesn't exist
        throw error;
      }
      console.log('Sections collection did not exist');
    }
    
    // Recreate indexes
    await Section.createIndexes();
    console.log('Indexes recreated');
    
    // Check state after reset
    const state = await checkMongoState();
    console.log('State after reset:', state);
    
    res.json({ message: 'Sections reset successfully', state });
  } catch (error) {
    console.error('Error resetting sections:', error);
    res.status(500).json({ message: 'Error resetting sections', error: error.message });
  }
});

// Reset sections collection and indexes
router.post('/reset-sections-indexes', auth, isAdmin, async (req, res) => {
  try {
    console.log('\n=== Resetting Section Indexes ===');
    
    // Get the collection
    const db = mongoose.connection.db;
    const sectionsCollection = db.collection('sections');
    
    // Drop all indexes except _id
    const indexes = await sectionsCollection.indexes();
    for (const index of indexes) {
      if (index.name !== '_id_') {
        await sectionsCollection.dropIndex(index.name);
        console.log(`Dropped index: ${index.name}`);
      }
    }
    
    // Recreate the correct compound index
    await sectionsCollection.createIndex(
      { name: 1, department: 1, year: 1, semester: 1 },
      { unique: true }
    );
    console.log('Created new compound index');
    
    res.json({ message: 'Section indexes reset successfully' });
  } catch (error) {
    console.error('Error resetting section indexes:', error);
    res.status(500).json({ 
      message: 'Error resetting section indexes',
      error: error.message 
    });
  }
});

// Get all sections - Public endpoint
router.get('/sections', async (req, res) => {
  try {
    console.log('\n=== Fetching Sections ===');
    
    // Check MongoDB state first
    const mongoState = await checkMongoState();
    console.log('MongoDB state before fetch:', mongoState);
    
    // Get sections using Mongoose
    const sections = await Section.find().lean();
    console.log('Sections from Mongoose:', sections);
    
    // Group sections
    const groupedSections = sections.reduce((acc, section) => {
      const key = `${section.department}-${section.year}-${section.semester}`;
      if (!acc[key]) {
        acc[key] = {
          _id: section._id,
          department: section.department,
          year: section.year,
          semester: section.semester,
          sections: [],
          sectionIds: {}
        };
      }
      acc[key].sections.push(section.name);
      acc[key].sectionIds[section.name] = section._id;
      return acc;
    }, {});
    
    const finalSections = Object.values(groupedSections);
    console.log('Grouped sections:', finalSections);
    
    res.json({ 
      sections: finalSections,
      debug: { mongoState }
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ message: 'Error fetching sections', error: error.message });
  }
});

// Create section
router.post('/sections', auth, isAdmin, async (req, res) => {
  try {
    console.log('\n=== Creating Section ===');
    console.log('Request body:', req.body);
    
    // Validate request body
    if (!req.body.name || !req.body.department || !req.body.year || !req.body.semester) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        received: req.body
      });
    }

    // Validate year and semester
    const year = Number(req.body.year);
    const semester = Number(req.body.semester);

    if (isNaN(year) || year < 1 || year > 4) {
      return res.status(400).json({ 
        message: 'Invalid year. Must be between 1 and 4',
        received: year
      });
    }

    if (isNaN(semester) || semester < 1 || semester > 8) {
      return res.status(400).json({ 
        message: 'Invalid semester. Must be between 1 and 8',
        received: semester
      });
    }

    // Check if department exists
    const department = await Department.findOne({ name: req.body.department });
    if (!department) {
      return res.status(400).json({ 
        message: 'Department not found',
        department: req.body.department
      });
    }

    // Check for existing section
    let section = await Section.findOne({
      name: req.body.name,
      department: req.body.department,
      year: year,
      semester: semester
    });

    if (section) {
      // If section exists, return it with a 200 status instead of error
      return res.status(200).json({
        ...section.toObject(),
        alreadyExists: true
      });
    }

    // Create new section
    section = new Section({
      name: req.body.name,
      department: req.body.department,
      year: year,
      semester: semester
    });

    const savedSection = await section.save();
    console.log('Section saved successfully:', savedSection);

    res.status(201).json(savedSection);
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ 
      message: 'Error creating section',
      error: error.message
    });
  }
});

// Update section
router.put('/sections/:id', auth, isAdmin, async (req, res) => {
  try {
    const section = await Section.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }
    res.json(section);
  } catch (error) {
    res.status(500).json({ message: 'Error updating section' });
  }
});

// Delete section
router.delete('/sections/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id === 'undefined') {
      return res.status(400).json({ 
        message: 'Invalid section ID provided',
        debug: { receivedId: id }
      });
    }

    // Verify the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        message: 'Invalid section ID format',
        debug: { receivedId: id }
      });
    }

    console.log('Attempting to delete section:', id);
    const section = await Section.findById(id);
    
    if (!section) {
      return res.status(404).json({ 
        message: 'Section not found',
        debug: { receivedId: id }
      });
    }

    console.log('Found section to delete:', section);
    await section.deleteOne();
    console.log('Section deleted successfully');

    res.json({ 
      message: 'Section deleted successfully',
      deletedSection: section
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ 
      message: 'Error deleting section',
      error: error.message,
      debug: {
        errorType: error.name,
        errorMessage: error.message,
        receivedId: req.params.id
      }
    });
  }
});

// Upload sections from Excel
router.post('/sections/upload', auth, isAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    // Validate headers
    const requiredHeaders = ['Department', 'Year', 'Semester', 'Sections'];
    const headers = Object.keys(data[0]);
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return res.status(400).json({ 
        message: `Missing required columns: ${missingHeaders.join(', ')}` 
      });
    }

    const results = {
      success: [],
      errors: []
    };

    // Process each row
    for (const row of data) {
      try {
        // Validate department exists
        const department = await Department.findOne({ name: row.Department });
        if (!department) {
          results.errors.push({
            row: row,
            error: `Department "${row.Department}" not found`
          });
          continue;
        }

        // Validate year and semester
        const year = parseInt(row.Year);
        const semester = parseInt(row.Semester);
        
        if (isNaN(year) || year < 1 || year > 4) {
          results.errors.push({
            row: row,
            error: 'Year must be between 1 and 4'
          });
          continue;
        }

        if (isNaN(semester) || semester < 1 || semester > 8) {
          results.errors.push({
            row: row,
            error: 'Semester must be between 1 and 8'
          });
          continue;
        }

        // Process sections
        const sections = row.Sections.split(',').map(s => s.trim()).filter(s => s);
        
        for (const sectionName of sections) {
          try {
            const existingSection = await Section.findOne({
              name: sectionName,
              department: row.Department,
              year: year,
              semester: semester
            });

            if (!existingSection) {
              await Section.create({
                name: sectionName,
                department: row.Department,
                year: year,
                semester: semester
              });
              results.success.push({
                department: row.Department,
                year: year,
                semester: semester,
                section: sectionName
              });
            }
          } catch (error) {
            results.errors.push({
              row: row,
              section: sectionName,
              error: error.message
            });
          }
        }
      } catch (error) {
        results.errors.push({
          row: row,
          error: error.message
        });
      }
    }

    res.json({
      message: 'File processed successfully',
      results: {
        totalProcessed: data.length,
        successCount: results.success.length,
        errorCount: results.errors.length,
        successDetails: results.success,
        errorDetails: results.errors
      }
    });

  } catch (error) {
    console.error('Error processing Excel file:', error);
    res.status(500).json({ 
      message: 'Error processing Excel file',
      error: error.message 
    });
  }
});

module.exports = router;  