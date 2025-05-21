import { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  OutlinedInput,
  Alert
} from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../config/axios';

const QuizBasicDetails = ({ basicDetails, setBasicDetails, error }) => {
  const { user } = useAuth();
  const [academicStructure, setAcademicStructure] = useState({});
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    semester: '',
    sections: []
  });
  const [subjects, setSubjects] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);

  // Fetch academic structure on component mount
  useEffect(() => {
    const fetchAcademicStructure = async () => {
      try {
        const response = await api.get('/api/academic-details/faculty-structure');
        console.log('Academic structure response:', response);
        
        if (!response || !response.data || typeof response.data !== 'object') {
          console.error('Invalid academic structure response:', response);
          throw new Error('Invalid response from server');
        }

        setAcademicStructure(response.data);
        
        // If user has only one department, auto-select it
        if (user?.assignments?.length === 1) {
          const assignment = user.assignments[0];
          setFilters(prev => ({
            ...prev,
            department: assignment.department,
            year: assignment.year,
            semester: assignment.semester
          }));
        }
      } catch (error) {
        console.error('Error fetching academic structure:', error);
        setAcademicStructure({});
      }
    };

    fetchAcademicStructure();
  }, [user]);

  // Update available years when department changes
  useEffect(() => {
    if (filters.department && user?.assignments) {
      // Filter years based on faculty assignments
      const years = [...new Set(
        user.assignments
          .filter(a => a.department === filters.department)
          .map(a => a.year)
      )].sort();
      setAvailableYears(years);

      // Reset year if current selection is not in available years
      if (!years.includes(filters.year)) {
        setFilters(prev => ({ ...prev, year: '', semester: '', sections: [] }));
      }
    } else {
      setAvailableYears([]);
    }
  }, [filters.department, user?.assignments]);

  // Update available semesters when year changes
  useEffect(() => {
    if (filters.department && filters.year && user?.assignments) {
      // Filter semesters based on faculty assignments
      const semesters = [...new Set(
        user.assignments
          .filter(a => 
            a.department === filters.department && 
            a.year === filters.year
          )
          .map(a => a.semester)
      )].sort();
      setAvailableSemesters(semesters);

      // Reset semester if current selection is not in available semesters
      if (!semesters.includes(filters.semester)) {
        setFilters(prev => ({ ...prev, semester: '', sections: [] }));
      }
    } else {
      setAvailableSemesters([]);
    }
  }, [filters.department, filters.year, user?.assignments]);

  // Update available sections when semester changes
  useEffect(() => {
    if (filters.department && filters.year && filters.semester && user?.assignments) {
      // Find matching assignment
      const assignment = user.assignments.find(a => 
        a.department === filters.department && 
        a.year === filters.year && 
        a.semester === filters.semester
      );

      // Get sections from assignment
      const sections = assignment ? assignment.sections : [];
      setAvailableSections(sections);

      // Reset sections if none match
      if (filters.sections.some(s => !sections.includes(s))) {
        setFilters(prev => ({ ...prev, sections: [] }));
      }
    } else {
      setAvailableSections([]);
    }
  }, [filters.department, filters.year, filters.semester, user?.assignments]);

  // Update subjects when filters change
  useEffect(() => {
    if (filters.department && filters.year && filters.semester) {
      try {
        // Get subjects from academic structure for the selected filters
        const semesterData = academicStructure[filters.department]?.years[filters.year]?.semesters[filters.semester];
        
        if (semesterData?.subjects && Array.isArray(semesterData.subjects)) {
          // Subjects are already in the correct format
          setSubjects(semesterData.subjects);
        } else {
          setSubjects([]);
        }
      } catch (error) {
        console.error('Error processing subjects:', error);
        setSubjects([]);
      }
    } else {
      setSubjects([]);
    }
  }, [filters, academicStructure]);

  // Handle basic details changes
  const handleBasicDetailsChange = (event) => {
    const { name, value } = event.target;
    setBasicDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle filter changes
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [name]: value
      };

      // Reset dependent fields
      if (name === 'department') {
        newFilters.year = '';
        newFilters.semester = '';
        newFilters.sections = [];
      } else if (name === 'year') {
        newFilters.semester = '';
        newFilters.sections = [];
      } else if (name === 'semester') {
        newFilters.sections = [];
      }

      return newFilters;
    });
  };

  // Handle sections change
  const handleSectionsChange = (event) => {
    const {
      target: { value },
    } = event;
    
    // On autofill we get a stringified value.
    const sections = typeof value === 'string' ? value.split(',') : value;
    
    setFilters(prev => ({
      ...prev,
      sections
    }));

    // Update allowed groups in basic details
    if (filters.department && filters.year && sections.length > 0) {
      const allowedGroups = sections.map(section => ({
        department: filters.department,
        year: parseInt(filters.year),
        semester: parseInt(filters.semester),
        section: section.trim()
      }));
      
      setBasicDetails(prev => ({
        ...prev,
        allowedGroups
      }));
    }
  };

  return (
    <Grid container spacing={2}>
      {error && (
        <Grid item xs={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      )}

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Department</InputLabel>
          <Select
            name="department"
            value={filters.department}
            onChange={handleFilterChange}
            required
          >
            {user?.assignments && [...new Set(user.assignments.map(a => a.department))].map(dept => (
              <MenuItem key={dept} value={dept}>
                {dept}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Year</InputLabel>
          <Select
            name="year"
            value={filters.year}
            onChange={handleFilterChange}
            required
            disabled={!filters.department}
          >
            {availableYears.map(year => (
              <MenuItem key={year} value={year}>
                Year {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Semester</InputLabel>
          <Select
            name="semester"
            value={filters.semester}
            onChange={handleFilterChange}
            required
            disabled={!filters.year}
          >
            {availableSemesters.map(semester => (
              <MenuItem key={semester} value={semester}>
                Semester {semester}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Subject</InputLabel>
          <Select
            name="subject"
            value={basicDetails.subject || ''}
            onChange={handleBasicDetailsChange}
            required
            disabled={!filters.semester || subjects.length === 0}
          >
            {subjects.map(subject => (
              <MenuItem key={subject.name} value={subject.name}>
                {subject.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {filters.semester && subjects.length === 0 && (
          <Typography variant="caption" color="error" sx={{ mt: 1 }}>
            No subjects available for selected semester
          </Typography>
        )}
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Sections</InputLabel>
          <Select
            multiple
            name="sections"
            value={filters.sections}
            onChange={handleSectionsChange}
            input={<OutlinedInput label="Sections" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            )}
            required
            disabled={!filters.semester}
          >
            {availableSections.map(section => (
              <MenuItem key={section} value={section}>
                Section {section}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Quiz Title"
          name="title"
          value={basicDetails.title || ''}
          onChange={handleBasicDetailsChange}
          required
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Duration (minutes)"
          name="duration"
          type="number"
          value={basicDetails.duration || ''}
          onChange={handleBasicDetailsChange}
          required
          inputProps={{ min: 1 }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Start Time"
          name="startTime"
          type="datetime-local"
          value={basicDetails.startTime || ''}
          onChange={handleBasicDetailsChange}
          required
          InputLabelProps={{
            shrink: true,
          }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="End Time"
          name="endTime"
          type="datetime-local"
          value={basicDetails.endTime || ''}
          onChange={handleBasicDetailsChange}
          required
          InputLabelProps={{
            shrink: true,
          }}
        />
      </Grid>

    </Grid>
  );
};

export default QuizBasicDetails; 