import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSignIcon, TrendingUpIcon, TrendingDownIcon, RefreshCwIcon, EyeIcon, FileTextIcon, FilterIcon } from 'lucide-react';
import vaultService, { VaultBalance, VaultUpdate } from '../services/vaultService';

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

const VaultView: React.FC = () => {
  const navigate = useNavigate();
  const [vaultData, setVaultData] = useState<VaultBalance | null>(null);
  const [vaultUpdates, setVaultUpdates] = useState<VaultUpdate[]>([]);
  const [filteredUpdates, setFilteredUpdates] = useState<VaultUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVaultId, setSelectedVaultId] = useState(1);
  const [showDenomModal, setShowDenomModal] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<VaultUpdate | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  useEffect(() => {
    fetchVaultData();
  }, [selectedVaultId]);

  useEffect(() => {
    filterTransactions();
  }, [vaultUpdates, startDate, endDate]);

  const fetchVaultData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch vault balance and denominations
      const balanceData = await vaultService.getVaultBalance(selectedVaultId);
      setVaultData(balanceData);
      
      // Fetch vault update history
      const updatesData = await vaultService.getVaultUpdates(selectedVaultId);
      setVaultUpdates(updatesData);
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vault data');
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...vaultUpdates];

    if (startDate) {
      filtered = filtered.filter(update => 
        new Date(update.created_at) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(update => 
        new Date(update.created_at) <= new Date(endDate + 'T23:59:59')
      );
    }

    setFilteredUpdates(filtered);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setFilteredUpdates([...vaultUpdates]);
  };

  const getFilterSummary = () => {
    if (!startDate && !endDate) return null;
    
    const totalFiltered = filteredUpdates.length;
    const totalAmount = filteredUpdates.reduce((sum, update) => {
      return sum + (update.amount_in || 0) - (update.amount_out || 0);
    }, 0);

    return {
      totalFiltered,
      totalAmount,
      hasFilter: startDate || endDate
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDenominationTotal = (denominations: any) => {
    return vaultService.calculateTotal(denominations);
  };

  const openBalanceCertificate = () => {
    navigate(`/balance-certificate/${selectedVaultId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Vault Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <FilterIcon size={20} />
            Filter
          </button>
          <button
            onClick={fetchVaultData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCwIcon size={20} />
            Refresh
          </button>
          <button
            onClick={openBalanceCertificate}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <FileTextIcon size={20} />
            Balance Certificate
          </button>
        </div>
      </div>

      {/* Date Filter Section */}
      {showDateFilter && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Filter Transactions</h3>
            <button
              onClick={() => setShowDateFilter(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearDateFilter}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Clear Filter
              </button>
            </div>
          </div>

          {getFilterSummary()?.hasFilter && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-900">
                  Showing {getFilterSummary()?.totalFiltered} of {vaultUpdates.length} transactions
                </span>
                <span className="text-sm font-semibold text-blue-900">
                  Net Amount: {formatCurrency(getFilterSummary()?.totalAmount || 0)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {vaultData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Vault Overview Card */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{vaultData.name}</h2>
                <span className="text-sm text-gray-500">ID: {vaultData.id}</span>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Current Balance</span>
                  <DollarSignIcon size={20} className="text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(vaultData.current_balance)}
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>Last Updated: {formatDate(vaultData.updated_at)}</p>
                <p>Created: {formatDate(vaultData.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Denomination Breakdown Card */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Denomination Breakdown</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Ones (1)</p>
                  <p className="text-lg font-semibold text-gray-900">{vaultData.ones}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(vaultData.ones * 1)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Fives (5)</p>
                  <p className="text-lg font-semibold text-gray-900">{vaultData.fives}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(vaultData.fives * 5)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Tens (10)</p>
                  <p className="text-lg font-semibold text-gray-900">{vaultData.tens}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(vaultData.tens * 10)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Twenties (20)</p>
                  <p className="text-lg font-semibold text-gray-900">{vaultData.twenties}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(vaultData.twenties * 20)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Forties (40)</p>
                  <p className="text-lg font-semibold text-gray-900">{vaultData.forties}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(vaultData.forties * 40)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Fifties (50)</p>
                  <p className="text-lg font-semibold text-gray-900">{vaultData.fifties}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(vaultData.fifties * 50)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Hundreds (100)</p>
                  <p className="text-lg font-semibold text-gray-900">{vaultData.hundreds}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(vaultData.hundreds * 100)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Two Hundreds (200)</p>
                  <p className="text-lg font-semibold text-gray-900">{vaultData.twoHundreds}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(vaultData.twoHundreds * 200)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Five Hundreds (500)</p>
                  <p className="text-lg font-semibold text-gray-900">{vaultData.fiveHundreds}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(vaultData.fiveHundreds * 500)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Thousands (1000)</p>
                  <p className="text-lg font-semibold text-gray-900">{vaultData.thousands}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(vaultData.thousands * 1000)}</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-900">Total from Denominations</span>
                  <span className="text-xl font-bold text-blue-900">
                    {formatCurrency(calculateDenominationTotal(vaultData))}
                  </span>
                </div>
                {Math.abs(calculateDenominationTotal(vaultData) - vaultData.current_balance) > 0.01 && (
                  <p className="text-sm text-red-600 mt-1">
                    ⚠️ Discrepancy detected between balance and denomination total
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
            {getFilterSummary()?.hasFilter && (
              <span className="text-sm text-gray-600">
                Filtered: {getFilterSummary()?.totalFiltered} transactions
              </span>
            )}
          </div>
        </div>
        
        {filteredUpdates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {getFilterSummary()?.hasFilter ? 'No transactions found for the selected date range' : 'No transactions found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Denominations
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUpdates.map((update) => (
                  <tr key={update.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(update.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {update.amount_in > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <TrendingUpIcon size={12} className="mr-1" />
                          Received
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          <TrendingDownIcon size={12} className="mr-1" />
                          Withdrawn
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      {update.amount_in > 0 ? (
                        <span className="text-green-600">+{formatCurrency(update.amount_in)}</span>
                      ) : (
                        <span className="text-red-600">-{formatCurrency(update.amount_out)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(update.new_balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {update.client_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {update.branch_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {update.team_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {update.comment || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        onClick={() => { setSelectedUpdate(update); setShowDenomModal(true); }}
                        title="View Denominations"
                      >
                        <EyeIcon size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Denomination Modal */}
      {showDenomModal && selectedUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Denomination Breakdown</h2>
              <button
                onClick={() => setShowDenomModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Transaction ID: <span className="font-semibold">{selectedUpdate.id}</span>
              </p>
              <p className="text-gray-700 mb-2">
                Date: <span className="font-semibold">{formatDate(selectedUpdate.created_at)}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {denominationList.map(denom => (
                <div key={denom.key} className="bg-gray-50 p-3 rounded text-center">
                  <p className="text-sm text-gray-600">{denom.label}</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedUpdate[denom.key as keyof VaultUpdate] as number || 0}</p>
                  <p className="text-sm text-gray-500">{formatCurrency((selectedUpdate[denom.key as keyof VaultUpdate] as number || 0) * denom.value)}</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Total from Denominations</h4>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(calculateDenominationTotal(selectedUpdate))}
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDenomModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultView; 