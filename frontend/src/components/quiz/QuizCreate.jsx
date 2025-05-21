import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ManualQuizForm from './quiz-forms/ManualQuizForm';
import ExcelQuizForm from './quiz-forms/ExcelQuizForm';
import WordQuizForm from './quiz-forms/WordQuizForm';
import ImageQuizForm from './quiz-forms/ImageQuizForm';
import QuizBasicDetails from './quiz-forms/QuizBasicDetails';
import api from '../../config/axios';

const QuizCreate = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [inputMethod, setInputMethod] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // Shared basic details state
  const [basicDetails, setBasicDetails] = useState({
    title: '',
    subject: '',
    duration: 30,
    startTime: '',
    endTime: '',
    allowedGroups: []
  });

  // Questions state for manual quiz creation
  const [questions, setQuestions] = useState([
    {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      marks: 1
    }
  ]);

  const steps = ['Choose Input Method', 'Create Quiz', 'Review & Submit'];

  const handleInputMethodChange = (event, newValue) => {
    setInputMethod(newValue);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
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

      const formData = {
        ...basicDetails,
        questions: questions.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswer: parseInt(q.correctAnswer),
          marks: parseInt(q.marks)
        })),
        type: 'academic'
      };

      await api.post('/api/quiz', formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/quizzes');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  const renderInputMethodHelp = () => (
    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        Choose Your Quiz Creation Method
      </Typography>
      <Typography variant="body2" paragraph>
        <strong>Manual Entry:</strong> Create quiz questions one by one using our intuitive form interface.
      </Typography>
      <Typography variant="body2" paragraph>
        <strong>Excel Upload:</strong> Upload questions in bulk using our Excel template. Perfect for large quizzes.
      </Typography>
      <Typography variant="body2" paragraph>
        <strong>Word Upload:</strong> Convert your Word document questions into an interactive quiz.
      </Typography>
      <Typography variant="body2">
        <strong>Image Upload:</strong> Extract questions from images or scanned documents.
      </Typography>
    </Box>
  );

  const renderQuizForm = () => {
    const commonProps = {
      onNext: handleNext,
      basicDetails: basicDetails,
      setBasicDetails: setBasicDetails
    };

    switch (inputMethod) {
      case 0:
        return (
          <ManualQuizForm 
            {...commonProps} 
            questions={questions}
            onQuestionsUpdate={setQuestions}
            isReview={false}
          />
        );
      case 1:
        return <ExcelQuizForm {...commonProps} />;
      case 2:
        return <WordQuizForm {...commonProps} />;
      case 3:
        return <ImageQuizForm {...commonProps} />;
      default:
        return null;
    }
  };

  const renderQuizSummary = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Quiz Summary
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Basic Details
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Title" secondary={basicDetails.title} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Subject" secondary={basicDetails.subject} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Duration" secondary={`${basicDetails.duration} minutes`} />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Start Time" 
                secondary={new Date(basicDetails.startTime).toLocaleString()} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="End Time" 
                secondary={new Date(basicDetails.endTime).toLocaleString()} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Allowed Groups" 
                secondary={basicDetails.allowedGroups.map(group => 
                  typeof group === 'object' ? `${group.department} - ${group.section} (Semester ${group.semester})` : group
                ).join(', ')} 
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Questions ({questions.length})
      </Typography>
      
      {questions.map((question, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Question {index + 1} ({question.marks} marks)
            </Typography>
            <Typography variant="body1" gutterBottom>
              {question.question}
            </Typography>
            <Grid container spacing={2}>
              {question.options.map((option, optIndex) => (
                <Grid item xs={12} sm={6} key={optIndex}>
                  <Typography
                    variant="body2"
                    color={optIndex === question.correctAnswer ? 'success.main' : 'text.primary'}
                  >
                    {String.fromCharCode(65 + optIndex)}) {option}
                    {optIndex === question.correctAnswer && ' ✓'}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Create New Quiz</Typography>
          <Tooltip title="Learn about quiz creation methods">
            <IconButton size="small" onClick={() => setShowHelp(prev => !prev)}>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Quiz created successfully! Redirecting to quizzes page...
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {showHelp && renderInputMethodHelp()}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeStep === 0 && (
              <Box sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs
                    value={inputMethod}
                    onChange={handleInputMethodChange}
                    variant="fullWidth"
                    aria-label="quiz creation method tabs"
                  >
                    <Tab label="Manual Entry" />
                    <Tab label="Excel Upload" />
                    <Tab label="Word Upload" />
                    <Tab label="Image Upload" />
                  </Tabs>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <QuizBasicDetails
                    basicDetails={basicDetails}
                    setBasicDetails={setBasicDetails}
                    error={error}
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                {renderQuizForm()}
              </Box>
            )}

            {activeStep === 1 && renderQuizForm()}
            {activeStep === 2 && renderQuizSummary()}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Quiz'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default QuizCreate; 