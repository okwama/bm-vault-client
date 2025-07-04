import api from './api';

export interface CashProcessing {
  id: number;
  cash_count_id: number;
  request_id: number;
  expected_total: number;
  processed_total: number;
  difference: number;
  matched: boolean;
  expected_ones: number;
  expected_fives: number;
  expected_tens: number;
  expected_twenties: number;
  expected_forties: number;
  expected_fifties: number;
  expected_hundreds: number;
  expected_twoHundreds: number;
  expected_fiveHundreds: number;
  expected_thousands: number;
  processed_ones: number;
  processed_fives: number;
  processed_tens: number;
  processed_twenties: number;
  processed_forties: number;
  processed_fifties: number;
  processed_hundreds: number;
  processed_twoHundreds: number;
  processed_fiveHundreds: number;
  processed_thousands: number;
  comment?: string;
  created_at: string;
  user_name?: string;
  pickup_location?: string;
  delivery_location?: string;
  branch_name?: string;
  branch_id?: number;
  client_name?: string;
  client_id?: number;
  team_name?: string;
  team_id?: number;
  team_members?: TeamMember[];
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  empl_no: string;
  photo_url: string;
}

export interface CreateCashProcessingData {
  cash_count_id: number;
  request_id: number;
  expected_total: number;
  processed_total: number;
  difference: number;
  matched: boolean;
  expected_denominations: {
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
  };
  processed_denominations: {
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
  };
  comment?: string;
}

export const cashProcessingService = {
  // Get all cash processing records
  getAllCashProcessing: async (): Promise<CashProcessing[]> => {
    try {
      const response = await api.get<CashProcessing[]>('/cash-processing');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching cash processing records:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch cash processing records');
    }
  },

  // Get cash processing by ID
  getCashProcessingById: async (id: string): Promise<CashProcessing> => {
    try {
      const response = await api.get<CashProcessing>(`/cash-processing/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching cash processing record:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch cash processing record');
    }
  },

  // Get cash processing by cash count ID
  getCashProcessingByCashCountId: async (cashCountId: string): Promise<CashProcessing> => {
    try {
      const response = await api.get<CashProcessing>(`/cash-counts/${cashCountId}/processing`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching cash processing by cash count ID:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch cash processing record');
    }
  },

  // Create new cash processing record
  createCashProcessing: async (data: CreateCashProcessingData): Promise<CashProcessing> => {
    try {
      const response = await api.post<CashProcessing>('/cash-processing', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating cash processing record:', error);
      throw new Error(error.response?.data?.message || 'Failed to create cash processing record');
    }
  },

  // Calculate total from denominations
  calculateTotal: (denominations: {
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
  }): number => {
    return (
      denominations.ones * 1 +
      denominations.fives * 5 +
      denominations.tens * 10 +
      denominations.twenties * 20 +
      denominations.forties * 40 +
      denominations.fifties * 50 +
      denominations.hundreds * 100 +
      denominations.twoHundreds * 200 +
      denominations.fiveHundreds * 500 +
      denominations.thousands * 1000
    );
  }
}; 