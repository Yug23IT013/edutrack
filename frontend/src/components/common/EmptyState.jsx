import React from 'react';
import { Plus } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionText, 
  onAction,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
        {Icon ? (
          <Icon className="h-full w-full" />
        ) : (
          <div className="h-full w-full bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-2xl">📄</span>
          </div>
        )}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-500 max-w-sm mx-auto mb-6">
        {description}
      </p>
      
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;