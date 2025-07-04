import { api } from './api';

export interface ATM {
  id: string;
  client_id: string;
  atm_code: string;
  location: string;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateATMData {
  atm_code: string;
  location: string;
  comment?: string;
}

export interface UpdateATMData {
  atm_code: string;
  location: string;
  comment?: string;
}

export const getATMs = async (clientId: string): Promise<ATM[]> => {
  try {
    const response = await api.get(`/clients/${clientId}/atms`);
    return response.data;
  } catch (error) {
    console.error('Error fetching ATMs:', error);
    throw error;
  }
};

export const createATM = async (clientId: string, data: CreateATMData): Promise<ATM> => {
  try {
    const response = await api.post(`/clients/${clientId}/atms`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating ATM:', error);
    throw error;
  }
};

export const updateATM = async (clientId: string, atmId: string, data: UpdateATMData): Promise<ATM> => {
  try {
    const response = await api.put(`/clients/${clientId}/atms/${atmId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating ATM:', error);
    throw error;
  }
};

export const deleteATM = async (clientId: string, atmId: string): Promise<void> => {
  try {
    await api.delete(`/clients/${clientId}/atms/${atmId}`);
  } catch (error) {
    console.error('Error deleting ATM:', error);
    throw error;
  }
}; 