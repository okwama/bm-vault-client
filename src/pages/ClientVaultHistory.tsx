import React, { useState, useEffect } from 'react';
import { DollarSignIcon, TrendingUpIcon, TrendingDownIcon, RefreshCwIcon, EyeIcon, CheckIcon, XIcon, FileTextIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clientUpdateService, { ClientUpdate } from '../services/clientUpdateService';
import { cashProcessingService, CashProcessing } from '../services/cashProcessingService';
import { clientService } from '../services/clientService';

interface Client {
  id: number;
  name: string;
}

interface ClientVaultSummary {
  clientId: number;
  clientName: string;
  totalCredits: number;
  totalDebits: number;
  netBalance: number;
  transactionCount: number;
  processingCount: number;
  lastTransaction: string;
}

const ClientVaultHistory: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSummaries, setClientSummaries] = useState<ClientVaultSummary[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [clientUpdates, setClientUpdates] = useState<ClientUpdate[]>([]);
  const [clientProcessingRecords, setClientProcessingRecords] = useState<CashProcessing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);

  useEffect(() => {
    fetchClientVaultData();
  }, []);

  const fetchClientVaultData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all clients
      const clientsData = await clientService.getClients();
      console.log('Clients data:', clientsData);
      setClients(clientsData);
      
      // Calculate client summaries
      const summaries: ClientVaultSummary[] = [];
      
      for (const client of clientsData) {
        try {
          // Fetch client updates for each client
          const clientUpdates = await clientUpdateService.getClientUpdates(client.id);
          console.log(`Client ${client.name} updates:`, clientUpdates);
          
          // Log each transaction for debugging
          clientUpdates.forEach((update, index) => {
            console.log(`Transaction ${index + 1}:`, {
              type: update.type,
              amount: update.amount,
              amountType: typeof update.amount,
              parsedAmount: Number(update.amount)
            });
          });
          
          const totalCredits = clientUpdates
            .filter((update: ClientUpdate) => update.type === 'credit')
            .reduce((sum: number, update: ClientUpdate) => {
              const amount = Number(update.amount) || 0;
              console.log(`Adding credit: ${amount} to sum: ${sum}`);
              return sum + amount;
            }, 0);
          
          const totalDebits = clientUpdates
            .filter((update: ClientUpdate) => update.type === 'debit')
            .reduce((sum: number, update: ClientUpdate) => {
              const amount = Number(update.amount) || 0;
              console.log(`Adding debit: ${amount} to sum: ${sum}`);
              return sum + amount;
            }, 0);
          
          const netBalance = totalCredits - totalDebits;
          
          console.log(`Client ${client.name} totals:`, { totalCredits, totalDebits, netBalance });
          
          const lastTransaction = clientUpdates.length > 0 
            ? clientUpdates[0].created_at 
            : 'No transactions';
          
          summaries.push({
            clientId: client.id,
            clientName: client.name,
            totalCredits,
            totalDebits,
            netBalance,
            transactionCount: clientUpdates.length,
            processingCount: 0, // Will be updated below
            lastTransaction
          });
        } catch (err) {
          console.error(`Error fetching updates for client ${client.id}:`, err);
          // Add client with zero values if there's an error
          summaries.push({
            clientId: client.id,
            clientName: client.name,
            totalCredits: 0,
            totalDebits: 0,
            netBalance: 0,
            transactionCount: 0,
            processingCount: 0,
            lastTransaction: 'No transactions'
          });
        }
      }
      
      console.log('Calculated summaries:', summaries);
      
      // Fetch processing records to get processing counts
      const allProcessingRecords = await cashProcessingService.getAllCashProcessing();
      console.log('Processing records:', allProcessingRecords);
      
      // Update processing counts
      summaries.forEach(summary => {
        const clientProcessing = allProcessingRecords.filter(record => {
          // Ensure both values are numbers for comparison
          const recordClientId = typeof record.client_id === 'string' ? parseInt(record.client_id) : record.client_id;
          return recordClientId === summary.clientId;
        });
        summary.processingCount = clientProcessing.length;
      });
      
      setClientSummaries(summaries);
      
    } catch (err: any) {
      console.error('Error in fetchClientVaultData:', err);
      setError(err.message || 'Failed to fetch client vault data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewClientDetails = async (clientId: number) => {
    try {
      setSelectedClient(clientId);
      
      // Fetch client-specific updates
      const clientUpdates = await clientUpdateService.getClientUpdates(clientId);
      setClientUpdates(clientUpdates);
      
      // Fetch client-specific processing records
      const allProcessingRecords = await cashProcessingService.getAllCashProcessing();
      const clientProcessing = allProcessingRecords.filter(record => {
        const recordClientId = typeof record.client_id === 'string' ? parseInt(record.client_id) : record.client_id;
        return recordClientId === clientId;
      });
      setClientProcessingRecords(clientProcessing);
      
      setShowClientDetails(true);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch client details');
    }
  };

  const formatCurrency = (amount: number) => {
    // Handle undefined, null, or NaN values
    if (amount === undefined || amount === null || isNaN(amount)) {
      console.log('formatCurrency received invalid value:', amount);
      return 'KSh 0.00';
    }
    
    // Ensure amount is a number
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
      console.log('formatCurrency failed to convert to number:', amount);
      return 'KSh 0.00';
    }
    
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(numericAmount);
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

  const getTransactionTypeLabel = (update: ClientUpdate) => {
    if (update.atm_code) {
      return 'ATM Loading';
    }
    return update.type === 'credit' ? 'Credit' : 'Debit';
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
        <h1 className="text-3xl font-bold text-gray-900">Client Transaction History</h1>
        <button
          onClick={fetchClientVaultData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCwIcon size={20} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Client Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {clientSummaries.map((summary) => (
          <div key={summary.clientId} className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">{summary.clientName}</h3>
              <button
                onClick={() => handleViewClientDetails(summary.clientId)}
                className="text-blue-600 hover:text-blue-900"
                title="View Details"
              >
                <EyeIcon size={16} />
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Net Balance:</span>
                <span className={`font-semibold ${
                  summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(summary.netBalance)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total Credits:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(summary.totalCredits)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total Debits:</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(summary.totalDebits)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Transactions:</span>
                <span className="font-semibold text-gray-900">
                  {summary.transactionCount}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Records:</span>
                <span className="font-semibold text-gray-900">
                  {summary.processingCount}
                </span>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Last Transaction: {summary.lastTransaction === 'No transactions' ? 
                    'No transactions' : formatDate(summary.lastTransaction)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Client Details Modal */}
      {showClientDetails && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {clientSummaries.find(s => s.clientId === selectedClient)?.clientName} - Transaction History
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/client-balance-certificate/${selectedClient}`)}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                >
                  <FileTextIcon size={16} />
                  Balance Certificate
                </button>
                <button
                  onClick={() => setShowClientDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {(() => {
                const summary = clientSummaries.find(s => s.clientId === selectedClient);
                if (!summary) return null;
                
                return (
                  <>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Net Balance</h4>
                      <p className={`text-2xl font-bold ${
                        summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(summary.netBalance)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900">Total Credits</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(summary.totalCredits)}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-red-900">Total Debits</h4>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(summary.totalDebits)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900">Processing Records</h4>
                      <p className="text-2xl font-bold text-gray-600">
                        {summary.processingCount}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Tabs for Transactions and Processing History */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button className="border-b-2 border-blue-500 py-2 px-1 text-sm font-medium text-blue-600">
                    Transactions ({clientUpdates.length})
                  </button>
                  <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Processing History ({clientProcessingRecords.length})
                  </button>
                </nav>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Client Transactions</h3>
              {clientUpdates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No transactions found for this client</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Balance</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ATM</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comment</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientUpdates.map((update) => (
                        <tr key={update.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(update.created_at)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {update.type === 'credit' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                <TrendingUpIcon size={12} className="mr-1" />
                                {getTransactionTypeLabel(update)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                <TrendingDownIcon size={12} className="mr-1" />
                                {getTransactionTypeLabel(update)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                            {update.type === 'credit' ? (
                              <span className="text-green-600">+{formatCurrency(Number(update.amount) || 0)}</span>
                            ) : (
                              <span className="text-red-600">-{formatCurrency(Number(update.amount) || 0)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(Number(update.new_balance) || 0)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {update.branch_name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {update.team_name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {update.atm_code ? `${update.atm_code} - ${update.atm_location}` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                            {update.comment || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Processing History Table */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Cash Processing History</h3>
              {clientProcessingRecords.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No processing records found for this client</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difference</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientProcessingRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(record.created_at)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{record.request_id}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(record.expected_total || 0)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(record.processed_total || 0)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`font-medium ${
                              (record.difference || 0) === 0 ? 'text-gray-600' : 
                              (record.processed_total || 0) > (record.expected_total || 0) ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {(record.difference || 0) === 0 ? 'No difference' : 
                               (record.processed_total || 0) > (record.expected_total || 0) ? '+' : ''}{formatCurrency(record.difference || 0)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {record.matched ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                <CheckIcon size={12} className="mr-1" />
                                Matched
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                <XIcon size={12} className="mr-1" />
                                Mismatch
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {record.branch_name || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowClientDetails(false)}
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

export default ClientVaultHistory; 