import { useEffect, useRef, useCallback } from 'react';

interface UseInactivityTimeoutProps {
  timeout: number; // in milliseconds
  onTimeout: () => void;
  onWarning?: () => void; // Optional warning callback
  warningTime?: number; // Time before timeout to show warning (default 1 minute)
  enabled?: boolean;
}

export const useInactivityTimeout = ({ 
  timeout, 
  onTimeout, 
  onWarning,
  warningTime = 60 * 1000, // 1 minute default
  enabled = true 
}: UseInactivityTimeoutProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }
    
    if (enabled) {
      // Set warning timer
      if (onWarning && warningTime < timeout) {
        warningRef.current = setTimeout(() => {
          onWarning();
        }, timeout - warningTime);
      }

      // Set main timeout
      timeoutRef.current = setTimeout(() => {
        onTimeout();
      }, timeout);
    }
  }, [timeout, onTimeout, onWarning, warningTime, enabled]);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return;
    }

    // Events to monitor for user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    // Reset timer on any user activity
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the initial timer
    resetTimer();

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearTimer();
    };
  }, [resetTimer, clearTimer, enabled]);

  return {
    resetTimer,
    clearTimer
  };
}; 