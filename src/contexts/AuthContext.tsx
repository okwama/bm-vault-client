import React, { createContext, useContext, useState, useEffect } from 'react';
import { useInactivityTimeout } from '../hooks/useInactivityTimeout';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  client_id: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isAutoLogout: boolean;
  showSessionWarning: boolean;
  setShowSessionWarning: (show: boolean) => void;
  resetSessionTimer: () => void;
  storageAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if localStorage is available and accessible
const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// Safe storage access functions with better error handling
const safeGetItem = (key: string): string | null => {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available');
    return null;
  }
  
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('Error accessing localStorage:', error);
    return null;
  }
};

const safeSetItem = (key: string, value: string): boolean => {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }
  
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn('Error setting localStorage:', error);
    return false;
  }
};

const safeRemoveItem = (key: string): boolean => {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn('Error removing from localStorage:', error);
    return false;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAutoLogout, setIsAutoLogout] = useState(false);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  // Initialize user from storage on mount
  useEffect(() => {
    const storageCheck = isStorageAvailable();
    setStorageAvailable(storageCheck);
    
    if (storageCheck) {
      const savedUser = safeGetItem('user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } catch (error) {
          console.warn('Error parsing saved user data:', error);
          // Clear corrupted data
          safeRemoveItem('user');
          safeRemoveItem('token');
        }
      }
    }
  }, []);

  const logout = () => {
    safeRemoveItem('token');
    safeRemoveItem('user');
    setUser(null);
    setIsAutoLogout(false);
    setShowSessionWarning(false);
  };

  const handleAutoLogout = () => {
    setIsAutoLogout(true);
    logout();
  };

  const handleSessionWarning = () => {
    setShowSessionWarning(true);
  };

  const resetSessionTimer = () => {
    setShowSessionWarning(false);
  };

  const login = (token: string, userData: User) => {
    const tokenSaved = safeSetItem('token', token);
    const userSaved = safeSetItem('user', JSON.stringify(userData));
    
    if (!tokenSaved || !userSaved) {
      console.warn('Failed to save authentication data to storage');
    }
    
    setUser(userData);
    setIsAutoLogout(false);
    setShowSessionWarning(false);
  };

  // Auto logout after 7 minutes of inactivity (7 * 60 * 1000 = 420000ms)
  // Warning after 6 minutes (6 * 60 * 1000 = 360000ms)
  useInactivityTimeout({
    timeout: 7 * 60 * 1000, // 7 minutes
    onTimeout: handleAutoLogout,
    onWarning: handleSessionWarning,
    warningTime: 60 * 1000, // 1 minute warning
    enabled: !!user && storageAvailable // Only enable when user is logged in and storage is available
  });

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAutoLogout, 
      showSessionWarning, 
      setShowSessionWarning,
      resetSessionTimer,
      storageAvailable
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 