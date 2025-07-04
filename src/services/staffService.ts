import api from './api';
import { AxiosError } from 'axios';

export interface Staff {
  id: number;
  name: string;
  photo_url: string;
  position: string;
  empl_no: string;
  id_no: number;
  role: string;
  status: number;  // 1 for active, 0 for deactivated
  created_at: string;
  updated_at: string;
}

export interface CreateStaffData {
  name: string;
  photo_url: string;
  empl_no: string;
  id_no: number;
  role: string;
}

export const staffService = {
  getStaffList: async (): Promise<Staff[]> => {
    try {
      console.log('Making API request to fetch staff list...');
      const response = await api.get('/staff');
      console.log('API Response:', response);
      return response.data;
    } catch (error) {
      console.error('Error in staffService.getStaffList:', error);
      if (error instanceof AxiosError) {
        if (error.response) {
          console.error('Error response data:', error.response.data);
          console.error('Error response status:', error.response.status);
          console.error('Error response headers:', error.response.headers);
        } else if (error.request) {
          console.error('Error request:', error.request);
        } else {
          console.error('Error message:', error.message);
        }
      }
      throw error;
    }
  },

  uploadPhoto: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.url;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  },

  createStaff: async (staffData: CreateStaffData): Promise<Staff> => {
    try {
      const response = await api.post('/staff', staffData);
      return response.data;
    } catch (error) {
      console.error('Error in staffService.createStaff:', error);
      throw error;
    }
  },

  updateStaffStatus: async (staffId: number, status: number): Promise<Staff> => {
    try {
      console.log('Updating staff status:', { staffId, status });
      const response = await api.put(`/staff/${staffId}/status`, { status });
      console.log('Status update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating staff status:', error);
      throw error;
    }
  },

  updateStaff: async (staffId: number, staffData: CreateStaffData): Promise<Staff> => {
    try {
      const response = await api.put(`/staff/${staffId}`, staffData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};