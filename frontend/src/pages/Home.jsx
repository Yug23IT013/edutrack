import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BookOpen,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  BarChart3,
  Clock,
  Award,
  TrendingUp,
  Bell,
  ChevronRight
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch different data based on user role
      if (user?.role === 'student') {
        await fetchStudentData(headers);
      } else if (user?.role === 'teacher') {
        await fetchTeacherData(headers);
      } else if (user?.role === 'admin') {
        await fetchAdminData(headers);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentData = async (headers) => {
    try {
      // Get enrolled courses count from user object
      const enrolledCoursesCount = user?.enrolledCourses?.length || 0;

      // Fetch pending assignments
      let pendingAssignments = [];
      try {
        const assignmentsRes = await axios.get('/api/assignments/student/pending', { headers });
        pendingAssignments = assignmentsRes.data || [];
      } catch (error) {
        console.log('Pending assignments endpoint not available');
      }

      // Fetch student grades to calculate average
      let averageGrade = 0;
      try {
        const gradesRes = await axios.get('/api/grades/student', { headers });
        const grades = gradesRes.data || [];
        if (grades.length > 0) {
          const totalGrade = grades.reduce((sum, grade) => sum + (grade.marks || 0), 0);
          averageGrade = Math.round(totalGrade / grades.length);
        }
      } catch (error) {
        console.log('Grades endpoint not available');
      }

      // Fetch recent activities
      let activities = [];
      try {
        const activitiesRes = await axios.get('/api/activities/student/recent', { headers });
        activities = activitiesRes.data || [];
      } catch (error) {
        console.log('Activities endpoint not available');
      }

      // Fetch upcoming assignments and events
      let events = [];
      try {
        const assignmentEvents = await axios.get('/api/assignments/student/upcoming', { headers });
        const assignments = assignmentEvents.data || [];
        events = assignments.map(assignment => ({
          id: assignment._id,
          title: assignment.title,
          time: formatEventTime(assignment.dueDate),
          type: 'assignment'
        }));
      } catch (error) {
        console.log('Upcoming assignments endpoint not available');
      }

      // Try to fetch timetable events
      try {
        const timetableRes = await axios.get('/api/timetable/student/upcoming', { headers });
        const timetableEvents = timetableRes.data || [];
        const timetableMapped = timetableEvents.map(event => ({
          id: event._id,
          title: event.title || `${event.subject} Class`,
          time: formatEventTime(event.date, event.startTime),
          type: 'class'
        }));
        events = [...events, ...timetableMapped];
      } catch (error) {
        console.log('Timetable endpoint not available');
      }

      setStats([
        { 
          label: 'Enrolled Courses', 
          value: enrolledCoursesCount.toString(), 
          icon: BookOpen, 
          color: 'text-blue-600', 
          bgColor: 'bg-blue-100' 
        },
        { 
          label: 'Pending Assignments', 
          value: pendingAssignments.length.toString(), 
          icon: FileText, 
          color: 'text-orange-600', 
          bgColor: 'bg-orange-100' 
        },
        { 
          label: 'Current Semester', 
          value: user?.currentSemester?.number ? `Sem ${user.currentSemester.number}` : 'N/A', 
          icon: TrendingUp, 
          color: 'text-purple-600', 
          bgColor: 'bg-purple-100' 
        }
      ]);

      setRecentActivity(activities.map((activity, index) => ({
        id: activity._id || index,
        type: activity.type || 'general',
        title: activity.description || activity.title || 'Activity',
        time: formatTimeAgo(activity.createdAt || activity.date),
        icon: getActivityIcon(activity.type || 'general')
      })));

      setUpcomingEvents(events.slice(0, 4)); // Show only first 4 events

    } catch (error) {
      console.error('Error fetching student data:', error);
      // Set fallback data based on actual user object
      const enrolledCount = user?.enrolledCourses?.length || 0;
      const semesterInfo = user?.currentSemester?.number || 'N/A';
      
      setStats([
        { label: 'Enrolled Courses', value: enrolledCount.toString(), icon: BookOpen, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { label: 'Pending Assignments', value: '0', icon: FileText, color: 'text-orange-600', bgColor: 'bg-orange-100' },
        { label: 'Current Semester', value: semesterInfo, icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-100' }
      ]);
      setRecentActivity([]);
      setUpcomingEvents([]);
    }
  };

  const fetchTeacherData = async (headers) => {
    try {
      // Fetch teacher courses - use the correct endpoint
      let courses = [];
      let totalStudents = 0;
      try {
        const coursesRes = await axios.get('/api/courses/teacher', { headers });
        courses = coursesRes.data || [];
        // Calculate total students across all teaching courses
        totalStudents = courses.reduce((sum, course) => sum + (course.students?.length || 0), 0);
      } catch (error) {
        console.log('Teaching courses endpoint not available');
      }

      // Fetch assignments to grade
      let pendingGrading = [];
      try {
        const assignmentsRes = await axios.get('/api/assignments/teacher/pending-grading', { headers });
        pendingGrading = assignmentsRes.data || [];
      } catch (error) {
        console.log('Pending grading endpoint not available');
      }

      // Fetch recent activities
      let activities = [];
      try {
        const activitiesRes = await axios.get('/api/activities/teacher/recent', { headers });
        activities = activitiesRes.data || [];
      } catch (error) {
        console.log('Teacher activities endpoint not available');
      }

      // Fetch upcoming events
      let events = [];
      try {
        const eventsRes = await axios.get('/api/timetable/teacher/upcoming', { headers });
        events = eventsRes.data || [];
      } catch (error) {
        console.log('Teacher events endpoint not available');
      }

      setStats([
        { 
          label: 'Teaching Courses', 
          value: courses.length.toString(), 
          icon: BookOpen, 
          color: 'text-blue-600', 
          bgColor: 'bg-blue-100' 
        },
        { 
          label: 'Total Students', 
          value: totalStudents.toString(), 
          icon: Users, 
          color: 'text-green-600', 
          bgColor: 'bg-green-100' 
        },
        { 
          label: 'Active Courses', 
          value: courses.filter(course => course.isActive).length.toString(), 
          icon: Award, 
          color: 'text-purple-600', 
          bgColor: 'bg-purple-100' 
        }
      ]);

      setRecentActivity(activities.map((activity, index) => ({
        id: activity._id || index,
        type: activity.type || 'general',
        title: activity.description || activity.title || 'Activity',
        time: formatTimeAgo(activity.createdAt || activity.date),
        icon: getActivityIcon(activity.type || 'general')
      })));

      setUpcomingEvents(events.map((event, index) => ({
        id: event._id || index,
        title: event.title || `${event.course?.name || 'Class'} - ${event.type || 'Event'}`,
        time: formatEventTime(event.date, event.startTime),
        type: event.type || 'class'
      })).slice(0, 4)); // Show only first 4 events

    } catch (error) {
      console.error('Error fetching teacher data:', error);
      // Set fallback data based on actual user object
      const teachingCount = user?.teachingCourses?.length || 0;
      
      setStats([
        { label: 'Teaching Courses', value: teachingCount.toString(), icon: BookOpen, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { label: 'Total Students', value: '0', icon: Users, color: 'text-green-600', bgColor: 'bg-green-100' },
        { label: 'Active Courses', value: '0', icon: Award, color: 'text-purple-600', bgColor: 'bg-purple-100' }
      ]);
      setRecentActivity([]);
      setUpcomingEvents([]);
    }
  };

  const fetchAdminData = async (headers) => {
    try {
      // Fetch total users
      const usersRes = await axios.get('/api/users/count', { headers });
      const userCount = usersRes.data?.total || 0;

      // Fetch total courses
      const coursesRes = await axios.get('/api/courses/count', { headers });
      const courseCount = coursesRes.data?.total || 0;

      // Fetch announcements count
      const announcementsRes = await axios.get('/api/announcements/count', { headers });
      const announcementCount = announcementsRes.data?.total || 0;

      // Fetch recent activities
      const activitiesRes = await axios.get('/api/activities/admin/recent', { headers });
      const activities = activitiesRes.data || [];

      // Fetch system events
      const eventsRes = await axios.get('/api/system/events/upcoming', { headers });
      const events = eventsRes.data || [];

      setStats([
        { 
          label: 'Total Users', 
          value: userCount.toLocaleString(), 
          icon: Users, 
          color: 'text-blue-600', 
          bgColor: 'bg-blue-100' 
        },
        { 
          label: 'Active Courses', 
          value: courseCount.toString(), 
          icon: BookOpen, 
          color: 'text-green-600', 
          bgColor: 'bg-green-100' 
        },
        { 
          label: 'Total Announcements', 
          value: announcementCount.toString(), 
          icon: MessageSquare, 
          color: 'text-orange-600', 
          bgColor: 'bg-orange-100' 
        }
      ]);

      setRecentActivity(activities.map(activity => ({
        id: activity.id || activity._id,
        type: activity.type,
        title: activity.description,
        time: formatTimeAgo(activity.timestamp || activity.createdAt),
        icon: getActivityIcon(activity.type)
      })));

      setUpcomingEvents(events.map(event => ({
        id: event.id || event._id,
        title: event.title,
        time: formatEventTime(event.date, event.time),
        type: event.type
      })));

    } catch (error) {
      console.error('Error fetching admin data:', error);
      // Set fallback empty data
      setStats([
        { label: 'Total Users', value: '0', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { label: 'Active Courses', value: '0', icon: BookOpen, color: 'text-green-600', bgColor: 'bg-green-100' },
        { label: 'Total Announcements', value: '0', icon: MessageSquare, color: 'text-orange-600', bgColor: 'bg-orange-100' }
      ]);
      setRecentActivity([]);
      setUpcomingEvents([]);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'assignment': return FileText;
      case 'grade': return Award;
      case 'announcement': return MessageSquare;
      case 'material': return BookOpen;
      case 'user': return Users;
      case 'course': return BookOpen;
      case 'system': return BarChart3;
      default: return Bell;
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown time';
    
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    } catch (error) {
      return 'Unknown time';
    }
  };

  const formatEventTime = (dateString, timeString) => {
    if (!dateString) return 'TBD';
    
    try {
      const eventDate = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const isToday = eventDate.toDateString() === today.toDateString();
      const isTomorrow = eventDate.toDateString() === tomorrow.toDateString();
      
      if (isToday) {
        return `Today${timeString ? `, ${timeString}` : ''}`;
      } else if (isTomorrow) {
        return `Tomorrow${timeString ? `, ${timeString}` : ''}`;
      } else {
        const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
        const time = timeString || eventDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        });
        return `${dayName}, ${time}`;
      }
    } catch (error) {
      return 'TBD';
    }
  };

  const getQuickActions = () => {
    if (user?.role === 'student') {
      return [
        { label: 'My Courses', path: '/courses', icon: BookOpen, color: 'bg-blue-500 hover:bg-blue-600' },
        { label: 'View Assignments', path: '/assignments', icon: FileText, color: 'bg-orange-500 hover:bg-orange-600' },
        { label: 'Check Grades', path: '/grades', icon: Award, color: 'bg-green-500 hover:bg-green-600' },
        { label: 'View Schedule', path: '/timetable', icon: Calendar, color: 'bg-purple-500 hover:bg-purple-600' }
      ];
    } else if (user?.role === 'teacher') {
      return [
        { label: 'My Courses', path: '/courses', icon: BookOpen, color: 'bg-blue-500 hover:bg-blue-600' },
        { label: 'Grade Assignments', path: '/assignments', icon: Award, color: 'bg-green-500 hover:bg-green-600' },
        { label: 'Manage Students', path: '/students', icon: Users, color: 'bg-purple-500 hover:bg-purple-600' },
        { label: 'Create Announcement', path: '/announcements', icon: MessageSquare, color: 'bg-orange-500 hover:bg-orange-600' }
      ];
    } else {
      return [
        { label: 'Manage Users', path: '/users', icon: Users, color: 'bg-blue-500 hover:bg-blue-600' },
        { label: 'Course Management', path: '/courses', icon: BookOpen, color: 'bg-green-500 hover:bg-green-600' },
        { label: 'System Reports', path: '/reports', icon: BarChart3, color: 'bg-purple-500 hover:bg-purple-600' },
        { label: 'Announcements', path: '/announcements', icon: MessageSquare, color: 'bg-orange-500 hover:bg-orange-600' }
      ];
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading dashboard..." className="py-20" />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-primary-100">
          Here's what's happening with your {user?.role === 'student' ? 'studies' : user?.role === 'teacher' ? 'classes' : 'system'} today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats?.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={`stat-${index}-${stat.label}`} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              {getQuickActions().map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={`action-${index}-${action.label}`}
                    onClick={() => navigate(action.path)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-white transition-colors ${action.color}`}
                  >
                    <div className="flex items-center">
                      <Icon className="h-5 w-5 mr-3" />
                      <span className="font-medium">{action.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <button 
                    onClick={() => navigate('/activities')}
                    className="w-full text-center text-sm text-primary-600 hover:text-primary-700 py-2 border-t border-gray-100 mt-4"
                  >
                    View All Activity
                  </button>
                </div>
              ) : (
                <EmptyState
                  icon={Bell}
                  title="No recent activity"
                  description="Your recent activity will appear here."
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
        </div>
        <div className="p-6">
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.time}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      event.type === 'quiz' ? 'bg-red-100 text-red-800' :
                      event.type === 'assignment' ? 'bg-orange-100 text-orange-800' :
                      event.type === 'class' ? 'bg-blue-100 text-blue-800' :
                      event.type === 'lab' ? 'bg-purple-100 text-purple-800' :
                      event.type === 'presentation' ? 'bg-pink-100 text-pink-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No upcoming events"
              description="Your upcoming events and deadlines will appear here."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;