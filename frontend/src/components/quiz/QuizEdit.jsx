import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent,
  FormControlLabel,
  Radio,
  RadioGroup,
  OutlinedInput,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';

const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const QuizEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quiz, setQuiz] = useState({
    title: '',
    subject: '',
    duration: 30,
    startTime: '',
    endTime: '',
    questions: [
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        marks: 1
      }
    ],
    allowedYears: [],
    allowedDepartments: [],
    allowedSections: []
  });

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      console.log('Fetching quiz with ID:', id);
      const response = await api.get(`/quiz/${id}`);
      console.log('Quiz data received:', response);
      
      // Helper function to safely format date
      const formatDate = (dateString) => {
        try {
          console.log('Formatting date:', dateString);
          const date = new Date(dateString);
          // Check if date is valid
          if (isNaN(date.getTime())) {
            console.warn('Invalid date:', dateString);
            return '';
          }
          const formatted = date.toISOString().slice(0, 16);
          console.log('Formatted date:', formatted);
          return formatted;
        } catch (error) {
          console.error('Error formatting date:', error);
          return '';
        }
      };
      
      // Format dates for input fields with validation
      const formattedQuiz = {
        ...response,  // The api instance already returns the data property
        startTime: formatDate(response.startTime),
        endTime: formatDate(response.endTime),
        // Ensure questions array exists with at least one default question
        questions: response.questions?.length ? response.questions : [{
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          marks: 1
        }],
        // Ensure other arrays exist
        allowedYears: response.allowedYears || [],
        allowedDepartments: response.allowedDepartments || [],
        allowedSections: response.allowedSections || []
      };
      
      console.log('Formatted quiz data:', formattedQuiz);
      setQuiz(formattedQuiz);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setError(error.response?.data?.message || 'Failed to load quiz');
      setLoading(false);
    }
  };

  const handleBasicDetailsChange = (e) => {
    const { name, value } = e.target;
    setQuiz(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelectChange = (e, field) => {
    const { value } = e.target;
    setQuiz(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i === questionIndex) {
          return { ...q, [field]: value };
        }
        return q;
      })
    }));
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setQuiz(prev => ({
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
    setQuiz(prev => ({
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
    if (quiz.questions.length > 1) {
      setQuiz(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      console.log('Submitting quiz update:', quiz);

      // Validate quiz data
      if (!quiz.title.trim()) {
        setError('Quiz title is required');
        return;
      }

      if (!quiz.questions.length) {
        setError('At least one question is required');
        return;
      }

      // Validate dates
      const startTime = new Date(quiz.startTime);
      const endTime = new Date(quiz.endTime);

      if (isNaN(startTime.getTime())) {
        setError('Invalid start time');
        return;
      }

      if (isNaN(endTime.getTime())) {
        setError('Invalid end time');
        return;
      }

      if (endTime <= startTime) {
        setError('End time must be after start time');
        return;
      }

      // Format dates to ISO string
      const updatedQuiz = {
        ...quiz,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };

      // Validate each question
      for (let i = 0; i < quiz.questions.length; i++) {
        const q = quiz.questions[i];
        
        if (!q.question.trim()) {
          setError(`Question ${i + 1} text is required`);
          return;
        }

        if (q.options.some(opt => !opt.trim())) {
          setError(`All options for question ${i + 1} must be filled`);
          return;
        }

        if (q.marks < 1) {
          setError(`Marks for question ${i + 1} must be at least 1`);
          return;
        }
      }

      console.log('Sending update request with data:', updatedQuiz);
      const response = await api.put(`/quiz/${id}`, updatedQuiz);
      console.log('Update response:', response);
      
      setSuccess('Quiz updated successfully');
      setTimeout(() => navigate('/quizzes'), 1500);
    } catch (error) {
      console.error('Error updating quiz:', error);
      setError(error.response?.data?.message || error.response?.data?.error || 'Failed to update quiz');
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
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/quizzes')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Edit Quiz</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Quiz Title"
              name="title"
              value={quiz.title}
              onChange={handleBasicDetailsChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              type="number"
              label="Duration (minutes)"
              name="duration"
              value={quiz.duration}
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
              value={quiz.startTime}
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
              value={quiz.endTime}
              onChange={handleBasicDetailsChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Sections</InputLabel>
              <Select
                multiple
                name="allowedSections"
                value={quiz.allowedSections}
                onChange={(e) => handleMultiSelectChange(e, 'allowedSections')}
                input={<OutlinedInput label="Sections" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={`Section ${value}`} />
                    ))}
                  </Box>
                )}
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

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Questions</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addQuestion}
          >
            Add Question
          </Button>
        </Box>

        {(quiz.questions || []).map((question, questionIndex) => (
          <Card key={questionIndex} sx={{ mb: 3, position: 'relative' }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={11}>
                  <TextField
                    required
                    fullWidth
                    label={`Question ${questionIndex + 1}`}
                    value={question.question}
                    onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={1}>
                  <IconButton
                    color="error"
                    onClick={() => removeQuestion(questionIndex)}
                    disabled={quiz.questions.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Options
                  </Typography>
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={question.correctAnswer}
                      onChange={(e) => handleQuestionChange(questionIndex, 'correctAnswer', parseInt(e.target.value))}
                    >
                      {question.options.map((option, optionIndex) => (
                        <Box key={optionIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <FormControlLabel
                            value={optionIndex}
                            control={<Radio />}
                            label=""
                          />
                          <TextField
                            required
                            fullWidth
                            label={`Option ${optionIndex + 1}`}
                            value={option}
                            onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                            size="small"
                          />
                        </Box>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Marks"
                    value={question.marks}
                    onChange={(e) => handleQuestionChange(questionIndex, 'marks', parseInt(e.target.value))}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/quizzes')}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
          >
            Save Changes
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default QuizEdit; 