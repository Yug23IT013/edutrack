import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TimetableManager = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    day: '',
    startTime: '',
    endTime: '',
    courseId: '',
    teacherId: '',
    room: '',
    type: 'lecture'
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const types = ['lecture', 'lab', 'tutorial', 'exam'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [timetableRes, coursesRes] = await Promise.all([
        axios.get('/api/timetable', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('/api/timetable/courses', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      setTimetable(timetableRes.data);
      setCourses(coursesRes.data);

      // Only admins can see all teachers
      if (user?.role === 'admin') {
        const teachersRes = await axios.get('/api/timetable/teachers', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setTeachers(teachersRes.data);
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to fetch data');
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Required field validations
    if (!formData.day) {
      errors.day = 'Please select a day';
    }
    
    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }
    
    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    }
    
    if (!formData.courseId) {
      errors.courseId = 'Please select a course';
    }
    
    if (!formData.room.trim()) {
      errors.room = 'Room number is required';
    } else if (formData.room.length > 20) {
      errors.room = 'Room number cannot exceed 20 characters';
    }
    
    if (user?.role === 'admin' && !formData.teacherId) {
      errors.teacherId = 'Please select a teacher';
    }
    
    // Time validation
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      
      if (start >= end) {
        errors.endTime = 'End time must be after start time';
      }
      
      const diffMinutes = (end - start) / (1000 * 60);
      if (diffMinutes < 30) {
        errors.endTime = 'Class must be at least 30 minutes long';
      }
      
      if (diffMinutes > 480) { // 8 hours
        errors.endTime = 'Class cannot exceed 8 hours';
      }
    }
    
    // Business hours validation (6 AM to 10 PM)
    if (formData.startTime) {
      const startHour = parseInt(formData.startTime.split(':')[0]);
      if (startHour < 6 || startHour > 22) {
        errors.startTime = 'Classes must be scheduled between 6:00 AM and 10:00 PM';
      }
    }
    
    if (formData.endTime) {
      const endHour = parseInt(formData.endTime.split(':')[0]);
      if (endHour < 6 || (endHour > 22 || (endHour === 22 && formData.endTime.split(':')[1] !== '00'))) {
        errors.endTime = 'Classes must end by 10:00 PM';
      }
    }
    
    return errors;
  };

  const resetForm = () => {
    setFormData({
      day: '',
      startTime: '',
      endTime: '',
      courseId: '',
      teacherId: user?.role === 'teacher' ? user.id : '',
      room: '',
      type: 'lecture'
    });
    setValidationErrors({});
    setEditingEntry(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setError('Please fix the validation errors before submitting');
      return;
    }
    
    try {
      const payload = {
        ...formData,
        teacherId: formData.teacherId || user.id,
        room: formData.room.trim().toUpperCase() // Standardize room format
      };

      if (editingEntry) {
        await axios.put(`/api/timetable/${editingEntry._id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post('/api/timetable', payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }

      await fetchData();
      resetForm();
      setError(null);
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Time conflict: Another class is already scheduled at this time');
      } else {
        setError(err.response?.data?.message || 'Failed to save timetable entry');
      }
    }
  };

  const handleEdit = (entry) => {
    setFormData({
      day: entry.day,
      startTime: entry.startTime,
      endTime: entry.endTime,
      courseId: entry.course._id,
      teacherId: entry.teacher._id,
      room: entry.room,
      type: entry.type
    });
    setEditingEntry(entry);
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this timetable entry?')) {
      try {
        await axios.delete(`/api/timetable/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        await fetchData();
      } catch (err) {
        setError('Failed to delete timetable entry');
      }
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'lecture': return '#4CAF50';
      case 'lab': return '#2196F3';
      case 'tutorial': return '#FF9800';
      case 'exam': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Timetable Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          style={styles.createButton}
        >
          Add New Entry
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showCreateForm && (
        <div style={styles.formContainer}>
          <h3>{editingEntry ? 'Edit Timetable Entry' : 'Create New Timetable Entry'}</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formRow}>
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                required
                style={styles.input}
              >
                <option value="">Select Day</option>
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>

              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
                style={styles.input}
                placeholder="Start Time"
              />

              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
                style={styles.input}
                placeholder="End Time"
              />
            </div>

            <div style={styles.formRow}>
              <select
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                required
                style={styles.input}
              >
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.name} ({course.code})
                  </option>
                ))}
              </select>

              {user?.role === 'admin' && (
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  required
                  style={styles.input}
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              )}

              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                required
                style={styles.input}
                placeholder="Room Number"
              />

              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={styles.input}
              >
                {types.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formActions}>
              <button type="button" onClick={resetForm} style={styles.cancelButton}>
                Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                {editingEntry ? 'Update' : 'Create'} Entry
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.timetableList}>
        <h3>Current Timetable Entries</h3>
        {timetable.length === 0 ? (
          <p style={styles.noData}>No timetable entries found.</p>
        ) : (
          <div style={styles.entriesGrid}>
            {timetable.map((entry) => (
              <div key={entry._id} style={styles.entryCard}>
                <div style={styles.entryHeader}>
                  <span style={styles.day}>{entry.day}</span>
                  <span style={{
                    ...styles.type,
                    backgroundColor: getTypeColor(entry.type)
                  }}>
                    {entry.type}
                  </span>
                </div>
                
                <div style={styles.timeInfo}>
                  {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                </div>
                
                <div style={styles.courseInfo}>
                  <div style={styles.courseName}>
                    {entry.course?.name || 'Unknown Course'}
                  </div>
                  <div style={styles.courseCode}>
                    {entry.course?.code}
                  </div>
                </div>
                
                <div style={styles.entryDetails}>
                  <div>Teacher: {entry.teacher?.name || 'TBD'}</div>
                  <div>Room: {entry.room}</div>
                </div>
                
                <div style={styles.entryActions}>
                  <button
                    onClick={() => handleEdit(entry)}
                    style={styles.editButton}
                  >
                    Edit
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleDelete(entry._id)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
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
  createButton: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#f44336',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px'
  },
  formContainer: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  input: {
    flex: 1,
    minWidth: '150px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
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
  noData: {
    textAlign: 'center',
    color: '#666',
    padding: '40px'
  },
  entriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px'
  },
  entryCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#fafafa'
  },
  entryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  day: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  type: {
    fontSize: '10px',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '12px',
    textTransform: 'uppercase',
    fontWeight: 'bold'
  },
  timeInfo: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px'
  },
  courseInfo: {
    marginBottom: '8px'
  },
  courseName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  courseCode: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase'
  },
  entryDetails: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '12px'
  },
  entryActions: {
    display: 'flex',
    gap: '8px'
  },
  editButton: {
    backgroundColor: '#ff9800',
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
  }
};

export default TimetableManager;
