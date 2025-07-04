import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const StorageWarning: React.FC = () => {
  const { storageAvailable } = useAuth();

  if (storageAvailable) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-yellow-100">
              <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </span>
            <p className="ml-3 font-medium text-sm text-yellow-800">
              <span className="md:hidden">Storage access limited</span>
              <span className="hidden md:inline">
                Local storage is not available. Some features may not work properly. Please check your browser settings or try a different browser.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageWarning; 