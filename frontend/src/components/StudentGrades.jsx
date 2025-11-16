import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentGrades = () => {
  const [grades, setGrades] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageGrade, setAverageGrade] = useState(0);

  useEffect(() => {
    fetchStudentGrades();
  }, []);

  const fetchStudentGrades = async () => {
    try {
      // Get current user info
      const userRes = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const userId = userRes.data._id;

      // Fetch assignments relevant to this student (backend filters by enrolled courses)
      const assignmentsRes = await axios.get('/api/assignments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      // Build available course filters
      const uniqueCourses = [];
      const courseMap = {};
      assignmentsRes.data.forEach((a) => {
        const c = a.course;
        if (c && !courseMap[c._id || c]) {
          courseMap[c._id || c] = c;
          uniqueCourses.push({ id: c._id || c, name: c.name || `Course ${c.code || ''}` });
        }
      });
      setCourses(uniqueCourses);

      // Build grades list from submissions
      const gradeItems = [];
      assignmentsRes.data
        .filter((a) => !selectedCourse || (a.course && (a.course._id || a.course) === selectedCourse))
        .forEach((assignment) => {
        const submission = assignment.submissions?.find((s) => {
          const sid = typeof s.student === 'object' ? (s.student?._id || s.student?.id) : s.student;
          return sid === userId;
        });
        if (submission && submission.grade !== undefined) {
          gradeItems.push({
            _id: `${assignment._id}-${submission._id || userId}`,
            assignment: assignment,
            grade: submission.grade,
          });
        }
      });

      setGrades(gradeItems);

      if (gradeItems.length > 0) {
        const total = gradeItems.reduce((sum, g) => sum + g.grade, 0);
        setAverageGrade((total / gradeItems.length).toFixed(2));
      }

      setLoading(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch grades');
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade >= 90) return '#4CAF50'; // Green
    if (grade >= 80) return '#8BC34A'; // Light green
    if (grade >= 70) return '#FFC107'; // Yellow
    if (grade >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  if (loading) {
    return <div className="loading">Loading your grades...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="student-grades" style={styles.container}>
      <div style={styles.headerRow}>
        <h2 style={{ margin: 0 }}>My Grades</h2>
        <div>
          <label style={styles.filterLabel}>Subject:</label>
          <select
            value={selectedCourse}
            onChange={async (e) => {
              setSelectedCourse(e.target.value);
              setLoading(true);
              await fetchStudentGrades();
            }}
            style={styles.select}
          >
            <option value="">All Subjects</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {grades.length === 0 ? (
        <p>No grades available yet.</p>
      ) : (
        <>
          <div className="grade-summary">
            <h3>Summary</h3>
            <p>Total Assignments: {grades.length}</p>
            <p>Average Grade: <span style={{ color: getGradeColor(averageGrade) }}>{averageGrade}</span></p>
          </div>

          <div className="grades-list" style={styles.tableWrap}>
            <h3>Assignment Grades</h3>
            <table className="grades-table" style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Assignment</th>
                  <th style={styles.th}>Grade</th>
                  <th style={styles.th}>Due Date</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade, idx) => (
                  <tr key={grade._id} style={idx % 2 ? styles.trAlt : undefined}>
                    <td style={styles.tdSubject}>{grade.assignment?.course?.name || '-'}</td>
                    <td style={styles.tdAssignment}>
                      <div>
                        <strong>{grade.assignment.title}</strong>
                        <p style={{ fontSize: '0.8em', color: '#666', margin: 0 }}>
                          {grade.assignment.description}
                        </p>
                      </div>
                    </td>
                    <td style={styles.tdGrade}>
                      <span 
                        className="grade-badge"
                        style={{ 
                          ...styles.gradeBadge,
                          backgroundColor: '#f3f7ff',
                          color: getGradeColor(grade.grade)
                        }}
                      >
                        {grade.grade}
                      </span>
                      <span style={styles.maxPoints}> / {grade.assignment.maxPoints ?? 100}</span>
                    </td>
                    <td style={styles.tdDate}>{new Date(grade.assignment.dueDate).toLocaleDateString()}</td>
                    <td style={styles.tdStatus}>
                      <span
                        style={{
                          ...styles.statusPill,
                          backgroundColor: new Date(grade.assignment.dueDate) < new Date() ? '#fde7e9' : '#e7f7ee',
                          color: new Date(grade.assignment.dueDate) < new Date() ? '#c62828' : '#2e7d32'
                        }}
                      >
                        {new Date(grade.assignment.dueDate) < new Date() ? 'Past Due' : 'On Time'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grade-breakdown">
            <h3>Grade Distribution</h3>
            <div className="grade-stats">
              <div className="stat">
                <span>A (90-100): </span>
                <span>{grades.filter(g => g.grade >= 90).length}</span>
              </div>
              <div className="stat">
                <span>B (80-89): </span>
                <span>{grades.filter(g => g.grade >= 80 && g.grade < 90).length}</span>
              </div>
              <div className="stat">
                <span>C (70-79): </span>
                <span>{grades.filter(g => g.grade >= 70 && g.grade < 80).length}</span>
              </div>
              <div className="stat">
                <span>D (60-69): </span>
                <span>{grades.filter(g => g.grade >= 60 && g.grade < 70).length}</span>
              </div>
              <div className="stat">
                <span>F (0-59): </span>
                <span>{grades.filter(g => g.grade < 60).length}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: { background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  filterLabel: { marginRight: 8, fontWeight: 'bold' },
  select: { padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6 },
  tableWrap: { marginTop: 12 },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' },
  thead: { background: '#f8fafc' },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 14, color: '#374151' },
  trAlt: { background: '#fafafa' },
  tdSubject: { padding: '10px 12px', fontWeight: 600 },
  tdAssignment: { padding: '10px 12px' },
  tdGrade: { padding: '10px 12px', whiteSpace: 'nowrap' },
  gradeBadge: { display: 'inline-block', minWidth: 36, textAlign: 'center', padding: '2px 8px', borderRadius: 999, fontWeight: 700 },
  maxPoints: { color: '#6b7280', marginLeft: 6 },
  tdDate: { padding: '10px 12px' },
  tdStatus: { padding: '10px 12px' },
  statusPill: { padding: '4px 10px', borderRadius: 999, fontWeight: 600, fontSize: 12 }
};

export default StudentGrades;
