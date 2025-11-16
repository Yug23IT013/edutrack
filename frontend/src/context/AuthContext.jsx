import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import SemesterSelectionModal from '../components/SemesterSelectionModal';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSemesterModal, setShowSemesterModal] = useState(false);

  // Set up axios defaults
  useEffect(() => {
    // Set base URL for axios
    if (API_BASE_URL) {
      axios.defaults.baseURL = API_BASE_URL;
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      getCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Check if student needs to select semester after user is loaded
  useEffect(() => {
    if (user && user.role === 'student' && !loading) {
      // Check sessionStorage for semester selection requirement
      const needsSelection = sessionStorage.getItem('needsSemesterSelection');
      
      console.log('🔍 Semester check from sessionStorage:', {
        userId: user._id || user.id,
        userEmail: user.email,
        needsSemesterSelection: needsSelection,
        shouldShowModal: needsSelection === 'true'
      });
      
      if (needsSelection === 'true') {
        console.log('✅ Student needs semester selection - showing modal');
        setShowSemesterModal(true);
      } else {
        console.log('❌ Student does not need semester selection - skipping modal');
        setShowSemesterModal(false);
      }
    } else {
      // For non-students or when loading, ensure modal is hidden
      setShowSemesterModal(false);
    }
  }, [user, loading]);

  const getCurrentUser = async () => {
    try {
      const response = await axios.get('/api/users/profile');
      console.log('User profile loaded:', response.data);
      setUser(response.data);
      
      // Update sessionStorage based on current user profile
      if (response.data.role === 'student') {
        const needsSelection = !response.data.currentSemester;
        sessionStorage.setItem('needsSemesterSelection', needsSelection ? 'true' : 'false');
        console.log('🔍 Profile load - semester selection status:', {
          userId: response.data._id,
          needsSemesterSelection: needsSelection,
          currentSemester: response.data.currentSemester
        });
      }
    } catch (error) {
      console.error('Get current user error:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      const response = await axios.post('/api/auth/signup', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      // Store semester selection status in sessionStorage
      if (user.role === 'student') {
        sessionStorage.setItem('needsSemesterSelection', user.needsSemesterSelection ? 'true' : 'false');
        console.log('🔍 Signup - semester selection status:', {
          userId: user.id,
          needsSemesterSelection: user.needsSemesterSelection,
          currentSemester: user.currentSemester
        });
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Signup failed' 
      };
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      // Store semester selection status in sessionStorage
      if (user.role === 'student') {
        sessionStorage.setItem('needsSemesterSelection', user.needsSemesterSelection ? 'true' : 'false');
        console.log('🔍 Login - semester selection status:', {
          userId: user.id,
          needsSemesterSelection: user.needsSemesterSelection,
          currentSemester: user.currentSemester
        });
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('needsSemesterSelection');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setShowSemesterModal(false);
    
    console.log('🚪 User logged out, session cleared');
  };

  const handleSemesterSelected = (semester, updatedUser) => {
    console.log('✅ Semester selected successfully:', { 
      semester: semester,
      updatedUser: updatedUser,
      userCurrentSemester: updatedUser.currentSemester 
    });
    
    // Update user state with the updated user data from backend
    setUser(updatedUser);
    // Close the modal
    setShowSemesterModal(false);
    
    // Update sessionStorage to reflect that semester selection is no longer needed
    sessionStorage.setItem('needsSemesterSelection', 'false');
    
    console.log('✅ Modal closed, sessionStorage updated, semester selection completed');
  };

  const updateUserSemester = async (semesterId) => {
    try {
      const response = await axios.put('/api/users/semester', {
        semesterId
      });
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update semester' 
      };
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    updateUserSemester,
    showSemesterModal: showSemesterModal && user?.role === 'student'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SemesterSelectionModal
        isOpen={showSemesterModal && user?.role === 'student'}
        onSemesterSelected={handleSemesterSelected}
      />
    </AuthContext.Provider>
  );
};
