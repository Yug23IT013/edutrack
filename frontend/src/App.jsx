import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SemesterProvider } from './context/SemesterContext';
import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Auth from './pages/Auth';
import Home from './pages/Home';
import AnnouncementsPage from './pages/AnnouncementsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import CoursesPage from './pages/CoursesPage';
import GradesPage from './pages/GradesPage';
import TimetablePage from './pages/TimetablePage';
import MaterialsPage from './pages/MaterialsPage';
import StudentsPage from './pages/StudentsPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';

// Route Guards
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner fullScreen size="lg" text="Authenticating..." />;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner fullScreen size="lg" text="Loading..." />;
  }
  
  return !user ? children : <Navigate to="/" replace />;
};

// Main App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/auth" 
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/announcements" 
        element={
          <ProtectedRoute>
            <AnnouncementsPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/assignments" 
        element={
          <ProtectedRoute>
            <AssignmentsPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/courses" 
        element={
          <ProtectedRoute>
            <CoursesPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/grades" 
        element={
          <ProtectedRoute>
            <GradesPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/timetable" 
        element={
          <ProtectedRoute>
            <TimetablePage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/materials" 
        element={
          <ProtectedRoute>
            <MaterialsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Teacher and Admin Routes */}
      <Route 
        path="/students" 
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <StudentsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Only Routes */}
      <Route 
        path="/users" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/timetable/manage" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <TimetablePage manage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ReportsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* User Profile */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SemesterProvider>
          <NotificationProvider>
            <Router 
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <div className="App">
                <AppRoutes />
              </div>
            </Router>
          </NotificationProvider>
        </SemesterProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
