import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const SemesterContext = createContext();

export const useSemester = () => {
  const context = useContext(SemesterContext);
  if (!context) {
    throw new Error('useSemester must be used within a SemesterProvider');
  }
  return context;
};

export const SemesterProvider = ({ children }) => {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSemesters();
    fetchCurrentSemester();
  }, []);

  // Update selected semester when user changes or user's currentSemester changes
  useEffect(() => {
    if (user && user.role === 'student' && user.currentSemester) {
      // For students, use their assigned current semester
      setSelectedSemester(user.currentSemester);
    } else if (currentSemester && (!user || user.role !== 'student')) {
      // For teachers/admins, use the global current semester
      setSelectedSemester(currentSemester);
    } else if (semesters.length > 0 && !selectedSemester) {
      // Fallback to first semester
      setSelectedSemester(semesters[0]);
    }
  }, [user, currentSemester, semesters]);

  const fetchSemesters = async () => {
    try {
      const response = await axios.get('/api/semesters');
      setSemesters(response.data);
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  };

  const fetchCurrentSemester = async () => {
    try {
      const response = await axios.get('/api/semesters/current');
      setCurrentSemester(response.data);
    } catch (error) {
      console.error('Error fetching current semester:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectSemester = (semester) => {
    // Only allow teachers/admins to manually select semesters
    // Students are locked to their assigned semester
    if (!user || user.role !== 'student') {
      setSelectedSemester(semester);
    }
  };

  const getSemesterById = (id) => {
    return semesters.find(semester => semester._id === id);
  };

  const getSemesterByNumber = (number) => {
    return semesters.find(semester => semester.number === number);
  };

  const value = {
    semesters,
    currentSemester,
    selectedSemester,
    loading,
    selectSemester,
    getSemesterById,
    getSemesterByNumber,
    fetchSemesters,
    fetchCurrentSemester,
    isStudentLocked: user?.role === 'student'
  };

  return (
    <SemesterContext.Provider value={value}>
      {children}
    </SemesterContext.Provider>
  );
};

export default SemesterContext;
