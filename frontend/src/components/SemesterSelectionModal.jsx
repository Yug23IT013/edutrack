import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SemesterSelectionModal = ({ isOpen, onSemesterSelected, onClose }) => {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSemesters();
    }
  }, [isOpen]);

  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/semesters');
      setSemesters(response.data);
      
      // Auto-select first semester if available
      if (response.data.length > 0) {
        setSelectedSemester(response.data[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch semesters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSemester) {
      alert('Please select a semester');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.put('/api/users/semester', {
        semesterId: selectedSemester
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const semester = semesters.find(s => s._id === selectedSemester);
      onSemesterSelected(semester, response.data.user);
    } catch (error) {
      console.error('Failed to update semester:', error);
      alert('Failed to update semester. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={(e) => e.stopPropagation()}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Select Your Current Semester</h2>
          <p style={styles.subtitle}>
            Please choose the semester you are currently enrolled in. This will help us show you the relevant courses and assignments.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {loading ? (
            <div style={styles.loading}>Loading semesters...</div>
          ) : (
            <div style={styles.semesterGrid}>
              {semesters.map(semester => (
                <label
                  key={semester._id}
                  style={{
                    ...styles.semesterOption,
                    backgroundColor: selectedSemester === semester._id ? '#e3f2fd' : '#fff',
                    borderColor: selectedSemester === semester._id ? '#2196f3' : '#ddd'
                  }}
                >
                  <input
                    type="radio"
                    name="semester"
                    value={semester._id}
                    checked={selectedSemester === semester._id}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    style={styles.radioInput}
                  />
                  <div style={styles.semesterInfo}>
                    <div style={styles.semesterNumber}>Semester {semester.number}</div>
                    <div style={styles.semesterName}>{semester.name}</div>
                    <div style={styles.semesterYear}>{semester.academicYear}</div>
                    {semester.isCurrent && (
                      <div style={styles.currentBadge}>Current Semester</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          <div style={styles.actions}>
            <button
              type="submit"
              disabled={!selectedSemester || submitting || loading}
              style={{
                ...styles.submitButton,
                opacity: (!selectedSemester || submitting || loading) ? 0.6 : 1,
                cursor: (!selectedSemester || submitting || loading) ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Saving...' : 'Confirm Selection'}
            </button>
          </div>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Please select your semester to continue. This is required to access your courses and assignments.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
  },
  header: {
    padding: '30px 30px 20px',
    borderBottom: '1px solid #eee',
    textAlign: 'center'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px'
  },
  subtitle: {
    margin: 0,
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.5'
  },
  form: {
    padding: '20px 30px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px'
  },
  semesterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  semesterOption: {
    display: 'block',
    border: '2px solid #ddd',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    position: 'relative'
  },
  radioInput: {
    position: 'absolute',
    opacity: 0,
    cursor: 'pointer'
  },
  semesterInfo: {
    pointerEvents: 'none'
  },
  semesterNumber: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px'
  },
  semesterName: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '5px'
  },
  semesterYear: {
    fontSize: '13px',
    color: '#888'
  },
  currentBadge: {
    backgroundColor: '#4caf50',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    marginTop: '8px',
    display: 'inline-block'
  },
  actions: {
    textAlign: 'center'
  },
  submitButton: {
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease'
  },
  footer: {
    padding: '15px 30px 30px',
    textAlign: 'center',
    borderTop: '1px solid #eee'
  },
  footerText: {
    margin: 0,
    fontSize: '14px',
    color: '#888'
  }
};

export default SemesterSelectionModal;