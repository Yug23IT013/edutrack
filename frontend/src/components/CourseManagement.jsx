import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSemester } from '../context/SemesterContext';
import SemesterSelector from './SemesterSelector';

const CourseManagement = () => {
  const { selectedSemester, semesters } = useSemester();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    credits: 3,
    department: '',
    isCore: true,
    maxEnrollment: 60,
    teacher: '',
    semester: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      fetchCoursesBySemester();
      setFormData(prev => ({ ...prev, semester: selectedSemester._id }));
    }
  }, [selectedSemester]);

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('/api/users/teachers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTeachers(response.data);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    }
  };

  const fetchCoursesBySemester = async () => {
    if (!selectedSemester) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/courses/semester/${selectedSemester.number}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    // Required field validations
    if (!formData.name.trim()) {
      errors.name = 'Course name is required';
    } else if (formData.name.length < 3) {
      errors.name = 'Course name must be at least 3 characters long';
    }
    
    if (!formData.code.trim()) {
      errors.code = 'Course code is required';
    } else if (!/^[A-Z0-9]{3,8}$/.test(formData.code.toUpperCase())) {
      errors.code = 'Course code must be 3-8 alphanumeric characters (e.g., CS101, MATH201)';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Course description is required';
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    }
    
    if (!formData.department.trim()) {
      errors.department = 'Department is required';
    }
    
    if (!formData.teacher) {
      errors.teacher = 'Please select a teacher';
    }
    
    // Numeric validations
    const credits = parseInt(formData.credits);
    if (isNaN(credits) || credits < 1 || credits > 6) {
      errors.credits = 'Credits must be between 1 and 6';
    }
    
    const maxEnrollment = parseInt(formData.maxEnrollment);
    if (isNaN(maxEnrollment) || maxEnrollment < 1) {
      errors.maxEnrollment = 'Max enrollment must be at least 1';
    } else if (maxEnrollment > 200) {
      errors.maxEnrollment = 'Max enrollment cannot exceed 200 students';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    try {
      const submitData = {
        ...formData,
        code: formData.code.toUpperCase() // Standardize course code format
      };
      
      if (editingCourse) {
        await axios.put(`/api/courses/${editingCourse._id}`, submitData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert('Course updated successfully!');
      } else {
        await axios.post('/api/courses', submitData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert('Course created successfully!');
      }
      
      resetForm();
      fetchCoursesBySemester();
    } catch (error) {
      console.error('Error saving course:', error);
      if (error.response?.status === 409) {
        setValidationErrors({ code: 'Course code already exists' });
      } else {
        alert('Failed to save course: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      description: course.description,
      credits: course.credits,
      department: course.department,
      isCore: course.isCore,
      maxEnrollment: course.maxEnrollment,
      teacher: course.teacher?._id || '',
      semester: course.semester?._id || selectedSemester?._id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await axios.delete(`/api/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert('Course deleted successfully!');
        fetchCoursesBySemester();
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Failed to delete course');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      credits: 3,
      department: '',
      isCore: true,
      maxEnrollment: 60,
      teacher: '',
      semester: selectedSemester?._id || ''
    });
    setValidationErrors({});
    setEditingCourse(null);
    setShowForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Course Management</h2>
        <div style={styles.headerActions}>
          <SemesterSelector />
          <button 
            style={styles.addButton}
            onClick={() => setShowForm(true)}
            disabled={!selectedSemester}
          >
            Add Course
          </button>
        </div>
      </div>

      {selectedSemester && (
        <div style={styles.semesterInfo}>
          <h3>Managing Courses for Semester {selectedSemester.number}</h3>
          <p>{selectedSemester.name} - {selectedSemester.academicYear}</p>
        </div>
      )}

      {showForm && (
        <div style={styles.formOverlay}>
          <form style={styles.form} onSubmit={handleSubmit}>
            <h3>{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
            
            <div style={styles.formRow}>
              <label style={styles.label}>Course Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                style={{
                  ...styles.input,
                  borderColor: validationErrors.name ? '#f44336' : '#ddd'
                }}
                required
              />
              {validationErrors.name && (
                <div style={styles.errorText}>{validationErrors.name}</div>
              )}
            </div>

            <div style={styles.formRow}>
              <label style={styles.label}>Course Code:</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                style={{
                  ...styles.input,
                  borderColor: validationErrors.code ? '#f44336' : '#ddd',
                  textTransform: 'uppercase'
                }}
                placeholder="e.g., CS101, MATH201"
                required
              />
              {validationErrors.code && (
                <div style={styles.errorText}>{validationErrors.code}</div>
              )}
            </div>

            <div style={styles.formRow}>
              <label style={styles.label}>Description:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                style={{
                  ...styles.textarea,
                  borderColor: validationErrors.description ? '#f44336' : '#ddd'
                }}
                rows="3"
                placeholder="Provide a detailed description of the course"
                required
              />
              <div style={styles.charCount}>
                {formData.description.length}/500 characters
              </div>
              {validationErrors.description && (
                <div style={styles.errorText}>{validationErrors.description}</div>
              )}
            </div>

            <div style={styles.formRow}>
              <label style={styles.label}>Credits:</label>
              <input
                type="number"
                name="credits"
                value={formData.credits}
                onChange={handleInputChange}
                style={{
                  ...styles.input,
                  borderColor: validationErrors.credits ? '#f44336' : '#ddd'
                }}
                min="1"
                max="6"
                required
              />
              <small style={styles.helpText}>Credits must be between 1 and 6</small>
              {validationErrors.credits && (
                <div style={styles.errorText}>{validationErrors.credits}</div>
              )}
            </div>

            <div style={styles.formRow}>
              <label style={styles.label}>Department:</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                style={{
                  ...styles.input,
                  borderColor: validationErrors.department ? '#f44336' : '#ddd'
                }}
                placeholder="e.g., Computer Science, Mathematics"
                required
              />
              {validationErrors.department && (
                <div style={styles.errorText}>{validationErrors.department}</div>
              )}
            </div>

            <div style={styles.formRow}>
              <label style={styles.label}>Teacher:</label>
              <select
                name="teacher"
                value={formData.teacher}
                onChange={handleInputChange}
                style={{
                  ...styles.select,
                  borderColor: validationErrors.teacher ? '#f44336' : '#ddd'
                }}
                required
              >
                <option value="">Select Teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
              {validationErrors.teacher && (
                <div style={styles.errorText}>{validationErrors.teacher}</div>
              )}
            </div>

            <div style={styles.formRow}>
              <label style={styles.label}>Max Enrollment:</label>
              <input
                type="number"
                name="maxEnrollment"
                value={formData.maxEnrollment}
                onChange={handleInputChange}
                style={{
                  ...styles.input,
                  borderColor: validationErrors.maxEnrollment ? '#f44336' : '#ddd'
                }}
                min="1"
                max="200"
                required
              />
              <small style={styles.helpText}>Maximum number of students (1-200)</small>
              {validationErrors.maxEnrollment && (
                <div style={styles.errorText}>{validationErrors.maxEnrollment}</div>
              )}
            </div>

            <div style={styles.checkboxRow}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="isCore"
                  checked={formData.isCore}
                  onChange={handleInputChange}
                />
                Core Subject
              </label>
            </div>

            <div style={styles.formActions}>
              <button type="button" onClick={resetForm} style={styles.cancelButton}>
                Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                {editingCourse ? 'Update Course' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>Loading courses...</div>
      ) : (
        <div style={styles.coursesList}>
          {courses.length > 0 ? (
            courses.map(course => (
              <div key={course._id} style={styles.courseCard}>
                <div style={styles.courseHeader}>
                  <div>
                    <h4 style={styles.courseName}>{course.name}</h4>
                    <p style={styles.courseCode}>{course.code}</p>
                  </div>
                  <div style={styles.courseActions}>
                    <button 
                      onClick={() => handleEdit(course)}
                      style={styles.editButton}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(course._id)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <p style={styles.courseDescription}>{course.description}</p>
                
                <div style={styles.courseInfo}>
                  <span><strong>Teacher:</strong> {course.teacher?.name || 'Not Assigned'}</span>
                  <span><strong>Credits:</strong> {course.credits}</span>
                  <span><strong>Department:</strong> {course.department}</span>
                  <span><strong>Type:</strong> {course.isCore ? 'Core' : 'Elective'}</span>
                  <span><strong>Max Enrollment:</strong> {course.maxEnrollment}</span>
                  <span><strong>Current Enrollment:</strong> {course.students?.length || 0}</span>
                </div>
              </div>
            ))
          ) : (
            <p style={styles.noCourses}>
              {selectedSemester 
                ? `No courses found for Semester ${selectedSemester.number}` 
                : 'Please select a semester to view courses'
              }
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  addButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  semesterInfo: {
    backgroundColor: '#f5f5f5',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  formOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  form: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    width: '500px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  formRow: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    resize: 'vertical'
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  checkboxRow: {
    marginBottom: '20px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px'
  },
  cancelButton: {
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#666'
  },
  coursesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  courseCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  courseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px'
  },
  courseName: {
    margin: '0 0 5px 0',
    color: '#333',
    fontSize: '18px'
  },
  courseCode: {
    margin: 0,
    color: '#666',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  courseActions: {
    display: 'flex',
    gap: '10px'
  },
  editButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  deleteButton: {
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  courseDescription: {
    margin: '10px 0',
    color: '#555',
    lineHeight: '1.5'
  },
  courseInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
    marginTop: '15px',
    fontSize: '14px',
    color: '#666'
  },
  noCourses: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    padding: '40px 0'
  },
  errorText: {
    color: '#f44336',
    fontSize: '12px',
    marginTop: '4px'
  },
  validationSummary: {
    backgroundColor: '#ffebee',
    border: '1px solid #f44336',
    borderRadius: '4px',
    padding: '12px',
    marginBottom: '16px',
    color: '#d32f2f'
  },
  helpText: {
    color: '#666',
    fontSize: '12px',
    display: 'block',
    marginTop: '2px'
  },
  charCount: {
    color: '#999',
    fontSize: '11px',
    textAlign: 'right',
    marginTop: '2px'
  }
};

export default CourseManagement;
