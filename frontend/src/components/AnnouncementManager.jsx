import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import './AnnouncementManager.css';

const AnnouncementManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    semester: '',
    priority: 'medium',
    type: 'general',
    publishDate: '',
    expiryDate: '',
    attachments: []
  });

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch announcements');
      
      const data = await response.json();
      setAnnouncements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch semesters
  const fetchSemesters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/semesters', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSemesters(data);
      }
    } catch (err) {
      console.error('Failed to fetch semesters:', err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchSemesters();
  }, []);

  // Initialize form with default semester if available
  useEffect(() => {
    if (semesters.length > 0 && !formData.semester && !editingAnnouncement) {
      // Find current semester or use the first active semester
      const currentSemester = semesters.find(sem => sem.isCurrent) || 
                              semesters.find(sem => sem.isActive) ||
                              semesters[0];
      
      if (currentSemester) {
        setFormData(prev => ({
          ...prev,
          semester: currentSemester._id
        }));
      }
    }
  }, [semesters, editingAnnouncement]);

  const validateForm = () => {
    const errors = {};
    
    // Title validation
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      errors.title = 'Title must be at least 5 characters long';
    } else if (formData.title.length > 200) {
      errors.title = 'Title cannot exceed 200 characters';
    }
    
    // Content validation
    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    } else if (formData.content.length < 10) {
      errors.content = 'Content must be at least 10 characters long';
    } else if (formData.content.length > 2000) {
      errors.content = 'Content cannot exceed 2000 characters';
    }
    
    // Semester validation
    if (!formData.semester) {
      errors.semester = 'Please select a semester';
    }
    
    // Date validations
    if (formData.publishDate && formData.expiryDate) {
      const publishDate = new Date(formData.publishDate);
      const expiryDate = new Date(formData.expiryDate);
      
      if (expiryDate <= publishDate) {
        errors.expiryDate = 'Expiry date must be after publish date';
      }
    }
    
    if (formData.publishDate) {
      const publishDate = new Date(formData.publishDate);
      const now = new Date();
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      if (publishDate > oneYearFromNow) {
        errors.publishDate = 'Publish date cannot be more than 1 year in the future';
      }
    }
    
    // Attachment validation
    if (formData.attachments.length > 5) {
      errors.attachments = 'Maximum 5 files allowed';
    }
    
    // Individual file size validation (10MB)
    for (let file of formData.attachments) {
      if (file.size > 10 * 1024 * 1024) {
        errors.attachments = 'Each file must be smaller than 10MB';
        break;
      }
    }
    
    return errors;
  };

  const resetForm = () => {
    // Find default semester
    const defaultSemester = semesters.find(sem => sem.isCurrent) || 
                           semesters.find(sem => sem.isActive) ||
                           semesters[0];
    
    setFormData({
      title: '',
      content: '',
      semester: defaultSemester?._id || '',
      priority: 'medium',
      type: 'general',
      publishDate: '',
      expiryDate: '',
      attachments: []
    });
    setValidationErrors({});
    setEditingAnnouncement(null);
    setShowCreateForm(false);
    setError(''); // Clear any previous errors
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Clear previous attachment errors
    const newErrors = { ...validationErrors };
    delete newErrors.attachments;
    setValidationErrors(newErrors);
    
    setFormData(prev => ({
      ...prev,
      attachments: files
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    
    // Validate form
    const errors = validateForm();
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setError('Please fix the validation errors before submitting');
      // Scroll to top to show errors
      e.target.scrollTop = 0;
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Add form fields (exclude empty fields for optional ones)
      Object.keys(formData).forEach(key => {
        if (key !== 'attachments') {
          const value = formData[key];
          if (value !== '' && value !== null && value !== undefined) {
            formDataToSend.append(key, value);
          }
        }
      });
      
      // Add files
      if (formData.attachments && formData.attachments.length > 0) {
        formData.attachments.forEach(file => {
          formDataToSend.append('attachments', file);
        });
      }

      const url = editingAnnouncement 
        ? `/api/announcements/${editingAnnouncement._id}`
        : '/api/announcements';
      
      const method = editingAnnouncement ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response:', errorData);
        
        // Handle specific validation errors from server
        if (response.status === 400 && errorData.errors) {
          setValidationErrors(errorData.errors);
          setError('Please fix the validation errors');
        } else {
          throw new Error(errorData.message || `Server error: ${response.status}`);
        }
        return;
      }

      await fetchAnnouncements();
      resetForm();
      setError('');
      
    } catch (err) {
      console.error('Submission error:', err);
      setError(`Failed to save announcement: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      semester: announcement.semester._id,
      priority: announcement.priority,
      type: announcement.type,
      publishDate: announcement.publishDate ? 
        new Date(announcement.publishDate).toISOString().slice(0, 16) : '',
      expiryDate: announcement.expiryDate ? 
        new Date(announcement.expiryDate).toISOString().slice(0, 16) : '',
      attachments: []
    });
    setEditingAnnouncement(announcement);
    setShowCreateForm(true);
  };

  const handleDelete = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete announcement');
      
      await fetchAnnouncements();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && announcements.length === 0) return <LoadingSpinner />;

  return (
    <div className="announcement-manager">
      <div className="manager-header">
        <h2>📢 Announcement Management</h2>
        <button
          className="create-btn"
          onClick={() => setShowCreateForm(true)}
          disabled={loading}
        >
          + Create Announcement
        </button>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="form-overlay">
          <div className="announcement-form">
            <div className="form-header">
              <h3>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Show validation errors */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="validation-errors">
                  <h4>Please fix the following errors:</h4>
                  <ul>
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  maxLength={200}
                  className={validationErrors.title ? 'error' : ''}
                />
                {validationErrors.title && (
                  <span className="error-text">{validationErrors.title}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Semester *</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    required
                    className={validationErrors.semester ? 'error' : ''}
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(sem => (
                      <option key={sem._id} value={sem._id}>
                        Semester {sem.number} - {sem.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.semester && (
                    <span className="error-text">{validationErrors.semester}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="general">General</option>
                    <option value="academic">Academic</option>
                    <option value="event">Event</option>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Content *</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  placeholder="Enter announcement content..."
                  maxLength={2000}
                  className={validationErrors.content ? 'error' : ''}
                />
                <div className="char-count">
                  {formData.content.length}/2000 characters
                </div>
                {validationErrors.content && (
                  <span className="error-text">{validationErrors.content}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Publish Date</label>
                  <input
                    type="datetime-local"
                    name="publishDate"
                    value={formData.publishDate}
                    onChange={handleInputChange}
                    className={validationErrors.publishDate ? 'error' : ''}
                  />
                  {validationErrors.publishDate && (
                    <span className="error-text">{validationErrors.publishDate}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="datetime-local"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className={validationErrors.expiryDate ? 'error' : ''}
                  />
                  {validationErrors.expiryDate && (
                    <span className="error-text">{validationErrors.expiryDate}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Attachments</label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.ppt,.pptx,.xls,.xlsx"
                  className={validationErrors.attachments ? 'error' : ''}
                />
                <small>Max 5 files, 10MB each</small>
                {validationErrors.attachments && (
                  <span className="error-text">{validationErrors.attachments}</span>
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingAnnouncement ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="announcements-table">
        {announcements.length === 0 ? (
          <div className="no-data">
            <p>📭 No announcements found</p>
            <p>Create your first announcement to get started!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Semester</th>
                <th>Priority</th>
                <th>Type</th>
                <th>Published</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map(announcement => (
                <tr key={announcement._id}>
                  <td>
                    <div className="title-cell">
                      <strong>{announcement.title}</strong>
                      <span className="author">
                        By: {announcement.author?.name}
                      </span>
                    </div>
                  </td>
                  <td>
                    Sem {announcement.semester?.number}
                  </td>
                  <td>
                    <span className={`priority-badge ${announcement.priority}`}>
                      {announcement.priority.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className="type-badge">{announcement.type}</span>
                  </td>
                  <td>{formatDate(announcement.publishDate)}</td>
                  <td>
                    {announcement.expiryDate ? (
                      <span className={
                        new Date(announcement.expiryDate) < new Date() 
                          ? 'expired' : ''
                      }>
                        {formatDate(announcement.expiryDate)}
                      </span>
                    ) : (
                      'No expiry'
                    )}
                  </td>
                  <td className="actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(announcement)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(announcement._id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AnnouncementManager;