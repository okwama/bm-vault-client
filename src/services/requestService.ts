import api from './api';
import axios from 'axios';

// Get API base URL using the same logic as api.ts
const getApiBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) {
    console.warn('VITE_API_URL is not defined, falling back to default URL');
    return 'https://bm-vault-server.vercel.app/api';
  }
  return url.endsWith('/api') ? url : `${url}/api`;
};

const API_BASE_URL = getApiBaseUrl();
console.log('Request service using API base URL:', API_BASE_URL);

// Create a separate API instance for request operations that doesn't require auth
const requestApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000,
  withCredentials: true
});

export interface RequestData {
  id: number;
  userId: number;
  userName: string;
  serviceTypeId: number;
  serviceTypeName: string;
  pickupLocation: string;
  deliveryLocation: string;
  pickupDate: string;
  status: string;
  myStatus: string;
  priority: string;
  branchId: number;
  branchName: string;
  clientId: number;
  teamId?: number;
  staffId?: number;
  atmId?: number;
  price?: number;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequestData {
  userId: number;
  userName: string;
  serviceTypeId: number;
  pickupLocation: string;
  deliveryLocation: string;
  pickupDate: string;
  status: string;
  myStatus: string;
  priority: string;
  branchId: number;
  teamId?: number;
  staffId?: number;
  atmId?: number;
  price?: number;
  latitude?: number;
  longitude?: number;
}

export interface Request {
  id: string;
  client_id: string;
  client_name: string;
  service_type_id: string;
  service_type_name: string;
  pickup_location: string;
  dropoff_location: string;
  status: string;
  latitude: number;
  longitude: number;
  // ... other fields
}

export const requestService = {
  createRequest: async (data: CreateRequestData): Promise<any> => {
    try {
      console.log('Creating request with data:', JSON.stringify(data, null, 2));
      const response = await api.post<any>('/requests', data);
      console.log('Request created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  },

  getRequests: async (filters?: { status?: string; myStatus?: number }): Promise<RequestData[]> => {
    try {
      console.log('Fetching requests with filters:', filters);
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.myStatus !== undefined) params.append('myStatus', filters.myStatus.toString());
      
      const response = await api.get<RequestData[]>(`/requests${params.toString() ? `?${params.toString()}` : ''}`);
      console.log('Requests fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('Error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  },

  updateRequest: async (requestId: string, data: Partial<RequestData>): Promise<any> => {
    try {
      console.log('Updating request:', requestId, 'with data:', JSON.stringify(data, null, 2));
      const response = await api.patch<any>(`/requests/${requestId}`, data);
      console.log('Request updated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('Error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  },

  getInTransitRequests: async (): Promise<Request[]> => {
    try {
      console.log('Fetching in-transit requests...'); // Debug log
      const response = await api.get<Request[]>('/requests/in-transit');
      console.log('API Response:', response.data); // Debug log
      return response.data;
    } catch (error: any) {
      console.error('Error in getInTransitRequests:', error); // Debug log
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch in-transit requests');
    }
  },

  getRequestById: async (id: number): Promise<RequestData> => {
    try {
      console.log('Fetching request by ID:', id);
      // Use the same API instance as vault service
      const response = await requestApi.get<RequestData>(`/requests/${id}`);
      console.log('Request fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching request by ID:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch request');
    }
  }
}; 