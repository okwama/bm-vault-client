import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface AutoLogoutNotificationProps {
  isVisible: boolean;
  onClose: () => void;
}

const AutoLogoutNotification: React.FC<AutoLogoutNotificationProps> = ({ 
  isVisible, 
  onClose 
}) => {
  useEffect(() => {
    if (isVisible) {
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Session Expired
            </h3>
            <p className="mt-1 text-sm text-red-700">
              You have been automatically logged out due to inactivity. Please log in again to continue.
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="inline-flex text-red-400 hover:text-red-600 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoLogoutNotification; 