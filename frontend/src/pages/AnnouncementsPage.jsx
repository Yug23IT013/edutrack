import React from 'react';
import { useAuth } from '../context/AuthContext';
import AnnouncementList from '../components/AnnouncementList';
import AnnouncementManager from '../components/AnnouncementManager';
import { MessageSquare } from 'lucide-react';

const AnnouncementsPage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'teacher';

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <MessageSquare className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600">
            {canManage ? 'Manage and view announcements' : 'Stay updated with the latest announcements'}
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {canManage ? <AnnouncementManager /> : <AnnouncementList />}
      </div>
    </div>
  );
};

export default AnnouncementsPage;