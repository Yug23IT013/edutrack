import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSemester } from '../context/SemesterContext';
import { useNotifications } from '../context/NotificationContext';
import AnnouncementCard from './AnnouncementCard';
import LoadingSpinner from './LoadingSpinner';
import './AnnouncementList.css';

const AnnouncementList = ({ showFilters = true, limit = 10 }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    priority: '',
    type: '',
    showExpired: false
  });
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { user } = useAuth();
  const { selectedSemester } = useSemester();
  const { markAsRead: markAsReadGlobal, refreshNotifications } = useNotifications();

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      let url = '/api/announcements';
      const params = new URLSearchParams();
      
      if (selectedSemester) {
        params.append('semester', selectedSemester._id);
      }
      if (filters.priority) {
        params.append('priority', filters.priority);
      }
      if (filters.type) {
        params.append('type', filters.type);
      }
      if (limit) {
        params.append('limit', limit.toString());
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }

      const data = await response.json();
      
      // Debug log to check read status from backend
      if (user?.role === 'student') {
        console.log('Fetched announcements with read status:', data.map(ann => ({
          id: ann._id,
          title: ann.title.substring(0, 20) + '...',
          isReadByUser: ann.isReadByUser
        })));
      }
      
      // Filter out expired announcements if not showing them
      let filteredData = data;
      if (!filters.showExpired) {
        filteredData = data.filter(announcement => {
          return !announcement.expiryDate || new Date(announcement.expiryDate) > new Date();
        });
      }
      
      setAnnouncements(filteredData);
      
      // Count unread announcements for students
      if (user?.role === 'student') {
        const unread = filteredData.filter(ann => !ann.isReadByUser).length;
        setUnreadCount(unread);
      }
      
    } catch (err) {
      console.error('Fetch announcements error:', err);
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count for students
  const fetchUnreadCount = async () => {
    if (user?.role !== 'student') return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/announcements/unread', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const unreadAnnouncements = await response.json();
        setUnreadCount(unreadAnnouncements.length);
      }
    } catch (err) {
      console.error('Fetch unread count error:', err);
    }
  };

  // Mark announcement as read
  const markAnnouncementAsRead = async (announcementId) => {
    try {
      console.log('AnnouncementList: Marking announcement as read:', announcementId);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/announcements/${announcementId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Mark as read response status:', response.status);

      if (response.ok) {
        // Update local state
        setAnnouncements(prev => 
          prev.map(ann => 
            ann._id === announcementId 
              ? { ...ann, isReadByUser: true }
              : ann
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Sync with global notification state and refresh local announcements
        if (user?.role === 'student') {
          refreshNotifications();
          // Force refresh announcements to get updated read status
          setTimeout(() => {
            fetchAnnouncements();
          }, 100); // Small delay to ensure backend is updated
        }
        
        console.log('Successfully marked as read and updated state');
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to mark as read');
      }
    } catch (err) {
      console.error('Mark as read error:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
      fetchUnreadCount();
    }
  }, [user, selectedSemester, filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      priority: '',
      type: '',
      showExpired: false
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="announcement-list-container">
      {/* Header */}
      <div className="announcement-header">
        <div className="header-title">
          <h2>📢 Announcements</h2>
          {user?.role === 'student' && unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} unread</span>
          )}
        </div>
        
        {selectedSemester && (
          <div className="current-semester">
            Semester {selectedSemester.number} - {selectedSemester.name}
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="announcement-filters">
          <div className="filter-group">
            <label>Priority:</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Type:</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="general">General</option>
              <option value="academic">Academic</option>
              <option value="event">Event</option>
              <option value="exam">Exam</option>
              <option value="assignment">Assignment</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.showExpired}
                onChange={(e) => handleFilterChange('showExpired', e.target.checked)}
              />
              Show Expired
            </label>
          </div>

          {(filters.priority || filters.type || filters.showExpired) && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Announcements */}
      <div className="announcements-grid">
        {announcements.length === 0 ? (
          <div className="no-announcements">
            {selectedSemester ? (
              <div>
                <p>📭 No announcements found for Semester {selectedSemester.number}</p>
                <p>Check back later for updates!</p>
              </div>
            ) : (
              <div>
                <p>📭 No announcements available</p>
                <p>Select a semester to view announcements</p>
              </div>
            )}
          </div>
        ) : (
          announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement._id}
              announcement={announcement}
              onMarkAsRead={markAnnouncementAsRead}
              isStudent={user?.role === 'student'}
            />
          ))
        )}
      </div>

      {/* Load More Button (for future implementation) */}
      {announcements.length >= limit && (
        <div className="load-more-container">
          <button className="load-more-btn" onClick={fetchAnnouncements}>
            Load More Announcements
          </button>
        </div>
      )}
    </div>
  );
};

export default AnnouncementList;