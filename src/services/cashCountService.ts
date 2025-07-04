import api from './api';

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  empl_no: string;
  photo_url: string;
}

export interface CashCount {
  id: number;
  request_id: number;
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
  created_at: string;
  cash_count_status?: string;
  user_name?: string;
  pickup_location?: string;
  delivery_location?: string;
  status?: string;
  branch_name?: string;
  branch_id?: number;
  client_name?: string;
  client_id?: number;
  team_name?: string;
  team_id?: number;
  team_members?: TeamMember[];
}

export interface CreateCashCountData {
  request_id: number;
  ones?: number;
  fives?: number;
  tens?: number;
  twenties?: number;
  forties?: number;
  fifties?: number;
  hundreds?: number;
  twoHundreds?: number;
  fiveHundreds?: number;
  thousands?: number;
}

export interface UpdateCashCountData {
  ones?: number;
  fives?: number;
  tens?: number;
  twenties?: number;
  forties?: number;
  fifties?: number;
  hundreds?: number;
  twoHundreds?: number;
  fiveHundreds?: number;
  thousands?: number;
}

export const cashCountService = {
  // Get all cash counts
  getAllCashCounts: async (): Promise<CashCount[]> => {
    try {
      const response = await api.get<CashCount[]>('/cash-counts');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching cash counts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch cash counts');
    }
  },

  // Get cash count by ID
  getCashCountById: async (id: string): Promise<CashCount> => {
    try {
      const response = await api.get<CashCount>(`/cash-counts/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching cash count:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch cash count');
    }
  },

  // Get cash count by request ID
  getCashCountByRequestId: async (requestId: string): Promise<CashCount> => {
    try {
      const response = await api.get<CashCount>(`/requests/${requestId}/cash-count`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching cash count by request ID:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch cash count');
    }
  },

  // Create new cash count
  createCashCount: async (data: CreateCashCountData): Promise<CashCount> => {
    try {
      const response = await api.post<CashCount>('/cash-counts', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating cash count:', error);
      throw new Error(error.response?.data?.message || 'Failed to create cash count');
    }
  },

  // Update cash count
  updateCashCount: async (id: string, data: UpdateCashCountData): Promise<CashCount> => {
    try {
      const response = await api.put<CashCount>(`/cash-counts/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating cash count:', error);
      throw new Error(error.response?.data?.message || 'Failed to update cash count');
    }
  },

  // Delete cash count
  deleteCashCount: async (id: string): Promise<void> => {
    try {
      await api.delete(`/cash-counts/${id}`);
    } catch (error: any) {
      console.error('Error deleting cash count:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete cash count');
    }
  },

  // Calculate total amount from cash count
  calculateTotal: (cashCount: CashCount): number => {
    return (
      cashCount.ones * 1 +
      cashCount.fives * 5 +
      cashCount.tens * 10 +
      cashCount.twenties * 20 +
      cashCount.forties * 40 +
      cashCount.fifties * 50 +
      cashCount.hundreds * 100 +
      cashCount.twoHundreds * 200 +
      cashCount.fiveHundreds * 500 +
      cashCount.thousands * 1000
    );
  }
}; 