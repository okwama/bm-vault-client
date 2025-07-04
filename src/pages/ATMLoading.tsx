import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, SaveIcon, AlertCircleIcon } from 'lucide-react';
import { clientService } from '../services/clientService';
import { getATMs, ATM } from '../services/atmService';
import atmLoadingService, { ATMLoadingTransaction } from '../services/atmLoadingService';

interface Client {
  id: number;
  name: string;
  account_number: string;
}

const denominationList = [
  { key: 'ones', label: 'Ones (1)', value: 1 },
  { key: 'fives', label: 'Fives (5)', value: 5 },
  { key: 'tens', label: 'Tens (10)', value: 10 },
  { key: 'twenties', label: 'Twenties (20)', value: 20 },
  { key: 'forties', label: 'Forties (40)', value: 40 },
  { key: 'fifties', label: 'Fifties (50)', value: 50 },
  { key: 'hundreds', label: 'Hundreds (100)', value: 100 },
  { key: 'twoHundreds', label: 'Two Hundreds (200)', value: 200 },
  { key: 'fiveHundreds', label: 'Five Hundreds (500)', value: 500 },
  { key: 'thousands', label: 'Thousands (1000)', value: 1000 }
];

const ATMLoading: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [atms, setAtms] = useState<ATM[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [selectedATM, setSelectedATM] = useState<string | null>(null);
  const [loadingDate, setLoadingDate] = useState<string>('');
  const [denominations, setDenominations] = useState<Record<string, number>>({
    ones: 0, fives: 0, tens: 0, twenties: 0, forties: 0,
    fifties: 0, hundreds: 0, twoHundreds: 0, fiveHundreds: 0, thousands: 0
  });
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
    setLoadingDate(new Date().toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchATMs(selectedClient);
    } else {
      setAtms([]);
      setSelectedATM(null);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const clientsData = await clientService.getClients();
      setClients(clientsData);
    } catch (err: any) {
      setError('Failed to fetch clients: ' + err.message);
    }
  };

  const fetchATMs = async (clientId: number) => {
    try {
      const atmsData = await getATMs(clientId.toString());
      setAtms(atmsData);
    } catch (err: any) {
      setError('Failed to fetch ATMs: ' + err.message);
    }
  };

  const handleDenominationChange = (key: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setDenominations(prev => ({
      ...prev,
      [key]: numValue
    }));
  };

  const calculateTotal = () => {
    return denominationList.reduce((sum, denom) => {
      return sum + (denominations[denom.key] * denom.value);
    }, 0);
  };

  const resetForm = () => {
    setSelectedClient(null);
    setSelectedATM(null);
    setLoadingDate(new Date().toISOString().slice(0, 10));
    setDenominations({
      ones: 0, fives: 0, tens: 0, twenties: 0, forties: 0,
      fifties: 0, hundreds: 0, twoHundreds: 0, fiveHundreds: 0, thousands: 0
    });
    setComment('');
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient) {
      setError('Please select a client');
      return;
    }

    if (!selectedATM) {
      setError('Please select an ATM');
      return;
    }

    if (!loadingDate) {
      setError('Please select a loading date');
      return;
    }

    const total = calculateTotal();
    if (total === 0) {
      setError('Please enter at least one denomination amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create ATM loading transaction
      const transactionData: ATMLoadingTransaction = {
        client_id: selectedClient,
        atm_id: parseInt(selectedATM!),
        amount: total,
        denominations: {
          ones: denominations.ones,
          fives: denominations.fives,
          tens: denominations.tens,
          twenties: denominations.twenties,
          forties: denominations.forties,
          fifties: denominations.fifties,
          hundreds: denominations.hundreds,
          twoHundreds: denominations.twoHundreds,
          fiveHundreds: denominations.fiveHundreds,
          thousands: denominations.thousands
        },
        comment: comment || 'ATM replenishment',
        loading_date: loadingDate
      };

      // Call the ATM loading service
      const response = await atmLoadingService.createATMLoading(transactionData);

      setSuccess(`ATM loading transaction recorded successfully. Total amount: KSh ${total.toLocaleString()}. New client balance: KSh ${response.newBalance?.toLocaleString() || 'N/A'}. New vault balance: KSh ${response.newVaultBalance?.toLocaleString() || 'N/A'}`);
      resetForm();
      
    } catch (err: any) {
      setError('Failed to record ATM loading: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <ArrowLeftIcon size={20} />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">ATM Loading</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <AlertCircleIcon size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Client *
            </label>
            <select
              value={selectedClient || ''}
              onChange={(e) => setSelectedClient(Number(e.target.value) || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.account_number})
                </option>
              ))}
            </select>
          </div>

          {/* ATM Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select ATM *
            </label>
            <select
              value={selectedATM || ''}
              onChange={(e) => setSelectedATM(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!selectedClient}
            >
              <option value="">Choose an ATM...</option>
              {atms.map((atm) => (
                <option key={atm.id} value={atm.id}>
                  {atm.atm_code} - {atm.location}
                </option>
              ))}
            </select>
            {!selectedClient && (
              <p className="text-sm text-gray-500 mt-1">Please select a client first</p>
            )}
          </div>

          {/* Loading Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loading Date *
            </label>
            <input
              type="date"
              value={loadingDate}
              onChange={(e) => setLoadingDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Denominations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Denomination Breakdown *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {denominationList.map((denom) => (
                <div key={denom.key} className="space-y-2">
                  <label className="block text-sm text-gray-600">{denom.label}</label>
                  <input
                    type="number"
                    min="0"
                    value={denominations[denom.key]}
                    onChange={(e) => handleDenominationChange(denom.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500">
                    {formatCurrency(denominations[denom.key] * denom.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-blue-900">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-900">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter any additional notes about this ATM loading..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <SaveIcon size={20} />
                  Record ATM Loading
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ATMLoading; 