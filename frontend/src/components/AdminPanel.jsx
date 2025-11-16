import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSemester } from '../context/SemesterContext';
import SemesterSelector from './SemesterSelector';
import CourseManagement from './CourseManagement';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const { selectedSemester, fetchSemesters } = useSemester();

  useEffect(() => {
    fetchUsers();
    fetchAllSemesters();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSemesters = async () => {
    try {
      const response = await axios.get('/api/semesters');
      setSemesters(response.data);
    } catch (error) {
      console.error('Failed to fetch semesters:', error);
    }
  };

  const handleSetCurrentSemester = async (semesterId) => {
    try {
      await axios.put(`/api/semesters/${semesterId}/set-current`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Current semester updated successfully!');
      fetchAllSemesters();
      fetchSemesters();
    } catch (error) {
      console.error('Failed to set current semester:', error);
      alert('Failed to update current semester');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`/api/users/${userId}/status`, {
        isActive: !currentStatus
      });
      fetchUsers();
      alert('User status updated successfully!');
    } catch (error) {
      alert('Failed to update user status');
      console.error('Update user status error:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    return user.role === filter;
  });

  const getUserStats = () => {
    const stats = {
      total: users.length,
      students: users.filter(u => u.role === 'student').length,
      teachers: users.filter(u => u.role === 'teacher').length,
      admins: users.filter(u => u.role === 'admin').length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length
    };
    return stats;
  };
  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        fetchUsers();
        alert('User deleted successfully!');
      } catch (error) {
        alert('Failed to delete user');
        console.error('Delete user error:', error);
      }
    }
  };

  const stats = getUserStats();

  const renderUserManagement = () => (
    <>
      <div style={styles.header}>
        <h2>User Management</h2>
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.total}</div>
            <div style={styles.statLabel}>Total Users</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.students}</div>
            <div style={styles.statLabel}>Students</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.teachers}</div>
            <div style={styles.statLabel}>Teachers</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.active}</div>
            <div style={styles.statLabel}>Active</div>
          </div>
        </div>
      </div>

      <div style={styles.controls}>
        <div style={styles.filters}>
          <label>Filter by role:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading users...</div>
      ) : (
        <div style={styles.userTable}>
          <div style={styles.tableHeader}>
            <div style={styles.headerCell}>Name</div>
            <div style={styles.headerCell}>Email</div>
            <div style={styles.headerCell}>Role</div>
            <div style={styles.headerCell}>Status</div>
            <div style={styles.headerCell}>Joined</div>
            <div style={styles.headerCell}>Actions</div>
          </div>
          
          {filteredUsers.length === 0 ? (
            <div style={styles.noUsers}>No users found</div>
          ) : (
            filteredUsers.map(user => (
              <div key={user._id} style={styles.tableRow}>
                <div style={styles.cell}>{user.name}</div>
                <div style={styles.cell}>{user.email}</div>
                <div style={styles.cell}>
                  <span style={{
                    ...styles.roleBadge,
                    backgroundColor: getRoleColor(user.role)
                  }}>
                    {user.role}
                  </span>
                </div>
                <div style={styles.cell}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: user.isActive ? '#4caf50' : '#f44336'
                  }}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={styles.cell}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
                <div style={styles.cell}>
                  <button
                    onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: user.isActive ? '#f44336' : '#4caf50'
                    }}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );

  const renderSemesterManagement = () => (
    <div>
      <h2>Semester Management</h2>
      <div style={styles.semesterGrid}>
        {semesters.map(semester => (
          <div 
            key={semester._id} 
            style={{
              ...styles.semesterCard,
              borderColor: semester.isCurrent ? '#4CAF50' : '#ddd'
            }}
          >
            <div style={styles.semesterHeader}>
              <h3>Semester {semester.number}</h3>
              {semester.isCurrent && (
                <span style={styles.currentBadge}>Current</span>
              )}
            </div>
            <p><strong>Name:</strong> {semester.name}</p>
            <p><strong>Academic Year:</strong> {semester.academicYear}</p>
            <p><strong>Status:</strong> {semester.isActive ? 'Active' : 'Inactive'}</p>
            
            {!semester.isCurrent && (
              <button
                onClick={() => handleSetCurrentSemester(semester._id)}
                style={styles.setCurrentButton}
              >
                Set as Current
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.tabContainer}>
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              ...styles.tab,
              backgroundColor: activeTab === 'users' ? '#4CAF50' : '#f1f1f1',
              color: activeTab === 'users' ? 'white' : 'black'
            }}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('semesters')}
            style={{
              ...styles.tab,
              backgroundColor: activeTab === 'semesters' ? '#4CAF50' : '#f1f1f1',
              color: activeTab === 'semesters' ? 'white' : 'black'
            }}
          >
            Semester Management
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            style={{
              ...styles.tab,
              backgroundColor: activeTab === 'courses' ? '#4CAF50' : '#f1f1f1',
              color: activeTab === 'courses' ? 'white' : 'black'
            }}
          >
            Course Management
          </button>
        </div>
      </div>

      <div style={styles.tabContent}>
        {activeTab === 'users' && renderUserManagement()}
        {activeTab === 'semesters' && renderSemesterManagement()}
        {activeTab === 'courses' && <CourseManagement />}
      </div>
    </div>
  );
};

const getRoleColor = (role) => {
  switch (role) {
    case 'admin': return '#ff9800';
    case 'teacher': return '#2196f3';
    case 'student': return '#4caf50';
    default: return '#666';
  }
};

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  tabContainer: {
    marginBottom: '20px'
  },
  tabs: {
    display: 'flex',
    borderBottom: '2px solid #eee'
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    borderRadius: '8px 8px 0 0',
    marginRight: '4px'
  },
  tabContent: {
    padding: '20px 0'
  },
  header: {
    marginBottom: '24px',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '16px'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginTop: '16px'
  },
  statCard: {
    backgroundColor: '#f9f9f9',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#666'
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px'
  },
  filters: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  refreshButton: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  userTable: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 100px 100px 120px 120px',
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  headerCell: {
    padding: '12px',
    borderRight: '1px solid #ddd'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 100px 100px 120px 120px',
    borderBottom: '1px solid #eee',
    transition: 'background-color 0.2s'
  },
  cell: {
    padding: '12px',
    borderRight: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px'
  },
  roleBadge: {
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    textTransform: 'capitalize',
    fontWeight: 'bold'
  },
  statusBadge: {
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  actionButton: {
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  noUsers: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  semesterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  semesterCard: {
    border: '2px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  semesterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  currentBadge: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  setCurrentButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '15px'
  }
};

export default AdminPanel;
