import React from 'react';
import { useSemester } from '../context/SemesterContext';

const SemesterSelector = ({ onSemesterChange, showLabel = true, disabled = false }) => {
  const { semesters, selectedSemester, selectSemester, loading, isStudentLocked } = useSemester();

  const handleSemesterChange = (e) => {
    const semesterId = e.target.value;
    const semester = semesters.find(s => s._id === semesterId);
    selectSemester(semester);
    if (onSemesterChange) {
      onSemesterChange(semester);
    }
  };

  if (loading) {
    return <div>Loading semesters...</div>;
  }

  return (
    <div style={styles.container}>
      {showLabel && <label style={styles.label}>
        {isStudentLocked ? 'Your Semester:' : 'Select Semester:'}
      </label>}
      <select
        value={selectedSemester?._id || ''}
        onChange={handleSemesterChange}
        style={{
          ...styles.select,
          backgroundColor: isStudentLocked ? '#f5f5f5' : '#fff',
          cursor: isStudentLocked ? 'not-allowed' : 'pointer'
        }}
        disabled={disabled || isStudentLocked}
        title={isStudentLocked ? 'Students cannot change semester. Contact admin if needed.' : ''}
      >
        <option value="">Select Semester</option>
        {semesters.map(semester => (
          <option key={semester._id} value={semester._id}>
            Semester {semester.number} - {semester.name} ({semester.academicYear})
            {semester.isCurrent ? ' [Current]' : ''}
          </option>
        ))}
      </select>
      {isStudentLocked && (
        <span style={styles.lockedIcon} title="Semester locked for students">🔒</span>
      )}
    </div>
  );
};

const styles = {
  container: {
    margin: '10px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  label: {
    fontWeight: 'bold',
    minWidth: '120px'
  },
  select: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minWidth: '250px'
  },
  lockedIcon: {
    fontSize: '16px',
    cursor: 'help'
  }
};

export default SemesterSelector;
