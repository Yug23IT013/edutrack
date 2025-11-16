import React from 'react';
import { useAuth } from '../context/AuthContext';
import StudentGrades from '../components/StudentGrades';
import GradeManagement from '../components/GradeManagement';
import { BarChart3 } from 'lucide-react';

const GradesPage = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BarChart3 className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grades</h1>
          <p className="text-gray-600">
            {isStudent ? 'View your grades and performance' : 'Manage student grades and assessments'}
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {isStudent ? <StudentGrades /> : <GradeManagement />}
      </div>
    </div>
  );
};

export default GradesPage;