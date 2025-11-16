import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const GradeManagement = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [gradeValue, setGradeValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'byStudent', 'byAssignment'
  const [search, setSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // default selected course for teachers with multiple courses
    if (user?.role === 'teacher' && user?.teachingCourses?.length) {
      const first = user.teachingCourses[0];
      setSelectedCourseId(first._id || first);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Teachers get only their assignments; students get their own; admin gets all active
      const assignmentsRes = await axios.get('/api/assignments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setAssignments(assignmentsRes.data || []);

      // Build student list from submissions across assignments to ensure relevance
      const studentMap = new Map();
      (assignmentsRes.data || []).forEach(a => {
        (a.submissions || []).forEach(s => {
          const stu = s.student;
          const id = typeof stu === 'object' ? (stu?._id || stu?.id) : stu;
          const name = typeof stu === 'object' ? (stu?.name || '-') : `Student ${String(stu).slice(-4)}`;
          const email = typeof stu === 'object' ? (stu?.email || '') : '';
          if (id && !studentMap.has(id)) studentMap.set(id, { _id: id, name, email });
        });
      });
      setStudents(Array.from(studentMap.values()));
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch data. Please ensure you have permission and try again.');
      setLoading(false);
    }
  };

  const assignmentsByCourse = useMemo(() => {
    if (!selectedCourseId) return assignments;
    return assignments.filter(a => (a.course?._id || a.course) === selectedCourseId);
  }, [assignments, selectedCourseId]);

  // Build grade rows from assignment submissions
  const allGrades = useMemo(() => {
    const rows = [];
    assignmentsByCourse.forEach((a) => {
      (a.submissions || []).forEach((s) => {
        rows.push({
          _id: `${a._id}-${(typeof s.student === 'object' ? (s.student?._id || s.student?.id) : s.student)}`,
          assignment: a,
          student: s.student, // may be object or id
          grade: s.grade,
        });
      });
    });
    return rows;
  }, [assignmentsByCourse]);

  const normalizedStudentId = (stu) => (typeof stu === 'object' ? (stu?._id || stu?.id) : stu);

  const filteredGrades = useMemo(() => {
    let rows = allGrades;
    if (viewMode === 'byStudent' && selectedStudent) {
      rows = rows.filter(r => normalizedStudentId(r.student) === selectedStudent);
    }
    if (viewMode === 'byAssignment' && selectedAssignment) {
      rows = rows.filter(r => r.assignment._id === selectedAssignment);
    }
    return rows;
  }, [allGrades, viewMode, selectedStudent, selectedAssignment]);

  const validateGradeForm = () => {
    const errors = {};
    
    if (!selectedAssignment) {
      errors.assignment = 'Please select an assignment';
    }
    
    if (!selectedStudent) {
      errors.student = 'Please select a student';
    }
    
    if (!gradeValue && gradeValue !== 0) {
      errors.grade = 'Please enter a grade';
    } else {
      const grade = parseFloat(gradeValue);
      if (isNaN(grade)) {
        errors.grade = 'Grade must be a valid number';
      } else if (grade < 0) {
        errors.grade = 'Grade cannot be negative';
      } else if (grade > 100) {
        errors.grade = 'Grade cannot exceed 100 points';
      }
      
      // Check assignment-specific max points if available
      const assignment = assignments.find(a => a._id === selectedAssignment);
      if (assignment && grade > (assignment.maxPoints || 100)) {
        errors.grade = `Grade cannot exceed ${assignment.maxPoints || 100} points for this assignment`;
      }
    }
    
    return errors;
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateGradeForm();
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setError('Please fix the validation errors before submitting');
      return;
    }
    
    try {
      await axios.put(`/api/assignments/${selectedAssignment}/grade`, {
        studentId: selectedStudent,
        grade: parseFloat(gradeValue),
        feedback: ''
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      await fetchData();
      setSelectedAssignment('');
      // keep selectedStudent for continued grading workflow
      setGradeValue('');
      setValidationErrors({});
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Assignment or student not found');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to grade this assignment');
      } else {
        setError('Failed to submit grade');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading grades...</div>;
  }

  const visibleStudents = students.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));

  // Build course options for teachers
  const teacherCourses = (user?.role === 'teacher' ? (user?.teachingCourses || []) : []);

  // Build assignments options filtered by course
  const assignmentOptions = assignmentsByCourse;

  // Student detail grades when a student is selected
  const selectedStudentRows = filteredGrades.filter(r => normalizedStudentId(r.student) === selectedStudent);

  return (
    <div className="grade-management" style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={styles.title}>Grade Management</h2>
        {teacherCourses.length > 1 && (
          <div>
            <label style={{ marginRight: 8 }}>Subject:</label>
            <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} style={styles.select}>
              {teacherCourses.map(c => (
                <option key={c._id || c} value={c._id || c}>{c.name || `Course ${c}`}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      {error && <div className="error" style={styles.error}>{error}</div>}

      <div style={styles.layout}>
        {/* Sidebar: Students */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h3 style={{ margin: 0 }}>Students</h3>
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.search}
            />
          </div>
          <div style={styles.studentList}>
            {visibleStudents.map((s) => {
              const isActive = selectedStudent === s._id && viewMode === 'byStudent';
              return (
                <div
                  key={s._id}
                  style={{ ...styles.studentItem, ...(isActive ? styles.studentItemActive : {}) }}
                  onClick={() => { setSelectedStudent(s._id); setViewMode('byStudent'); }}
                >
                  <div style={styles.avatar}>{s.name?.charAt(0)?.toUpperCase()}</div>
                  <div>
                    <div style={styles.studentName}>{s.name}</div>
                    <div style={styles.studentEmail}>{s.email}</div>
                  </div>
                </div>
              );
            })}
            {visibleStudents.length === 0 && <div style={styles.empty}>No students</div>}
          </div>
        </aside>

        {/* Main Content */}
        <section style={styles.main}>
          {/* Grade Entry */}
          <div style={styles.card}>
            <h3>Add/Update Grade</h3>
            <form onSubmit={handleSubmitGrade} style={styles.formRow}>
              <select value={selectedAssignment} onChange={(e) => setSelectedAssignment(e.target.value)} style={styles.select} required>
                <option value="">Select Assignment</option>
                {assignmentOptions.map(a => (
                  <option key={a._id} value={a._id}>{a.title}</option>
                ))}
              </select>

              <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} style={styles.select} required>
                <option value="">Select Student</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>

              <input type="number" placeholder="Grade" value={gradeValue} onChange={(e) => setGradeValue(e.target.value)} min="0" max="100" style={styles.input} required />

              <button type="submit" style={styles.primaryBtn}>Submit Grade</button>
            </form>
          </div>

          {/* Filters */}
          <div style={styles.filters}>
            <label><input type="radio" value="all" checked={viewMode === 'all'} onChange={(e) => setViewMode(e.target.value)} /> All Grades</label>
            <label><input type="radio" value="byStudent" checked={viewMode === 'byStudent'} onChange={(e) => setViewMode(e.target.value)} /> By Student</label>
            <label><input type="radio" value="byAssignment" checked={viewMode === 'byAssignment'} onChange={(e) => setViewMode(e.target.value)} /> By Assignment</label>
            {viewMode === 'byAssignment' && (
              <select value={selectedAssignment} onChange={(e) => setSelectedAssignment(e.target.value)} style={{ ...styles.select, marginLeft: 8 }}>
                <option value="">Select Assignment</option>
                {assignmentOptions.map(a => (
                  <option key={a._id} value={a._id}>{a.title}</option>
                ))}
              </select>
            )}
          </div>

          {/* Grades Table or Student Detail */}
          <div style={styles.card}>
            {viewMode === 'byStudent' && selectedStudent ? (
              <div>
                <h3 style={{ marginTop: 0 }}>Grades for Student</h3>
                {selectedStudentRows.length === 0 ? (
                  <p>No grades for this student in the selected subject.</p>
                ) : (
                  <table style={styles.table}>
                    <thead style={styles.thead}>
                      <tr>
                        <th style={styles.th}>Assignment</th>
                        <th style={styles.th}>Grade</th>
                        <th style={styles.th}>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudentRows.map((row, idx) => (
                        <tr key={row._id} style={idx % 2 ? styles.trAlt : undefined}>
                          <td style={styles.td}>{row.assignment.title}</td>
                          <td style={styles.td}><span style={styles.gradeBadge}>{row.grade !== undefined ? row.grade : '-'}</span> <span style={styles.maxPoints}>/ {row.assignment.maxPoints ?? 100}</span></td>
                          <td style={styles.td}>{new Date(row.assignment.dueDate).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div>
                <h3 style={{ marginTop: 0 }}>Grades</h3>
                {filteredGrades.length === 0 ? (
                  <p>No grades found.</p>
                ) : (
                  <table style={styles.table}>
                    <thead style={styles.thead}>
                      <tr>
                        <th style={styles.th}>Student</th>
                        <th style={styles.th}>Assignment</th>
                        <th style={styles.th}>Grade</th>
                        <th style={styles.th}>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGrades.map((row, idx) => (
                        <tr key={row._id} style={idx % 2 ? styles.trAlt : undefined}>
                          <td style={styles.td}>{(typeof row.student === 'object' ? row.student?.name : students.find(s => s._id === row.student)?.name) || '-'}</td>
                          <td style={styles.td}>{row.assignment.title}</td>
                          <td style={styles.td}><span style={styles.gradeBadge}>{row.grade !== undefined ? row.grade : '-'}</span> <span style={styles.maxPoints}>/ {row.assignment.maxPoints ?? 100}</span></td>
                          <td style={styles.td}>{new Date(row.assignment.dueDate).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const styles = {
  container: { background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  title: { marginTop: 0 },
  error: { background: '#fdecea', color: '#c62828', border: '1px solid #f5c6cb', padding: 8, borderRadius: 8, marginBottom: 12 },
  layout: { display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 },
  sidebar: { border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' },
  sidebarHeader: { padding: 12, borderBottom: '1px solid #e5e7eb', background: '#f8fafc' },
  search: { width: '100%', marginTop: 8, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 },
  studentList: { maxHeight: 480, overflowY: 'auto' },
  studentItem: { display: 'flex', gap: 10, alignItems: 'center', padding: 12, cursor: 'pointer', borderBottom: '1px solid #f1f5f9' },
  studentItemActive: { background: '#eef2ff' },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#667eea', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  studentName: { fontWeight: 600 },
  studentEmail: { fontSize: 12, color: '#6b7280' },
  empty: { padding: 12, color: '#6b7280' },
  main: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 },
  formRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  select: { padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, minWidth: 180 },
  input: { padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, width: 100 },
  primaryBtn: { background: '#667eea', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' },
  filters: { display: 'flex', alignItems: 'center', gap: 12 },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' },
  thead: { background: '#f8fafc' },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 14, color: '#374151' },
  trAlt: { background: '#fafafa' },
  td: { padding: '10px 12px' },
  gradeBadge: { display: 'inline-block', minWidth: 32, textAlign: 'center', padding: '2px 8px', borderRadius: 999, fontWeight: 700, background: '#f3f7ff' },
  maxPoints: { color: '#6b7280', marginLeft: 6 }
};

export default GradeManagement;
