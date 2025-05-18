import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  CircularProgress,
  Alert,
  ButtonGroup,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import ClassIcon from '@mui/icons-material/Class';

const COLORS = {
  excellent: '#4caf50',
  good: '#2196f3',
  average: '#ff9800',
  poor: '#f44336',
  submitted: '#4caf50',
  notSubmitted: '#f44336'
};

const QuizList = () => {
  const departments = [
    'Computer Science',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical'
  ];

  const [quizzes, setQuizzes] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [filters, setFilters] = useState({
    year: 'all',
    department: user?.department || 'all',
    section: 'all',
    subject: 'all',
    status: 'all',
    faculty: 'all'
  });

  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    submittedCount: 0,
    averageScore: 0,
    scoreDistribution: {
      excellent: 0,
      good: 0,
      average: 0,
      poor: 0
    }
  });

  const [detailedStats, setDetailedStats] = useState({
    subjectWiseStats: {},
    departmentWiseStats: {},
    yearWiseStats: {}
  });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      calculateStatistics();
    }
  }, [quizzes, submissions]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDetailedStatistics();
    }
  }, [filters]);

  // Add a focus effect to refresh data when tab becomes active
  useEffect(() => {
    const handleFocus = () => {
      fetchQuizzes();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use the correct endpoint for all roles
      const response = await api.get('/quiz');
      
      // Ensure response is an array
      const quizData = Array.isArray(response) ? response : [];
      setQuizzes(quizData);
      
      // For students, fetch their submissions
      if (user.role === 'student') {
        const submissionPromises = quizData.map(quiz =>
          api.get(`/quiz/${quiz._id}/submission`)
            .then(res => ({ quizId: quiz._id, ...res }))
            .catch(() => null)
        );
        const submissions = await Promise.all(submissionPromises);
        const submissionMap = {};
        submissions.forEach(sub => {
          if (sub) submissionMap[sub.quizId] = sub;
        });
        setSubmissions(submissionMap);
      }
      
      // For admin, fetch all submissions for statistics
      if (user.role === 'admin') {
        console.log('Fetching admin statistics...');
        const allSubmissions = await api.get('/quiz/all-submissions');
        console.log('Admin submissions response:', allSubmissions);
        setSubmissions(allSubmissions || {});
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to fetch quizzes');
      // Ensure quizzes is an empty array on error
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = () => {
    if (!quizzes || !submissions) return;

    const stats = {
      totalStudents: 0,
      submittedCount: 0,
      averageScore: 0,
      scoreDistribution: {
        excellent: 0,
        good: 0,
        average: 0,
        poor: 0
      }
    };

    quizzes.forEach(quiz => {
      if (!quiz) return;

      // Use the actual authorized student count from the backend
      stats.totalStudents += quiz.totalAuthorizedStudents || 0;
      
      // Calculate submission statistics
      const quizSubmissions = submissions[quiz._id] || [];
      stats.submittedCount += Array.isArray(quizSubmissions) ? quizSubmissions.length : 0;
      
      // Calculate score distribution
      if (Array.isArray(quizSubmissions)) {
        quizSubmissions.forEach(submission => {
          if (!submission?.answers) return;
          
          const score = submission.answers.reduce((total, ans) => total + (ans?.marks || 0), 0);
          const percentage = quiz.totalMarks > 0 ? (score / quiz.totalMarks) * 100 : 0;
          
          if (percentage > 90) stats.scoreDistribution.excellent++;
          else if (percentage > 70) stats.scoreDistribution.good++;
          else if (percentage > 50) stats.scoreDistribution.average++;
          else stats.scoreDistribution.poor++;
          
          stats.averageScore += score;
        });
      }
    });

    // Calculate final average
    if (stats.submittedCount > 0) {
      stats.averageScore = stats.averageScore / stats.submittedCount;
    }

    setStatistics(stats);
  };

  const fetchDetailedStatistics = async () => {
    try {
      if (user.role !== 'admin') return;

      console.log('Fetching detailed statistics with filters:', filters);
      const response = await api.get('/quiz/statistics', {
        params: {
          department: filters.department !== 'all' ? filters.department : undefined,
          year: filters.year !== 'all' ? filters.year : undefined,
          section: filters.section !== 'all' ? filters.section : undefined,
          subject: filters.subject !== 'all' ? filters.subject : undefined
        }
      });
      console.log('Statistics response:', response.data);

      if (response.data) {
        setDetailedStats({
          subjectWiseStats: response.data.subjectWiseStats || {},
          departmentWiseStats: response.data.departmentWiseStats || {},
          yearWiseStats: response.data.yearWiseStats || {}
        });

        // Update overall statistics
        setStatistics({
          totalStudents: response.data.totalStudents || 0,
          submittedCount: response.data.submittedCount || 0,
          averageScore: response.data.averageScore || 0,
          scoreDistribution: {
            excellent: response.data.scoreDistribution?.excellent || 0,
            good: response.data.scoreDistribution?.good || 0,
            average: response.data.scoreDistribution?.average || 0,
            poor: response.data.scoreDistribution?.poor || 0
          }
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to fetch statistics');
    }
  };

  const getQuizStatus = (quiz, submission) => {
    const now = new Date();
    const startTime = new Date(quiz.startTime);
    const endTime = new Date(quiz.endTime);

    if (submission) {
      return { label: 'Completed', color: 'success' };
    } else if (now < startTime) {
      return { label: 'Upcoming', color: 'info' };
    } else if (now > endTime) {
      return { label: 'Expired', color: 'error' };
    } else {
      return { label: 'Active', color: 'primary' };
    }
  };

  const getButtonConfig = (quiz, status, submission) => {
    if (submission) {
      return {
        text: 'Review Answers',
        icon: <AssessmentIcon />,
        action: () => navigate(`/quizzes/${quiz._id}/review`),
        disabled: false,
        color: 'primary'
      };
    }

    switch (status.label) {
      case 'Active':
        return {
          text: 'Start Quiz',
          action: () => navigate(`/quizzes/${quiz._id}`),
          disabled: false,
          color: 'primary'
        };
      case 'Upcoming':
        return {
          text: 'Not Started Yet',
          action: () => {},
          disabled: true,
          color: 'info'
        };
      case 'Expired':
        return {
          text: 'Quiz Expired',
          action: () => {},
          disabled: true,
          color: 'error'
        };
      default:
        return {
          text: 'View Details',
          action: () => navigate(`/quizzes/${quiz._id}`),
          disabled: true,
          color: 'default'
        };
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDeleteClick = (quiz) => {
    setQuizToDelete(quiz);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/quiz/${quizToDelete._id}`);
      setShowDeleteConfirm(false);
      setQuizToDelete(null);
      fetchQuizzes();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete quiz');
    }
  };

  const getFilteredQuizzes = () => {
    return quizzes.filter(quiz => {
      if (!quiz) return false;

      // Check year filter
      if (filters.year !== 'all') {
        const hasMatchingYear = quiz.allowedGroups.some(
          group => group.year === parseInt(filters.year)
        );
        if (!hasMatchingYear) return false;
      }

      // Check section filter
      if (filters.section !== 'all') {
        const hasMatchingSection = quiz.allowedGroups.some(
          group => group.section === filters.section
        );
        if (!hasMatchingSection) return false;
      }

      // Check subject filter
      if (filters.subject !== 'all' && quiz?.subject?._id !== filters.subject) {
        return false;
      }

      // Check status filter
      if (filters.status !== 'all') {
        const now = new Date();
        const startTime = new Date(quiz.startTime);
        const endTime = new Date(quiz.endTime);
        
        switch (filters.status) {
          case 'active':
            if (!(now >= startTime && now <= endTime)) return false;
            break;
          case 'upcoming':
            if (!(now < startTime)) return false;
            break;
          case 'completed':
            if (!(now > endTime)) return false;
            break;
        }
      }
      
      return true;
    });
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const renderFilters = () => (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <FilterListIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Filters & Statistics</Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Filter Controls */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {/* Faculty Filter - Only for Admin */}
            {user?.role === 'admin' && (
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Faculty</InputLabel>
                  <Select
                    name="faculty"
                    value={filters.faculty}
                    onChange={(e) => handleFilterChange(e)}
                    label="Faculty"
                  >
                    <MenuItem value="all">All Faculty</MenuItem>
                    {quizzes
                      .map(quiz => quiz.createdBy)
                      .filter((faculty, index, self) => 
                        faculty && index === self.findIndex(f => f._id === faculty._id)
                      )
                      .map(faculty => (
                        <MenuItem key={faculty._id} value={faculty._id}>
                          {faculty.name}
                        </MenuItem>
                      ))
                    }
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  name="department"
                  value={filters.department}
                  onChange={(e) => handleFilterChange(e)}
                  label="Department"
                >
                  <MenuItem value="all">All Departments</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Year</InputLabel>
                <Select
                  name="year"
                  value={filters.year}
                  onChange={(e) => handleFilterChange(e)}
                  label="Year"
                >
                  <MenuItem value="all">All Years</MenuItem>
                  {[1, 2, 3, 4].map(year => (
                    <MenuItem key={year} value={year}>Year {year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Section</InputLabel>
                <Select
                  name="section"
                  value={filters.section}
                  onChange={(e) => handleFilterChange(e)}
                  label="Section"
                >
                  <MenuItem value="all">All Sections</MenuItem>
                  {['A', 'B', 'C', 'D', 'E'].map(section => (
                    <MenuItem key={section} value={section}>Section {section}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Subject</InputLabel>
                <Select
                  name="subject"
                  value={filters.subject}
                  onChange={(e) => handleFilterChange(e)}
                  label="Subject"
                >
                  <MenuItem value="all">All Subjects</MenuItem>
                  {quizzes
                    .map(quiz => quiz.subject)
                    .filter((subject, index, self) => 
                      index === self.findIndex(s => s._id === subject._id)
                    )
                    .map(subject => (
                      <MenuItem key={subject._id} value={subject._id}>
                        {subject.name}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange(e)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setFilters({
                    year: 'all',
                    department: 'all',
                    section: 'all',
                    subject: 'all',
                    status: 'all',
                    faculty: 'all'
                  });
                }}
                disabled={Object.values(filters).every(v => v === 'all')}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Grid>

        {/* Statistics Summary */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" gutterBottom>
              Quick Statistics
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Quizzes: {quizzes.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Students: {statistics.totalStudents}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Submissions: {statistics.submittedCount} ({((statistics.submittedCount / statistics.totalStudents) * 100).toFixed(1)}%)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Score: {statistics.averageScore.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Score Distribution:
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" color="success.main">
                  Excellent (&gt;90%): {statistics.scoreDistribution.excellent}
                </Typography>
                <Typography variant="body2" color="info.main">
                  Good (70-90%): {statistics.scoreDistribution.good}
                </Typography>
                <Typography variant="body2" color="warning.main">
                  Average (50-70%): {statistics.scoreDistribution.average}
                </Typography>
                <Typography variant="body2" color="error.main">
                  Poor (&lt;50%): {statistics.scoreDistribution.poor}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );

  const renderStatisticsCharts = () => {
    // Prepare data for submission status pie chart
    const submissionData = [
      { 
        name: 'Submitted', 
        value: statistics?.submittedCount || 0, 
        color: COLORS.submitted 
      },
      { 
        name: 'Not Submitted', 
        value: (statistics?.totalStudents || 0) - (statistics?.submittedCount || 0),
        color: COLORS.notSubmitted 
      }
    ].filter(item => item.value > 0); // Only show non-zero values

    // Prepare data for score distribution pie chart
    const scoreDistributionData = [
      { 
        name: 'Excellent', 
        value: statistics?.scoreDistribution?.excellent || 0, 
        color: COLORS.excellent 
      },
      { 
        name: 'Good', 
        value: statistics?.scoreDistribution?.good || 0, 
        color: COLORS.good 
      },
      { 
        name: 'Average', 
        value: statistics?.scoreDistribution?.average || 0, 
        color: COLORS.average 
      },
      { 
        name: 'Poor', 
        value: statistics?.scoreDistribution?.poor || 0, 
        color: COLORS.poor 
      }
    ].filter(item => item.value > 0); // Only show non-zero values

    // Don't render charts if no data
    if (submissionData.length === 0 && scoreDistributionData.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No statistics available yet. Start creating quizzes and collecting submissions to see analytics.
        </Alert>
      );
    }

    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {submissionData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom align="center">
                Submission Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={submissionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {submissionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}
        
        {scoreDistributionData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom align="center">
                Score Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={scoreDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {scoreDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderDetailedStatistics = () => {
    // Check if we have any detailed statistics
    if (!detailedStats || 
        (!Object.keys(detailedStats.subjectWiseStats || {}).length && 
         !Object.keys(detailedStats.departmentWiseStats || {}).length && 
         !Object.keys(detailedStats.yearWiseStats || {}).length)) {
      return null;
    }

    // Prepare data for bar charts
    const subjectData = Object.entries(detailedStats.subjectWiseStats || {})
      .map(([id, data]) => ({
        name: data.code || 'Unknown',
        submissions: data.totalSubmissions || 0,
        average: parseFloat((data.averageScore || 0).toFixed(1))
      }))
      .filter(item => item.submissions > 0);

    const departmentData = Object.entries(detailedStats.departmentWiseStats || {})
      .map(([dept, data]) => ({
        name: dept || 'Unknown',
        submissions: data.totalSubmissions || 0,
        average: parseFloat((data.averageScore || 0).toFixed(1))
      }))
      .filter(item => item.submissions > 0);

    const yearData = Object.entries(detailedStats.yearWiseStats || {})
      .map(([year, data]) => ({
        name: `Year ${year}`,
        submissions: data.totalSubmissions || 0,
        average: parseFloat((data.averageScore || 0).toFixed(1))
      }))
      .filter(item => item.submissions > 0);

    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {/* Subject-wise Statistics */}
        {subjectData.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom align="center">
                Subject-wise Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <RechartsTooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="submissions" name="Submissions" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="average" name="Average Score %" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Department-wise Statistics */}
        {departmentData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom align="center">
                Department-wise Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="submissions" name="Submissions" fill="#8884d8" />
                  <Bar dataKey="average" name="Average Score %" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Year-wise Statistics */}
        {yearData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom align="center">
                Year-wise Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="submissions" name="Submissions" fill="#8884d8" />
                  <Bar dataKey="average" name="Average Score %" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

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
    <Container 
      maxWidth="lg" 
      sx={{ 
        mt: 4, 
        mb: 4,
        px: { xs: 0, sm: 3 },
        '& .MuiPaper-root': {
          width: '100%',
          mx: { xs: 0 }
        }
      }}
    >
     
        <Typography variant="h4">Quizzes</Typography>
      <br />

      {/* Show filters and statistics only for admin */}
      {user?.role === 'admin' && (
        <>
          <Box sx={{ px: { xs: 2, sm: 0 } }}>
            {renderFilters()}
          </Box>
          {renderStatisticsCharts()}
          {renderDetailedStatistics()}
        </>
      )}

      {/* Show simple filters for faculty */}
      {user?.role === 'faculty' && (
        <Box sx={{ px: { xs: 2, sm: 0 }, mb: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <FilterListIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Filters</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Year</InputLabel>
                  <Select
                    name="year"
                    value={filters.year}
                    onChange={(e) => handleFilterChange(e)}
                    label="Year"
                  >
                    <MenuItem value="all">All Years</MenuItem>
                    {[1, 2, 3, 4].map(year => (
                      <MenuItem key={year} value={year}>Year {year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Section</InputLabel>
                  <Select
                    name="section"
                    value={filters.section}
                    onChange={(e) => handleFilterChange(e)}
                    label="Section"
                  >
                    <MenuItem value="all">All Sections</MenuItem>
                    {['A', 'B', 'C', 'D', 'E'].map(section => (
                      <MenuItem key={section} value={section}>Section {section}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={filters.status}
                    onChange={(e) => handleFilterChange(e)}
                    label="Status"
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="upcoming">Upcoming</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setFilters({
                      year: 'all',
                      department: user.department, // Keep faculty's department
                      section: 'all',
                      subject: 'all',
                      status: 'all',
                      faculty: 'all'
                    });
                  }}
                  disabled={Object.values(filters).every(v => v === 'all')}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}

      <Grid 
        container 
        spacing={2}
        sx={{ 
          width: '100%',
          margin: '0 auto',
          px: { xs: 2, sm: 0 }
        }}
      >
        {getFilteredQuizzes().length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info">
              No quizzes available for the selected filters.
            </Alert>
          </Grid>
        ) : (
          getFilteredQuizzes().map((quiz) => {
            const submission = submissions[quiz._id];
            const status = getQuizStatus(quiz, submission);
            const buttonConfig = getButtonConfig(quiz, status, submission);

            return (
              <Grid item xs={12} sm={12} md={6} key={quiz._id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    width: '100%',
                    maxWidth: '100%',
                    p: 2,
                    boxShadow: { xs: 'none', sm: 1 },  // Remove shadow on mobile
                    border: { xs: '1px solid #e0e0e0', sm: 'none' }  // Add border on mobile
                  }}
                >
                  <CardContent 
                    sx={{ 
                      flexGrow: 1, 
                      p: 0,
                      '&:last-child': {
                        pb: 0
                      }
                    }}
                  >
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="div" gutterBottom>
                        {quiz.title}
                      </Typography>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </Box>
                    
                    <Stack spacing={1.5}>
                      <Typography color="text.secondary">
                        Subject: {quiz.subject.name}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Duration: {quiz.duration} minutes
                        </Typography>
                      </Box>

                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <GroupIcon fontSize="small" color="action" />
                          <Typography variant="body2" component="span">
                            Years:{' '}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {[...new Set(quiz.allowedGroups.map(group => group.year))].map((year) => (
                              <Chip
                                key={year}
                                label={`Year ${year}`}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <ClassIcon fontSize="small" color="action" />
                          <Typography variant="body2" component="span">
                            Sections:{' '}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {[...new Set(quiz.allowedGroups.map(group => group.section))].map((section) => (
                              <Chip
                                key={section}
                                label={`${section}`}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      </Box>

                      <Typography variant="body2">
                        Total Marks: {quiz.totalMarks}
                      </Typography>

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Start: {new Date(quiz.startTime).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          End: {new Date(quiz.endTime).toLocaleString()}
                        </Typography>
                      </Box>
                    </Stack>

                    {submission && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="h6" color="primary">
                            Score: {submission.answers.reduce((total, ans) => total + (ans.marks || 0), 0)} / {quiz.totalMarks}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    {user?.role === 'faculty' ? (
                      <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => navigate(`/quizzes/${quiz._id}/edit`)}
                          fullWidth
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteClick(quiz)}
                          fullWidth
                        >
                          Delete
                        </Button>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<AssessmentIcon />}
                          onClick={() => navigate(`/quizzes/${quiz._id}/submissions`)}
                          fullWidth
                        >
                          View Details
                        </Button>
                      </Stack>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        color={buttonConfig.color}
                        onClick={buttonConfig.action}
                        disabled={buttonConfig.disabled}
                        startIcon={buttonConfig.icon}
                      >
                        {buttonConfig.text}
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this quiz?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuizList; 