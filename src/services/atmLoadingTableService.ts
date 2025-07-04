import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bm-vault-server.vercel.app/api';

export interface ATMLoadingDenominations {
  ones: number;
  fives: number;
  tens: number;
  twenties: number;
  forties: number;
  fifties: number;
  hundreds: number;
  twoHundreds: number;
  fiveHundreds: number;
  thousands: number;
}

export interface ATMLoadingRecord {
  id: number;
  client_id: number;
  atm_id: number;
  ones: number;
  fives: number;
  tens: number;
  twenties: number;
  forties: number;
  fifties: number;
  hundreds: number;
  twoHundreds: number;
  fiveHundreds: number;
  thousands: number;
  total_amount: number;
  loading_date: string;
  comment?: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
  atm_code?: string;
  atm_location?: string;
}

export interface CreateATMLoadingData {
  client_id: number;
  atm_id: number;
  denominations: ATMLoadingDenominations;
  loading_date: string;
  comment?: string;
}

export interface UpdateATMLoadingData {
  client_id: number;
  atm_id: number;
  denominations: ATMLoadingDenominations;
  loading_date: string;
  comment?: string;
}

class ATMLoadingTableService {
  // Create ATM loading record
  async createATMLoading(data: CreateATMLoadingData): Promise<ATMLoadingRecord> {
    try {
      console.log('Creating ATM loading record:', data);
      const response = await axios.post(`${API_BASE_URL}/atm-loading`, data);
      console.log('ATM loading record created:', response.data);
      return response.data.record;
    } catch (error) {
      console.error('Error creating ATM loading record:', error);
      throw error;
    }
  }

  // Get all ATM loading records
  async getAllATMLoading(): Promise<ATMLoadingRecord[]> {
    try {
      console.log('Fetching all ATM loading records');
      const response = await axios.get(`${API_BASE_URL}/atm-loading`);
      console.log('ATM loading records fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching ATM loading records:', error);
      throw error;
    }
  }

  // Get ATM loading record by ID
  async getATMLoadingById(id: number): Promise<ATMLoadingRecord> {
    try {
      console.log('Fetching ATM loading record by ID:', id);
      const response = await axios.get(`${API_BASE_URL}/atm-loading/${id}`);
      console.log('ATM loading record fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching ATM loading record:', error);
      throw error;
    }
  }

  // Get ATM loading records by client
  async getATMLoadingByClient(clientId: number): Promise<ATMLoadingRecord[]> {
    try {
      console.log('Fetching ATM loading records for client:', clientId);
      const response = await axios.get(`${API_BASE_URL}/atm-loading/client/${clientId}`);
      console.log('Client ATM loading records fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching client ATM loading records:', error);
      throw error;
    }
  }

  // Get ATM loading records by ATM
  async getATMLoadingByATM(atmId: number): Promise<ATMLoadingRecord[]> {
    try {
      console.log('Fetching ATM loading records for ATM:', atmId);
      const response = await axios.get(`${API_BASE_URL}/atm-loading/atm/${atmId}`);
      console.log('ATM loading records fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching ATM loading records:', error);
      throw error;
    }
  }

  // Update ATM loading record
  async updateATMLoading(id: number, data: UpdateATMLoadingData): Promise<ATMLoadingRecord> {
    try {
      console.log('Updating ATM loading record:', { id, data });
      const response = await axios.put(`${API_BASE_URL}/atm-loading/${id}`, data);
      console.log('ATM loading record updated:', response.data);
      return response.data.record;
    } catch (error) {
      console.error('Error updating ATM loading record:', error);
      throw error;
    }
  }

  // Delete ATM loading record
  async deleteATMLoading(id: number): Promise<void> {
    try {
      console.log('Deleting ATM loading record:', id);
      const response = await axios.delete(`${API_BASE_URL}/atm-loading/${id}`);
      console.log('ATM loading record deleted:', response.data);
    } catch (error) {
      console.error('Error deleting ATM loading record:', error);
      throw error;
    }
  }

  // Calculate total amount from denominations
  calculateTotalAmount(denominations: ATMLoadingDenominations): number {
    return (
      (denominations.ones || 0) * 1 +
      (denominations.fives || 0) * 5 +
      (denominations.tens || 0) * 10 +
      (denominations.twenties || 0) * 20 +
      (denominations.forties || 0) * 40 +
      (denominations.fifties || 0) * 50 +
      (denominations.hundreds || 0) * 100 +
      (denominations.twoHundreds || 0) * 200 +
      (denominations.fiveHundreds || 0) * 500 +
      (denominations.thousands || 0) * 1000
    );
  }

  // Format denominations for display
  formatDenominations(record: ATMLoadingRecord): ATMLoadingDenominations {
    return {
      ones: record.ones || 0,
      fives: record.fives || 0,
      tens: record.tens || 0,
      twenties: record.twenties || 0,
      forties: record.forties || 0,
      fifties: record.fifties || 0,
      hundreds: record.hundreds || 0,
      twoHundreds: record.twoHundreds || 0,
      fiveHundreds: record.fiveHundreds || 0,
      thousands: record.thousands || 0
    };
  }
}

export default new ATMLoadingTableService(); 