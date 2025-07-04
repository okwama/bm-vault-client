import { api } from './api';
import axios from 'axios';

// Create a separate API instance for vault operations that doesn't require auth
const vaultApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://bm-vault-server.vercel.app',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000,
  withCredentials: true
});

// Add request interceptor for debugging
vaultApi.interceptors.request.use(
  (config) => {
    console.log('Vault API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Vault API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
vaultApi.interceptors.response.use(
  (response) => {
    console.log('Vault API Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Vault API Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export interface VaultBalance {
  id: number;
  name: string;
  current_balance: number;
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
  updated_at: string;
}

export interface VaultUpdate {
  id: number;
  vault_id: number;
  client_id?: number;
  branch_id?: number;
  team_id?: number;
  amount_in: number;
  amount_out: number;
  new_balance: number;
  comment?: string;
  created_at: string;
  client_name?: string;
  branch_name?: string;
  team_name?: string;
}

export interface Denominations {
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

export interface ReceiveAmountRequest {
  vaultId?: number;
  clientId?: number;
  branchId?: number;
  teamId?: number;
  amount: number;
  comment?: string;
  cashCountId?: number;
  denominations?: Denominations;
}

export interface WithdrawAmountRequest {
  vaultId?: number;
  clientId?: number;
  branchId?: number;
  teamId?: number;
  amount: number;
  comment?: string;
  denominations?: Denominations;
}

const vaultService = {
  // Get vault balance
  getVaultBalance: async (vaultId: number = 1): Promise<VaultBalance> => {
    console.log('getVaultBalance called with vaultId:', vaultId);
    const response = await vaultApi.get(`/vault/${vaultId}/balance`);
    console.log('getVaultBalance response:', response);
    return response.data;
  },

  // Get vault update history
  getVaultUpdates: async (vaultId: number = 1): Promise<VaultUpdate[]> => {
    console.log('getVaultUpdates called with vaultId:', vaultId);
    const response = await vaultApi.get(`/vault/${vaultId}/updates`);
    console.log('getVaultUpdates response:', response);
    return response.data;
  },

  // Receive amount into vault
  receiveAmount: async (data: ReceiveAmountRequest): Promise<{ message: string; update: VaultUpdate; newBalance: number }> => {
    console.log('receiveAmount called with data:', data);
    try {
      const response = await vaultApi.post('/vault/receive', data);
      console.log('receiveAmount response:', response);
      return response.data;
    } catch (error) {
      console.error('receiveAmount error:', error);
      throw error;
    }
  },

  // Withdraw amount from vault
  withdrawAmount: async (data: WithdrawAmountRequest): Promise<{ message: string; update: VaultUpdate; newBalance: number }> => {
    console.log('withdrawAmount called with data:', data);
    try {
      const response = await vaultApi.post('/vault/withdraw', data);
      console.log('withdrawAmount response:', response);
      return response.data;
    } catch (error) {
      console.error('withdrawAmount error:', error);
      throw error;
    }
  },

  // Calculate total from denominations
  calculateTotal: (denominations: Denominations): number => {
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

export default vaultService; 