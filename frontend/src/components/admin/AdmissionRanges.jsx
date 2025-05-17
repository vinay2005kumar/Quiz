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
  Stack,
  Grid,
  Chip,
  Tooltip,
  Card,
  CardContent,
  Tabs,
  Tab
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PeopleIcon from '@mui/icons-material/People';
import FilterListIcon from '@mui/icons-material/FilterList';
import axios from 'axios';

const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];
const sections = ['A', 'B', 'C', 'D', 'E'];
const years = ['1', '2', '3', '4'];

const AdmissionRanges = () => {
  const [ranges, setRanges] = useState([]);
  const [studentCounts, setStudentCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);
  const [rangeToDelete, setRangeToDelete] = useState(null);
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    section: ''
  });
  const [formData, setFormData] = useState({
    department: '',
    year: '',
    section: '',
    regularEntry: { start: '', end: '' },
    lateralEntry: { start: '', end: '' }
  });
  const [useSimpleInput, setUseSimpleInput] = useState(false);
  const [simpleFormData, setSimpleFormData] = useState({
    department: '',
    year: '',
    section: '',
    regularStart: '',
    regularEnd: '',
    lateralStart: '',
    lateralEnd: ''
  });
  const [inputMethod, setInputMethod] = useState('standard');
  const [manualNumbers, setManualNumbers] = useState({
    regular: '',
    lateral: ''
  });

  useEffect(() => {
    Promise.all([fetchRanges(), fetchStudentCounts()]);
  }, []);

  const fetchStudentCounts = async () => {
    try {
      const response = await axios.get('/admin/student-counts');
      setStudentCounts(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch student counts');
    }
  };

  const fetchRanges = async () => {
    try {
      const response = await axios.get('/admin/admission-ranges');
      setRanges(response.data);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch ranges');
      setLoading(false);
    }
  };

  const generateAdmissionNumber = (type, year, dept, number) => {
    const deptCode = dept.split(' ')[0].toLowerCase();
    const paddedNumber = number.toString().padStart(3, '0');
    return `${type}${year}${deptCode}${paddedNumber}`;
  };

  const handleSimpleInputChange = (field, value) => {
    setSimpleFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputMethodChange = (event, newValue) => {
    setInputMethod(newValue);
  };

  const parseManualNumbers = (numbersString) => {
    return numbersString
      .split(/[\s,\n]+/)
      .map(num => num.trim())
      .filter(num => num && !isNaN(num))
      .map(num => num.padStart(3, '0'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let dataToSubmit;

      if (inputMethod === 'manual') {
        const regularNumbers = parseManualNumbers(manualNumbers.regular);
        const lateralNumbers = parseManualNumbers(manualNumbers.lateral);

        if (regularNumbers.length === 0 && lateralNumbers.length === 0) {
          setError('Please enter at least one number for regular or lateral entry');
          return;
        }

        dataToSubmit = {
          department: formData.department,
          year: formData.year,
          section: formData.section,
          regularEntry: {
            numbers: regularNumbers
          },
          lateralEntry: {
            numbers: lateralNumbers
          }
        };
      } else {
        dataToSubmit = formData;
      }

      if (selectedRange) {
        await axios.put(`/admin/admission-ranges/${selectedRange._id}`, dataToSubmit);
        setSuccess('Range updated successfully');
      } else {
        await axios.post('/admin/admission-ranges', dataToSubmit);
        setSuccess('Range created successfully');
      }
      
      setOpenDialog(false);
      fetchRanges(); // Refresh the list
      fetchStudentCounts(); // Also refresh the student counts
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save range');
    }
  };

  const handleDeleteClick = (range) => {
    setRangeToDelete(range);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/admin/admission-ranges/${rangeToDelete._id}`);
      setSuccess('Range deleted successfully');
      fetchRanges();
      fetchStudentCounts();
      setOpenDeleteDialog(false);
      setRangeToDelete(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete range');
    }
  };

  const handleEdit = (range) => {
    setSelectedRange(range);
    setFormData({
      department: range.department,
      year: range.year,
      section: range.section,
      regularEntry: {
        start: range.regularEntry.start,
        end: range.regularEntry.end
      },
      lateralEntry: {
        start: range.lateralEntry.start,
        end: range.lateralEntry.end
      }
    });
    setManualNumbers({
      regular: '',
      lateral: ''
    });
    setInputMethod('standard');
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setSelectedRange(null);
    setFormData({
      department: '',
      year: '',
      section: '',
      regularEntry: { start: '', end: '' },
      lateralEntry: { start: '', end: '' }
    });
    setManualNumbers({
      regular: '',
      lateral: ''
    });
    setInputMethod('standard');
    setOpenDialog(true);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('/admin/admission-ranges/bulk-upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Ranges uploaded successfully');
      fetchRanges();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to upload ranges');
    }
  };

  const getStudentCount = (department, year, section) => {
    const count = studentCounts.find(
      c => c.department === department && 
           c.year === parseInt(year) && 
           c.section === section
    );
    return count || { totalCount: 0, regularCount: 0, lateralCount: 0 };
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getFilteredRanges = () => {
    return ranges.filter(range => {
      const matchDepartment = !filters.department || range.department === filters.department;
      const matchYear = !filters.year || range.year === filters.year;
      const matchSection = !filters.section || range.section === filters.section;
      return matchDepartment && matchYear && matchSection;
    });
  };

  const getDepartmentSummary = (department) => {
    const departmentCounts = studentCounts.filter(c => c.department === department);
    return {
      total: departmentCounts.reduce((sum, c) => sum + c.totalCount, 0),
      regular: departmentCounts.reduce((sum, c) => sum + c.regularCount, 0),
      lateral: departmentCounts.reduce((sum, c) => sum + c.lateralCount, 0)
    };
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const filteredRanges = getFilteredRanges();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Admission Number Ranges</Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              Add Range
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              component="label"
            >
              Upload Excel
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
              />
            </Button>
          </Stack>
        </Box>

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <FormControl 
                  fullWidth 
                  size="medium"
                  sx={{
                    '& .MuiInputBase-root': {
                      height: '56px',
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                      }
                    }
                  }}
                >
                  {/* <InputLabel>Department</InputLabel> */}
                  <Select
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    label="Department"
                    displayEmpty
                  >
                    <MenuItem value="">All Departments</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl 
                  fullWidth 
                  size="medium"
                  sx={{
                    '& .MuiInputBase-root': {
                      height: '56px',
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                      }
                    }
                  }}
                >
                  {/* <InputLabel>Year</InputLabel> */}
                  <Select
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    label="Year"
                    displayEmpty
                  >
                    <MenuItem value="">All Years</MenuItem>
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        Year {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl 
                  fullWidth 
                  size="medium"
                  sx={{
                    '& .MuiInputBase-root': {
                      height: '56px',
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                      }
                    }
                  }}
                >
                  {/* <InputLabel>Section</InputLabel> */}
                  <Select
                    value={filters.section}
                    onChange={(e) => handleFilterChange('section', e.target.value)}
                    label="Section"
                    displayEmpty
                  >
                    <MenuItem value="">All Sections</MenuItem>
                    {sections.map((section) => (
                      <MenuItem key={section} value={section}>
                        Section {section}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={() => setFilters({ department: '', year: '', section: '' })}
                  sx={{ height: '56px' }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>

            {filters.department && (
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Department Summary: {filters.department}
                </Typography>
                <Stack direction="row" spacing={2}>
                  {(() => {
                    const summary = getDepartmentSummary(filters.department);
                    return (
                      <>
                        <Chip label={`Total Students: ${summary.total}`} color="primary" />
                        <Chip label={`Regular: ${summary.regular}`} color="secondary" />
                        <Chip label={`Lateral: ${summary.lateral}`} color="info" />
                      </>
                    );
                  })()}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Department</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Regular Entry Range</TableCell>
                <TableCell>Lateral Entry Range</TableCell>
                <TableCell>Student Count</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRanges.map((range) => {
                const counts = getStudentCount(range.department, range.year, range.section);
                return (
                  <TableRow key={range._id}>
                    <TableCell>{range.department}</TableCell>
                    <TableCell>{range.year}</TableCell>
                    <TableCell>{range.section}</TableCell>
                    <TableCell>
                      {range.regularEntry.start} - {range.regularEntry.end}
                    </TableCell>
                    <TableCell>
                      {range.lateralEntry.start} - {range.lateralEntry.end}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title={`Regular: ${counts.regularCount}, Lateral: ${counts.lateralCount}`}>
                          <Chip
                            icon={<PeopleIcon />}
                            label={`Total: ${counts.totalCount}`}
                            color="primary"
                            variant="outlined"
                          />
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {new Date(range.lastUpdated).toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Edit">
                          <IconButton 
                            onClick={() => handleEdit(range)}
                            color="primary"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            onClick={() => handleDeleteClick(range)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRanges.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body1" color="text.secondary">
                      No ranges found for the selected filters
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" id="delete-dialog-description">
            Are you sure you want to delete this admission range?
          </Typography>
          {rangeToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Range Details:
              </Typography>
              <Typography variant="body2">
                Department: {rangeToDelete.department}
              </Typography>
              <Typography variant="body2">
                Year: {rangeToDelete.year}
              </Typography>
              <Typography variant="body2">
                Section: {rangeToDelete.section}
              </Typography>
              <Typography variant="body2">
                Regular Entry: {rangeToDelete.regularEntry.start} - {rangeToDelete.regularEntry.end}
              </Typography>
              <Typography variant="body2">
                Lateral Entry: {rangeToDelete.lateralEntry.start} - {rangeToDelete.lateralEntry.end}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenDeleteDialog(false);
              setRangeToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRange ? 'Edit Range' : 'Add Range'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }} onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    label="Department"
                    required
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Section</InputLabel>
                  <Select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    label="Section"
                    required
                  >
                    {sections.map((section) => (
                      <MenuItem key={section} value={section}>
                        Section {section}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Tabs
                  value={inputMethod}
                  onChange={handleInputMethodChange}
                  centered
                  sx={{ mb: 2 }}
                >
                  <Tab label="Standard Input" value="standard" />
                  <Tab label="Manual Numbers" value="manual" />
                </Tabs>
              </Grid>

              {inputMethod === 'manual' ? (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Regular Entry Numbers
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={manualNumbers.regular}
                      onChange={(e) => setManualNumbers({ ...manualNumbers, regular: e.target.value })}
                      placeholder="Enter numbers separated by commas, spaces, or new lines (e.g., 1, 2, 3, 4, 5)"
                      helperText="Numbers will be automatically padded with zeros (e.g., 1 becomes 001)"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Lateral Entry Numbers
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={manualNumbers.lateral}
                      onChange={(e) => setManualNumbers({ ...manualNumbers, lateral: e.target.value })}
                      placeholder="Enter numbers separated by commas, spaces, or new lines (e.g., 1, 2, 3, 4, 5)"
                      helperText="Numbers will be automatically padded with zeros (e.g., 1 becomes 001)"
                    />
                  </Grid>
                  {formData.department && formData.year && (
                    <Grid item xs={12}>
                      <Alert severity="info">
                        Preview of admission numbers that will be created:
                        <Box component="div" sx={{ mt: 1 }}>
                          <strong>Regular Entry:</strong><br />
                          {parseManualNumbers(manualNumbers.regular)
                            .map(num => generateAdmissionNumber('y', formData.year, formData.department, num))
                            .join(', ') || 'No numbers entered'}
                        </Box>
                        <Box component="div" sx={{ mt: 1 }}>
                          <strong>Lateral Entry:</strong><br />
                          {parseManualNumbers(manualNumbers.lateral)
                            .map(num => generateAdmissionNumber('l', formData.year, formData.department, num))
                            .join(', ') || 'No numbers entered'}
                        </Box>
                      </Alert>
                    </Grid>
                  )}
                </>
              ) : (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Regular Entry Range
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Start"
                          value={formData.regularEntry.start}
                          onChange={(e) => setFormData({
                            ...formData,
                            regularEntry: { ...formData.regularEntry, start: e.target.value }
                          })}
                          required
                          helperText="Format: y22cs001"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="End"
                          value={formData.regularEntry.end}
                          onChange={(e) => setFormData({
                            ...formData,
                            regularEntry: { ...formData.regularEntry, end: e.target.value }
                          })}
                          required
                          helperText="Format: y22cs066"
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Lateral Entry Range
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Start"
                          value={formData.lateralEntry.start}
                          onChange={(e) => setFormData({
                            ...formData,
                            lateralEntry: { ...formData.lateralEntry, start: e.target.value }
                          })}
                          required
                          helperText="Format: l22cs001"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="End"
                          value={formData.lateralEntry.end}
                          onChange={(e) => setFormData({
                            ...formData,
                            lateralEntry: { ...formData.lateralEntry, end: e.target.value }
                          })}
                          required
                          helperText="Format: l22cs020"
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedRange ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdmissionRanges; 