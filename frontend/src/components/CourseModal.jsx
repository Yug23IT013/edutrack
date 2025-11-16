import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSemester } from '../context/SemesterContext';

const CourseModal = ({ isOpen, onClose, onSuccess, userRole, userId }) => {
  const { selectedSemester } = useSemester();
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
    }
  }, [isOpen, selectedSemester]);

  const fetchCourses = async () => {
    try {
      let url = '/api/courses';
      if (userRole === 'student' && selectedSemester) {
        // For students, only show courses from their current semester
        url = `/api/courses/semester/${selectedSemester.number}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCourses(response.data);
    } catch (error) {
      setError('Failed to load courses');
    }
  };

  const handleCourseToggle = (courseId) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedCourses.length === 0) {
      setError('Please select at least one course');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (userRole === 'student') {
        // Enroll in courses
        for (const courseId of selectedCourses) {
          await axios.put(`/api/courses/${courseId}/enroll`, {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
        }
      } else if (userRole === 'teacher') {
        // Update teaching courses
        await axios.put('/api/courses/teaching', {
          courseIds: selectedCourses
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update courses');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {userRole === 'student' ? 'Register for Courses' : 'Select Teaching Courses'}
          </h2>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.courseList}>
          {courses.map(course => (
            <div key={course._id} style={styles.courseItem}>
              <label style={styles.courseLabel}>
                <input
                  type="checkbox"
                  checked={selectedCourses.includes(course._id)}
                  onChange={() => handleCourseToggle(course._id)}
                  style={styles.checkbox}
                />
                <div>
                  <div style={styles.courseName}>{course.name}</div>
                  <div style={styles.courseCode}>{course.code}</div>
                  <div style={styles.courseDescription}>{course.description}</div>
                </div>
              </label>
            </div>
          ))}
        </div>

        <div style={styles.actions}>
          <button style={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button 
            style={styles.submitButton} 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '20px'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666'
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '15px',
    textAlign: 'center'
  },
  courseList: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '20px'
  },
  courseItem: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    marginBottom: '10px',
    padding: '15px'
  },
  courseLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    cursor: 'pointer',
    gap: '12px'
  },
  checkbox: {
    marginTop: '2px'
  },
  courseName: {
    fontWeight: 'bold',
    fontSize: '16px',
    marginBottom: '4px'
  },
  courseCode: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '4px'
  },
  courseDescription: {
    color: '#888',
    fontSize: '14px'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: '10px 20px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  submitButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#667eea',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default CourseModal;
