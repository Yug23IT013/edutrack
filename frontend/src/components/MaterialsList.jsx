import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSemester } from '../context/SemesterContext';
import LoadingSpinner from './LoadingSpinner';
import './MaterialsList.css';

const MaterialsList = () => {
  const { user } = useAuth();
  const { selectedSemester } = useSemester();
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('uploadDate');
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  // Get all unique tags from materials
  const allTags = materials.reduce((tags, material) => {
    material.tags.forEach(tag => {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    });
    return tags;
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      fetchCoursesBySemester();
      fetchMaterialsBySemester();
    }
  }, [selectedSemester]);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseMaterials();
    } else if (selectedSemester) {
      fetchMaterialsBySemester();
    }
  }, [selectedCourse]);

  const fetchCoursesBySemester = async () => {
    if (!selectedSemester) return;
    
    try {
      const response = await axios.get(`/api/courses/semester/${selectedSemester.number}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Fetched courses by semester:', response.data);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchMaterialsBySemester = async () => {
    if (!selectedSemester) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/materials/semester/${selectedSemester.number}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMaterials(response.data.materials || []);
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
      const response = await axios.get(`/api/materials/course/${selectedCourse}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMaterials(response.data.materials || []);
    } catch (error) {
      console.error('Error fetching course materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (materialId, originalName) => {
    setDownloadingIds(prev => new Set([...prev, materialId]));
    
    try {
      const response = await axios.get(`/api/materials/${materialId}/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Refresh materials to update download count
      if (selectedCourse) {
        fetchCourseMaterials();
      } else {
        fetchMaterialsBySemester();
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading file. Please try again.');
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(materialId);
        return newSet;
      });
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

  const getFileIcon = (mimeType) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📈';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('video')) return '🎥';
    if (mimeType.includes('audio')) return '🎵';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📄';
  };

  // Filter and sort materials
  const filteredMaterials = materials
    .filter(material => {
      const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           material.originalName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = !selectedTag || material.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'course':
          return (a.course?.name || 'Unknown').localeCompare(b.course?.name || 'Unknown');
        case 'uploadDate':
        default:
          return new Date(b.uploadDate) - new Date(a.uploadDate);
      }
    });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!selectedSemester) {
    return (
      <div className="materials-list">
        <div className="no-semester">
          <p>Please select a semester to view materials.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="materials-list">
      <div className="materials-header">
        <h2>Course Materials</h2>
        <p className="semester-info">
          Semester {selectedSemester.number} - {selectedSemester.name}
        </p>
      </div>

      {/* Filters and Controls */}
      <div className="materials-controls">
        <div className="filter-group">
          <label>Course:</label>
          <select 
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.name || 'Unnamed Course'} ({course.code || 'No Code'})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Tag:</label>
          <select 
            value={selectedTag} 
            onChange={(e) => setSelectedTag(e.target.value)}
          >
            <option value="">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="uploadDate">Upload Date</option>
            <option value="title">Title</option>
            <option value="course">Course</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-info">
        {filteredMaterials.length === 0 ? (
          <p>No materials found.</p>
        ) : (
          <p>
            Showing {filteredMaterials.length} of {materials.length} materials
          </p>
        )}
      </div>

      {/* Materials Grid */}
      <div className="materials-grid">
        {filteredMaterials.map(material => (
          <div key={material._id} className="material-item">
            <div className="material-header">
              <div className="file-icon">
                {getFileIcon(material.mimeType)}
              </div>
              <div className="material-title-info">
                <h4>{material.title}</h4>
                <p className="course-name">
                  {material.course?.name || 'Unknown Course'} ({material.course?.code || 'N/A'})
                </p>
              </div>
            </div>

            {material.description && (
              <p className="material-description">{material.description}</p>
            )}

            <div className="material-details">
              <div className="detail-item">
                <span className="label">File:</span>
                <span>{material.originalName}</span>
              </div>
              <div className="detail-item">
                <span className="label">Size:</span>
                <span>{formatFileSize(material.fileSize)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Uploaded:</span>
                <span>{formatDate(material.uploadDate)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Teacher:</span>
                <span>{material.teacher?.name || 'Unknown Teacher'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Downloads:</span>
                <span>{material.downloadCount}</span>
              </div>
            </div>

            {material.tags.length > 0 && (
              <div className="material-tags">
                {material.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            )}

            <div className="material-actions">
              <button 
                className="btn btn-primary download-btn"
                onClick={() => handleDownload(material._id, material.originalName)}
                disabled={downloadingIds.has(material._id)}
              >
                {downloadingIds.has(material._id) ? (
                  <>
                    <span className="spinner"></span>
                    Downloading...
                  </>
                ) : (
                  <>
                    📥 Download
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMaterials.length === 0 && materials.length > 0 && (
        <div className="no-results">
          <p>No materials match your current filters.</p>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setSearchTerm('');
              setSelectedTag('');
              setSelectedCourse('');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default MaterialsList;