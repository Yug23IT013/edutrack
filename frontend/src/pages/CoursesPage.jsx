import React from 'react';
import { useAuth } from '../context/AuthContext';
import CourseManagement from '../components/CourseManagement';
import EnrolledCourses from '../components/EnrolledCourses';
import TeachingCourses from '../components/TeachingCourses';
import { BookOpen } from 'lucide-react';

const CoursesPage = () => {
  const { user } = useAuth();

  const getDescription = () => {
    switch (user?.role) {
      case 'admin':
        return 'Manage all courses in the system';
      case 'teacher':
        return 'View and manage your teaching courses';
      case 'student':
      default:
        return 'View your enrolled courses';
    }
  };

  const renderCourseComponent = () => {
    if (user?.role === 'student') {
      return <EnrolledCourses />;
    } else if (user?.role === 'teacher') {
      return <TeachingCourses />;
    }
    // Admin gets the full course management interface
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CourseManagement />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BookOpen className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'student' ? 'My Courses' : 
             user?.role === 'teacher' ? 'Teaching Courses' : 
             'Course Management'}
          </h1>
          <p className="text-gray-600">{getDescription()}</p>
        </div>
      </div>
      
      {renderCourseComponent()}
    </div>
  );
};

export default CoursesPage;