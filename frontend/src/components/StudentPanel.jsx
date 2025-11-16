import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSemester } from '../context/SemesterContext';
import AssignmentSubmission from '../pages/AssignmentSubmission';
import SemesterSelector from './SemesterSelector';

const StudentPanel = () => {
  const { user } = useAuth();
  const { selectedSemester } = useSemester();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showSubmissionPage, setShowSubmissionPage] = useState(false);

  useEffect(() => {
    if (selectedSemester) {
      fetchCoursesBySemester();
      fetchAssignmentsBySemester();
    }
  }, [selectedSemester]);

  useEffect(() => {
    if (selectedCourse) {
      fetchAssignments();
    }
  }, [selectedCourse]);

  const fetchCoursesBySemester = async () => {
    if (!selectedSemester) return;
    
    try {
      const response = await axios.get(`/api/courses/semester/${selectedSemester.number}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCourses(response.data);
      
      // Auto-select first course if available
      if (response.data.length > 0) {
        setSelectedCourse(response.data[0]._id);
      } else {
        setSelectedCourse('');
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

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

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/assignments/${selectedCourse}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAssignments(response.data);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatus = (assignment) => {
    const submission = assignment.submissions?.find(s => {
      const sid = typeof s.student === 'object' ? (s.student?._id || s.student?.id) : s.student;
      return sid === (user?.id || user?._id);
    });
    if (!submission) return { status: 'pending', color: '#ff9800' };
    if (submission.grade !== undefined) return { status: 'graded', color: '#4caf50' };
    return { status: 'submitted', color: '#2196f3' };
  };

  const handleAssignmentClick = (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionPage(true);
  };

  const handleBackToAssignments = () => {
    setShowSubmissionPage(false);
    setSelectedAssignment(null);
    if (selectedSemester) {
      fetchAssignmentsBySemester();
    }
  };

  if (showSubmissionPage && selectedAssignment) {
    return (
      <AssignmentSubmission
        assignmentId={selectedAssignment._id}
        onBack={handleBackToAssignments}
        onSubmitSuccess={handleBackToAssignments}
      />
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Student Dashboard</h2>
        {/* Show semester info but don't allow students to change it */}
        {selectedSemester && (
          <div style={styles.semesterDisplay}>
            <span style={styles.semesterLabel}>Your Semester:</span>
            <span style={styles.semesterValue}>
              Semester {selectedSemester.number} - {selectedSemester.name}
            </span>
          </div>
        )}
      </div>
      
      {selectedSemester && (
        <div style={styles.semesterInfo}>
          <h3>Semester {selectedSemester.number} - {selectedSemester.name}</h3>
          <p>Academic Year: {selectedSemester.academicYear}</p>
          {selectedSemester.isCurrent && (
            <span style={styles.currentBadge}>Current Semester</span>
          )}
        </div>
      )}

      {!selectedSemester && !loading && (
        <div style={styles.noSemester}>
          <h3>No Semester Selected</h3>
          <p>Please wait while we set up your semester, or contact your administrator if this persists.</p>
        </div>
      )}

      {selectedSemester && courses.length > 1 && (
        <div style={styles.courseSelector}>
          <label>Filter by Course: </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            style={styles.select}
          >
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.name} ({course.code})
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>Loading assignments...</div>
      ) : (
        <div style={styles.assignmentsContainer}>
          <h3>Assignments</h3>
          {assignments.length > 0 ? (
            <div style={styles.assignmentsList}>
              {assignments
                .filter(assignment => !selectedCourse || assignment.course._id === selectedCourse)
                .map(assignment => {
                  const status = getSubmissionStatus(assignment);
                  return (
                    <div 
                      key={assignment._id} 
                      style={{...styles.assignmentCard, borderLeft: `4px solid ${status.color}`}}
                      onClick={() => handleAssignmentClick(assignment)}
                    >
                      <div style={styles.assignmentHeader}>
                        <div>
                          <h4 style={styles.assignmentTitle}>{assignment.title}</h4>
                          <p style={styles.courseInfo}>
                            {assignment.course.name} ({assignment.course.code})
                          </p>
                        </div>
                        <div style={styles.assignmentMeta}>
                          <span style={{...styles.statusBadge, backgroundColor: status.color}}>
                            {status.status}
                          </span>
                          <p style={styles.dueDate}>
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p style={styles.assignmentDescription}>{assignment.description}</p>
                      <div style={styles.assignmentFooter}>
                        <span>Max Points: {assignment.maxPoints}</span>
                        {assignment.submissions?.find(s => {
                          const sid = typeof s.student === 'object' ? (s.student?._id || s.student?.id) : s.student;
                          return sid === (user?.id || user?._id);
                        })?.grade !== undefined && (
                          <span style={styles.grade}>
                            Grade: {assignment.submissions.find(s => {
                              const sid = typeof s.student === 'object' ? (s.student?._id || s.student?.id) : s.student;
                              return sid === (user?.id || user?._id);
                            })?.grade}/{assignment.maxPoints}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
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
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  semesterDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f0f8ff',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid #2196f3'
  },
  semesterLabel: {
    fontSize: '14px',
    color: '#666',
    fontWeight: 'normal'
  },
  semesterValue: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2196f3'
  },
  semesterInfo: {
    backgroundColor: '#f5f5f5',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    position: 'relative'
  },
  currentBadge: {
    backgroundColor: '#4caf50',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    position: 'absolute',
    top: '15px',
    right: '15px'
  },
  noSemester: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  courseSelector: {
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  select: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#666'
  },
  assignmentsContainer: {
    marginTop: '20px'
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
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  assignmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px'
  },
  assignmentTitle: {
    margin: '0 0 5px 0',
    color: '#333',
    fontSize: '18px'
  },
  courseInfo: {
    margin: 0,
    color: '#666',
    fontSize: '14px'
  },
  assignmentMeta: {
    textAlign: 'right'
  },
  statusBadge: {
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-block',
    marginBottom: '5px'
  },
  dueDate: {
    margin: 0,
    fontSize: '14px',
    color: '#666'
  },
  assignmentDescription: {
    margin: '10px 0',
    color: '#555',
    lineHeight: '1.5'
  },
  assignmentFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '15px',
    fontSize: '14px',
    color: '#666'
  },
  grade: {
    fontWeight: 'bold',
    color: '#4caf50'
  },
  noAssignments: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    padding: '40px 0'
  }
};

export default StudentPanel;
