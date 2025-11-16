import React from 'react';
import { useAuth } from '../context/AuthContext';
import MaterialsList from '../components/MaterialsList';
import MaterialManager from '../components/MaterialManager';
import { Folder } from 'lucide-react';

const MaterialsPage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'teacher' || user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Folder className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Materials</h1>
          <p className="text-gray-600">
            {canManage ? 'Upload and manage course materials' : 'Access and download course materials'}
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {canManage ? <MaterialManager /> : <MaterialsList />}
      </div>
    </div>
  );
};

export default MaterialsPage;