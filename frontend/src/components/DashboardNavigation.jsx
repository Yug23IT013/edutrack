import React from 'react';
import { useAuth } from '../context/AuthContext';

const DashboardNavigation = ({ onNavigate, currentView }) => {
  const { user } = useAuth();

  const getNavigationItems = () => {
    const baseItems = [
      { 
        id: 'overview', 
        label: 'Dashboard Overview', 
        description: 'Main dashboard with quick stats',
        icon: '📊'
      }
    ];

    if (user?.role === 'student') {
      return [
        ...baseItems,
        { 
          id: 'announcements', 
          label: 'Announcements', 
          description: 'View semester announcements',
          icon: '📢'
        },
        { 
          id: 'assignments', 
          label: 'Assignments', 
          description: 'View and submit assignments',
          icon: '📝'
        },
        { 
          id: 'grades', 
          label: 'My Grades', 
          description: 'Check assignment grades',
          icon: '🎯'
        },
        { 
          id: 'timetable', 
          label: 'My Timetable', 
          description: 'View class schedule',
          icon: '📅'
        },
        { 
          id: 'materials', 
          label: 'Course Materials', 
          description: 'View and download course materials',
          icon: '📚'
        }
      ];
    } else if (user?.role === 'teacher') {
      return [
        ...baseItems,
        { 
          id: 'announcements', 
          label: 'Announcements', 
          description: 'View and manage announcements',
          icon: '📢'
        },
        { 
          id: 'courses', 
          label: 'My Courses', 
          description: 'Manage teaching courses',
          icon: '🏫'
        },
        { 
          id: 'assignments', 
          label: 'Assignments', 
          description: 'Create and grade assignments',
          icon: '�'
        },
        { 
          id: 'students', 
          label: 'Students', 
          description: 'View course students',
          icon: '👥'
        },
        { 
          id: 'timetable', 
          label: 'My Schedule', 
          description: 'View teaching schedule',
          icon: '📅'
        },
        { 
          id: 'materials', 
          label: 'Materials Management', 
          description: 'Upload and manage course materials',
          icon: '📚'
        }
      ];
    } else if (user?.role === 'admin') {
      return [
        ...baseItems,
        { 
          id: 'announcements', 
          label: 'Announcement Management', 
          description: 'Manage all announcements',
          icon: '📢'
        },
        { 
          id: 'users', 
          label: 'User Management', 
          description: 'Manage all users',
          icon: '👤'
        },
        { 
          id: 'courses', 
          label: 'Course Management', 
          description: 'Manage all courses',
          icon: '📖'
        },
        { 
          id: 'timetable', 
          label: 'View Timetable', 
          description: 'View all timetables',
          icon: '📅'
        },
        { 
          id: 'timetable-manage', 
          label: 'Manage Timetable', 
          description: 'Create and edit timetables',
          icon: '🗓️'
        }
      ];
    }
    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Navigation</h2>
        <p>Choose a section to explore</p>
      </div>
      <div style={styles.cardGrid}>
        {navigationItems.map((item) => (
          <div 
            key={item.id} 
            style={{
              ...styles.card,
              ...(currentView === item.id ? styles.activeCard : {})
            }}
            onClick={() => onNavigate(item.id)}
          >
            <div style={styles.cardIcon}>{item.icon}</div>
            <h3 style={styles.cardTitle}>{item.label}</h3>
            <p style={styles.cardDescription}>{item.description}</p>
          </div>
        ))}
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
    textAlign: 'center',
    marginBottom: '30px',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '16px'
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  card: {
    padding: '24px',
    textAlign: 'center',
    backgroundColor: '#fff',
    border: '2px solid #e1e5e9',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  activeCard: {
    borderColor: '#667eea',
    backgroundColor: '#f8f9ff',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
  },
  cardIcon: {
    fontSize: '40px',
    marginBottom: '12px',
    display: 'block'
  },
  cardTitle: {
    margin: '0 0 8px 0',
    color: '#333',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  cardDescription: {
    margin: 0,
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.4'
  }
};

export default DashboardNavigation;
