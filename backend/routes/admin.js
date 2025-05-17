const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const AdmissionRange = require('../models/AdmissionRange');
const User = require('../models/User');
const multer = require('multer');
const XLSX = require('xlsx');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Get all admission ranges
router.get('/admission-ranges', auth, authorize('admin'), async (req, res) => {
  try {
    const ranges = await AdmissionRange.find()
      .populate('updatedBy', 'name email')
      .sort({ department: 1, year: -1, section: 1 });
    res.json(ranges);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new admission range
router.post('/admission-ranges', auth, authorize('admin'), async (req, res) => {
  try {
    const range = new AdmissionRange({
      ...req.body,
      updatedBy: req.user._id
    });
    await range.save();
    res.status(201).json(range);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
});

// Update admission range
router.put('/admission-ranges/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const range = await AdmissionRange.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user._id,
        lastUpdated: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!range) {
      return res.status(404).json({ message: 'Range not found' });
    }
    
    res.json(range);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
});

// Delete admission range
router.delete('/admission-ranges/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const range = await AdmissionRange.findByIdAndDelete(req.params.id);
    
    if (!range) {
      return res.status(404).json({ message: 'Range not found' });
    }
    
    res.json({ message: 'Range deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk upload admission ranges through Excel
router.post('/admission-ranges/bulk-upload', auth, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const workbook = XLSX.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const ranges = data.map(row => ({
      department: row.Department,
      year: row.Year,
      section: row.Section,
      regularEntry: {
        start: row.RegularStart,
        end: row.RegularEnd
      },
      lateralEntry: {
        start: row.LateralStart,
        end: row.LateralEnd
      },
      isActive: true,
      updatedBy: req.user._id
    }));

    await AdmissionRange.insertMany(ranges);

    res.status(201).json({ 
      message: `Successfully uploaded ${ranges.length} ranges`,
      count: ranges.length
    });
  } catch (error) {
    res.status(400).json({ message: 'Upload failed', error: error.message });
  }
});

// Validate admission number
router.post('/validate-admission', auth, async (req, res) => {
  try {
    const { admissionNumber, department, year, section } = req.body;

    const range = await AdmissionRange.findOne({
      department,
      year,
      section,
      isActive: true
    });

    if (!range) {
      return res.status(404).json({ message: 'No range configuration found' });
    }

    const isRegular = admissionNumber.startsWith('y');
    const entry = isRegular ? range.regularEntry : range.lateralEntry;
    const num = parseInt(admissionNumber.slice(-3));
    const startNum = parseInt(entry.start.slice(-3));
    const endNum = parseInt(entry.end.slice(-3));

    const isValid = num >= startNum && num <= endNum;

    res.json({
      isValid,
      message: isValid ? 'Valid admission number' : 'Invalid admission number for this section'
    });
  } catch (error) {
    res.status(500).json({ message: 'Validation failed', error: error.message });
  }
});

// Get student counts by semester and section
router.get('/student-counts', auth, authorize('admin'), async (req, res) => {
  try {
    const counts = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: {
            department: '$department',
            year: '$year',
            section: '$section'
          },
          count: { $sum: 1 },
          regularCount: {
            $sum: { $cond: [{ $eq: ['$isLateral', false] }, 1, 0] }
          },
          lateralCount: {
            $sum: { $cond: [{ $eq: ['$isLateral', true] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          department: '$_id.department',
          year: '$_id.year',
          section: '$_id.section',
          totalCount: '$count',
          regularCount: '$regularCount',
          lateralCount: '$lateralCount'
        }
      },
      { $sort: { department: 1, year: 1, section: 1 } }
    ]);

    res.json(counts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 