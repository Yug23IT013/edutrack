import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TeacherPanel = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '23:59',
    maxPoints: 100
  });

  useEffect(() => {
    if (user?.teachingCourses?.length > 0) {
      const firstCourse = user.teachingCourses[0];
      setSelectedCourse(firstCourse._id || firstCourse);
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchAssignments();
    }
  }, [selectedCourse]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/assignments/${selectedCourse}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAssignments(response.data);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateAssignmentForm = () => {
    const errors = {};
    
    // Title validation
    if (!newAssignment.title.trim()) {
      errors.title = 'Assignment title is required';
    } else if (newAssignment.title.length < 5) {
      errors.title = 'Title must be at least 5 characters long';
    } else if (newAssignment.title.length > 100) {
      errors.title = 'Title cannot exceed 100 characters';
    }
    
    // Description validation
    if (!newAssignment.description.trim()) {
      errors.description = 'Assignment description is required';
    } else if (newAssignment.description.length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    } else if (newAssignment.description.length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters';
    }
    
    // Due date validation
    if (!newAssignment.dueDate) {
      errors.dueDate = 'Due date is required';
    } else {
      const dueDateTime = new Date(`${newAssignment.dueDate}T${newAssignment.dueTime}`);
      const now = new Date();
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      if (dueDateTime <= now) {
        errors.dueDate = 'Due date must be in the future';
      }
      
      if (dueDateTime > oneYearFromNow) {
        errors.dueDate = 'Due date cannot be more than 1 year from now';
      }
    }
    
    // Due time validation
    if (!newAssignment.dueTime) {
      errors.dueTime = 'Due time is required';
    }
    
    // Max points validation
    const maxPoints = parseInt(newAssignment.maxPoints);
    if (isNaN(maxPoints) || maxPoints <= 0) {
      errors.maxPoints = 'Max points must be a positive number';
    } else if (maxPoints > 1000) {
      errors.maxPoints = 'Max points cannot exceed 1000';
    }
    
    return errors;
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateAssignmentForm();
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    try {
      await axios.post('/api/assignments', {
        ...newAssignment,
        courseId: selectedCourse
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setNewAssignment({ 
        title: '', 
        description: '', 
        dueDate: '', 
        dueTime: '23:59', 
        maxPoints: 100 
      });
      setValidationErrors({});
      setShowCreateForm(false);
      fetchAssignments();
      alert('Assignment created successfully!');
    } catch (error) {
      if (error.response?.status === 409) {
        setValidationErrors({ title: 'An assignment with this title already exists for this course' });
      } else {
        alert('Failed to create assignment');
        console.error('Create assignment error:', error);
      }
    }
  };

  const handleGradeSubmission = async (assignmentId, studentId, grade, feedback) => {
    try {
      await axios.put(`/api/assignments/${assignmentId}/grade`, {
        studentId,
        grade: parseInt(grade),
        feedback
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchAssignments();
      alert('Assignment graded successfully!');
    } catch (error) {
      alert('Failed to grade assignment');
      console.error('Grade assignment error:', error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Teacher Dashboard</h2>
        <div style={styles.headerActions}>
          {user?.teachingCourses?.length > 1 && (
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={styles.courseSelect}
            >
              {user.teachingCourses.map(course => (
                <option key={course._id || course} value={course._id || course}>
                  {course.name || `Course ${course}`}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowCreateForm(true)}
            style={styles.createButton}
          >
            Create Assignment
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div style={styles.createForm}>
          <h3>Create New Assignment</h3>
          <form onSubmit={handleCreateAssignment}>
            <input
              type="text"
              placeholder="Assignment Title"
              value={newAssignment.title}
              onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
              required
              style={{
                ...styles.input,
                borderColor: validationErrors.title ? '#f44336' : '#ddd'
              }}
            />
            {validationErrors.title && (
              <div style={styles.errorText}>{validationErrors.title}</div>
            )}
            
            <textarea
              placeholder="Assignment Description"
              value={newAssignment.description}
              onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
              required
              style={{
                ...styles.textarea,
                borderColor: validationErrors.description ? '#f44336' : '#ddd'
              }}
            />
            <div style={styles.charCount}>
              {newAssignment.description.length}/1000 characters
            </div>
            {validationErrors.description && (
              <div style={styles.errorText}>{validationErrors.description}</div>
            )}
            
            <div style={styles.formRow}>
              <div style={styles.dateTimeGroup}>
                <input
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                  required
                  style={{
                    ...styles.input,
                    borderColor: validationErrors.dueDate ? '#f44336' : '#ddd'
                  }}
                />
                {validationErrors.dueDate && (
                  <div style={styles.errorText}>{validationErrors.dueDate}</div>
                )}
              </div>
              
              <div style={styles.dateTimeGroup}>
                <input
                  type="time"
                  value={newAssignment.dueTime}
                  onChange={(e) => setNewAssignment({...newAssignment, dueTime: e.target.value})}
                  required
                  style={{
                    ...styles.input,
                    borderColor: validationErrors.dueTime ? '#f44336' : '#ddd'
                  }}
                />
                {validationErrors.dueTime && (
                  <div style={styles.errorText}>{validationErrors.dueTime}</div>
                )}
              </div>
              
              <div style={styles.dateTimeGroup}>
                <input
                  type="number"
                  placeholder="Max Points"
                  value={newAssignment.maxPoints}
                  onChange={(e) => setNewAssignment({...newAssignment, maxPoints: e.target.value})}
                  required
                  min="1"
                  max="1000"
                  style={{
                    ...styles.input,
                    borderColor: validationErrors.maxPoints ? '#f44336' : '#ddd'
                  }}
                />
                <small style={styles.helpText}>Points (1-1000)</small>
                {validationErrors.maxPoints && (
                  <div style={styles.errorText}>{validationErrors.maxPoints}</div>
                )}
              </div>
            </div>
            
            <div style={styles.formActions}>
              <button 
                type="button" 
                onClick={() => {
                  setShowCreateForm(false);
                  setValidationErrors({});
                }} 
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                Create Assignment
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>Loading assignments...</div>
      ) : (
        <div style={styles.content}>
          <h3>Course Assignments</h3>
          {assignments.length === 0 ? (
            <p style={styles.noData}>No assignments found for this course.</p>
          ) : (
            <div style={styles.assignmentList}>
              {assignments.map(assignment => (
                <AssignmentCard
                  key={assignment._id}
                  assignment={assignment}
                  onGrade={handleGradeSubmission}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AssignmentCard = ({ assignment, onGrade }) => {
  const [expandedSubmissions, setExpandedSubmissions] = useState(false);

  return (
    <div style={styles.assignmentCard}>
      <div style={styles.assignmentHeader}>
        <h4>{assignment.title}</h4>
        <div style={styles.assignmentStats}>
          <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
          <span>Max: {assignment.maxPoints} pts</span>
          <span>Submissions: {assignment.submissions?.length || 0}</span>
        </div>
      </div>
      
      <p style={styles.description}>{assignment.description}</p>
      
      <button
        onClick={() => setExpandedSubmissions(!expandedSubmissions)}
        style={styles.toggleButton}
      >
        {expandedSubmissions ? 'Hide Submissions' : 'View Submissions'}
      </button>

      {expandedSubmissions && (
        <div style={styles.submissions}>
          {assignment.submissions?.length === 0 ? (
            <p>No submissions yet.</p>
          ) : (
            assignment.submissions.map(submission => (
              <SubmissionCard
                key={submission._id}
                submission={submission}
                assignmentId={assignment._id}
                maxPoints={assignment.maxPoints}
                onGrade={onGrade}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const SubmissionCard = ({ submission, assignmentId, maxPoints, onGrade }) => {
  const [grade, setGrade] = useState(submission.grade || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [isGrading, setIsGrading] = useState(false);
  const [gradeError, setGradeError] = useState('');

  const validateGrade = (gradeValue) => {
    const numGrade = parseFloat(gradeValue);
    if (isNaN(numGrade)) {
      return 'Grade must be a number';
    }
    if (numGrade < 0) {
      return 'Grade cannot be negative';
    }
    if (numGrade > maxPoints) {
      return `Grade cannot exceed ${maxPoints} points`;
    }
    return '';
  };

  const handleGrade = () => {
    const error = validateGrade(grade);
    if (error) {
      setGradeError(error);
      return;
    }
    
    onGrade(assignmentId, submission.student._id || submission.student, grade, feedback);
    setIsGrading(false);
    setGradeError('');
  };

  const handleGradeChange = (value) => {
    setGrade(value);
    if (gradeError) {
      setGradeError(validateGrade(value));
    }
  };

  return (
    <div style={styles.submissionCard}>
      <div style={styles.submissionHeader}>
        <span>Student: {submission.student?.name || submission.student}</span>
        <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
        {submission.grade !== undefined && (
          <span style={styles.gradeDisplay}>Grade: {submission.grade}/{maxPoints}</span>
        )}
      </div>

      <div style={styles.fileInfo}>
        <strong>Submitted File:</strong>
        <div style={styles.fileDownload}>
          <span>{submission.originalFileName || submission.submissionFile}</span>
          <a 
            href={`http://localhost:5000/api/assignments/download/${submission.submissionFile}?token=${encodeURIComponent(localStorage.getItem('token') || '')}`}
            download
            style={styles.downloadLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            📁 Download
          </a>
        </div>
      </div>

      {!isGrading ? (
        <button onClick={() => setIsGrading(true)} style={styles.gradeButton}>
          {submission.grade !== undefined ? 'Update Grade' : 'Grade Submission'}
        </button>
      ) : (
        <div style={styles.gradingForm}>
          <input
            type="number"
            placeholder="Grade"
            value={grade}
            onChange={(e) => handleGradeChange(e.target.value)}
            max={maxPoints}
            min="0"
            step="0.1"
            style={{
              ...styles.gradeInput,
              borderColor: gradeError ? '#f44336' : '#ddd'
            }}
          />
          {gradeError && (
            <div style={styles.errorText}>{gradeError}</div>
          )}
          <small style={styles.helpText}>Max: {maxPoints} points</small>
          
          <textarea
            placeholder="Feedback (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            style={styles.feedbackInput}
            maxLength="500"
          />
          <div style={styles.charCount}>{feedback.length}/500 characters</div>
          
          <div style={styles.gradingActions}>
            <button 
              onClick={() => {
                setIsGrading(false);
                setGradeError('');
              }} 
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button 
              onClick={handleGrade} 
              style={styles.submitButton}
              disabled={!!gradeError}
            >
              Save Grade
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '16px'
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  courseSelect: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px'
  },
  createButton: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  createForm: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '12px',
    fontSize: '14px'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '12px',
    minHeight: '80px',
    fontSize: '14px',
    resize: 'vertical'
  },
  formRow: {
    display: 'flex',
    gap: '12px'
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  submitButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#667eea',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  content: {
    marginTop: '24px'
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    padding: '40px'
  },
  assignmentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  assignmentCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px'
  },
  assignmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  assignmentStats: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: '#666'
  },
  description: {
    color: '#666',
    marginBottom: '16px'
  },
  toggleButton: {
    backgroundColor: '#f0f0f0',
    border: '1px solid #ddd',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  submissions: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #eee'
  },
  submissionCard: {
    backgroundColor: '#f9f9f9',
    padding: '16px',
    borderRadius: '6px',
    marginBottom: '12px'
  },
  submissionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '14px'
  },
  gradeDisplay: {
    fontWeight: 'bold',
    color: '#4caf50'
  },
  gradeButton: {
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  gradingForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  gradeInput: {
    width: '100px',
    padding: '6px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  feedbackInput: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    minHeight: '60px',
    resize: 'vertical'
  },
  gradingActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end'
  },
  fileInfo: {
    marginBottom: '12px',
    padding: '8px',
    backgroundColor: '#f0f8ff',
    borderRadius: '4px'
  },
  fileDownload: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px'
  },
  downloadLink: {
    backgroundColor: '#667eea',
    color: 'white',
    textDecoration: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  errorText: {
    color: '#f44336',
    fontSize: '12px',
    marginTop: '4px'
  },
  helpText: {
    color: '#666',
    fontSize: '11px',
    display: 'block',
    marginTop: '2px'
  },
  charCount: {
    color: '#999',
    fontSize: '11px',
    textAlign: 'right',
    marginTop: '2px'
  },
  dateTimeGroup: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  }
};

export default TeacherPanel;
