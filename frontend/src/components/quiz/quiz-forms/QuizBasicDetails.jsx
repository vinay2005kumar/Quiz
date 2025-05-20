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
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({
    departments: [],
    years: [],
    semesters: [],
    sections: []
  });

  // Debug logging for user permissions
  useEffect(() => {
    console.log('User permissions:', {
      departments: user?.departments || [],
      years: user?.years || [],
      semesters: user?.semesters || [],
      sections: user?.sections || [],
      subjects: user?.subjects || []
    });
  }, [user]);

  useEffect(() => {
    console.log('User data:', {
      departments: user?.departments,
      years: user?.years,
      semesters: user?.semesters,
      sections: user?.sections,
      assignments: user?.assignments
    });
    
    if (user?.departments?.length > 0) {
      fetchDepartments();
      fetchSections();
    }
  }, [user]);

  useEffect(() => {
    if (filters.departments.length > 0 && filters.years.length > 0 && filters.semesters.length > 0) {
      fetchSubjects();
    }
  }, [filters.departments, filters.years, filters.semesters]);

  // Add useEffect for auto-selecting departments
  useEffect(() => {
    if (departments.length === 1) {
      setFilters(prev => ({
        ...prev,
        departments: [departments[0].name]
      }));
    }
  }, [departments]);

  // Add useEffect for auto-selecting years and semesters
  useEffect(() => {
    const uniqueYears = [...new Set(sections.map(s => s.year))];
    const uniqueSemesters = [...new Set(sections.map(s => s.semester))];

    if (uniqueYears.length === 1) {
      setFilters(prev => ({
        ...prev,
        years: [uniqueYears[0]]
      }));
    }

    if (uniqueSemesters.length === 1) {
      setFilters(prev => ({
        ...prev,
        semesters: [uniqueSemesters[0]]
      }));
    }
  }, [sections]);

  // Add useEffect for auto-selecting subject
  useEffect(() => {
    if (subjects.length === 1) {
      setBasicDetails(prev => ({
        ...prev,
        subject: subjects[0]._id
      }));
    }
  }, [subjects, setBasicDetails]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/api/settings/departments');
      console.log('Departments API response:', response);
      
      if (response?.departments) {
        // Filter departments based on user's allowed departments
        const allowedDepartments = response.departments.filter(
          dept => user?.departments?.includes(dept.name)
        );
        console.log('Filtered departments:', allowedDepartments);
        setDepartments(allowedDepartments);

        // Auto-select department since user only has one
        if (user?.departments?.length === 1) {
          setFilters(prev => ({
            ...prev,
            departments: user.departments
          }));
        }
      } else {
        console.error('No departments found in response:', response);
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await api.get('/api/settings/sections');
      console.log('Sections API response:', response);
      
      if (response?.sections) {
        // Transform the grouped sections data
        const allSections = response.sections.map(group => ({
          department: group.department,
          year: group.year.toString(),
          semester: group.semester.toString(),
          sections: group.sections.map(s => s.toString())
        }));
        console.log('Transformed sections:', allSections);

        // Filter sections based on user's assignments
        const allowedSections = allSections.filter(section => {
          // Check if this combination exists in user's assignments
          return user?.assignments?.some(assignment => 
            assignment.department === section.department &&
            assignment.year === section.year &&
            assignment.semester === section.semester &&
            section.sections.some(sec => assignment.sections.includes(sec))
          );
        });

        console.log('Filtered sections:', allowedSections);
        setSections(allowedSections);
      } else {
        console.error('No sections found in response:', response);
        setSections([]);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      console.log('Fetching subjects with filters:', filters);
      // Fetch subjects for all selected combinations
      const subjectPromises = filters.departments.flatMap(dept =>
        filters.years.flatMap(year =>
          filters.semesters.map(sem =>
            api.get('/api/subjects', {
              params: {
                department: dept,
                year: year,
                semester: sem
              }
            })
          )
        )
      );

      const responses = await Promise.all(subjectPromises);
      console.log('Subjects API responses:', responses);
      
      // Flatten and transform subject responses
      const allSubjects = responses.flatMap(response => 
        Array.isArray(response.data) ? response.data : []
      );

      // Remove duplicates based on subject ID
      const uniqueSubjects = Array.from(
        new Map(allSubjects.map(item => [item._id, item])).values()
      );
      console.log('Unique subjects:', uniqueSubjects);

      // Filter subjects based on user's assignments
      const allowedSubjects = uniqueSubjects.filter(subject => {
        // Check if this subject matches any of the user's assignments
        return user?.assignments?.some(assignment =>
          assignment.department === subject.department &&
          assignment.year.toString() === subject.year.toString() &&
          assignment.semester.toString() === subject.semester.toString()
        );
      });

      console.log('Filtered subjects:', allowedSubjects);
      setSubjects(allowedSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    }
  };

  // Get available years based on user's assignments and selected departments
  const getAvailableYears = () => {
    if (!filters.departments.length) return [];
    return user?.years || [];
  };

  // Get available semesters based on user's assignments and selected departments/years
  const getAvailableSemesters = () => {
    if (!filters.departments.length || !filters.years.length) return [];
    return user?.semesters || [];
  };

  // Get available sections based on user's assignments and selected filters
  const getAvailableSections = () => {
    if (!filters.departments.length || !filters.years.length || !filters.semesters.length) return [];

    // Get sections based on selected combinations from assignments
    const availableSections = new Set();
    
    user?.assignments?.forEach(assignment => {
      if (
        filters.departments.includes(assignment.department) &&
        filters.years.includes(assignment.year) &&
        filters.semesters.includes(assignment.semester)
      ) {
        assignment.sections.forEach(section => availableSections.add(section));
      }
    });

    return Array.from(availableSections).sort();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [name]: value
      };
      
      // Reset dependent fields
      if (name === 'departments') {
        newFilters.years = [];
        newFilters.semesters = [];
        setBasicDetails(prev => ({
          ...prev,
          subject: '',
          allowedGroups: []
        }));
      } else if (name === 'years') {
        newFilters.semesters = [];
        setBasicDetails(prev => ({
          ...prev,
          subject: '',
          allowedGroups: []
        }));
      } else if (name === 'semesters') {
        setBasicDetails(prev => ({
          ...prev,
          subject: '',
          allowedGroups: []
        }));
      }
      
      return newFilters;
    });
  };

  const handleBasicDetailsChange = (e) => {
    const { name, value } = e.target;
    setBasicDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSectionsChange = (event) => {
    const selectedSections = event.target.value;
    
    // Create allowedGroups array based on selected values
    const allowedGroups = [];

    // For each selected section, add all valid year-semester combinations from assignments
    selectedSections.forEach(section => {
      user?.assignments?.forEach(assignment => {
        if (
          filters.departments.includes(assignment.department) &&
          filters.years.includes(assignment.year) &&
          filters.semesters.includes(assignment.semester) &&
          assignment.sections.includes(section)
        ) {
          allowedGroups.push({
            department: assignment.department,
            year: parseInt(assignment.year),
            semester: parseInt(assignment.semester),
            section: section
          });
        }
      });
    });

    setBasicDetails(prev => ({
      ...prev,
      allowedGroups: allowedGroups
    }));
  };

  return (
    <Grid container spacing={3}>
      {error && (
        <Grid item xs={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      )}

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Quiz Title"
          name="title"
          value={basicDetails.title}
          onChange={handleBasicDetailsChange}
          required
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Department</InputLabel>
          <Select
            multiple
            name="departments"
            value={filters.departments}
            onChange={handleFilterChange}
            input={<OutlinedInput label="Department" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            )}
          >
            {departments.map((dept) => (
              <MenuItem key={dept.name} value={dept.name}>
                {dept.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Year</InputLabel>
          <Select
            multiple
            name="years"
            value={filters.years}
            onChange={handleFilterChange}
            input={<OutlinedInput label="Year" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={`Year ${value}`} />
                ))}
              </Box>
            )}
            disabled={!filters.departments.length}
          >
            {getAvailableYears().map((year) => (
              <MenuItem key={year} value={year}>
                Year {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Semester</InputLabel>
          <Select
            multiple
            name="semesters"
            value={filters.semesters}
            onChange={handleFilterChange}
            input={<OutlinedInput label="Semester" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={`Semester ${value}`} />
                ))}
              </Box>
            )}
            disabled={!filters.years.length}
          >
            {getAvailableSemesters().map((semester) => (
              <MenuItem key={semester} value={semester}>
                Semester {semester}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Subject</InputLabel>
          <Select
            name="subject"
            value={basicDetails.subject}
            onChange={handleBasicDetailsChange}
            label="Subject"
            disabled={!filters.semesters.length}
          >
            {subjects.map(subject => (
              <MenuItem key={subject._id} value={subject._id}>
                {subject.name} ({subject.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Sections</InputLabel>
          <Select
            multiple
            value={basicDetails.allowedGroups.map(g => g.section).filter((v, i, a) => a.indexOf(v) === i)}
            onChange={handleSectionsChange}
            input={<OutlinedInput label="Sections" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  // Get all year-semester combinations for this section
                  const combinations = basicDetails.allowedGroups
                    .filter(g => g.section === value)
                    .map(g => `${g.year}-${g.semester}`)
                    .join(', ');
                  
                  return (
                    <Chip 
                      key={value} 
                      label={`Section ${value} (${combinations})`}
                    />
                  );
                })}
              </Box>
            )}
            disabled={!filters.semesters.length}
          >
            {getAvailableSections().map((section) => {
              // Show which year-semester combinations this section is available for
              const availableCombos = user?.assignments
                ?.filter(assignment =>
                  filters.departments.includes(assignment.department) &&
                  filters.years.includes(assignment.year) &&
                  filters.semesters.includes(assignment.semester) &&
                  assignment.sections.includes(section)
                )
                .map(assignment => `${assignment.year}-${assignment.semester}`)
                .join(', ');

              return (
                <MenuItem key={section} value={section}>
                  Section {section} ({availableCombos})
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          type="number"
          label="Duration (minutes)"
          name="duration"
          value={basicDetails.duration}
          onChange={handleBasicDetailsChange}
          required
          inputProps={{ min: 1 }}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          type="datetime-local"
          label="Start Time"
          name="startTime"
          value={basicDetails.startTime}
          onChange={handleBasicDetailsChange}
          required
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          type="datetime-local"
          label="End Time"
          name="endTime"
          value={basicDetails.endTime}
          onChange={handleBasicDetailsChange}
          required
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
    </Grid>
  );
};

export default QuizBasicDetails; 