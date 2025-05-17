import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Chip
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const QuizReview = () => {
  const { id, studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizData, setQuizData] = useState(null);
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    fetchQuizReview();
  }, [id, studentId]);

  const fetchQuizReview = async () => {
    try {
      let submissionResponse;
      
      if (user.role === 'faculty' && studentId) {
        // Faculty viewing student submission
        submissionResponse = await axios.get(`/quiz/${id}/submissions/${studentId}`);
      } else {
        // Student viewing their own submission
        submissionResponse = await axios.get(`/quiz/${id}/submission`);
      }

      if (!submissionResponse.data) {
        setError('No submission found for this quiz');
        setLoading(false);
        return;
      }

      if (submissionResponse.data.status === 'started') {
        navigate(`/quizzes/${id}`);
        return;
      }

      // For faculty view, we need to set quiz data from the submission response
      if (user.role === 'faculty' && studentId) {
        setQuizData({
          title: submissionResponse.data.quiz.title,
          subject: { name: 'N/A' }, // Add default value
          totalMarks: submissionResponse.data.quiz.totalMarks,
          questions: submissionResponse.data.quiz.questions
        });
      } else {
        // For student view, fetch quiz details separately
        const quizResponse = await axios.get(`/quiz/${id}`);
        setQuizData(quizResponse.data);
      }

      setSubmission(submissionResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Quiz review error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load quiz review';
      setError(errorMessage);
      setLoading(false);
    }
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

  const getAnswerStatus = (question, selectedOption) => {
    const answer = submission.answers.find(a => a.questionId === question._id);
    if (!answer) return 'not-answered';
    return answer.isCorrect ? 'correct' : 'incorrect';
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Quiz Review: {quizData.title}
          </Typography>
          <Typography variant="h5" color="primary" gutterBottom>
            Score: {submission.totalMarks} / {quizData.totalMarks}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Subject: {quizData.subject.name}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Started: {new Date(submission.startTime).toLocaleString()}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Submitted: {new Date(submission.submitTime).toLocaleString()}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Duration: {submission.duration ? `${submission.duration} minutes` : 'N/A'}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Status: <Chip 
              label={submission.status} 
              color={
                submission.status === 'evaluated' ? 'success' :
                submission.status === 'started' ? 'warning' :
                submission.status === 'submitted' ? 'primary' : 'default'
              }
              size="small"
            />
          </Typography>
          {user.role === 'faculty' && (
            <>
              <Typography variant="body1" gutterBottom>
                Student Name: {submission.student?.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Admission Number: {submission.student?.admissionNumber}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Department: {submission.student?.department}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Year: {submission.student?.year}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Section: {submission.student?.section}
              </Typography>
            </>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {quizData.questions.map((question, index) => {
          const userAnswer = submission.answers.find(a => a.questionId === question._id);
          const answerStatus = getAnswerStatus(question, userAnswer?.selectedOption);

          return (
            <Paper 
              key={question._id} 
              sx={{ 
                p: 3, 
                mb: 2, 
                border: 2,
                borderColor: answerStatus === 'correct' ? 'success.main' : 
                           answerStatus === 'incorrect' ? 'error.main' : 
                           'warning.main'
              }}
            >
              <Typography variant="h6" gutterBottom>
                {index + 1}. {question.question}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Marks: {userAnswer?.marks || 0} / {question.marks}
              </Typography>

              <FormControl component="fieldset" fullWidth>
                <RadioGroup value={userAnswer?.selectedOption?.toString() || ''}>
                  {question.options.map((option, optionIndex) => {
                    const isCorrectAnswer = optionIndex === question.correctAnswer;
                    const isUserAnswer = optionIndex === userAnswer?.selectedOption;
                    
                    return (
                      <FormControlLabel
                        key={optionIndex}
                        value={optionIndex.toString()}
                        control={<Radio />}
                        label={
                          <Typography
                            sx={{
                              color: isCorrectAnswer ? 'success.main' : 
                                     isUserAnswer && !userAnswer.isCorrect ? 'error.main' : 
                                     'text.primary',
                              '& span': {
                                ml: 1,
                                fontSize: '0.875rem',
                                color: 'text.secondary'
                              }
                            }}
                          >
                            {option}
                            {isCorrectAnswer && <span>(Correct Answer)</span>}
                            {isUserAnswer && !isCorrectAnswer && <span>(Your Answer)</span>}
                          </Typography>
                        }
                        sx={{ mb: 0.5 }}
                        disabled
                      />
                    );
                  })}
                </RadioGroup>
              </FormControl>

              <Box sx={{ mt: 1 }}>
                {userAnswer ? (
                  userAnswer.isCorrect ? (
                    <Typography color="success.main" variant="body2">
                      ✓ Correct! Marks: {userAnswer.marks}
                    </Typography>
                  ) : (
                    <Typography color="error.main" variant="body2">
                      ✗ Incorrect. Marks: 0
                    </Typography>
                  )
                ) : (
                  <Typography color="warning.main" variant="body2">
                    Not answered
                  </Typography>
                )}
              </Box>
            </Paper>
          );
        })}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/quizzes')}
          >
            Back to Quizzes
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default QuizReview; 