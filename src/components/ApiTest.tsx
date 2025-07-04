import React, { useState } from 'react';
import api from '../services/api';

const ApiTest: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testApiConnection = async () => {
    try {
      setStatus('Testing API connection...');
      setError('');
      
      // Test the API base URL
      const response = await api.get('/auth/login');
      setStatus(`API connection successful: ${response.status}`);
    } catch (err: any) {
      setError(`API connection failed: ${err.message}`);
      setStatus('Failed');
      console.error('API test error:', err);
    }
  };

  const testBackendHealth = async () => {
    try {
      setStatus('Testing backend health...');
      setError('');
      
      // Test if the backend is reachable
      const response = await fetch('https://vaultserver.vercel.app/api/auth/login', {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      setStatus(`Backend health check: ${response.status} ${response.statusText}`);
    } catch (err: any) {
      setError(`Backend health check failed: ${err.message}`);
      setStatus('Failed');
      console.error('Backend health check error:', err);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">API Connection Test</h3>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={testApiConnection}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test API Connection
          </button>
        </div>
        
        <div>
          <button
            onClick={testBackendHealth}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Test Backend Health
          </button>
        </div>
        
        {status && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded">
            <strong>Status:</strong> {status}
          </div>
        )}
        
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p><strong>API Base URL:</strong> {api.defaults.baseURL}</p>
          <p><strong>Backend URL:</strong> https://vaultserver.vercel.app/api</p>
        </div>
      </div>
    </div>
  );
};

export default ApiTest; 