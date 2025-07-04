import React, { useState, useEffect } from 'react';
import { EyeIcon, TrashIcon, CheckIcon, DollarSignIcon, TrendingDownIcon, FilterIcon, CalendarIcon } from 'lucide-react';
import { CashCount, cashCountService } from '../services/cashCountService';

const ReceivedCashCounts: React.FC = () => {
  const [cashCounts, setCashCounts] = useState<CashCount[]>([]);
  const [filteredCashCounts, setFilteredCashCounts] = useState<CashCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCashCount, setSelectedCashCount] = useState<CashCount | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReceivedCashCounts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cashCounts, startDate, endDate]);

  const fetchReceivedCashCounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cashCountService.getAllCashCounts();
      console.log('Fetched all cash counts:', data);
      
      // Filter to only show received cash counts
      const receivedCashCounts = data.filter(cc => cc.cash_count_status === 'received');
      console.log('Filtered received cash counts:', receivedCashCounts);
      
      setCashCounts(receivedCashCounts);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch received cash counts');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cashCounts];

    // Apply date filters
    if (startDate) {
      filtered = filtered.filter(cc => {
        const createdDate = new Date(cc.created_at);
        const start = new Date(startDate);
        return createdDate >= start;
      });
    }

    if (endDate) {
      filtered = filtered.filter(cc => {
        const createdDate = new Date(cc.created_at);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Set to end of day
        return createdDate <= end;
      });
    }

    setFilteredCashCounts(filtered);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilteredCashCounts(cashCounts);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this received cash count?')) {
      return;
    }

    try {
      await cashCountService.deleteCashCount(id.toString());
      await fetchReceivedCashCounts();
    } catch (err: any) {
      setError(err.message || 'Failed to delete cash count');
    }
  };

  const handleViewDetails = (cashCount: CashCount) => {
    setSelectedCashCount(cashCount);
    setShowDetailsModal(true);
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
        <h1 className="text-3xl font-bold text-gray-900">Received Cash Counts</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FilterIcon size={20} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarIcon size={20} />
            Filter by Date
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
          {(startDate || endDate) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Active Filters:</span>
                {startDate && ` From ${new Date(startDate).toLocaleDateString()}`}
                {endDate && ` To ${new Date(endDate).toLocaleDateString()}`}
                {` (${filteredCashCounts.length} of ${cashCounts.length} items)`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      {filteredCashCounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Total Received Amount */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-800">Total Received</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(
                    filteredCashCounts.reduce((sum, cc) => sum + cashCountService.calculateTotal(cc), 0)
                  )}
                </p>
                <p className="text-sm text-green-700">
                  {filteredCashCounts.length} items
                </p>
              </div>
            </div>
          </div>

          {/* Received Count */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDownIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-800">Received Items</p>
                <p className="text-2xl font-bold text-blue-900">
                  {filteredCashCounts.length}
                </p>
                <p className="text-sm text-blue-700">
                  Successfully processed
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredCashCounts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {cashCounts.length === 0 ? 'No received cash counts found' : 'No items match the selected filters'}
          </p>
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
                {filteredCashCounts.map((cashCount) => (
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
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {cashCount.cash_count_status || 'received'}
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
              <h2 className="text-xl font-bold text-gray-900">Received Cash Count Details</h2>
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

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Total Amount Received</h4>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(cashCountService.calculateTotal(selectedCashCount))}
              </p>
            </div>

            <div className="mt-6 flex justify-end">
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
    </div>
  );
};

export default ReceivedCashCounts; 