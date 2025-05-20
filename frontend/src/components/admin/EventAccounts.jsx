import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Grid,
  Tooltip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Upload as UploadIcon, FilterList as FilterListIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import api from '../../config/axios';

const EventAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [formData, setFormData] = useState({
    department: '',
    email: '',
    password: '',
    isActive: true
  });
  const [dialogError, setDialogError] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    name: '',
    date: '',
    status: '',
    year: '',
    semester: '',
    section: ''
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/admin/event-quiz-accounts');
      if (Array.isArray(response)) {
        setAccounts(response);
      } else if (response && Array.isArray(response.accounts)) {
        setAccounts(response.accounts);
      } else {
        console.error('Invalid accounts response:', response);
        setError('Invalid response format from server');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setError('Failed to fetch event accounts');
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/api/settings/departments');
      if (response && Array.isArray(response.departments)) {
        setDepartments(response.departments);
      } else {
        console.error('Invalid departments data:', response);
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await api.get('/api/settings/sections');
      if (response && Array.isArray(response.sections)) {
        setSections(response.sections);
      } else {
        console.error('Invalid sections data:', response);
        setSections([]);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchDepartments();
    fetchSections();
  }, []);

  const handleOpenDialog = (account = null) => {
    if (account) {
      setSelectedAccount(account);
      setFormData({
        department: account.department,
        email: account.email,
        password: '',
        isActive: account.isActive
      });
    } else {
      setSelectedAccount(null);
      setFormData({
        department: '',
        email: '',
        password: '',
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAccount(null);
    setDialogError('');
    setFormData({
      department: '',
      email: '',
      password: '',
      isActive: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setDialogError('');

      // Basic validation
      if (!formData.email || !formData.department || (!selectedAccount && !formData.password)) {
        setDialogError('Please fill in all required fields');
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setDialogError('Please enter a valid email address');
        return;
      }

      if (selectedAccount) {
        // Update existing account
        await api.patch(`/api/admin/event-quiz-accounts/${selectedAccount._id}/status`, {
          isActive: formData.isActive
        });
      } else {
        // Create new account
        await api.post('/api/admin/event-quiz-accounts', formData);
      }

      handleCloseDialog();
      fetchAccounts();
    } catch (error) {
      console.error('Error:', error);
      setDialogError(error.response?.data?.message || 'Failed to save account');
    }
  };

  const handleDelete = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this event account?')) {
      try {
        await api.delete(`/api/admin/event-quiz-accounts/${accountId}`);
        fetchAccounts();
      } catch (error) {
        setError('Failed to delete account');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'isActive' ? checked : value
    }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      await api.post('/api/admin/event-quiz-accounts/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setOpenUploadDialog(false);
      fetchAccounts();
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload event accounts. Please check your Excel file format.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAccounts = () => {
    return accounts.filter(account => {
      const departmentMatch = !filters.department || account.department === filters.department;
      const nameMatch = !filters.name || account.name.toLowerCase().includes(filters.name.toLowerCase());
      const dateMatch = !filters.date || account.date.includes(filters.date);
      const statusMatch = !filters.status || account.status === filters.status;
      return departmentMatch && nameMatch && dateMatch && statusMatch;
    });
  };

  // Fix the toggleAllPasswords function
  const toggleAllPasswords = async () => {
    try {
      if (!showAllPasswords) {
        // Fetch all passwords at once
        const response = await api.get('/api/admin/event-quiz-accounts/passwords');
        console.log('Password response:', response); // Debug log
        if (response && response.passwords) {
          setVisiblePasswords(response.passwords);
        } else {
          console.error('Invalid password response:', response);
        }
      } else {
        // Clear all visible passwords
        setVisiblePasswords({});
      }
      setShowAllPasswords(!showAllPasswords);
    } catch (error) {
      console.error('Error fetching passwords:', error);
    }
  };

  // Add helper function to get available sections
  const getAvailableSections = (department, year, semester) => {
    if (!department || !year || !semester) return [];
    const matchingSection = sections.find(section => 
      section.department === department && 
      section.year.toString() === year.toString() &&
      section.semester.toString() === semester.toString()
    );
    return matchingSection ? matchingSection.sections : [];
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
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Event Quiz Accounts</Typography>
          <Box>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setOpenUploadDialog(true)}
              sx={{ mr: 2 }}
            >
              Upload Excel
            </Button>
            <Button
              variant="contained"
              onClick={() => handleOpenDialog()}
            >
              Add Event Account
            </Button>
          </Box>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon /> Filters
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value, year: '', semester: '', section: '' })}
                  label="Department"
                >
                  <MenuItem value="">All</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept._id} value={dept.name}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Year</InputLabel>
                <Select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value, semester: '', section: '' })}
                  label="Year"
                  disabled={!filters.department}
                >
                  <MenuItem value="">All</MenuItem>
                  {[1, 2, 3, 4].map(year => (
                    <MenuItem key={year} value={year}>Year {year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Semester</InputLabel>
                <Select
                  value={filters.semester}
                  onChange={(e) => setFilters({ ...filters, semester: e.target.value, section: '' })}
                  label="Semester"
                  disabled={!filters.year}
                >
                  <MenuItem value="">All</MenuItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Section</InputLabel>
                <Select
                  value={filters.section}
                  onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                  label="Section"
                  disabled={!filters.department || !filters.year || !filters.semester}
                >
                  <MenuItem value="">All</MenuItem>
                  {getAvailableSections(filters.department, filters.year, filters.semester).map(section => (
                    <MenuItem key={section} value={section}>
                      Section {section}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Event Name"
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                placeholder="Search by name..."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Date"
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="ongoing">Ongoing</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setFilters({ department: '', name: '', date: '', status: '', year: '', semester: '', section: '' })}
                disabled={!filters.department && !filters.name && !filters.date && !filters.status && !filters.year && !filters.semester && !filters.section}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {accounts.length === 0 ? (
          <Alert severity="info">
            No event accounts found. Add an account using the button above or upload via Excel.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Department</TableCell>
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
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredAccounts().map((account) => (
                  <TableRow key={account._id}>
                    <TableCell>{account.department}</TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontFamily: 'monospace' }}>
                        {visiblePasswords[account._id] || '********'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={account.isActive}
                            onChange={() => {
                              handleOpenDialog({
                                ...account,
                                isActive: !account.isActive
                              });
                            }}
                            color="primary"
                          />
                        }
                        label={account.isActive ? 'Active' : 'Inactive'}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(account)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(account._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add/Edit Event Account Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedAccount ? 'Edit Event Account' : 'Add New Event Account'}
        </DialogTitle>
        <DialogContent>
          {dialogError && (
            <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
              {dialogError}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Department</InputLabel>
              <Select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                label="Department"
              >
                {departments.map((dept) => (
                  <MenuItem key={dept._id} value={dept.name}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required={!selectedAccount}
              margin="normal"
              helperText={selectedAccount ? "Leave blank to keep current password" : ""}
            />
            {selectedAccount && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    name="isActive"
                  />
                }
                label={formData.isActive ? 'Active' : 'Inactive'}
                sx={{ mt: 2 }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedAccount ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Excel Dialog */}
      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)}>
        <DialogTitle>Upload Event Accounts Data</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Upload an Excel file containing event account information. Please ensure your file follows this format:
          </Typography>
          
          <Box sx={{ my: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Required Excel Columns:</Typography>
            <Typography variant="body2" component="div">
              <ul>
                <li><strong>Department</strong>: Must match an existing department name exactly</li>
                <li><strong>Email</strong>: Valid email address</li>
                <li><strong>Password</strong>: Initial password for the account</li>
                <li><strong>IsActive</strong>: "true" or "false" (optional, defaults to true)</li>
              </ul>
            </Typography>
          </Box>

          <Box sx={{ my: 2, p: 2, bgcolor: 'info.light', color: 'info.contrastText', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Example Row:</Typography>
            <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace' }}>
              Department: Computer Science and Engineering<br />
              Email: cs.events@example.com<br />
              Password: eventPass123<br />
              IsActive: true
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="excel-upload"
          />
          <label htmlFor="excel-upload">
            <Button variant="contained" component="span">
              Choose File
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventAccounts; 