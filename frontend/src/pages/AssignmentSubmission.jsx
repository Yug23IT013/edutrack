import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AssignmentSubmission = ({ assignmentId, onBack, onSubmitSuccess }) => {
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchAssignmentDetails();
  }, [assignmentId]);

  const fetchAssignmentDetails = async () => {
    try {
      // Since we don't have a specific assignment endpoint, we'll get it from course assignments
      const response = await axios.get(`/api/assignments/single/${assignmentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAssignment(response.data);
    } catch (error) {
      setError('Failed to load assignment details');
      console.error('Failed to fetch assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file) => {
    const errors = {};
    
    if (!file) {
      errors.file = 'Please select a file to submit';
      return errors;
    }
    
    // File size validation (25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      errors.file = 'File size cannot exceed 25MB';
    }
    
    // File type validation
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.zip', '.jpg', '.png'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      errors.file = 'Invalid file type. Allowed: PDF, DOC, DOCX, TXT, ZIP, JPG, PNG';
    }
    
    // File name validation
    if (file.name.length > 100) {
      errors.file = 'File name is too long (max 100 characters)';
    }
    
    return errors;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const errors = validateFile(file);
    
    setValidationErrors(errors);
    setSelectedFile(file);
    
    if (Object.keys(errors).length === 0) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate file
    const fileErrors = validateFile(selectedFile);
    setValidationErrors(fileErrors);
    
    if (Object.keys(fileErrors).length > 0) {
      setError('Please fix the file validation errors before submitting');
      return;
    }
    
    // Check if assignment deadline has passed
    if (assignment && new Date() > new Date(assignment.dueDate)) {
      setError('Assignment deadline has passed. Late submissions may not be accepted.');
      // Still allow submission but show warning
    }

    setSubmitting(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('assignmentId', assignmentId);

    try {
      await axios.post('/api/assignments/submit', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      alert('Assignment submitted successfully!');
      setSelectedFile(null);
      setValidationErrors({});
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      onSubmitSuccess && onSubmitSuccess();
    } catch (error) {
      if (error.response?.status === 413) {
        setError('File size too large. Please choose a smaller file.');
      } else if (error.response?.status === 409) {
        setError('You have already submitted this assignment. Contact your teacher to resubmit.');
      } else {
        setError(error.response?.data?.message || 'Failed to submit assignment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading assignment details...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Assignment not found</div>
        <button onClick={onBack} style={styles.backButton}>← Back</button>
      </div>
    );
  }

  const isOverdue = new Date() > new Date(assignment.dueDate);
  const existingSubmission = assignment.submissions?.find(s => {
    const sid = typeof s.student === 'object' ? (s.student?._id || s.student?.id) : s.student;
    return sid === (user?.id || user?._id);
  });

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backButton}>
        ← Back to Assignments
      </button>

      <div style={styles.assignmentCard}>
        <div style={styles.assignmentHeader}>
          <h2 style={styles.title}>{assignment.title}</h2>
          <div style={{
            ...styles.statusBadge,
            backgroundColor: existingSubmission?.grade !== undefined ? '#4caf50' : // green for graded
                           existingSubmission ? '#2196f3' : // blue for submitted
                           isOverdue ? '#f44336' : // red for overdue
                           '#ff9800' // orange for pending
          }}>
            {existingSubmission?.grade !== undefined ? 'Graded' : 
             existingSubmission ? 'Submitted' : 
             isOverdue ? 'Overdue' : 'Pending'}
          </div>
        </div>

        <div style={styles.assignmentDetails}>
          <p><strong>Description:</strong></p>
          <p style={styles.description}>{assignment.description}</p>
          
          <div style={styles.detailsGrid}>
            <div>
              <strong>Due Date:</strong>
              <p>{new Date(assignment.dueDate).toLocaleString()}</p>
            </div>
            <div>
              <strong>Max Points:</strong>
              <p>{assignment.maxPoints}</p>
            </div>
          </div>
        </div>

        {existingSubmission ? (
          <div style={styles.submissionInfo}>
            <h3>Your Submission</h3>
            <p><strong>Submitted:</strong> {new Date(existingSubmission.submittedAt).toLocaleString()}</p>
            <div style={styles.fileInfo}>
              <strong>Submitted File:</strong>
              <div style={styles.fileDownload}>
                <span>{existingSubmission.originalFileName || existingSubmission.submissionFile}</span>
                <a 
                  href={`http://localhost:5000/api/assignments/download/${existingSubmission.submissionFile}`}
                  download
                  style={styles.downloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📁 Download
                </a>
              </div>
            </div>
            {existingSubmission.grade !== undefined ? (
              <div style={{...styles.gradeInfo, backgroundColor: '#e8f5e8', border: '1px solid #4caf50'}}>
                <h3 style={{color: '#2e7d32', margin: '0 0 12px 0'}}>Assignment Graded</h3>
                <p style={{fontSize: '18px', color: '#1b5e20'}}>
                  <strong>Grade:</strong> {existingSubmission.grade}/{assignment.maxPoints} 
                  ({((existingSubmission.grade / assignment.maxPoints) * 100).toFixed(1)}%)
                </p>
                {existingSubmission.feedback && (
                  <div>
                    <strong>Feedback:</strong>
                    <p style={styles.feedback}>{existingSubmission.feedback}</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{...styles.submissionPending, backgroundColor: '#f3f8ff', border: '1px solid #2196f3', padding: '16px', borderRadius: '8px', marginTop: '16px'}}>
                <p style={{margin: '0', color: '#0d47a1'}}>
                  Your submission is currently being reviewed. Check back later for your grade.
                </p>
              </div>
            )}
          </div>
        ) : isOverdue ? (
          <div style={{...styles.overdueWarning, padding: '24px', textAlign: 'center', border: '1px solid #f44336'}}>
            <h4 style={{color: '#c62828', margin: '0 0 12px 0'}}>⚠️ Assignment Overdue</h4>
            <p style={{margin: '0', color: '#d32f2f', fontSize: '16px'}}>
              The deadline for this assignment has passed on {new Date(assignment.dueDate).toLocaleString()}.
              <br />Contact your teacher if you need an extension.
            </p>
          </div>
        ) : (
          <div style={styles.submissionForm}>
            <h3>Submit Assignment</h3>
            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={styles.fileInputContainer}>
                <label htmlFor="file" style={styles.fileLabel}>
                  Choose File to Submit:
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  style={styles.fileInput}
                  accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.png"
                />
                {selectedFile && (
                  <div style={styles.selectedFile}>
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>

              <div style={styles.submitContainer}>
                <button
                  type="submit"
                  disabled={submitting || !selectedFile}
                  style={{
                    ...styles.submitButton,
                    opacity: submitting || !selectedFile ? 0.6 : 1
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxWidth: '800px',
    margin: '0 auto'
  },
  backButton: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  assignmentCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '24px'
  },
  assignmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '16px'
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '24px'
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white'
  },
  assignmentDetails: {
    marginBottom: '24px'
  },
  description: {
    backgroundColor: '#f9f9f9',
    padding: '12px',
    borderRadius: '6px',
    lineHeight: '1.6',
    margin: '8px 0 16px 0'
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginTop: '16px'
  },
  submissionInfo: {
    backgroundColor: '#f0f8ff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #b3d9ff'
  },
  gradeInfo: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#e8f5e8',
    borderRadius: '6px'
  },
  feedback: {
    backgroundColor: 'white',
    padding: '8px',
    borderRadius: '4px',
    margin: '8px 0',
    fontStyle: 'italic'
  },
  submissionForm: {
    border: '2px dashed #ddd',
    padding: '24px',
    borderRadius: '8px',
    textAlign: 'center'
  },
  overdueWarning: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    border: '1px solid #ffeaa7'
  },
  fileInputContainer: {
    marginBottom: '20px'
  },
  fileLabel: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    textAlign: 'left'
  },
  fileInput: {
    width: '100%',
    padding: '12px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px'
  },
  selectedFile: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#e8f5e8',
    borderRadius: '4px',
    fontSize: '14px',
    textAlign: 'left'
  },
  submitContainer: {
    textAlign: 'center'
  },
  submitButton: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px 32px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#666'
  },
  errorText: {
    color: '#f44336',
    fontSize: '12px',
    marginTop: '4px',
    textAlign: 'left'
  },
  helpText: {
    color: '#666',
    fontSize: '12px',
    marginTop: '4px',
    textAlign: 'left'
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    textAlign: 'center'
  },
  fileInfo: {
    marginBottom: '16px'
  },
  fileDownload: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px',
    backgroundColor: '#f0f8ff',
    borderRadius: '4px',
    marginTop: '8px'
  },
  downloadLink: {
    backgroundColor: '#667eea',
    color: 'white',
    textDecoration: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold'
  }
};

export default AssignmentSubmission;
