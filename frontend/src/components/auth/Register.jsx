import { useState } from 'react';
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
  Grid
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

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
  const { register } = useAuth();
  const navigate = useNavigate();

  const departments = [
    'Computer Science',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical'
  ];

  const sections = ['A', 'B', 'C', 'D', 'E'];

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
          return !/^[yl]\d{2}[a-z]{2}\d{3}$/i.test(value) ? 'Invalid admission number format' : '';
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

    if (!validateForm()) {
      setSubmitError('Please fix the errors before submitting');
      return;
    }

    try {
      console.log('Submitting form data:', formData);
      const result = await register(formData);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setSubmitError(result.error);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Register
        </Typography>
        {submitError && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {submitError}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid xs={12}>
              <TextField
                required
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid xs={12}>
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
              />
            </Grid>
            <Grid xs={12}>
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
              />
            </Grid>
            <Grid xs={12}>
              <FormControl 
                fullWidth 
                required
                sx={{
                  minWidth: '100%',
                  '& .MuiSelect-select': {
                    width: '100%',
                    minWidth: '200px'
                  }
                }}
              >
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Role"
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="faculty">Faculty</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <FormControl 
                fullWidth 
                required 
                error={!!errors.department}
                sx={{
                  minWidth: '100%',
                  '& .MuiSelect-select': {
                    width: '100%',
                    minWidth: '200px'
                  }
                }}
              >
                <InputLabel>Department</InputLabel>
                <Select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  label="Department"
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
                <Grid xs={12}>
                  <FormControl 
                    fullWidth 
                    required 
                    error={!!errors.year}
                    sx={{
                      minWidth: '100%',
                      '& .MuiSelect-select': {
                        width: '100%',
                        minWidth: '200px'
                      }
                    }}
                  >
                    <InputLabel>Year</InputLabel>
                    <Select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      label="Year"
                    >
                      <MenuItem value={1}>First Year</MenuItem>
                      <MenuItem value={2}>Second Year</MenuItem>
                      <MenuItem value={3}>Third Year</MenuItem>
                      <MenuItem value={4}>Fourth Year</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12}>
                  <FormControl 
                    fullWidth 
                    required 
                    error={!!errors.section}
                    sx={{
                      minWidth: '100%',
                      '& .MuiSelect-select': {
                        width: '100%',
                        minWidth: '200px'
                      }
                    }}
                  >
                    <InputLabel>Section</InputLabel>
                    <Select
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      label="Section"
                    >
                      {sections.map(section => (
                        <MenuItem key={section} value={section}>
                          Section {section}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Admission Number"
                    name="admissionNumber"
                    value={formData.admissionNumber}
                    onChange={handleChange}
                    error={!!errors.admissionNumber}
                    helperText={errors.admissionNumber || 'Format: y22cs021 or l22cs021'}
                  />
                </Grid>
              </>
            )}
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Register
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;