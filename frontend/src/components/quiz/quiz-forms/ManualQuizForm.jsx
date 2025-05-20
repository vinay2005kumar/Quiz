import { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Paper,
  Typography,
  IconButton,
  Radio,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import api from '../../../config/axios';

const ManualQuizForm = ({ onNext, basicDetails }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([
    {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      marks: 1
    }
  ]);

  const handleQuestionChange = (index, field, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === index) {
        return { ...q, [field]: value };
      }
      return q;
    }));
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === questionIndex) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        marks: 1
      }
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate basic details
      if (!basicDetails.title) throw new Error('Quiz title is required');
      if (!basicDetails.subject) throw new Error('Subject is required');
      if (!basicDetails.duration) throw new Error('Duration is required');
      if (!basicDetails.startTime) throw new Error('Start time is required');
      if (!basicDetails.endTime) throw new Error('End time is required');
      if (basicDetails.allowedGroups.length === 0) throw new Error('Select at least one section');

      // Validate questions
      questions.forEach((q, i) => {
        if (!q.question) throw new Error(`Question ${i + 1} is empty`);
        if (q.options.some(opt => !opt)) throw new Error(`All options for question ${i + 1} are required`);
        if (!q.marks) throw new Error(`Marks for question ${i + 1} are required`);
      });

      const formData = {
        ...basicDetails,
        questions,
        type: 'academic'
      };

      await api.post('/api/quiz', formData);
      onNext();
    } catch (error) {
      setError(error.message || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Questions
          </Typography>
          {questions.map((question, questionIndex) => (
            <Paper key={questionIndex} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={11}>
                  <TextField
                    fullWidth
                    label={`Question ${questionIndex + 1}`}
                    value={question.question}
                    onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={1}>
                  <IconButton
                    color="error"
                    onClick={() => removeQuestion(questionIndex)}
                    disabled={questions.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>

                {question.options.map((option, optionIndex) => (
                  <Grid item xs={12} sm={6} key={optionIndex}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Radio
                        checked={question.correctAnswer === optionIndex}
                        onChange={() => handleQuestionChange(questionIndex, 'correctAnswer', optionIndex)}
                        value={optionIndex}
                      />
                      <TextField
                        fullWidth
                        label={`Option ${optionIndex + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                        required
                      />
                    </Box>
                  </Grid>
                ))}

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Marks"
                    value={question.marks}
                    onChange={(e) => handleQuestionChange(questionIndex, 'marks', Number(e.target.value))}
                    required
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
          >
            Add Question
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              Create Quiz
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ManualQuizForm; 