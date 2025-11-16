import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch unread announcements
  const fetchNotifications = async () => {
    if (user?.role !== 'student') {
      console.log('Not a student, skipping notification fetch');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, skipping notification fetch');
        return;
      }
      
      console.log('Fetching unread notifications...');
      const response = await axios.get('/api/announcements/unread', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const unreadAnnouncements = response.data || [];
      console.log('Fetched notifications:', unreadAnnouncements.length);
      
      setNotifications(unreadAnnouncements);
      setUnreadCount(unreadAnnouncements.length);
    } catch (error) {
      console.error('Error fetching notifications:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (announcementId) => {
    if (user?.role !== 'student') {
      throw new Error('Only students can mark announcements as read');
    }
    
    try {
      console.log('NotificationContext: Marking as read', announcementId);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.post(`/api/announcements/${announcementId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Mark as read response:', response.status);
      
      // Update local state
      setNotifications(prev => prev.filter(notif => notif._id !== announcementId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error.response?.data || error.message);
      throw error;
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const promises = notifications.map(notif => 
        axios.post(`/api/announcements/${notif._id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      await Promise.all(promises);
      setNotifications([]);
      setUnreadCount(0);
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  // Initial fetch and periodic updates
  useEffect(() => {
    if (user?.role === 'student') {
      fetchNotifications();
      
      // Set up polling for real-time updates every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      
      return () => clearInterval(interval);
    } else {
      // Clear notifications for non-students
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // Refresh notifications (can be called from components)
  const refreshNotifications = () => {
    fetchNotifications();
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};