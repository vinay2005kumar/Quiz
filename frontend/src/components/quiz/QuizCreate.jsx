import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Alert,
  Stepper,
  Step,
  StepLabel,
  OutlinedInput,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  CircularProgress,
  FormHelperText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';

const steps = ['Basic Details', 'Questions', 'Review'];

const DEPARTMENTS = [
  'Computer Science',
  'Electronics',
  'Mechanical',
  'Civil',
  'Electrical'
];

const YEARS = [
  { value: 1, label: 'First Year' },
  { value: 2, label: 'Second Year' },
  { value: 3, label: 'Third Year' },
  { value: 4, label: 'Fourth Year' }
];

const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 'auto',
      minWidth: '250px'
    }
  }
};

const selectStyles = {
  width: '100%',
  '& .MuiSelect-select': {
    minHeight: '56px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
    padding: '8px 14px'
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.23)'
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.87)'
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'primary.main'
  }
};

const QuizCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState({
    year: '',
    department: user?.department || '',
    semester: '',
  });
  const [quizData, setQuizData] = useState({
    title: '',
    subject: '',
    duration: 30,
    startTime: '',
    endTime: '',
    allowedGroups: [],
    questions: [
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        marks: 1
      }
    ]
  });

  useEffect(() => {
    // Set department from user and fetch initial subjects
    if (user?.department) {
      setSelectedFilters(prev => ({
        ...prev,
        department: user.department
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchSubjects();
  }, [selectedFilters]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      console.log('Fetching subjects with filters:', selectedFilters);
      
      // Only fetch subjects if we have both year and semester selected
      if (selectedFilters.year && selectedFilters.semester) {
        const response = await api.get('/subject', {
          params: {
            department: selectedFilters.department,
            year: selectedFilters.year,
            semester: selectedFilters.semester
          }
        });
        console.log('Subjects response:', response);
        if (Array.isArray(response)) {
          setSubjects(response);
        } else {
          console.error('Invalid subjects data:', response);
          setError('Failed to load subjects. Please try again.');
        }
      } else {
        setSubjects([]); // Clear subjects if year or semester is not selected
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Failed to load subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSelectedFilters(prev => {
      const newFilters = {
        ...prev,
        [name]: value
      };
      
      // Reset semester when year changes
      if (name === 'year') {
        newFilters.semester = '';
      }
      
      // Reset subject when any filter changes
      setQuizData(prev => ({
        ...prev,
        subject: ''
      }));
      
      return newFilters;
    });
  };

  const validateBasicDetails = () => {
    if (!quizData.title.trim()) return 'Quiz title is required';
    if (!quizData.subject) return 'Subject is required';
    if (!quizData.duration || quizData.duration < 1) return 'Duration must be at least 1 minute';
    if (!quizData.startTime) return 'Start time is required';
    if (!quizData.endTime) return 'End time is required';
    if (new Date(quizData.endTime) <= new Date(quizData.startTime)) return 'End time must be after start time';
    if (quizData.allowedGroups.length === 0) return 'Select at least one section';
    return null;
  };

  const validateQuestions = () => {
    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      if (!q.question.trim()) return `Question ${i + 1} is empty`;
      if (q.options.some(opt => !opt.trim())) return `All options for question ${i + 1} are required`;
      if (q.marks < 1) return `Marks for question ${i + 1} must be at least 1`;
    }
    return null;
  };

  const handleBasicDetailsChange = (e) => {
    const { name, value } = e.target;
    setQuizData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelectChange = (e, field) => {
    const { value } = e.target;
    setQuizData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i === index) {
          return { ...q, [field]: value };
        }
        return q;
      })
    }));
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i === questionIndex) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    }));
  };

  const addQuestion = () => {
    setQuizData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          marks: 1
        }
      ]
    }));
  };

  const removeQuestion = (index) => {
    if (quizData.questions.length > 1) {
      setQuizData(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }));
    }
  };

  const handleNext = () => {
    let validationError = null;
    
    if (activeStep === 0) {
      validationError = validateBasicDetails();
    } else if (activeStep === 1) {
      validationError = validateQuestions();
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const validationError = activeStep === 0 
      ? validateBasicDetails() 
      : activeStep === 1 
        ? validateQuestions()
        : null;

    if (validationError) {
      setError(validationError);
      return;
    }

    if (activeStep === steps.length - 1) {
      try {
        setLoading(true);
        // Transform the data to match the backend expectations
        const transformedData = {
          ...quizData,
          // Create an array of allowed combinations
          allowedGroups: quizData.allowedGroups
        };
        
        await api.post('/quiz', transformedData);
        navigate('/quizzes');
      } catch (error) {
        console.error('Error creating quiz:', error);
        setError(error.message || 'Failed to create quiz');
      } finally {
        setLoading(false);
      }
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const renderBasicDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Quiz Title"
          name="title"
          value={quizData.title}
          onChange={handleBasicDetailsChange}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <FormControl fullWidth required>
          <InputLabel>Year</InputLabel>
          <Select
            name="year"
            value={selectedFilters.year}
            onChange={handleFilterChange}
            label="Year"
          >
            {[1, 2, 3, 4].map(year => (
              <MenuItem key={year} value={year}>Year {year}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={4}>
        <FormControl fullWidth required>
          <InputLabel>Semester</InputLabel>
          <Select
            name="semester"
            value={selectedFilters.semester}
            onChange={handleFilterChange}
            label="Semester"
            disabled={!selectedFilters.year}
          >
            {getSemestersByYear(selectedFilters.year).map(({ value, label }) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={4}>
        <FormControl fullWidth required>
          <InputLabel>Department</InputLabel>
          <Select
            name="department"
            value={selectedFilters.department}
            disabled={true} // Department is fixed to faculty's department
            label="Department"
          >
            <MenuItem value={user?.department}>{user?.department}</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth required>
          <InputLabel>Subject</InputLabel>
          <Select
            name="subject"
            value={quizData.subject}
            onChange={handleBasicDetailsChange}
            label="Subject"
            disabled={!selectedFilters.year || !selectedFilters.semester}
          >
            {subjects.map(subject => (
              <MenuItem key={subject._id} value={subject._id}>
                {subject.name} ({subject.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={4}>
        <FormControl fullWidth required>
          <InputLabel>Sections</InputLabel>
          <Select
            multiple
            name="allowedGroups"
            value={quizData.allowedGroups.map(group => group.section)}
            onChange={(e) => {
              const selectedSections = e.target.value;
              // Create allowed groups with the selected sections
              const groups = selectedSections.map(section => ({
                year: parseInt(selectedFilters.year),
                department: selectedFilters.department,
                section: section
              }));
              setQuizData(prev => ({
                ...prev,
                allowedGroups: groups
              }));
            }}
            label="Sections"
            sx={selectStyles}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={`Section ${value}`} />
                ))}
              </Box>
            )}
            displayEmpty
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 48 * 4.5 + 8,
                  width: '250px'
                }
              }
            }}
          >
            {['A', 'B', 'C', 'D', 'E'].map(section => (
              <MenuItem key={section} value={section}>
                Section {section}
              </MenuItem>
            ))}
          </Select>
          {quizData.allowedGroups.length === 0 && (
            <FormHelperText>Select at least one section</FormHelperText>
          )}
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          required
          type="number"
          label="Duration (minutes)"
          name="duration"
          value={quizData.duration}
          onChange={handleBasicDetailsChange}
          inputProps={{ min: 1 }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          type="datetime-local"
          label="Start Time"
          name="startTime"
          value={quizData.startTime}
          onChange={handleBasicDetailsChange}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          type="datetime-local"
          label="End Time"
          name="endTime"
          value={quizData.endTime}
          onChange={handleBasicDetailsChange}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
    </Grid>
  );

  const renderQuestions = () => (
    <Box>
      {quizData.questions.map((question, questionIndex) => (
        <Paper key={questionIndex} sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={11}>
              <TextField
                required
                fullWidth
                label={`Question ${questionIndex + 1}`}
                value={question.question}
                onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
              />
            </Grid>
            <Grid item xs={1}>
              <IconButton
                color="error"
                onClick={() => removeQuestion(questionIndex)}
                disabled={quizData.questions.length === 1}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
            {question.options.map((option, optionIndex) => (
              <Grid item xs={12} sm={6} key={optionIndex}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Radio
                    checked={question.correctAnswer === optionIndex}
                    onChange={(e) => handleQuestionChange(questionIndex, 'correctAnswer', optionIndex)}
                    value={optionIndex}
                    name={`correct-answer-${questionIndex}`}
                    sx={{ mt: 1 }}
                  />
                  <TextField
                    required
                    fullWidth
                    label={`Option ${optionIndex + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                  />
                </Box>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Select the radio button next to the correct option
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Marks"
                value={question.marks}
                onChange={(e) => handleQuestionChange(questionIndex, 'marks', e.target.value)}
                inputProps={{ min: 1 }}
              />
            </Grid>
          </Grid>
        </Paper>
      ))}
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={addQuestion}
        sx={{ mt: 2 }}
      >
        Add Question
      </Button>
    </Box>
  );

  const renderReview = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Quiz Details
      </Typography>
      <Typography>Title: {quizData.title}</Typography>
      <Typography>Duration: {quizData.duration} minutes</Typography>
      <Typography>Start Time: {new Date(quizData.startTime).toLocaleString()}</Typography>
      <Typography>End Time: {new Date(quizData.endTime).toLocaleString()}</Typography>
      <Typography>Number of Questions: {quizData.questions.length}</Typography>
      <Typography>
        Total Marks: {quizData.questions.reduce((sum, q) => sum + Number(q.marks), 0)}
      </Typography>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '80vh'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={() => navigate('/quizzes/upload')}
            >
              Upload Quiz
            </Button>
            <br></br>
            <p style={{textAlign: 'center'}}>Or</p>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create New Quiz
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && renderBasicDetails()}
        {activeStep === 1 && renderQuestions()}
        {activeStep === 2 && renderReview()}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          {activeStep > 0 && (
            <Button
              onClick={handleBack}
              sx={{ mr: 1 }}
              disabled={loading}
            >
              Back
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                {activeStep === steps.length - 1 ? 'Creating Quiz...' : 'Next'}
              </>
            ) : (
              activeStep === steps.length - 1 ? 'Create Quiz' : 'Next'
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default QuizCreate; 