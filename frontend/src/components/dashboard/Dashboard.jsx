import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar
} from '@mui/material';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    upcomingQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    submissions: []
  });
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get quizzes
        const quizzesResponse = await api.get('/quiz');
        const quizzes = Array.isArray(quizzesResponse.data) ? quizzesResponse.data : [];

        // For students, fetch their submissions
        let submissions = [];
        if (user.role === 'student' && quizzes.length > 0) {
          const submissionPromises = quizzes.map(quiz =>
            api.get(`/quiz/${quiz._id}/submission`)
              .then(res => ({ quizId: quiz._id, ...res.data }))
              .catch(() => null)
          );
          submissions = (await Promise.all(submissionPromises)).filter(sub => sub !== null);
        }

        // Calculate statistics
        const now = new Date();
        const stats = {
          totalQuizzes: quizzes.length,
          upcomingQuizzes: quizzes.filter(quiz => new Date(quiz.startTime) > now).length,
          completedQuizzes: submissions.length,
          averageScore: submissions.length > 0 
            ? submissions.reduce((sum, sub) => sum + (sub.totalMarks || 0), 0) / submissions.length
            : 0,
          submissions: submissions
        };

        setStats(stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const StudentDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Welcome, {user.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {user.department} - Year {user.year}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Admission Number: {user.admissionNumber}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Total Quizzes</Typography>
            <Typography variant="h4">{stats.totalQuizzes}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Upcoming</Typography>
            <Typography variant="h4">{stats.upcomingQuizzes}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Completed</Typography>
            <Typography variant="h4">{stats.completedQuizzes}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Average Score</Typography>
            <Typography variant="h4">{stats.averageScore}%</Typography>
          </CardContent>
        </Card>
      </Grid>

      {stats.submissions.length > 0 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Submissions
            </Typography>
            <Grid container spacing={2}>
              {stats.submissions.slice(0, 3).map((submission) => (
                <Grid item xs={12} sm={4} key={submission.quizId}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {submission.quiz?.title || 'Quiz'}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        Score: {submission.answers.reduce((total, ans) => total + (ans.marks || 0), 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Submitted: {new Date(submission.submitTime).toLocaleString()}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => navigate(`/quizzes/${submission.quizId}/review`)}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      )}

      <Grid item xs={12}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/quizzes')}
        >
          View Available Quizzes
        </Button>
      </Grid>
    </Grid>
  );

  const FacultyDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Welcome, {user.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {user.department} - Faculty
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Total Quizzes</Typography>
            <Typography variant="h4">{stats.totalQuizzes}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Upcoming</Typography>
            <Typography variant="h4">{stats.upcomingQuizzes}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Active</Typography>
            <Typography variant="h4">{stats.activeQuizzes}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Completed</Typography>
            <Typography variant="h4">{stats.completedQuizzes}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/quizzes/create')}
          sx={{ mr: 2 }}
        >
          Create New Quiz
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/quizzes')}
        >
          View My Quizzes
        </Button>
      </Grid>
    </Grid>
  );

  const AdminDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Welcome, {user.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            System Administrator
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Manage Subjects</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Add, edit, or remove subjects from the system
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => navigate('/subjects')}>
              View Subjects
            </Button>
          </CardActions>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Admission Ranges</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Configure admission number ranges for departments
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => navigate('/admin/admission-ranges')}>
              Manage Ranges
            </Button>
          </CardActions>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Quiz Overview</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Monitor quiz activities across departments
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => navigate('/quizzes-overview')}>
              View Quizzes
            </Button>
          </CardActions>
        </Card>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {user.role === 'student' ? (
          <StudentDashboard />
        ) : user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <FacultyDashboard />
        )}
      </Container>
    </Box>
  );
};

export default Dashboard; 