import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Search, Mail, Phone, BookOpen, Plus } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import axios from 'axios';

const StudentsPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStudents(response.data);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.enrolledCourses && student.enrolledCourses.some(course => 
      course.name.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );



  if (loading) {
    return <LoadingSpinner size="lg" text="Loading students..." className="py-20" />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-800 font-medium">Error loading students</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button 
          onClick={fetchStudents}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Users className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' 
              ? 'Manage all students in your institution' 
              : 'Manage students in your courses'
            }
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students by name, email, or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            {user?.role === 'admin' && (
              <button className="btn-primary flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Student</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Course</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">ID: {student.formattedId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900 flex items-center mb-1">
                          <Mail className="h-3 w-3 mr-1 text-gray-400" />
                          {student.email}
                        </div>
                        {student.phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {student.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {student.enrolledCourses && student.enrolledCourses.length > 0 ? (
                            student.enrolledCourses.slice(0, 2).map((course, index) => (
                              <div key={course._id} className="flex items-center text-sm text-gray-900">
                                <BookOpen className="h-3 w-3 mr-2 text-primary-600" />
                                <span className="truncate">{course.name}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500 italic">No courses enrolled</div>
                          )}
                          {student.enrolledCourses && student.enrolledCourses.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{student.enrolledCourses.length - 2} more
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {student.currentSemesterInfo || 'Not Set'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title={searchTerm ? "No students found" : "No students yet"}
              description={
                searchTerm 
                  ? 'No students match your search criteria.' 
                  : user?.role === 'teacher' 
                    ? 'No students are enrolled in your courses yet.'
                    : 'No students have been added to the system yet.'
              }
              actionText={user?.role === 'admin' ? "Add Student" : null}
              onAction={user?.role === 'admin' ? () => console.log('Add student') : null}
            />
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{students.length}</div>
          <div className="text-sm text-gray-500">
            {user?.role === 'teacher' ? 'Students in Your Courses' : 'Total Students'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {students.reduce((total, student) => total + (student.totalEnrolledCourses || 0), 0)}
          </div>
          <div className="text-sm text-gray-500">Total Course Enrollments</div>
        </div>
      </div>
    </div>
  );
};

export default StudentsPage;