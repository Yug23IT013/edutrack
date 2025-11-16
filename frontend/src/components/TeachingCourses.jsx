import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  BookOpen, 
  Users, 
  Award,
  Calendar,
  FileText,
  Eye
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './common/EmptyState';
import toast from 'react-hot-toast';

const TeachingCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachingCourses();
  }, []);

  const fetchTeachingCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/courses/teacher', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data || []);
    } catch (error) {
      console.error('Failed to fetch teaching courses:', error);
      toast.error('Failed to load teaching courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading your teaching courses..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          My Teaching Courses
        </h2>
        <p className="text-gray-600">
          You are currently teaching {courses.length} course{courses.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Courses Grid */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Course Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{course.code}</h3>
                    <p className="text-green-100 text-sm">{course.department}</p>
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
                <h4 className="font-medium text-gray-900 mb-2">
                  {course.name}
                </h4>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>

                {/* Course Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <div className="text-lg font-semibold text-gray-900">
                      {course.students?.length || 0}
                    </div>
                    <div className="text-xs text-gray-600">Students</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Award className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <div className="text-lg font-semibold text-gray-900">
                      {course.credits}
                    </div>
                    <div className="text-xs text-gray-600">Credits</div>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Eye className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <div className="text-lg font-semibold text-gray-900">
                      {Math.round(((course.students?.length || 0) / course.maxEnrollment) * 100)}%
                    </div>
                    <div className="text-xs text-gray-600">Capacity</div>
                  </div>
                </div>

                {/* Course Details */}
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Semester:</span>
                    <span className="font-medium">
                      {course.semester?.number} - {course.semester?.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Max Enrollment:</span>
                    <span className="font-medium">{course.maxEnrollment}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      course.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {course.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No Teaching Courses"
          description="You are not assigned to teach any courses yet. Please contact the administrator to get course assignments."
        />
      )}

      {/* Teaching Summary */}
      {courses.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Teaching Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {courses.length}
              </div>
              <p className="text-gray-600 text-sm">Total Courses</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {courses.reduce((sum, course) => sum + (course.students?.length || 0), 0)}
              </div>
              <p className="text-gray-600 text-sm">Total Students</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {courses.reduce((sum, course) => sum + (course.credits || 0), 0)}
              </div>
              <p className="text-gray-600 text-sm">Total Credits</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {courses.filter(course => course.isCore).length}
              </div>
              <p className="text-gray-600 text-sm">Core Courses</p>
            </div>
          </div>

          {/* Capacity Overview */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Enrollment Overview</h4>
            <div className="space-y-3">
              {courses.map((course) => {
                const percentage = Math.round(((course.students?.length || 0) / course.maxEnrollment) * 100);
                return (
                  <div key={course._id} className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">{course.code}</span>
                      <span className="text-gray-600 ml-2">
                        {course.students?.length || 0}/{course.maxEnrollment}
                      </span>
                    </div>
                    <div className="flex items-center w-32">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            percentage >= 90 ? 'bg-red-500' :
                            percentage >= 70 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 ml-2 w-8">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachingCourses;