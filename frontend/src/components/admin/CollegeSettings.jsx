import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Box,
  Tab,
  Tabs,
  Alert,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import api from '../../config/axios';
import * as XLSX from 'xlsx';

const CollegeSettings = () => {
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [openDeptDialog, setOpenDeptDialog] = useState(false);
  const [openSectionDialog, setOpenSectionDialog] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [deptFormData, setDeptFormData] = useState({ name: '', code: '', description: '' });
  const [sectionFormData, setSectionFormData] = useState({
    names: [],
    department: '',
    year: 1,
    semester: 1
  });
  const [uploadMode, setUploadMode] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [sectionInput, setSectionInput] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  
  // New state for dialogs
  const [errorDialog, setErrorDialog] = useState({ open: false, message: '' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });

  useEffect(() => {
    fetchDepartments();
    fetchSections();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/api/settings/departments');
      console.log('Departments response:', response);
      if (response && Array.isArray(response.departments)) {
        setDepartments(response.departments);
      } else {
        console.error('Invalid departments data:', response);
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]); // Set empty array on error
    }
  };

  const fetchSections = async () => {
    try {
      const response = await api.get('/api/settings/sections');
      console.log('Sections response:', response);
      if (response && response.sections) {
        // Backend already sends grouped sections, use them directly
        setSections(response.sections);
      } else {
        console.error('Invalid sections data:', response);
        setSections([]);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]); // Set empty array on error
    }
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedDept) {
        await api.put(`/api/settings/departments/${selectedDept._id}`, deptFormData);
      } else {
        await api.post('/api/settings/departments', deptFormData);
      }
      fetchDepartments();
      setOpenDeptDialog(false);
      setDeptFormData({ name: '', code: '', description: '' });
      setSelectedDept(null);
    } catch (error) {
      console.error('Error saving department:', error);
    }
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!sectionFormData.department || !sectionFormData.year || !sectionFormData.semester || sectionFormData.names.length === 0) {
        showError('Please fill in all required fields and add at least one section');
        return;
      }

      if (selectedSection) {
        // Update existing section
        const response = await api.put(`/api/settings/sections/${selectedSection._id}`, {
          name: sectionFormData.names[0],
          department: sectionFormData.department,
          year: Number(sectionFormData.year),
          semester: Number(sectionFormData.semester)
        });
        console.log('Section updated:', response.data);
      } else {
        // Create new sections
        console.log('Creating sections with data:', sectionFormData);
        const results = [];
        let hasErrors = false;
        
        for (const name of sectionFormData.names) {
          try {
            const response = await api.post('/api/settings/sections', {
              name: name.trim(),
              department: sectionFormData.department,
              year: Number(sectionFormData.year),
              semester: Number(sectionFormData.semester)
            });
            
            if (response.status === 201 || (response.status === 200 && response.data.alreadyExists)) {
              results.push(response.data);
            }
          } catch (error) {
            console.error(`Error creating section ${name}:`, error);
            hasErrors = true;
          }
        }

        if (results.length === 0 && hasErrors) {
          showError('Error creating sections. Please try again.');
          return;
        }
      }

      // Refresh sections and reset form
      await fetchSections();
      setOpenSectionDialog(false);
      setSectionFormData({ names: [], department: '', year: 1, semester: 1 });
      setSelectedSection(null);
      setSectionInput('');
    } catch (error) {
      console.error('Error saving section:', error);
      showError('Error saving sections. Please try again.');
    }
  };

  const handleDeleteDepartment = async (id) => {
    showConfirmation(
      'Are you sure you want to delete this department? This will also delete all associated sections.',
      async () => {
        try {
          await api.delete(`/api/settings/departments/${id}`);
          fetchDepartments();
          fetchSections();
        } catch (error) {
          console.error('Error deleting department:', error);
          showError('Error deleting department. Please try again.');
        }
      }
    );
  };

  const handleDeleteSection = async (id) => {
    showConfirmation(
      'Are you sure you want to delete this section?',
      async () => {
        try {
          await api.delete(`/api/settings/sections/${id}`);
          fetchSections();
        } catch (error) {
          console.error('Error deleting section:', error);
          showError('Error deleting section. Please try again.');
        }
      }
    );
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        setUploadError('Please upload an Excel file (.xlsx or .xls)');
        return;
      }
      setExcelFile(file);
      setUploadError('');
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['Department', 'Year', 'Semester', 'Sections'],
      ['Computer Science and Engineering', '1', '1', 'A,B,C'],
      ['Computer Science and Engineering', '1', '2', 'A,B,C'],
      // Add more example rows as needed
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sections Template');
    XLSX.writeFile(wb, 'sections_template.xlsx');
  };

  const handleExcelUpload = async () => {
    try {
      if (!excelFile) {
        setUploadError('Please select a file first');
        return;
      }

      const formData = new FormData();
      formData.append('file', excelFile);

      const response = await api.post('/api/settings/sections/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadSuccess('Sections uploaded successfully');
      setExcelFile(null);
      fetchSections();
      setOpenSectionDialog(false);
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Error uploading sections');
    }
  };

  // Function to show error dialog
  const showError = (message) => {
    setErrorDialog({ open: true, message });
  };

  // Function to show confirmation dialog
  const showConfirmation = (message, onConfirm) => {
    setConfirmDialog({ open: true, message, onConfirm });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Departments */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Departments</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedDept(null);
                  setDeptFormData({ name: '', code: '', description: '' });
                  setOpenDeptDialog(true);
                }}
              >
                Add Department
              </Button>
            </Box>
            <List>
              {departments.map((dept) => (
                <ListItem key={dept._id}>
                  <ListItemText
                    primary={dept.name}
                    secondary={`Code: ${dept.code}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => {
                        setSelectedDept(dept);
                        setDeptFormData({
                          name: dept.name,
                          code: dept.code,
                          description: dept.description || ''
                        });
                        setOpenDeptDialog(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteDepartment(dept._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Sections */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Sections</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedSection(null);
                  setSectionFormData({ names: [], department: '', year: 1, semester: 1 });
                  setOpenSectionDialog(true);
                }}
              >
                Add Section
              </Button>
            </Box>

            {/* Filters */}
            <Stack direction="row" spacing={2} mb={2}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Department</InputLabel>
                <Select
                  value={filterDepartment || ''}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  label="Filter by Department"
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept._id} value={dept.name}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Filter by Year</InputLabel>
                <Select
                  value={filterYear || ''}
                  onChange={(e) => setFilterYear(e.target.value)}
                  label="Filter by Year"
                >
                  <MenuItem value="">All Years</MenuItem>
                  {[1, 2, 3, 4].map((year) => (
                    <MenuItem key={year} value={year}>
                      Year {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Filter by Semester</InputLabel>
                <Select
                  value={filterSemester || ''}
                  onChange={(e) => setFilterSemester(e.target.value)}
                  label="Filter by Semester"
                >
                  <MenuItem value="">All Semesters</MenuItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <MenuItem key={sem} value={sem}>
                      Semester {sem}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* Sections Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Department</strong></TableCell>
                    <TableCell><strong>Year</strong></TableCell>
                    <TableCell><strong>Semester</strong></TableCell>
                    <TableCell><strong>Sections</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sections
                    .filter(section => 
                      (!filterDepartment || section.department === filterDepartment) &&
                      (!filterYear || section.year === Number(filterYear)) &&
                      (!filterSemester || section.semester === Number(filterSemester))
                    )
                    .map((groupedSection) => (
                      <TableRow key={`${groupedSection.department}-${groupedSection.year}-${groupedSection.semester}`}>
                        <TableCell>{groupedSection.department}</TableCell>
                        <TableCell>Year {groupedSection.year}</TableCell>
                        <TableCell>Semester {groupedSection.semester}</TableCell>
                        <TableCell>
                          {groupedSection.sections.map(sectionName => (
                            <Chip
                              key={groupedSection.sectionIds[sectionName]}
                              label={sectionName}
                              onDelete={() => handleDeleteSection(groupedSection.sectionIds[sectionName])}
                              onClick={() => {
                                setSelectedSection({
                                  _id: groupedSection.sectionIds[sectionName],
                                  name: sectionName,
                                  department: groupedSection.department,
                                  year: groupedSection.year,
                                  semester: groupedSection.semester
                                });
                                setSectionFormData({
                                  names: [sectionName],
                                  department: groupedSection.department,
                                  year: groupedSection.year,
                                  semester: groupedSection.semester
                                });
                                setOpenSectionDialog(true);
                              }}
                              sx={{ m: 0.5 }}
                              variant="outlined"
                            />
                          ))}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              setSelectedSection(null);
                              setSectionFormData({
                                names: [],
                                department: groupedSection.department,
                                year: groupedSection.year,
                                semester: groupedSection.semester
                              });
                              setOpenSectionDialog(true);
                            }}
                          >
                            Add Section
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Department Dialog */}
      <Dialog open={openDeptDialog} onClose={() => setOpenDeptDialog(false)}>
        <DialogTitle>
          {selectedDept ? 'Edit Department' : 'Add Department'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Department Name"
            fullWidth
            value={deptFormData.name}
            onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Department Code"
            fullWidth
            value={deptFormData.code}
            onChange={(e) => setDeptFormData({ ...deptFormData, code: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={deptFormData.description}
            onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeptDialog(false)}>Cancel</Button>
          <Button onClick={handleDeptSubmit} variant="contained">
            {selectedDept ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Section Dialog */}
      <Dialog
        open={openSectionDialog}
        onClose={() => {
          setOpenSectionDialog(false);
          setUploadMode(false);
          setExcelFile(null);
          setUploadError('');
          setUploadSuccess('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedSection ? 'Edit Section' : 'Add Sections'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={uploadMode ? 1 : 0}
              onChange={(e, newValue) => {
                setUploadMode(newValue === 1);
                setUploadError('');
                setUploadSuccess('');
              }}
            >
              <Tab label="Manual Entry" />
              <Tab label="Excel Upload" />
            </Tabs>
          </Box>

          {uploadMode ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Excel Upload Instructions
              </Typography>

              <Typography variant="body2" color="textSecondary" paragraph>
                Please follow these guidelines to prepare your Excel file:
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Column Name</strong></TableCell>
                      <TableCell><strong>Description</strong></TableCell>
                      <TableCell><strong>Example</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Department</TableCell>
                      <TableCell>Full department name as configured in the system</TableCell>
                      <TableCell>Computer Science and Engineering</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Year</TableCell>
                      <TableCell>Study year (1-4)</TableCell>
                      <TableCell>1</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Semester</TableCell>
                      <TableCell>Semester number (1-8)</TableCell>
                      <TableCell>1</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Sections</TableCell>
                      <TableCell>Comma-separated list of section names</TableCell>
                      <TableCell>A,B,C</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle2" gutterBottom>
                Example Excel Format:
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Department</TableCell>
                      <TableCell>Year</TableCell>
                      <TableCell>Semester</TableCell>
                      <TableCell>Sections</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Computer Science and Engineering</TableCell>
                      <TableCell>1</TableCell>
                      <TableCell>1</TableCell>
                      <TableCell>A,B,C</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Computer Science and Engineering</TableCell>
                      <TableCell>1</TableCell>
                      <TableCell>2</TableCell>
                      <TableCell>A,B,C</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Important Notes:</strong>
                </Typography>
                <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                  <li>Department names must match exactly with the departments configured in the system</li>
                  <li>Year must be between 1 and 4</li>
                  <li>Semester must be between 1 and 8</li>
                  <li>Multiple sections should be comma-separated (e.g., A,B,C)</li>
                  <li>The Excel file must include all the columns shown above</li>
                </Box>
              </Alert>

              <Box sx={{ mb: 2 }}>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={downloadTemplate}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Download Template
                </Button>
                <Typography variant="caption" color="textSecondary">
                  Download and use this template for correct formatting
                </Typography>
              </Box>

              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="excel-upload"
              />
              <label htmlFor="excel-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<UploadIcon />}
                  fullWidth
                >
                  Choose Excel File
                </Button>
              </label>

              {excelFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected file: {excelFile.name}
                </Typography>
              )}

              {uploadError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {uploadError}
                </Alert>
              )}

              {uploadSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {uploadSuccess}
                </Alert>
              )}
            </Box>
          ) : (
            <>
              <TextField
                select
                margin="dense"
                label="Department"
                fullWidth
                value={sectionFormData.department}
                onChange={(e) => setSectionFormData({
                  ...sectionFormData,
                  department: e.target.value,
                  year: '',
                  semester: '',
                  names: []
                })}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept._id} value={dept.name}>
                    {dept.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                margin="dense"
                label="Year"
                fullWidth
                value={sectionFormData.year}
                onChange={(e) => setSectionFormData({
                  ...sectionFormData,
                  year: Number(e.target.value),
                  semester: '',
                  names: []
                })}
                disabled={!sectionFormData.department}
              >
                {[1, 2, 3, 4].map((year) => (
                  <MenuItem key={year} value={year}>
                    Year {year}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                margin="dense"
                label="Semester"
                fullWidth
                value={sectionFormData.semester}
                onChange={(e) => setSectionFormData({
                  ...sectionFormData,
                  semester: Number(e.target.value),
                  names: []
                })}
                disabled={!sectionFormData.year}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <MenuItem key={sem} value={sem}>
                    Semester {sem}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                margin="dense"
                label="Section Names (comma-separated)"
                fullWidth
                value={sectionInput}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSectionInput(newValue);
                  
                  // Convert input to sections array
                  if (newValue.trim()) {
                    const sections = newValue
                      .split(',')
                      .map(s => s.trim())
                      .filter(s => s.length > 0)
                      .map(s => s.toUpperCase());
                    
                    setSectionFormData({
                      ...sectionFormData,
                      names: sections
                    });
                  } else {
                    setSectionFormData({
                      ...sectionFormData,
                      names: []
                    });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && sectionInput.trim()) {
                    e.preventDefault();
                    const newValue = sectionInput + ', ';
                    setSectionInput(newValue);
                  }
                }}
                helperText={`Current sections: ${sectionFormData.names.join(', ') || 'None'}`}
                disabled={!sectionFormData.semester}
                placeholder="Type section names (e.g., A, B, C)"
              />
              
              {sectionFormData.names.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {sectionFormData.names.map((section, index) => (
                    <Chip
                      key={index}
                      label={section}
                      onDelete={() => {
                        const newSections = sectionFormData.names.filter((_, i) => i !== index);
                        setSectionFormData({
                          ...sectionFormData,
                          names: newSections
                        });
                        setSectionInput(newSections.join(', '));
                      }}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenSectionDialog(false);
            setUploadMode(false);
            setExcelFile(null);
            setUploadError('');
            setUploadSuccess('');
          }}>
            Cancel
          </Button>
          {uploadMode ? (
            <Button
              onClick={handleExcelUpload}
              variant="contained"
              disabled={!excelFile}
            >
              Upload
            </Button>
          ) : (
            <Button
              onClick={handleSectionSubmit}
              variant="contained"
              disabled={!sectionFormData.department ||
                !sectionFormData.year ||
                !sectionFormData.semester ||
                !sectionFormData.names.length}
            >
              {selectedSection ? 'Update' : 'Add'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ ...errorDialog, open: false })}
      >
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Typography>{errorDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialog({ ...errorDialog, open: false })} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              confirmDialog.onConfirm?.();
              setConfirmDialog({ ...confirmDialog, open: false });
            }}
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

export default CollegeSettings; 