import React from 'react';
import { useAuth } from '../context/AuthContext';
import Timetable from '../components/Timetable';
import TimetableManager from '../components/TimetableManager';
import { Calendar } from 'lucide-react';

const TimetablePage = ({ manage = false }) => {
  const { user } = useAuth();

  const getDescription = () => {
    if (manage) {
      return 'Create and manage timetables for all courses';
    }
    switch (user?.role) {
      case 'admin':
        return 'View all course schedules';
      case 'teacher':
        return 'View your teaching schedule';
      case 'student':
      default:
        return 'View your class schedule';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Calendar className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {manage ? 'Manage Timetable' : 'Timetable'}
          </h1>
          <p className="text-gray-600">{getDescription()}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {manage ? <TimetableManager /> : <Timetable />}
      </div>
    </div>
  );
};

export default TimetablePage;