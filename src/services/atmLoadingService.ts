const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bm-vault-server.vercel.app';

export interface ATMLoadingTransaction {
  client_id: number;
  atm_id: number;
  amount: number;
  denominations: {
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
  loading_date?: string;
}

export interface ATMLoadingResponse {
  message: string;
  transaction: any;
  newBalance: number;
  newVaultBalance: number;
}

const atmLoadingService = {
  // Create ATM loading transaction
  createATMLoading: async (transactionData: ATMLoadingTransaction): Promise<ATMLoadingResponse> => {
    try {
      console.log('Creating ATM loading transaction:', transactionData);
      
      const response = await fetch(`${API_BASE_URL}/api/atm-loading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create ATM loading transaction');
      }

      const data = await response.json();
      console.log('ATM loading transaction created:', data);
      return data;
    } catch (error) {
      console.error('Error creating ATM loading transaction:', error);
      throw error;
    }
  },

  // Get all ATM loading transactions
  getAllATMLoading: async (): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/atm-loading`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch ATM loading transactions');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching ATM loading transactions:', error);
      throw error;
    }
  },

  // Get ATM loading history for a specific client
  getATMLoadingHistory: async (clientId: string): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/atm-loading/client/${clientId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch ATM loading history');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching ATM loading history:', error);
      throw error;
    }
  },

  // Get ATM loading history for a specific ATM
  getATMLoadingHistoryByATM: async (atmId: string): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/atm-loading/atm/${atmId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch ATM loading history');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching ATM loading history by ATM:', error);
      throw error;
    }
  }
};

export default atmLoadingService; 