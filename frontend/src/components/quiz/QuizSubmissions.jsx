import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const QuizAuthorizedStudents = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [students, setStudents] = useState([]);
  const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'];
  const [filters, setFilters] = useState({
    admissionNumber: '',
    scoreRange: 'all',
    submissionStatus: 'all',
    department: 'all',
    year: 'all',
    section: 'all'
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'admissionNumber',
    direction: 'asc'
  });

  useEffect(() => {
    fetchAuthorizedStudents();
  }, [id]);

  const fetchAuthorizedStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/quiz/${id}/authorized-students`);
      setQuiz(response.data.quiz);
      setStudents(response.data.students);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching authorized students:', error);

      let errorMessage = 'Failed to load student data';
      if (error.response) {
        // The request was made and the server responded with a status code
        errorMessage = error.response.data.message ||
          error.response.data.error ||
          error.response.statusText;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server';
      } else {
        // Something happened in setting up the request
        errorMessage = error.message;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      admissionNumber: '',
      scoreRange: 'all',
      submissionStatus: 'all',
      department: 'all',
      year: 'all',
      section: 'all'
    });
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Helper function to format duration
  const formatDuration = (durationInMinutes) => {
    if (!durationInMinutes && durationInMinutes !== 0) return 'Not submitted';
    
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Helper function to calculate score percentage
  const calculateScorePercentage = (score, totalMarks) => {
    if (score === undefined || totalMarks === 0) return 0;
    return (score / totalMarks) * 100;
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Admission number filter
      if (filters.admissionNumber &&
        !student.student.admissionNumber.toLowerCase().includes(filters.admissionNumber.toLowerCase())) {
        return false;
      }

      // Score range filter
      if (filters.scoreRange !== 'all') {
        const scorePercentage = calculateScorePercentage(student.totalMarks, quiz.totalMarks);
        const [min, max] = filters.scoreRange.split('-').map(Number);
        
        // If no submission, handle based on filter range
        if (!student.hasSubmitted) {
          // Only include non-submitted students if filter includes 0
          return min === 0;
        }
        
        if (scorePercentage < min || scorePercentage > max) return false;
      }

      // Submission status filter
      if (filters.submissionStatus !== 'all') {
        if (filters.submissionStatus === 'submitted' && !student.hasSubmitted) return false;
        if (filters.submissionStatus === 'not-submitted' && student.hasSubmitted) return false;
        if (filters.submissionStatus !== 'submitted' &&
          filters.submissionStatus !== 'not-submitted' &&
          student.submissionStatus !== filters.submissionStatus) {
          return false;
        }
      }

      // Department filter
      if (filters.department !== 'all' && student.student.department !== filters.department) {
        return false;
      }

      // Year filter
      if (filters.year !== 'all' && student.student.year !== parseInt(filters.year)) {
        return false;
      }

      // Section filter
      if (filters.section !== 'all' && student.student.section !== filters.section) {
        return false;
      }

      return true;
    });
  }, [students, filters, quiz]);

  const sortedStudents = useMemo(() => {
    const sortableStudents = [...filteredStudents];
    if (sortConfig.key) {
      sortableStudents.sort((a, b) => {
        // Handle different sort keys
        if (sortConfig.key === 'admissionNumber') {
          return sortConfig.direction === 'asc'
            ? a.student.admissionNumber.localeCompare(b.student.admissionNumber)
            : b.student.admissionNumber.localeCompare(a.student.admissionNumber);
        } else if (sortConfig.key === 'score') {
          // Handle cases where score might be undefined
          if (!a.hasSubmitted && !b.hasSubmitted) return 0;
          if (!a.hasSubmitted) return sortConfig.direction === 'asc' ? -1 : 1;
          if (!b.hasSubmitted) return sortConfig.direction === 'asc' ? 1 : -1;
          
          const scorePercentageA = calculateScorePercentage(a.totalMarks, quiz.totalMarks);
          const scorePercentageB = calculateScorePercentage(b.totalMarks, quiz.totalMarks);
          return sortConfig.direction === 'asc' ? scorePercentageA - scorePercentageB : scorePercentageB - scorePercentageA;
        } else if (sortConfig.key === 'submissionStatus') {
          return sortConfig.direction === 'asc'
            ? a.submissionStatus.localeCompare(b.submissionStatus)
            : b.submissionStatus.localeCompare(a.submissionStatus);
        } else if (sortConfig.key === 'name') {
          return sortConfig.direction === 'asc'
            ? a.student.name.localeCompare(b.student.name)
            : b.student.name.localeCompare(a.student.name);
        } else if (sortConfig.key === 'duration') {
          if (!a.duration) return sortConfig.direction === 'asc' ? 1 : -1;
          if (!b.duration) return sortConfig.direction === 'asc' ? -1 : 1;
          
          return sortConfig.direction === 'asc' ? a.duration - b.duration : b.duration - a.duration;
        }
        return 0;
      });
    }
    return sortableStudents;
  }, [filteredStudents, sortConfig, quiz]);

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/quizzes')}
            sx={{ mb: 2 }}
          >
            Back to Quizzes
          </Button>

          <Typography variant="h4" gutterBottom>
            {quiz?.title} - Authorized Students
          </Typography>

          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2">
              Department: {quiz?.allowedDepartments.join(', ')}
            </Typography>
            <Typography variant="body2">
              Year: {quiz?.allowedYears.join(', ')}
            </Typography>
            <Typography variant="body2">
              Section: {quiz?.allowedSections.join(', ')}
            </Typography>
            <Typography variant="body2">
              Total Students: {students.length}
            </Typography>
            <Typography variant="body2">
              Submitted: {students.filter(s => s.hasSubmitted).length}
            </Typography>
            <Typography variant="body2">
              Not Submitted: {students.filter(s => !s.hasSubmitted).length}
            </Typography>
            <Typography variant="body2">
              Average Duration: {
                (() => {
                  const submittedStudents = students.filter(s => s.duration);
                  if (submittedStudents.length === 0) return 'N/A';
                  const avgDuration = submittedStudents.reduce((sum, s) => sum + s.duration, 0) / submittedStudents.length;
                  return formatDuration(Math.round(avgDuration));
                })()
              }
            </Typography>
          </Box>
        </Box>
        <Box sx={{ px: { xs: 2, sm: 0 }, mb: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <FilterListIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Filters</Typography>
            </Box>
            <Grid container spacing={2}>
              {/* Admission Number Filter */}
              <Grid xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Admission Number"
                  value={filters.admissionNumber}
                  onChange={(e) => handleFilterChange('admissionNumber', e.target.value)}
                />
              </Grid>

              {/* Score Range Filter */}
              <Grid xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Score Range</InputLabel>
                  <Select
                    value={filters.scoreRange}
                    onChange={(e) => handleFilterChange('scoreRange', e.target.value)}
                    label="Score Range"
                  >
                    <MenuItem value="all">All Scores</MenuItem>
                    <MenuItem value="0-50">0 - 50%</MenuItem>
                    <MenuItem value="50-75">50 - 75%</MenuItem>
                    <MenuItem value="75-90">75 - 90%</MenuItem>
                    <MenuItem value="90-100">90 - 100%</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Submission Status Filter */}
              <Grid xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Submission Status</InputLabel>
                  <Select
                    value={filters.submissionStatus}
                    onChange={(e) => handleFilterChange('submissionStatus', e.target.value)}
                    label="Submission Status"
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="submitted">Submitted</MenuItem>
                    <MenuItem value="not-submitted">Not Submitted</MenuItem>
                    <MenuItem value="evaluated">Evaluated</MenuItem>
                    <MenuItem value="started">Started</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Department Filter */}
              <Grid xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    label="Department"
                  >
                    <MenuItem value="all">All Departments</MenuItem>
                    {departments.map(dept => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Year Filter */}
              <Grid xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    label="Year"
                  >
                    <MenuItem value="all">All Years</MenuItem>
                    {[1, 2, 3, 4].map(year => (
                      <MenuItem key={year} value={year}>Year {year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Section Filter */}
              <Grid xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Section</InputLabel>
                  <Select
                    value={filters.section}
                    onChange={(e) => handleFilterChange('section', e.target.value)}
                    label="Section"
                  >
                    <MenuItem value="all">All Sections</MenuItem>
                    {['A', 'B', 'C', 'D'].map(section => (
                      <MenuItem key={section} value={section}>Section {section}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Clear Filters Button */}
              <Grid xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={resetFilters}
                  disabled={Object.values(filters).every(v => v === 'all' || v === '')}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'name'}
                    direction={sortConfig.key === 'name' ? sortConfig.direction : 'asc'}
                    onClick={() => requestSort('name')}
                  >
                    Student Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'admissionNumber'}
                    direction={sortConfig.key === 'admissionNumber' ? sortConfig.direction : 'asc'}
                    onClick={() => requestSort('admissionNumber')}
                  >
                    Admission Number
                  </TableSortLabel>
                </TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'score'}
                    direction={sortConfig.key === 'score' ? sortConfig.direction : 'asc'}
                    onClick={() => requestSort('score')}
                  >
                    Score (%)
                  </TableSortLabel>
                </TableCell>
               
                <TableCell>Submission Time</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'duration'}
                    direction={sortConfig.key === 'duration' ? sortConfig.direction : 'asc'}
                    onClick={() => requestSort('duration')}
                  >
                    Duration
                  </TableSortLabel>
                </TableCell>
                 <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'submissionStatus'}
                    direction={sortConfig.key === 'submissionStatus' ? sortConfig.direction : 'asc'}
                    onClick={() => requestSort('submissionStatus')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                sortedStudents.map((student) => (
                  <TableRow key={student.student._id}>
                    <TableCell>{student.student.name}</TableCell>
                    <TableCell>{student.student.admissionNumber}</TableCell>
                    <TableCell>{student.student.department}</TableCell>
                    <TableCell>{student.student.year}</TableCell>
                    <TableCell>{student.student.section}</TableCell>
                    <TableCell>
                      {student.hasSubmitted && student.totalMarks !== undefined ? (
                        `${calculateScorePercentage(student.totalMarks, quiz.totalMarks).toFixed(2)}%`
                      ) : (
                        'Not submitted'
                      )}
                    </TableCell>
                  
                    <TableCell>
                      {student.submitTime
                        ? new Date(student.submitTime).toLocaleString()
                        : 'Not submitted'}
                    </TableCell>
                    <TableCell>
                      {student.hasSubmitted ? (
                        formatDuration(student.duration)
                      ) : (
                        'Not submitted'
                      )}
                    </TableCell>
                      <TableCell>
                      <Chip
                        label={student.submissionStatus}
                        color={
                          student.submissionStatus === 'evaluated'
                            ? 'success'
                            : student.submissionStatus === 'started'
                              ? 'warning'
                              : student.submissionStatus === 'submitted'
                                ? 'primary'
                                : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>

                      {student.hasSubmitted && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/quizzes/${id}/submissions/${student.student._id}`)}
                        >
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default QuizAuthorizedStudents;