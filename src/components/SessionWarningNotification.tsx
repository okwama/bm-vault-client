import React, { useEffect, useState } from 'react';
import { Clock, X } from 'lucide-react';

interface SessionWarningNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  onStayLoggedIn: () => void;
  timeRemaining: number; // in seconds
}

const SessionWarningNotification: React.FC<SessionWarningNotificationProps> = ({ 
  isVisible, 
  onClose,
  onStayLoggedIn,
  timeRemaining
}) => {
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    if (isVisible && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isVisible, countdown]);

  useEffect(() => {
    if (isVisible) {
      setCountdown(timeRemaining);
    }
  }, [isVisible, timeRemaining]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Clock className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Session Expiring Soon
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              Your session will expire in <span className="font-bold">{countdown}</span> seconds due to inactivity.
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={onStayLoggedIn}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
              >
                Stay Logged In
              </button>
              <button
                onClick={onClose}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
              >
                Logout Now
              </button>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningNotification; 