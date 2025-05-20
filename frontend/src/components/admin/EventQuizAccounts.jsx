import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  CircularProgress,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import api from '../../config/axios';

const EventQuizAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    email: '',
    password: '',
    department: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  const departments = [
    'Computer Science',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical'
  ];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!newAccount.name.trim()) errors.name = 'Name is required';
    if (!newAccount.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAccount.email)) errors.email = 'Invalid email format';
    if (!newAccount.password) errors.password = 'Password is required';
    else if (newAccount.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!newAccount.department) errors.department = 'Department is required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/admin/event-quiz-accounts');
      console.log('API Response:', response);
      
      // Check if response is an array
      if (!Array.isArray(response)) {
        console.error('Invalid response format:', response);
        setError('Invalid response format from server');
        return;
      }
      
      setAccounts(response);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setError(error.response?.data?.message || 'Failed to fetch event quiz accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!validateForm()) return;

    try {
      setError('');
      // Check if email already exists
      const response = await api.get('/api/admin/event-quiz-accounts');
      const emailExists = response && Array.isArray(response) && 
        response.some(account => account.email === newAccount.email);
      
      if (emailExists) {
        setValidationErrors(prev => ({
          ...prev,
          email: 'This email is already registered'
        }));
        return;
      }

      await api.post('/api/admin/event-quiz-accounts', {
        ...newAccount,
        role: 'faculty',
        isEventQuizAccount: true
      });
      setOpenDialog(false);
      setNewAccount({
        name: '',
        email: '',
        password: '',
        department: ''
      });
      setValidationErrors({});
      fetchAccounts();
    } catch (error) {
      console.error('Error creating account:', error);
      if (error.response?.data?.message === 'Email already registered') {
        setValidationErrors(prev => ({
          ...prev,
          email: 'This email is already registered'
        }));
      } else {
        setError(error.response?.data?.message || 'Failed to create account');
      }
    }
  };

  const handleDeleteAccount = async (accountId) => {
    try {
      setError('');
      await api.delete(`/api/auth/event-quiz-accounts/${accountId}`);
      fetchAccounts();
      setOpenDeleteDialog(false);
      setAccountToDelete(null);
    } catch (error) {
      console.error('Error deleting account:', error);
      setError(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const handleDeleteClick = (account) => {
    setAccountToDelete(account);
    setOpenDeleteDialog(true);
  };

  const handleEdit = (account) => {
    setEditingId(account._id);
    setNewAccount({
      name: account.name,
      email: account.email,
      password: '', // Don't show existing password
      department: account.department
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewAccount({
      name: '',
      email: '',
      password: '',
      department: ''
    });
    setValidationErrors({});
  };

  const handleUpdateAccount = async () => {
    if (!validateForm()) return;

    try {
      setError('');
      // Check if email already exists (excluding the current account)
      const existingAccounts = await api.get('/api/auth/event-quiz-accounts');
      const emailExists = existingAccounts.some(
        account => account.email === newAccount.email && account._id !== editingId
      );
      
      if (emailExists) {
        setValidationErrors(prev => ({
          ...prev,
          email: 'This email is already registered'
        }));
        return;
      }

      const updateData = {
        name: newAccount.name,
        email: newAccount.email,
        department: newAccount.department
      };
      
      // Only include password if it's been changed
      if (newAccount.password) {
        updateData.password = newAccount.password;
      }

      await api.put(`/api/auth/event-quiz-accounts/${editingId}`, updateData);
      setEditingId(null);
      setNewAccount({
        name: '',
        email: '',
        password: '',
        department: ''
      });
      setValidationErrors({});
      fetchAccounts();
    } catch (error) {
      console.error('Error updating account:', error);
      if (error.response?.data?.message === 'Email already registered') {
        setValidationErrors(prev => ({
          ...prev,
          email: 'This email is already registered'
        }));
      } else {
        setError(error.response?.data?.message || 'Failed to update account');
      }
    }
  };

  // Add toggle password visibility function
  const toggleAllPasswords = async () => {
    try {
      if (!showAllPasswords) {
        // Fetch all passwords
        const response = await api.get('/api/admin/event-quiz-accounts/passwords');
        if (response && response.passwords) {
          setVisiblePasswords(response.passwords);
        }
      } else {
        // Clear all visible passwords
        setVisiblePasswords({});
      }
      setShowAllPasswords(!showAllPasswords);
    } catch (error) {
      console.error('Error fetching passwords:', error);
      setError('Failed to fetch passwords');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Event Quiz Accounts
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenDialog(true)}
        >
          Create New Account
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Password
                  <Tooltip title={showAllPasswords ? "Hide All Passwords" : "Show All Passwords"}>
                    <IconButton
                      size="small"
                      onClick={toggleAllPasswords}
                    >
                      {showAllPasswords ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account._id}>
                <TableCell>
                  {editingId === account._id ? (
                    <TextField
                      value={newAccount.name}
                      onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                      error={!!validationErrors.name}
                      helperText={validationErrors.name}
                      size="small"
                    />
                  ) : (
                    account.name
                  )}
                </TableCell>
                <TableCell>
                  {editingId === account._id ? (
                    <TextField
                      value={newAccount.email}
                      onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                      error={!!validationErrors.email}
                      helperText={validationErrors.email}
                      size="small"
                    />
                  ) : (
                    account.email
                  )}
                </TableCell>
                <TableCell>
                  {editingId === account._id ? (
                    <TextField
                      type="password"
                      value={newAccount.password}
                      onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                      error={!!validationErrors.password}
                      helperText={validationErrors.password}
                      size="small"
                      placeholder="Enter new password"
                    />
                  ) : (
                    <Typography sx={{ fontFamily: 'monospace' }}>
                      {visiblePasswords[account._id] || '********'}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === account._id ? (
                    <FormControl size="small" error={!!validationErrors.department}>
                      <Select
                        value={newAccount.department}
                        onChange={(e) => setNewAccount({ ...newAccount, department: e.target.value })}
                      >
                        {departments.map((dept) => (
                          <MenuItem key={dept} value={dept}>
                            {dept}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    account.department
                  )}
                </TableCell>
                <TableCell>
                  {editingId === account._id ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Save">
                        <IconButton
                          color="primary"
                          onClick={handleUpdateAccount}
                        >
                          <SaveIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <IconButton
                          color="error"
                          onClick={handleCancelEdit}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(account)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(account)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={openDialog} 
        onClose={() => {
          setOpenDialog(false);
          setValidationErrors({});
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Event Quiz Account</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={newAccount.name}
              onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
              error={!!validationErrors.name}
              helperText={validationErrors.name}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={newAccount.email}
              onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={newAccount.password}
              onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
              error={!!validationErrors.password}
              helperText={validationErrors.password}
              fullWidth
            />
            <FormControl fullWidth error={!!validationErrors.department}>
              <InputLabel>Department</InputLabel>
              <Select
                value={newAccount.department}
                onChange={(e) => setNewAccount({ ...newAccount, department: e.target.value })}
                label="Department"
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
              {validationErrors.department && (
                <Typography color="error" variant="caption">
                  {validationErrors.department}
                </Typography>
              )}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenDialog(false);
              setValidationErrors({});
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateAccount} 
            variant="contained" 
            color="primary"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => {
          setOpenDeleteDialog(false);
          setAccountToDelete(null);
        }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this event quiz account?
          </Typography>
          {accountToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Account Details:
              </Typography>
              <Typography variant="body2">
                Email: {accountToDelete.email}
              </Typography>
              <Typography variant="body2">
                Department: {accountToDelete.department}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDeleteDialog(false);
            setAccountToDelete(null);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleDeleteAccount(accountToDelete._id)} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventQuizAccounts; 