import { useState, useEffect } from 'react';
import './AnnouncementCard.css';

const AnnouncementCard = ({ announcement, onMarkAsRead, isStudent }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRead, setIsRead] = useState(announcement.isReadByUser || false);

  // Sync read status with prop changes (important for persistence)
  useEffect(() => {
    setIsRead(announcement.isReadByUser || false);
  }, [announcement.isReadByUser]);

  // Debug log to check read status
  useEffect(() => {
    console.log(`AnnouncementCard ${announcement._id}: isReadByUser=${announcement.isReadByUser}, isRead=${isRead}`);
  }, [announcement._id, announcement.isReadByUser, isRead]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffbb00';
      case 'low': return '#00aa00';
      default: return '#666666';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'academic': return '📚';
      case 'event': return '📅';
      case 'exam': return '📝';
      case 'assignment': return '📋';
      default: return '📢';
    }
  };

  const handleMarkAsRead = async () => {
    if (isStudent && !isRead && onMarkAsRead) {
      try {
        console.log('AnnouncementCard: Attempting to mark as read:', announcement._id);
        await onMarkAsRead(announcement._id);
        setIsRead(true);
        console.log('AnnouncementCard: Successfully marked as read');
      } catch (error) {
        console.error('Error marking announcement as read:', error);
      }
    }
  };

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
    if (isStudent && !isRead) {
      handleMarkAsRead();
    }
  };

  const isExpired = announcement.expiryDate && new Date(announcement.expiryDate) < new Date();

  return (
    <div 
      className={`announcement-card ${isRead ? 'read' : 'unread'} ${isExpired ? 'expired' : ''}`}
      onClick={handleCardClick}
    >
      {/* Priority Badge */}
      <div 
        className="priority-badge"
        style={{ backgroundColor: getPriorityColor(announcement.priority) }}
      >
        {announcement.priority.toUpperCase()}
      </div>

      {/* Header */}
      <div className="announcement-header">
        <div className="announcement-meta">
          <span className="type-icon">{getTypeIcon(announcement.type)}</span>
          <span className="announcement-type">{announcement.type}</span>
          {!isRead && isStudent && <span className="unread-dot">●</span>}
        </div>
        <div className="announcement-date">
          {formatDate(announcement.publishDate)}
        </div>
      </div>

      {/* Title */}
      <h3 className="announcement-title">{announcement.title}</h3>

      {/* Author and Semester */}
      <div className="announcement-info">
        <span className="author">
          By: {announcement.author?.name} ({announcement.author?.role})
        </span>
        <span className="semester">
          Semester {announcement.semester?.number} - {announcement.semester?.name}
        </span>
      </div>

      {/* Content Preview */}
      <div className="announcement-content">
        <p className={`content-text ${isExpanded ? 'expanded' : 'collapsed'}`}>
          {announcement.content}
        </p>
        {announcement.content.length > 200 && (
          <button className="expand-btn">
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        )}
      </div>

      {/* Attachments */}
      {announcement.attachments && announcement.attachments.length > 0 && (
        <div className="announcement-attachments">
          <h4>📎 Attachments:</h4>
          <ul>
            {announcement.attachments.map((attachment, index) => (
              <li key={index}>
                <a 
                  href={`/api/announcements/${announcement._id}/download/${attachment.filename}`}
                  download={attachment.originalName}
                  onClick={(e) => e.stopPropagation()}
                >
                  {attachment.originalName}
                </a>
                <span className="file-size">
                  ({(attachment.size / 1024).toFixed(1)} KB)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expiry Notice */}
      {announcement.expiryDate && (
        <div className={`expiry-notice ${isExpired ? 'expired' : ''}`}>
          {isExpired ? (
            <span>⚠️ Expired on {formatDate(announcement.expiryDate)}</span>
          ) : (
            <span>📅 Expires on {formatDate(announcement.expiryDate)}</span>
          )}
        </div>
      )}

      {/* Read Status for Students */}
      {isStudent && (
        <div className="read-status">
          {isRead ? (
            <span className="read-indicator">✓ Read</span>
          ) : (
            <button 
              className="mark-read-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsRead();
              }}
            >
              Mark as Read
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AnnouncementCard;