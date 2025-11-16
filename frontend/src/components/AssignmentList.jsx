import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSemester } from '../context/SemesterContext';
import SemesterSelector from './SemesterSelector';

const AssignmentList = ({ assignments: propAssignments }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { selectedSemester } = useSemester();

  useEffect(() => {
    if (selectedSemester && !propAssignments) {
      fetchAssignmentsBySemester();
    } else if (propAssignments) {
      setAssignments(propAssignments);
    }
  }, [selectedSemester, propAssignments]);

  const fetchAssignmentsBySemester = async () => {
    if (!selectedSemester) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/assignments/semester/${selectedSemester.number}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAssignments(response.data);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const timeDiff = due.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) return '#f44336'; // overdue - red
    if (daysDiff <= 1) return '#ff9800'; // due soon - orange
    return '#4caf50'; // good time - green
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>Assignments</h3>
        {!propAssignments && <SemesterSelector showLabel={false} />}
      </div>
      
      {loading ? (
        <p>Loading assignments...</p>
      ) : assignments && assignments.length > 0 ? (
        <div style={styles.assignmentsList}>
          {assignments.map(assignment => (
            <div key={assignment._id} style={styles.assignmentCard}>
              <div style={styles.assignmentHeader}>
                <h4 style={styles.title}>{assignment.title}</h4>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(assignment.dueDate)
                }}>
                  Due: {formatDate(assignment.dueDate)}
                </span>
              </div>
              <p style={styles.description}>{assignment.description}</p>
              <div style={styles.assignmentInfo}>
                <span style={styles.courseInfo}>
                  <strong>Course:</strong> {assignment.course?.name} ({assignment.course?.code})
                </span>
                <span style={styles.pointsInfo}>
                  <strong>Max Points:</strong> {assignment.maxPoints}
                </span>
              </div>
              {assignment.semester && (
                <div style={styles.semesterInfo}>
                  <strong>Semester:</strong> {assignment.semester.number} - {assignment.semester.name}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={styles.noAssignments}>
          {selectedSemester 
            ? `No assignments available for Semester ${selectedSemester.number}` 
            : 'No assignments available'
          }
        </p>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  assignmentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  assignmentCard: {
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  assignmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px'
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '18px'
  },
  statusBadge: {
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  description: {
    margin: '10px 0',
    color: '#666',
    lineHeight: '1.5'
  },
  assignmentInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
    fontSize: '14px'
  },
  courseInfo: {
    color: '#555'
  },
  pointsInfo: {
    color: '#555'
  },
  semesterInfo: {
    marginTop: '10px',
    fontSize: '14px',
    color: '#777'
  },
  noAssignments: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    padding: '40px 0'
  }
};

export default AssignmentList;
