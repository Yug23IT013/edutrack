import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  BookOpen, 
  User, 
  Clock, 
  Award,
  Calendar,
  FileText
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './common/EmptyState';
import toast from 'react-hot-toast';

const EnrolledCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/courses/enrolled', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data || []);
    } catch (error) {
      console.error('Failed to fetch enrolled courses:', error);
      toast.error('Failed to load enrolled courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading your courses..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          My Enrolled Courses
        </h2>
        <p className="text-gray-600">
          You are currently enrolled in {courses.length} course{courses.length !== 1 ? 's' : ''}
          {user?.currentSemester && (
            <span> for {user.currentSemester.name} ({user.currentSemester.academicYear})</span>
          )}
        </p>
      </div>

      {/* Courses Grid */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Course Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{course.code}</h3>
                    <p className="text-primary-100 text-sm">{course.department}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      course.isCore 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {course.isCore ? 'Core' : 'Elective'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Course Content */}
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                  {course.name}
                </h4>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {course.description}
                </p>

                {/* Course Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span className="font-medium">Instructor:</span>
                    <span className="ml-1">{course.teacher?.name || 'TBA'}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Award className="h-4 w-4 mr-2" />
                    <span className="font-medium">Credits:</span>
                    <span className="ml-1">{course.credits}</span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="font-medium">Enrolled:</span>
                    <span className="ml-1">
                      {course.students?.length || 0} / {course.maxEnrollment} students
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button className="flex items-center justify-center py-2 px-3 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors">
                      <FileText className="h-3 w-3 mr-1" />
                      Materials
                    </button>
                    <button className="flex items-center justify-center py-2 px-3 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors">
                      <Calendar className="h-3 w-3 mr-1" />
                      Schedule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No Enrolled Courses"
          description="You are not enrolled in any courses yet. Please contact your academic advisor to enroll in courses."
        />
      )}

      {/* Course Summary */}
      {courses.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {courses.length}
              </div>
              <p className="text-gray-600 text-sm">Total Courses</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {courses.reduce((sum, course) => sum + (course.credits || 0), 0)}
              </div>
              <p className="text-gray-600 text-sm">Total Credits</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {courses.filter(course => course.isCore).length}
              </div>
              <p className="text-gray-600 text-sm">Core Subjects</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrolledCourses;