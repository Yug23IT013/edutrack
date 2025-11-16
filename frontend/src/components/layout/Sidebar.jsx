import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home,
  BookOpen,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  GraduationCap,
  Folder,
  ClipboardList,
  User
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getNavigationItems = () => {
    const baseItems = [
      {
        id: 'home',
        label: 'Dashboard',
        path: '/',
        icon: Home,
        description: 'Overview and quick actions'
      }
    ];

    if (user?.role === 'student') {
      return [
        ...baseItems,
        {
          id: 'announcements',
          label: 'Announcements',
          path: '/announcements',
          icon: MessageSquare,
          description: 'View semester announcements'
        },
        {
          id: 'assignments',
          label: 'Assignments',
          path: '/assignments',
          icon: ClipboardList,
          description: 'View and submit assignments'
        },
        {
          id: 'grades',
          label: 'My Grades',
          path: '/grades',
          icon: BarChart3,
          description: 'Check assignment grades'
        },
        {
          id: 'timetable',
          label: 'Timetable',
          path: '/timetable',
          icon: Calendar,
          description: 'View class schedule'
        },
        {
          id: 'materials',
          label: 'Materials',
          path: '/materials',
          icon: Folder,
          description: 'Course materials and resources'
        },
        {
          id: 'courses',
          label: 'My Courses',
          path: '/courses',
          icon: BookOpen,
          description: 'Enrolled courses'
        }
      ];
    } else if (user?.role === 'teacher') {
      return [
        ...baseItems,
        {
          id: 'courses',
          label: 'My Courses',
          path: '/courses',
          icon: BookOpen,
          description: 'Teaching courses'
        },
        {
          id: 'assignments',
          label: 'Assignments',
          path: '/assignments',
          icon: ClipboardList,
          description: 'Create and grade assignments'
        },
        {
          id: 'students',
          label: 'Students',
          path: '/students',
          icon: Users,
          description: 'Manage course students'
        },
        {
          id: 'grades',
          label: 'Grade Management',
          path: '/grades',
          icon: BarChart3,
          description: 'Grade assignments and reports'
        },
        {
          id: 'timetable',
          label: 'Schedule',
          path: '/timetable',
          icon: Calendar,
          description: 'Teaching schedule'
        },
        {
          id: 'materials',
          label: 'Materials',
          path: '/materials',
          icon: Folder,
          description: 'Upload and manage materials'
        },
        {
          id: 'announcements',
          label: 'Announcements',
          path: '/announcements',
          icon: MessageSquare,
          description: 'Create and manage announcements'
        }
      ];
    } else if (user?.role === 'admin') {
      return [
        ...baseItems,
        {
          id: 'users',
          label: 'User Management',
          path: '/users',
          icon: User,
          description: 'Manage all users'
        },
        {
          id: 'courses',
          label: 'Course Management',
          path: '/courses',
          icon: BookOpen,
          description: 'Manage all courses'
        },
        {
          id: 'timetable',
          label: 'Timetable',
          path: '/timetable',
          icon: Calendar,
          description: 'View all schedules'
        },
        {
          id: 'timetable-manage',
          label: 'Manage Timetable',
          path: '/timetable/manage',
          icon: Settings,
          description: 'Create and edit timetables'
        },
        {
          id: 'announcements',
          label: 'Announcements',
          path: '/announcements',
          icon: MessageSquare,
          description: 'Manage all announcements'
        },
        {
          id: 'reports',
          label: 'Reports',
          path: '/reports',
          icon: FileText,
          description: 'System reports and analytics'
        }
      ];
    }
    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <NavLink
        to={item.path}
        onClick={onClose}
        className={({ isActive }) =>
          `flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 group ${
            isActive
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
          }`
        }
      >
        <Icon 
          className={`h-5 w-5 mr-3 flex-shrink-0 ${
            isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary-600'
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate">{item.label}</div>
        </div>
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full border-r border-gray-200">
          {/* Logo area */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GraduationCap className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-2">
                <h1 className="text-xl font-bold text-gray-900">
                  <span className="text-primary-600">Edu</span>Track
                </h1>
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center px-4 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {user?.role}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </nav>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="text-xs text-gray-500 text-center">
              © 2025 EduTrack
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;