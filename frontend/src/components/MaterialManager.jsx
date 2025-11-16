import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import './MaterialManager.css';

const MaterialManager = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    courseId: '',
    tags: '',
    file: null
  });

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) {
      fetchTeacherMaterials();
      fetchTeacherCourses();
    }
  }, [user?._id, user?.id]);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseMaterials();
    } else if (selectedCourse === '' && user?._id) {
      // When "All My Materials" is selected, fetch all teacher materials
      fetchTeacherMaterials();
    }
  }, [selectedCourse]);

  // Validate selectedCourse when courses are updated
  useEffect(() => {
    if (courses.length > 0 && selectedCourse) {
      const courseExists = courses.find(course => course._id === selectedCourse);
      if (!courseExists) {
        console.log('Selected course not found in courses array, resetting to first course');
        setSelectedCourse(courses[0]._id);
      }
    }
  }, [courses, selectedCourse]);

  const fetchTeacherCourses = async () => {
    const userId = user?._id || user?.id;
    if (!userId) {
      console.error('User not available for fetching courses');
      return;
    }
    
    try {
      // Always fetch from teacher courses API to get complete course objects
      const response = await axios.get('/api/courses/teacher', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Fetched teacher courses:', response.data);
      setCourses(response.data);
      if (response.data.length > 0) {
        setSelectedCourse(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Fallback: try to get courses from materials data
      if (materials.length > 0) {
        const uniqueCourses = materials.reduce((acc, material) => {
          if (material.course && !acc.find(c => c._id === material.course._id)) {
            acc.push(material.course);
          }
          return acc;
        }, []);
        setCourses(uniqueCourses);
      }
    }
  };

  const fetchTeacherMaterials = async () => {
    const userId = user?._id || user?.id;
    if (!userId) {
      console.error('User ID not available');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching materials for teacher:', userId);
      const response = await axios.get(`/api/materials/teacher/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Teacher materials response:', response.data);
      const materials = response.data.materials || [];
      console.log('Setting materials:', materials);
      setMaterials(materials);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseMaterials = async () => {
    if (!selectedCourse) return;
    
    setLoading(true);
    try {
      console.log('Fetching materials for course:', selectedCourse);
      const response = await axios.get(`/api/materials/course/${selectedCourse}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Course materials response:', response.data);
      const materials = response.data.materials || [];
      console.log('Setting course materials:', materials);
      setMaterials(materials);
    } catch (error) {
      console.error('Error fetching course materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateUploadForm = () => {
    const errors = {};
    
    // File validation
    if (!uploadForm.file) {
      errors.file = 'Please select a file to upload';
    } else {
      const file = uploadForm.file;
      
      // File size validation (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        errors.file = 'File size cannot exceed 50MB';
      }
      
      // File type validation
      const allowedTypes = [
        '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
        '.txt', '.zip', '.rar', '.jpg', '.jpeg', '.png', '.gif',
        '.mp4', '.mp3', '.avi'
      ];
      
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        errors.file = 'File type not allowed. Please upload a valid file format.';
      }
    }
    
    // Course validation
    if (!uploadForm.courseId) {
      errors.courseId = 'Please select a course';
    }
    
    // Title validation (optional but if provided, must meet criteria)
    if (uploadForm.title && uploadForm.title.length > 100) {
      errors.title = 'Title cannot exceed 100 characters';
    }
    
    // Description validation (optional but if provided, must meet criteria)
    if (uploadForm.description && uploadForm.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }
    
    // Tags validation
    if (uploadForm.tags) {
      const tags = uploadForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      if (tags.length > 10) {
        errors.tags = 'Maximum 10 tags allowed';
      }
      
      for (let tag of tags) {
        if (tag.length > 30) {
          errors.tags = 'Each tag must be 30 characters or less';
          break;
        }
      }
    }
    
    return errors;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    // Clear previous file errors
    const newErrors = { ...validationErrors };
    delete newErrors.file;
    setValidationErrors(newErrors);
    
    setUploadForm(prev => ({
      ...prev,
      file,
      title: prev.title || (file ? file.name.split('.').slice(0, -1).join('.') : '')
    }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateUploadForm();
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }

    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('title', uploadForm.title || uploadForm.file.name);
    formData.append('description', uploadForm.description);
    formData.append('course', uploadForm.courseId);
    formData.append('tags', uploadForm.tags);

    console.log('Upload form data:', {
      title: uploadForm.title,
      description: uploadForm.description,
      course: uploadForm.courseId,
      tags: uploadForm.tags,
      fileName: uploadForm.file?.name
    });

    try {
      await axios.post('/api/materials/upload', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Reset form
      setUploadForm({
        title: '',
        description: '',
        courseId: '',
        tags: '',
        file: null
      });
      setValidationErrors({});
      
      // Reset file input
      const fileInput = document.getElementById('fileInput');
      if (fileInput) fileInput.value = '';
      
      setShowUploadForm(false);
      
      // Refresh materials
      if (selectedCourse) {
        fetchCourseMaterials();
      } else {
        fetchTeacherMaterials();
      }
      
      alert('Material uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      if (error.response?.status === 413) {
        setValidationErrors({ file: 'File size too large. Please choose a smaller file.' });
      } else {
        alert(error.response?.data?.error || 'Error uploading material');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial({
      ...material,
      tags: material.tags.join(', ')
    });
  };

  const handleUpdateMaterial = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`/api/materials/${editingMaterial._id}`, {
        title: editingMaterial.title,
        description: editingMaterial.description,
        tags: editingMaterial.tags
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setEditingMaterial(null);
      
      // Refresh materials
      if (selectedCourse) {
        fetchCourseMaterials();
      } else {
        fetchTeacherMaterials();
      }
      
      alert('Material updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      alert(error.response?.data?.error || 'Error updating material');
    }
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      await axios.delete(`/api/materials/${materialId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Refresh materials
      if (selectedCourse) {
        fetchCourseMaterials();
      } else {
        fetchTeacherMaterials();
      }
      
      alert('Material deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.response?.data?.error || 'Error deleting material');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="material-manager">
      <div className="material-manager-header">
        <h2>Material Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowUploadForm(true)}
        >
          Upload Material
        </button>
      </div>

      {/* Course Filter */}
      <div className="course-filter">
        <label>Filter by Course:</label>
        <select 
          value={selectedCourse} 
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">All My Materials</option>
          {courses.map(course => (
            <option key={course._id || course} value={course._id || course}>
              {course.name || 'Unnamed Course'} ({course.code || 'No Code'})
            </option>
          ))}
        </select>
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Upload Material</h3>
              <button 
                className="close-btn"
                onClick={() => setShowUploadForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Course *</label>
                <select 
                  value={uploadForm.courseId}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, courseId: e.target.value }))}
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course._id || course} value={course._id || course}>
                      {course.name || 'Unnamed Course'} ({course.code || 'No Code'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>File *</label>
                <input
                  id="fileInput"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.avi"
                  required
                />
              </div>

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Material title (optional)"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the material"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Tags</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Tags separated by commas (e.g., lecture, notes, assignment)"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowUploadForm(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="btn btn-primary"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingMaterial && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Material</h3>
              <button 
                className="close-btn"
                onClick={() => setEditingMaterial(null)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateMaterial}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editingMaterial.title}
                  onChange={(e) => setEditingMaterial(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingMaterial.description}
                  onChange={(e) => setEditingMaterial(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Tags</label>
                <input
                  type="text"
                  value={editingMaterial.tags}
                  onChange={(e) => setEditingMaterial(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Tags separated by commas"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setEditingMaterial(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Materials List */}
      <div className="materials-list">
        {console.log('Rendering materials, count:', materials.length, 'materials:', materials)}
        {materials.length === 0 ? (
          <div className="no-materials">
            <p>No materials found. Upload your first material to get started!</p>
          </div>
        ) : (
          materials.map(material => (
            <div key={material._id} className="material-card">
              <div className="material-info">
                <h4>{material.title}</h4>
                <p className="material-description">{material.description}</p>
                <div className="material-meta">
                  <span className="course-info">
                    {material.course.name} ({material.course.code})
                  </span>
                  <span className="file-info">
                    {material.originalName} • {formatFileSize(material.fileSize)}
                  </span>
                  <span className="upload-date">
                    Uploaded: {formatDate(material.uploadDate)}
                  </span>
                  <span className="download-count">
                    Downloads: {material.downloadCount}
                  </span>
                </div>
                {material.tags.length > 0 && (
                  <div className="material-tags">
                    {material.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="material-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleEdit(material)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDelete(material._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MaterialManager;