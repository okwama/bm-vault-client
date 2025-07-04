import { api } from './api';

export interface ClientUpdate {
  id: number;
  client_id: number;
  branch_id?: number;
  team_id?: number;
  atm_id?: number;
  type: 'credit' | 'debit';
  amount: number;
  new_balance: number;
  comment?: string;
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
  branch_name?: string;
  team_name?: string;
  atm_code?: string;
  atm_location?: string;
}

export interface ClientBalance {
  currentBalance: number;
  currentDenoms: {
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
  lastUpdate: ClientUpdate | null;
}

export interface ClientBalanceCertificate {
  client: {
    id: number;
    name: string;
    account_number: string;
    email: string;
    phone?: string;
    address?: string;
  };
  selectedDate: string;
  prevClosingBalance: number;
  prevClosingDenoms: {
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
  dateCredits: ClientUpdate[];
  dateDebits: ClientUpdate[];
  dateCreditsTotal: number;
  dateDebitsTotal: number;
  dateCreditsDenoms: {
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
  dateDebitsDenoms: {
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
  closingBalance: number;
  closingDenoms: {
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
  dateTransactions: ClientUpdate[];
}

const clientUpdateService = {
  // Get client update history
  getClientUpdates: async (clientId: number): Promise<ClientUpdate[]> => {
    try {
      const response = await api.get<ClientUpdate[]>(`/clients/${clientId}/updates`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching client updates:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch client updates');
    }
  },

  // Get current client balance
  getClientBalance: async (clientId: number): Promise<ClientBalance> => {
    try {
      const response = await api.get<ClientBalance>(`/clients/${clientId}/balance`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching client balance:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch client balance');
    }
  },

  // Get client balance certificate for a specific date
  getClientBalanceCertificate: async (clientId: number, date: string): Promise<ClientBalanceCertificate> => {
    try {
      const response = await api.get<ClientBalanceCertificate>(`/clients/${clientId}/balance-certificate`, {
        params: { date }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching client balance certificate:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch client balance certificate');
    }
  },

  // Calculate total from denominations
  calculateTotal: (denominations: any): number => {
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
};

export default clientUpdateService; 