import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = () => {
  const location = useLocation();
  
  // Create breadcrumb items based on current path
  const pathnames = location.pathname.split('/').filter((x) => x);
  
  // Map path segments to readable names
  const getReadableName = (segment) => {
    const nameMap = {
      'announcements': 'Announcements',
      'assignments': 'Assignments',
      'grades': 'Grades',
      'timetable': 'Timetable',
      'materials': 'Materials',
      'courses': 'Courses',
      'students': 'Students',
      'users': 'Users',
      'reports': 'Reports',
      'manage': 'Manage',
      'profile': 'Profile',
      'settings': 'Settings'
    };
    return nameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  // Don't show breadcrumbs on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 lg:px-8">
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          {/* Home breadcrumb */}
          <li>
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
          </li>

          {/* Dynamic breadcrumbs */}
          {pathnames.map((name, index) => {
            const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;

            return (
              <li key={name} className="flex items-center">
                <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                {isLast ? (
                  <span className="text-sm font-medium text-gray-900">
                    {getReadableName(name)}
                  </span>
                ) : (
                  <Link
                    to={routeTo}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    {getReadableName(name)}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumbs;