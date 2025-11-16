import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSemester } from '../context/SemesterContext';

const Timetable = () => {
  const { user } = useAuth();
  const { selectedSemester } = useSemester();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (selectedSemester) {
      fetchTimetableForDate(selectedDate);
    }
  }, [selectedDate, selectedSemester]);

  const fetchTimetableForDate = async (date) => {
    if (!selectedSemester) return;
    
    try {
      setLoading(true);
      const dayName = days[date.getDay()];
      const response = await axios.get(`/api/timetable/semester/${selectedSemester.number}/day/${dayName}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTimetable(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch timetable');
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const generateCalendarDates = () => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const dates = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };


  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'lecture': return '#4CAF50';
      case 'lab': return '#2196F3';
      case 'tutorial': return '#FF9800';
      case 'exam': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading timetable...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  const currentDayName = days[selectedDate.getDay()];
  const calendarDates = generateCalendarDates();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2>
            {user?.role === 'student' ? 'My Timetable' : 
             user?.role === 'teacher' ? 'Teaching Schedule' : 
             'Class Timetable'}
          </h2>
          <div style={styles.dateInfo}>
            <span style={styles.selectedDate}>{formatDate(selectedDate)}</span>
            {isToday(selectedDate) && <span style={styles.todayBadge}>Today</span>}
          </div>
        </div>
        <div style={styles.headerRight}>
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            style={styles.calendarButton}
          >
            📅 Calendar
          </button>
          {!isToday(selectedDate) && (
            <button 
              onClick={() => setSelectedDate(new Date())}
              style={styles.todayButton}
            >
              Today
            </button>
          )}
        </div>
      </div>

      {showCalendar && (
        <div style={styles.calendarOverlay}>
          <div style={styles.calendar}>
            <div style={styles.calendarHeader}>
              <button onClick={() => navigateMonth(-1)} style={styles.navButton}>‹</button>
              <span style={styles.monthYear}>
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => navigateMonth(1)} style={styles.navButton}>›</button>
            </div>
            <div style={styles.calendarGrid}>
              <div style={styles.dayHeaders}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} style={styles.dayHeader}>{day}</div>
                ))}
              </div>
              <div style={styles.datesGrid}>
                {calendarDates.map((date, index) => {
                  const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  const isTodayDate = isToday(date);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(date)}
                      style={{
                        ...styles.dateCell,
                        ...(isSelected ? styles.selectedDateCell : {}),
                        ...(isTodayDate ? styles.todayDateCell : {}),
                        ...(isCurrentMonth ? {} : styles.otherMonthDate)
                      }}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={styles.calendarFooter}>
              <button 
                onClick={() => setShowCalendar(false)}
                style={styles.closeCalendarButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.scheduleContainer}>
        {timetable.length === 0 ? (
          <div style={styles.noData}>
            <div style={styles.noClassesIcon}>📚</div>
            <h3>No classes scheduled</h3>
            <p>No classes found for {currentDayName}, {selectedDate.toLocaleDateString()}</p>
            {user?.role === 'student' && (
              <p style={styles.helpText}>Contact your administrator if you think this is incorrect.</p>
            )}
          </div>
        ) : (
          <div style={styles.daySchedule}>
            <div style={styles.dayTitle}>
              <h3>{currentDayName} Schedule</h3>
              <span style={styles.classCount}>{timetable.length} {timetable.length === 1 ? 'class' : 'classes'}</span>
            </div>
            <div style={styles.classList}>
              {timetable.map((entry, index) => (
                <div key={index} style={{
                  ...styles.classEntry,
                  borderLeft: `4px solid ${getTypeColor(entry.type)}`
                }}>
                  <div style={styles.timeSlot}>
                    <span style={styles.startTime}>{formatTime(entry.startTime)}</span>
                    <span style={styles.timeSeparator}>-</span>
                    <span style={styles.endTime}>{formatTime(entry.endTime)}</span>
                  </div>
                  <div style={styles.classInfo}>
                    <div style={styles.courseName}>
                      {entry.course?.name || 'Unknown Course'}
                    </div>
                    <div style={styles.courseCode}>
                      {entry.course?.code}
                    </div>
                    {user?.role !== 'teacher' && (
                      <div style={styles.teacherName}>
                        {entry.teacher?.name || 'TBD'}
                      </div>
                    )}
                    <div style={styles.classDetails}>
                      <span style={styles.room}>{entry.room}</span>
                      <span style={{
                        ...styles.type,
                        backgroundColor: getTypeColor(entry.type)
                      }}>
                        {entry.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'relative'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '16px'
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  dateInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  selectedDate: {
    fontSize: '16px',
    color: '#555',
    fontWeight: '500'
  },
  todayBadge: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  calendarButton: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  todayButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  calendarOverlay: {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '1000',
    borderRadius: '12px'
  },
  calendar: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
    minWidth: '320px'
  },
  calendarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  monthYear: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333'
  },
  navButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '5px 10px',
    borderRadius: '6px',
    color: '#667eea',
    transition: 'background-color 0.2s'
  },
  calendarGrid: {
    marginBottom: '20px'
  },
  dayHeaders: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px',
    marginBottom: '8px'
  },
  dayHeader: {
    textAlign: 'center',
    padding: '8px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#666'
  },
  datesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px'
  },
  dateCell: {
    border: 'none',
    padding: '12px 8px',
    textAlign: 'center',
    cursor: 'pointer',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'transparent',
    transition: 'background-color 0.2s',
    minHeight: '36px'
  },
  selectedDateCell: {
    backgroundColor: '#667eea',
    color: 'white',
    fontWeight: 'bold'
  },
  todayDateCell: {
    backgroundColor: '#4CAF50',
    color: 'white',
    fontWeight: 'bold'
  },
  otherMonthDate: {
    color: '#ccc'
  },
  calendarFooter: {
    display: 'flex',
    justifyContent: 'center'
  },
  closeCalendarButton: {
    backgroundColor: '#f5f5f5',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  scheduleContainer: {
    marginTop: '20px'
  },
  daySchedule: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  dayTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '12px',
    borderBottom: '1px solid #e0e0e0'
  },
  classCount: {
    fontSize: '14px',
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: '4px 12px',
    borderRadius: '12px'
  },
  classList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  noClassesIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  helpText: {
    fontSize: '14px',
    color: '#999',
    fontStyle: 'italic'
  },
  dayFilter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    minWidth: '120px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    color: '#f44336',
    backgroundColor: '#ffebee',
    borderRadius: '8px'
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  timetableGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  dayCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#fafafa'
  },
  dayContent: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  noClasses: {
    textAlign: 'center',
    color: '#999',
    padding: '20px',
    fontStyle: 'italic'
  },
  classEntry: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
    cursor: 'pointer'
  },
  timeSlot: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  startTime: {
    color: '#4CAF50'
  },
  timeSeparator: {
    color: '#999'
  },
  endTime: {
    color: '#f44336'
  },
  classInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  courseName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  courseCode: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase'
  },
  teacherName: {
    fontSize: '14px',
    color: '#555'
  },
  classDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px'
  },
  room: {
    fontSize: '12px',
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  type: {
    fontSize: '10px',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '12px',
    textTransform: 'uppercase',
    fontWeight: 'bold'
  }
};

export default Timetable;
