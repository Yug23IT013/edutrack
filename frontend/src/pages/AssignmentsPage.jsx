import React from 'react';
import { useAuth } from '../context/AuthContext';
import AssignmentList from '../components/AssignmentList';
import AdminPanel from '../components/AdminPanel';
import TeacherPanel from '../components/TeacherPanel';
import StudentPanel from '../components/StudentPanel';
import { ClipboardList } from 'lucide-react';

const AssignmentsPage = () => {
  const { user } = useAuth();

  const renderContent = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminPanel />;
      case 'teacher':
        return <TeacherPanel />;
      case 'student':
      default:
        return <StudentPanel />;
    }
  };

  const getDescription = () => {
    switch (user?.role) {
      case 'admin':
        return 'Manage assignments across all courses';
      case 'teacher':
        return 'Create and grade assignments for your courses';
      case 'student':
      default:
        return 'View and submit your assignments';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ClipboardList className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600">{getDescription()}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default AssignmentsPage;