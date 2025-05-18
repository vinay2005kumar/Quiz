import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';

const SubjectList = () => {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    year: '',
    semester: ''
  });

  const departments = [
    'Computer Science',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical'
  ];

  const years = [
    { value: 1, label: 'First Year' },
    { value: 2, label: 'Second Year' },
    { value: 3, label: 'Third Year' },
    { value: 4, label: 'Fourth Year' }
  ];

  const getSemestersByYear = (year) => {
    switch (parseInt(year)) {
      case 1: return [
        { value: 1, label: 'First Semester' },
        { value: 2, label: 'Second Semester' }
      ];
      case 2: return [
        { value: 3, label: 'Third Semester' },
        { value: 4, label: 'Fourth Semester' }
      ];
      case 3: return [
        { value: 5, label: 'Fifth Semester' },
        { value: 6, label: 'Sixth Semester' }
      ];
      case 4: return [
        { value: 7, label: 'Seventh Semester' },
        { value: 8, label: 'Eighth Semester' }
      ];
      default: return [];
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, subjects]);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subject');
      const sortedSubjects = response.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.semester - b.semester;
      });
      setSubjects(sortedSubjects);
      setFilteredSubjects(sortedSubjects);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Failed to fetch subjects');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...subjects];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(subject => 
        subject.name.toLowerCase().includes(searchTerm) ||
        subject.code.toLowerCase().includes(searchTerm)
      );
    }

    // Apply department filter
    if (filters.department) {
      filtered = filtered.filter(subject => 
        subject.department === filters.department
      );
    }

    // Apply year filter
    if (filters.year) {
      filtered = filtered.filter(subject => 
        subject.year === parseInt(filters.year)
      );
    }

    // Apply semester filter
    if (filters.semester) {
      filtered = filtered.filter(subject => 
        subject.semester === parseInt(filters.semester)
      );
    }

    setFilteredSubjects(filtered);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [name]: value
      };
      
      // Reset semester when year changes
      if (name === 'year') {
        newFilters.semester = '';
      }
      
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      department: '',
      year: '',
      semester: ''
    });
  };

  const formatYearSemester = (year, semester) => {
    const yearNames = ['First', 'Second', 'Third', 'Fourth'];
    const semesterNames = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth'];
    return `${yearNames[year-1]} Year - ${semesterNames[semester-1]} Semester`;
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/subject/${id}`);
      fetchSubjects();
      setSubjectToDelete(null);
    } catch (error) {
      setError('Failed to delete subject');
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Subjects
        </Typography>
        {user.role === 'admin' && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/subjects/create')}
          >
            Add Subject
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          <FilterListIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by name or code"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="medium">
              <InputLabel id="department-filter-label">All Departments</InputLabel>
              <Select
                labelId="department-filter-label"
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
                label="All Departments"
                displayEmpty
                sx={{
                  minWidth: '200px',
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '42px'
                  }
                }}
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="medium">
              <InputLabel id="year-filter-label">All Years</InputLabel>
              <Select
                labelId="year-filter-label"
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                label="All Years"
                displayEmpty
                sx={{
                  minWidth: '200px',
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '42px'
                  }
                }}
              >
                <MenuItem value="">All Years</MenuItem>
                {years.map(({ value, label }) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="medium">
              <InputLabel id="semester-filter-label">All Semesters</InputLabel>
              <Select
                labelId="semester-filter-label"
                name="semester"
                value={filters.semester}
                onChange={handleFilterChange}
                label="All Semesters"
                disabled={!filters.year}
                displayEmpty
                sx={{
                  minWidth: '200px',
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '42px'
                  }
                }}
              >
                <MenuItem value="">All Semesters</MenuItem>
                {getSemestersByYear(filters.year).map(({ value, label }) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearFilters}
              disabled={!filters.search && !filters.department && !filters.year && !filters.semester}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Year & Semester</TableCell>
              <TableCell>Credits</TableCell>
              {user.role === 'admin' && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={user.role === 'admin' ? 6 : 5} align="center">
                  No subjects found matching the filters
                </TableCell>
              </TableRow>
            ) : (
              filteredSubjects.map((subject) => (
                <TableRow key={subject._id}>
                  <TableCell>{subject.code}</TableCell>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell>{subject.department}</TableCell>
                  <TableCell>{formatYearSemester(subject.year, subject.semester)}</TableCell>
                  <TableCell>{subject.credits}</TableCell>
                  {user.role === 'admin' && (
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/subjects/edit/${subject._id}`)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => {
                          setSubjectToDelete(subject._id);
                          setOpenDeleteDialog(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" id="delete-dialog-description" gutterBottom>
            Are you sure you want to delete this subject?
          </Typography>
          {subjectToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Subject Details:
              </Typography>
              {subjects.filter(s => s._id === subjectToDelete).map(subject => (
                <Box key={subject._id}>
                  <Typography variant="body2">
                    Code: {subject.code}
                  </Typography>
                  <Typography variant="body2">
                    Name: {subject.name}
                  </Typography>
                  <Typography variant="body2">
                    Department: {subject.department}
                  </Typography>
                  <Typography variant="body2">
                    Year & Semester: {formatYearSemester(subject.year, subject.semester)}
                  </Typography>
                  <Typography variant="body2">
                    Credits: {subject.credits}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              handleDelete(subjectToDelete);
              setOpenDeleteDialog(false);
            }} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubjectList; 