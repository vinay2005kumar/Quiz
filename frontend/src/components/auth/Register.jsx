import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../common/ErrorBoundary';
import api from '../../config/axios';

// Shared styles for Select components
const selectStyles = {
  width: '100%',
  '& .MuiSelect-select': {
    minHeight: '1.4375em',
    padding: '16.5px 14px'
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.23)'
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'primary.main'
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.87)'
  }
};

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    year: '',
    section: '',
    admissionNumber: '',
    isLateral: false
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [currentRange, setCurrentRange] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const departments = [
    'Computer Science',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical'
  ];

  const sections = ['A', 'B', 'C', 'D', 'E'];

  // Reset dependent fields when role changes
  useEffect(() => {
    if (formData.role === 'faculty') {
      setFormData(prev => ({
        ...prev,
        year: '',
        section: '',
        admissionNumber: '',
        isLateral: false
      }));
    }
  }, [formData.role]);

  // Fetch admission ranges when department, year, or section changes
  useEffect(() => {
    const fetchAdmissionRanges = async () => {
      if (formData.role === 'student' && formData.department && formData.year && formData.section) {
        try {
          const range = await api.get(`/api/auth/admission-ranges?department=${formData.department}&year=${formData.year}&section=${formData.section}`);
          if (range) {
            setCurrentRange(range);
          } else {
            setCurrentRange(null);
          }
        } catch (error) {
          console.error('Error fetching admission ranges:', error);
          setCurrentRange(null);
        }
      } else {
        setCurrentRange(null);
      }
    };
    fetchAdmissionRanges();
  }, [formData.department, formData.year, formData.section, formData.role]);

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return value.trim().length < 2 ? 'Name must be at least 2 characters' : '';
      case 'email':
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email format' : '';
      case 'password':
        return value.length < 6 ? 'Password must be at least 6 characters' : '';
      case 'admissionNumber':
        if (formData.role === 'student') {
          if (!/^[yl]\d{2}[a-z]{2}\d{3}$/i.test(value)) {
            return 'Invalid admission number format';
          }
          if (currentRange) {
            const isRegular = value.startsWith('y');
            const entry = isRegular ? currentRange.regularEntry : currentRange.lateralEntry;
            const num = parseInt(value.slice(-3));
            const startNum = parseInt(entry.start.slice(-3));
            const endNum = parseInt(entry.end.slice(-3));
            
            if (num < startNum || num > endNum) {
              return `Admission number must be between ${entry.start} and ${entry.end}`;
            }
          }
        }
        return '';
      case 'department':
        return !value ? 'Department is required' : '';
      case 'year':
        if (formData.role === 'student') {
          return !value ? 'Year is required' : '';
        }
        return '';
      case 'section':
        if (formData.role === 'student') {
          return !value ? 'Section is required' : '';
        }
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is changed
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, value)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      // Skip validation for faculty-specific fields when role is faculty
      if (formData.role === 'faculty' && ['year', 'section', 'admissionNumber'].includes(key)) {
        return;
      }
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsLoading(true);

    if (!validateForm()) {
      setSubmitError('Please fix the errors before submitting');
      setIsLoading(false);
      return;
    }

    try {
      // Remove unnecessary fields for faculty
      const submissionData = { ...formData };
      if (formData.role === 'faculty') {
        delete submissionData.year;
        delete submissionData.section;
        delete submissionData.admissionNumber;
        delete submissionData.isLateral;
      }

      console.log('Submitting form data:', submissionData);
      const result = await register(submissionData);
      if (!result.success) {
        setSubmitError(result.error);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <Container component="main" maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography component="h1" variant="h4" gutterBottom>
              Register
            </Typography>
            {submitError && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {submitError}
              </Alert>
            )}
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={!!errors.name}
                    helperText={errors.name}
                    disabled={isLoading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    disabled={isLoading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={!!errors.password}
                    helperText={errors.password || 'Password must be at least 6 characters'}
                    disabled={isLoading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required error={!!errors.role}>
                    <InputLabel id="role-label">Role</InputLabel>
                    <Select
                      labelId="role-label"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      label="Role"
                      sx={selectStyles}
                      disabled={isLoading}
                    >
                      <MenuItem value="student">Student</MenuItem>
                      <MenuItem value="faculty">Faculty</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required error={!!errors.department}>
                    <InputLabel id="department-label">Department</InputLabel>
                    <Select
                      labelId="department-label"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      label="Department"
                      sx={selectStyles}
                      disabled={isLoading}
                    >
                      {departments.map(dept => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {formData.role === 'student' && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth required error={!!errors.year}>
                        <InputLabel id="year-label">Year</InputLabel>
                        <Select
                          labelId="year-label"
                          name="year"
                          value={formData.year}
                          onChange={handleChange}
                          label="Year"
                          sx={selectStyles}
                          disabled={isLoading}
                        >
                          <MenuItem value={1}>First Year</MenuItem>
                          <MenuItem value={2}>Second Year</MenuItem>
                          <MenuItem value={3}>Third Year</MenuItem>
                          <MenuItem value={4}>Fourth Year</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth required error={!!errors.section}>
                        <InputLabel id="section-label">Section</InputLabel>
                        <Select
                          labelId="section-label"
                          name="section"
                          value={formData.section}
                          onChange={handleChange}
                          label="Section"
                          sx={selectStyles}
                          disabled={isLoading}
                        >
                          {sections.map(section => (
                            <MenuItem key={section} value={section}>
                              Section {section}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    {currentRange && (
                      <Grid item xs={12}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Available Admission Number Ranges:
                          </Typography>
                          <Typography variant="body2" component="div">
                            <strong>Regular Entry:</strong>
                            <br />
                            {currentRange.regularEntry.start} to {currentRange.regularEntry.end}
                          </Typography>
                          <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                            <strong>Lateral Entry:</strong>
                            <br />
                            {currentRange.lateralEntry.start} to {currentRange.lateralEntry.end}
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <TextField
                        required
                        fullWidth
                        label="Admission Number"
                        name="admissionNumber"
                        value={formData.admissionNumber}
                        onChange={handleChange}
                        error={!!errors.admissionNumber}
                        helperText={errors.admissionNumber || (currentRange ? 
                          `Enter your admission number from the ranges shown above` : 
                          'Format: y22cs021 (for regular) or l22cs021 (for lateral)')}
                        disabled={isLoading}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 4, mb: 2, py: 1.5, height: 48 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    Registering...
                  </>
                ) : (
                  'Register'
                )}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => navigate('/login')}
                disabled={isLoading}
              >
                Already have an account? Sign In
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </ErrorBoundary>
  );
};

export default Register;