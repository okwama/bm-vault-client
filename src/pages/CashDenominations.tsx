import React, { useState, useEffect } from 'react';
import { PlusIcon, EditIcon, TrashIcon, EyeIcon, DollarSignIcon, CheckIcon, XIcon, TrendingUpIcon } from 'lucide-react';
import { CashCount, cashCountService } from '../services/cashCountService';
import vaultService, { ReceiveAmountRequest } from '../services/vaultService';
import { cashProcessingService, CreateCashProcessingData } from '../services/cashProcessingService';
import { requestService } from '../services/requestService';

const CashDenominations: React.FC = () => {
  const [cashCounts, setCashCounts] = useState<CashCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCashCount, setSelectedCashCount] = useState<CashCount | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [receivingAmount, setReceivingAmount] = useState<number | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveComment, setReceiveComment] = useState('');
  const [showCashProcessingModal, setShowCashProcessingModal] = useState(false);
  const [processedDenominations, setProcessedDenominations] = useState({
    ones: 0,
    fives: 0,
    tens: 0,
    twenties: 0,
    forties: 0,
    fifties: 0,
    hundreds: 0,
    twoHundreds: 0,
    fiveHundreds: 0,
    thousands: 0
  });

  useEffect(() => {
    fetchCashCounts();
  }, []);

  const fetchCashCounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cashCountService.getAllCashCounts();
      console.log('Fetched cash counts:', data);
      console.log('Available request IDs:', data.map(cc => cc.request_id));
      
      // Filter to only show pending cash counts
      const pendingCashCounts = data.filter(cc => cc.cash_count_status !== 'received');
      console.log('Filtered pending cash counts:', pendingCashCounts);
      
      setCashCounts(pendingCashCounts);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cash counts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this cash count?')) {
      return;
    }

    try {
      await cashCountService.deleteCashCount(id.toString());
      await fetchCashCounts();
    } catch (err: any) {
      setError(err.message || 'Failed to delete cash count');
    }
  };

  const handleViewDetails = (cashCount: CashCount) => {
    setSelectedCashCount(cashCount);
    setShowDetailsModal(true);
  };

  const handleReceiveAmount = (cashCount: CashCount) => {
    console.log('handleReceiveAmount called with cashCount:', cashCount);
    
    // Check if already received
    if (cashCount.cash_count_status === 'received') {
      alert('This amount has already been received into the vault.');
      return;
    }
    
    const totalAmount = cashCountService.calculateTotal(cashCount);
    console.log('Calculated total amount:', totalAmount);
    setReceivingAmount(totalAmount);
    setReceiveComment(`Cash count received from Request #${cashCount.request_id} - ${cashCount.client_name || 'Unknown Client'}`);
    
    // Initialize processed denominations with expected values
    setProcessedDenominations({
      ones: cashCount.ones,
      fives: cashCount.fives,
      tens: cashCount.tens,
      twenties: cashCount.twenties,
      forties: cashCount.forties,
      fifties: cashCount.fifties,
      hundreds: cashCount.hundreds,
      twoHundreds: cashCount.twoHundreds,
      fiveHundreds: cashCount.fiveHundreds,
      thousands: cashCount.thousands
    });
    
    setShowCashProcessingModal(true);
  };

  const calculateProcessedTotal = () => {
    return (
      processedDenominations.ones * 1 +
      processedDenominations.fives * 5 +
      processedDenominations.tens * 10 +
      processedDenominations.twenties * 20 +
      processedDenominations.forties * 40 +
      processedDenominations.fifties * 50 +
      processedDenominations.hundreds * 100 +
      processedDenominations.twoHundreds * 200 +
      processedDenominations.fiveHundreds * 500 +
      processedDenominations.thousands * 1000
    );
  };

  const getDenominationDifference = (expected: number, actual: number) => {
    const diff = actual - expected;
    return {
      value: diff,
      isPositive: diff > 0,
      isNegative: diff < 0,
      isZero: diff === 0
    };
  };

  const confirmCashProcessing = async () => {
    if (!selectedCashCount || !receivingAmount) {
      console.log('Missing selectedCashCount or receivingAmount');
      return;
    }

    const processedTotal = calculateProcessedTotal();
    const expectedTotal = cashCountService.calculateTotal(selectedCashCount);
    const difference = Math.abs(processedTotal - expectedTotal);
    const matched = difference === 0;
    
    // Check if there's a significant difference (more than 1% or 1000 KES)
    const percentageDifference = (difference / expectedTotal) * 100;
    
    if (difference > 1000 || percentageDifference > 1) {
      const proceed = window.confirm(
        `Warning: There is a significant difference between expected and processed amounts!\n\n` +
        `Expected: ${formatCurrency(expectedTotal)}\n` +
        `Processed: ${formatCurrency(processedTotal)}\n` +
        `Difference: ${formatCurrency(difference)}\n\n` +
        `Do you want to proceed with the processed amount?`
      );
      
      if (!proceed) {
        return;
      }
    }

    try {
      // Create cash processing record
      const processingData: CreateCashProcessingData = {
        cash_count_id: selectedCashCount.id,
        request_id: selectedCashCount.request_id,
        expected_total: expectedTotal,
        processed_total: processedTotal,
        difference: difference,
        matched: matched,
        expected_denominations: {
          ones: selectedCashCount.ones,
          fives: selectedCashCount.fives,
          tens: selectedCashCount.tens,
          twenties: selectedCashCount.twenties,
          forties: selectedCashCount.forties,
          fifties: selectedCashCount.fifties,
          hundreds: selectedCashCount.hundreds,
          twoHundreds: selectedCashCount.twoHundreds,
          fiveHundreds: selectedCashCount.fiveHundreds,
          thousands: selectedCashCount.thousands
        },
        processed_denominations: processedDenominations,
        comment: `Cash processing for Request #${selectedCashCount.request_id}`
      };

      console.log('Creating cash processing record:', processingData);
      await cashProcessingService.createCashProcessing(processingData);
      console.log('Cash processing record created successfully');

      // Update the receiving amount to the processed total
      setReceivingAmount(processedTotal);
      
      // Update comment to include processed amount information if there's a difference
      if (difference > 0) {
        setReceiveComment(prev => 
          `${prev} - Processed: ${formatCurrency(processedTotal)} (Expected: ${formatCurrency(expectedTotal)}, Difference: ${formatCurrency(difference)})`
        );
      }
      
      setShowCashProcessingModal(false);
      setShowReceiveModal(true);
      
    } catch (error) {
      console.error('Error creating cash processing record:', error);
      alert('Failed to create cash processing record. Please try again.');
    }
  };

  const confirmReceiveAmount = async () => {
    console.log('confirmReceiveAmount called');
    console.log('selectedCashCount:', selectedCashCount);
    console.log('receivingAmount:', receivingAmount);
    
    if (!selectedCashCount || !receivingAmount) {
      console.log('Missing selectedCashCount or receivingAmount');
      return;
    }

    try {
      console.log('Using client_id and branch_id from cash count data');
      
      const requestData: ReceiveAmountRequest = {
        vaultId: 1, // Default to Vault 1
        clientId: selectedCashCount.client_id, // Use client_id from cash count
        branchId: selectedCashCount.branch_id, // Use branch_id from cash count
        teamId: selectedCashCount.team_id,
        amount: receivingAmount,
        comment: receiveComment,
        cashCountId: selectedCashCount.id, // Add cash count ID to update status
        denominations: processedDenominations
      };

      console.log('Sending vault receive request:', requestData);

      const result = await vaultService.receiveAmount(requestData);
      console.log('Vault receive result:', result);
      
      // Show success message
      alert('Amount received successfully into vault!');
      
      // Refresh cash counts to get updated status
      await fetchCashCounts();
      
      // Close modal and reset state
      setShowReceiveModal(false);
      setReceivingAmount(null);
      setReceiveComment('');
      setSelectedCashCount(null);
      
    } catch (err: any) {
      console.error('Error receiving amount:', err);
      setError(err.message || 'Failed to receive amount into vault');
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Pending Expected Amounts</h1>
        <button
          onClick={() => {/* TODO: Add create functionality */}}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon size={20} />
          Add Cash Count
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {cashCounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Total Pending Amount */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSignIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-800">Total Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {formatCurrency(
                    cashCounts.reduce((sum, cc) => sum + cashCountService.calculateTotal(cc), 0)
                  )}
                </p>
                <p className="text-sm text-yellow-700">
                  {cashCounts.length} items
                </p>
              </div>
            </div>
          </div>

          {/* Pending Count */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUpIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-800">Pending Items</p>
                <p className="text-2xl font-bold text-orange-900">
                  {cashCounts.length}
                </p>
                <p className="text-sm text-orange-700">
                  Awaiting receipt
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {cashCounts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No cash counts found</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
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
                    Team Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cashCounts.map((cashCount) => (
                  <tr key={cashCount.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{cashCount.request_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cashCount.client_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cashCount.branch_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cashCount.team_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cashCount.team_members && cashCount.team_members.length > 0 ? (
                        <div className="max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {cashCount.team_members.map((member, index) => (
                              <span
                                key={member.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                title={`${member.name} - ${member.role}`}
                              >
                                {member.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cashCount.user_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {formatCurrency(cashCountService.calculateTotal(cashCount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        cashCount.cash_count_status === 'received' 
                          ? 'bg-green-100 text-green-800'
                          : cashCount.cash_count_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {cashCount.cash_count_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(cashCount.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(cashCount)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon size={16} />
                        </button>
                        <button
                          onClick={() => handleReceiveAmount(cashCount)}
                          disabled={cashCount.cash_count_status === 'received'}
                          className={`${
                            cashCount.cash_count_status === 'received'
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={cashCount.cash_count_status === 'received' ? 'Already Received' : 'Receive Amount'}
                        >
                          <DollarSignIcon size={16} />
                        </button>
                        <button
                          onClick={() => {/* TODO: Add edit functionality */}}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit"
                        >
                          <EditIcon size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cashCount.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCashCount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Expected Amount Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Request Information</h3>
                <p><span className="font-medium">Request ID:</span> #{selectedCashCount.request_id}</p>
                <p><span className="font-medium">Client:</span> {selectedCashCount.client_name || 'N/A'}</p>
                <p><span className="font-medium">Branch:</span> {selectedCashCount.branch_name || 'N/A'}</p>
                <p><span className="font-medium">User:</span> {selectedCashCount.user_name || 'N/A'}</p>
                <p><span className="font-medium">Pickup:</span> {selectedCashCount.pickup_location || 'N/A'}</p>
                <p><span className="font-medium">Delivery:</span> {selectedCashCount.delivery_location || 'N/A'}</p>
                <p><span className="font-medium">Status:</span> {selectedCashCount.cash_count_status || 'N/A'}</p>
                <p><span className="font-medium">Team:</span> {selectedCashCount.team_name || 'N/A'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Timestamps</h3>
                <p><span className="font-medium">Created:</span> {formatDate(selectedCashCount.created_at)}</p>
              </div>
            </div>

            {/* Team Members Section */}
            {selectedCashCount.team_members && selectedCashCount.team_members.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-4">Team Members</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedCashCount.team_members.map((member) => (
                    <div key={member.id} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={member.photo_url}
                            alt={member.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/40x40?text=' + member.name.charAt(0);
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {member.role}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {member.empl_no}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-4">Denomination Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Ones (1)</p>
                  <p className="text-lg font-semibold">{selectedCashCount.ones}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(selectedCashCount.ones * 1)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Fives (5)</p>
                  <p className="text-lg font-semibold">{selectedCashCount.fives}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(selectedCashCount.fives * 5)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Tens (10)</p>
                  <p className="text-lg font-semibold">{selectedCashCount.tens}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(selectedCashCount.tens * 10)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Twenties (20)</p>
                  <p className="text-lg font-semibold">{selectedCashCount.twenties}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(selectedCashCount.twenties * 20)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Forties (40)</p>
                  <p className="text-lg font-semibold">{selectedCashCount.forties}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(selectedCashCount.forties * 40)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Fifties (50)</p>
                  <p className="text-lg font-semibold">{selectedCashCount.fifties}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(selectedCashCount.fifties * 50)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Hundreds (100)</p>
                  <p className="text-lg font-semibold">{selectedCashCount.hundreds}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(selectedCashCount.hundreds * 100)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Two Hundreds (200)</p>
                  <p className="text-lg font-semibold">{selectedCashCount.twoHundreds}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(selectedCashCount.twoHundreds * 200)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Five Hundreds (500)</p>
                  <p className="text-lg font-semibold">{selectedCashCount.fiveHundreds}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(selectedCashCount.fiveHundreds * 500)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Thousands (1000)</p>
                  <p className="text-lg font-semibold">{selectedCashCount.thousands}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(selectedCashCount.thousands * 1000)}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Total Amount</h4>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(cashCountService.calculateTotal(selectedCashCount))}
              </p>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => handleReceiveAmount(selectedCashCount)}
                disabled={selectedCashCount.cash_count_status === 'received'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  selectedCashCount.cash_count_status === 'received'
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <DollarSignIcon size={16} />
                {selectedCashCount.cash_count_status === 'received' ? 'Already Received' : 'Receive Amount'}
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Amount Modal */}
      {showReceiveModal && receivingAmount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Receive Amount into Vault</h2>
              <button
                onClick={() => {
                  setShowReceiveModal(false);
                  setReceivingAmount(null);
                  setReceiveComment('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Are you sure you want to receive <span className="font-bold text-green-600">{formatCurrency(receivingAmount)}</span> into Vault 1?
              </p>
              <p className="text-sm text-gray-500 mb-4">
                This will update the vault balance and create a transaction record.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment (optional)
              </label>
              <textarea
                value={receiveComment}
                onChange={(e) => setReceiveComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add a comment for this transaction..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReceiveModal(false);
                  setReceivingAmount(null);
                  setReceiveComment('');
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmReceiveAmount}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <DollarSignIcon size={16} />
                Confirm Receive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Processing Modal */}
      {showCashProcessingModal && selectedCashCount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Cash Processing - Request #{selectedCashCount.request_id}</h2>
              <button
                onClick={() => {
                  setShowCashProcessingModal(false);
                  setReceivingAmount(null);
                  setReceiveComment('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Enter the denominations you are actually receiving and compare with the expected amounts.
              </p>
            </div>

            {/* Denomination Comparison Table */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-4">Denomination Comparison</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Denomination</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expected</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Processed</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Difference</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[
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
                    ].map((denom) => {
                      const expected = selectedCashCount[denom.key as keyof CashCount] as number;
                      const processed = processedDenominations[denom.key as keyof typeof processedDenominations];
                      const diff = getDenominationDifference(expected, processed);
                      
                      return (
                        <tr key={denom.key} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{denom.label}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{expected}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              value={processed}
                              onChange={(e) => setProcessedDenominations(prev => ({
                                ...prev,
                                [denom.key]: parseInt(e.target.value) || 0
                              }))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`font-medium ${
                              diff.isPositive ? 'text-green-600' : 
                              diff.isNegative ? 'text-red-600' : 
                              'text-gray-600'
                            }`}>
                              {diff.isPositive ? '+' : ''}{diff.value}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {diff.isZero ? (
                              <CheckIcon size={16} className="text-green-600" />
                            ) : (
                              <XIcon size={16} className="text-red-600" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Expected Total</h4>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(cashCountService.calculateTotal(selectedCashCount))}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Processed Total</h4>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(calculateProcessedTotal())}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${
                Math.abs(calculateProcessedTotal() - cashCountService.calculateTotal(selectedCashCount)) > 1000 ? 
                'bg-red-50' : 'bg-yellow-50'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  Math.abs(calculateProcessedTotal() - cashCountService.calculateTotal(selectedCashCount)) > 1000 ? 
                  'text-red-900' : 'text-yellow-900'
                }`}>Difference</h4>
                <p className={`text-2xl font-bold ${
                  Math.abs(calculateProcessedTotal() - cashCountService.calculateTotal(selectedCashCount)) > 1000 ? 
                  'text-red-900' : 'text-yellow-900'
                }`}>
                  {formatCurrency(Math.abs(calculateProcessedTotal() - cashCountService.calculateTotal(selectedCashCount)))}
                </p>
              </div>
            </div>

            {/* Warning for significant differences */}
            {Math.abs(calculateProcessedTotal() - cashCountService.calculateTotal(selectedCashCount)) > 1000 && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                <div className="flex">
                  <XIcon size={20} className="text-red-400 mr-2" />
                  <div>
                    <p className="font-medium">Significant difference detected!</p>
                    <p className="text-sm">Please verify the denominations before proceeding.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setProcessedDenominations({
                    ones: selectedCashCount.ones,
                    fives: selectedCashCount.fives,
                    tens: selectedCashCount.tens,
                    twenties: selectedCashCount.twenties,
                    forties: selectedCashCount.forties,
                    fifties: selectedCashCount.fifties,
                    hundreds: selectedCashCount.hundreds,
                    twoHundreds: selectedCashCount.twoHundreds,
                    fiveHundreds: selectedCashCount.fiveHundreds,
                    thousands: selectedCashCount.thousands
                  });
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Reset to Expected
              </button>
              <button
                onClick={() => {
                  setShowCashProcessingModal(false);
                  setReceivingAmount(null);
                  setReceiveComment('');
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmCashProcessing}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckIcon size={16} />
                Proceed with Processed Amount
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashDenominations; 