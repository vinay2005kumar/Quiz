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
  FormLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';
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
  minHeight: '56px',
  display: 'flex',
  alignItems: 'center',
  '& .MuiSelect-select': {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 0.5,
    alignItems: 'center',
    minHeight: '56px !important',
    padding: '14px'
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.23)'
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.87)'
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'primary.main'
  },
  '& .MuiInputLabel-root': {
    backgroundColor: 'white',
    padding: '0 8px',
    marginLeft: '-4px'
  }
};

const QuizCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');
  const [quizData, setQuizData] = useState({
    title: '',
    subject: '',
    duration: 30,
    startTime: '',
    endTime: '',
    allowedYears: [],
    allowedDepartments: [],
    allowedSections: [],
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
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      console.log('Fetching subjects...');
      const response = await axios.get('/subject');
      console.log('Subjects response:', response.data);
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error.response || error);
      setError('Failed to fetch subjects');
    }
  };

  const validateBasicDetails = () => {
    if (!quizData.title.trim()) return 'Quiz title is required';
    if (!quizData.subject) return 'Subject is required';
    if (!quizData.duration || quizData.duration < 1) return 'Duration must be at least 1 minute';
    if (!quizData.startTime) return 'Start time is required';
    if (!quizData.endTime) return 'End time is required';
    if (new Date(quizData.endTime) <= new Date(quizData.startTime)) return 'End time must be after start time';
    if (quizData.allowedYears.length === 0) return 'Select at least one year';
    if (quizData.allowedDepartments.length === 0) return 'Select at least one department';
    if (quizData.allowedSections.length === 0) return 'Select at least one section';
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

  const handleSubmit = async () => {
    try {
      // Validate all fields before submitting
      const basicDetailsError = validateBasicDetails();
      const questionsError = validateQuestions();
      
      if (basicDetailsError || questionsError) {
        setError(basicDetailsError || questionsError);
        return;
      }

      await axios.post('/quiz', quizData);
      navigate('/quizzes');
    } catch (error) {
      console.error('Error creating quiz:', error);
      const errorData = error.response?.data;
      let errorMessage = 'Failed to create quiz';

      if (errorData) {
        if (errorData.fields) {
          errorMessage = `Missing required fields: ${errorData.fields.join(', ')}`;
        } else if (errorData.questionIndex !== undefined) {
          errorMessage = `Invalid question format for question ${errorData.questionIndex + 1}`;
        } else if (errorData.details) {
          errorMessage = Object.entries(errorData.details)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('; ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }

      setError(errorMessage);
    }
  };

  const renderBasicDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="Quiz Title"
          name="title"
          value={quizData.title}
          onChange={handleBasicDetailsChange}
          placeholder="Enter quiz title"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth required>
          <InputLabel>Subject</InputLabel>
          <Select
            name="subject"
            value={quizData.subject}
            onChange={handleBasicDetailsChange}
            label="Subject"
            displayEmpty
            sx={selectStyles}
            MenuProps={MenuProps}
          >
            <MenuItem disabled value="">
              <em>Select a subject</em>
            </MenuItem>
            {subjects.length === 0 ? (
              <MenuItem disabled value="">
                No subjects available. Please add subjects first.
              </MenuItem>
            ) : (
              subjects.map((subject) => (
                <MenuItem key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code})
                </MenuItem>
              ))
            )}
          </Select>
          {subjects.length === 0 && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              No subjects are available. Please contact an administrator to add subjects.
            </Alert>
          )}
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          required
          fullWidth
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
          required
          fullWidth
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
          required
          fullWidth
          type="datetime-local"
          label="End Time"
          name="endTime"
          value={quizData.endTime}
          onChange={handleBasicDetailsChange}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required variant="outlined">
          <InputLabel id="allowed-years-label" sx={{ backgroundColor: 'white', px: 1 }}>
            Allowed Years
          </InputLabel>
          <Select
            labelId="allowed-years-label"
            multiple
            name="allowedYears"
            value={quizData.allowedYears}
            onChange={(e) => handleMultiSelectChange(e, 'allowedYears')}
            input={<OutlinedInput label="Allowed Years" />}
            displayEmpty
            renderValue={(selected) => {
              if (selected.length === 0) {
                return <em>Select years</em>;
              }
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip 
                      key={value} 
                      label={`Year ${value}`}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              );
            }}
            MenuProps={MenuProps}
            sx={selectStyles}
          >
            {YEARS.map((year) => (
              <MenuItem key={year.value} value={year.value}>
                {year.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth required variant="outlined">
          <InputLabel id="allowed-departments-label" sx={{ backgroundColor: 'white', px: 1 }}>
            Allowed Departments
          </InputLabel>
          <Select
            labelId="allowed-departments-label"
            multiple
            name="allowedDepartments"
            value={quizData.allowedDepartments}
            onChange={(e) => handleMultiSelectChange(e, 'allowedDepartments')}
            input={<OutlinedInput label="Allowed Departments" />}
            displayEmpty
            renderValue={(selected) => {
              if (selected.length === 0) {
                return <em>Select departments</em>;
              }
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip 
                      key={value} 
                      label={value}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              );
            }}
            MenuProps={MenuProps}
            sx={selectStyles}
          >
            {DEPARTMENTS.map((dept) => (
              <MenuItem key={dept} value={dept}>
                {dept}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth required variant="outlined">
          <InputLabel id="allowed-sections-label" sx={{ backgroundColor: 'white', px: 1 }}>
            Sections
          </InputLabel>
          <Select
            labelId="allowed-sections-label"
            multiple
            name="allowedSections"
            value={quizData.allowedSections}
            onChange={(e) => handleMultiSelectChange(e, 'allowedSections')}
            input={<OutlinedInput label="Sections" />}
            displayEmpty
            renderValue={(selected) => {
              if (selected.length === 0) {
                return <em>Select sections</em>;
              }
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip 
                      key={value} 
                      label={`Section ${value}`}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              );
            }}
            MenuProps={MenuProps}
            sx={selectStyles}
          >
            {SECTIONS.map((section) => (
              <MenuItem key={section} value={section}>
                Section {section}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
            <Button onClick={handleBack} sx={{ mr: 1 }}>
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button variant="contained" onClick={handleSubmit}>
              Create Quiz
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default QuizCreate; 