import React, { useState, useEffect } from 'react';
import { EyeIcon, CheckIcon, XIcon } from 'lucide-react';
import { CashProcessing, cashProcessingService } from '../services/cashProcessingService';

const CashProcessingHistory: React.FC = () => {
  const [processingRecords, setProcessingRecords] = useState<CashProcessing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<CashProcessing | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchProcessingRecords();
  }, []);

  const fetchProcessingRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cashProcessingService.getAllCashProcessing();
      console.log('Fetched processing records:', data);
      setProcessingRecords(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch processing records');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (record: CashProcessing) => {
    setSelectedRecord(record);
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

  const getDenominationDifference = (expected: number, processed: number) => {
    const diff = processed - expected;
    return {
      value: diff,
      isPositive: diff > 0,
      isNegative: diff < 0,
      isZero: diff === 0
    };
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
        <h1 className="text-3xl font-bold text-gray-900">Cash Processing History</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {processingRecords.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No cash processing records found</p>
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
                    Expected Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processed Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Match Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processed At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processingRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{record.request_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.client_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.branch_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {formatCurrency(record.expected_total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {formatCurrency(record.processed_total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${
                        record.difference === 0 ? 'text-gray-600' : 
                        record.processed_total > record.expected_total ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {record.difference === 0 ? 'No difference' : 
                         record.processed_total > record.expected_total ? '+' : ''}{formatCurrency(record.difference)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(record.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(record)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <EyeIcon size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Cash Processing Details - Request #{selectedRecord.request_id}</h2>
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
                <p><span className="font-medium">Request ID:</span> #{selectedRecord.request_id}</p>
                <p><span className="font-medium">Client:</span> {selectedRecord.client_name || 'N/A'}</p>
                <p><span className="font-medium">Branch:</span> {selectedRecord.branch_name || 'N/A'}</p>
                <p><span className="font-medium">User:</span> {selectedRecord.user_name || 'N/A'}</p>
                <p><span className="font-medium">Pickup:</span> {selectedRecord.pickup_location || 'N/A'}</p>
                <p><span className="font-medium">Delivery:</span> {selectedRecord.delivery_location || 'N/A'}</p>
                <p><span className="font-medium">Team:</span> {selectedRecord.team_name || 'N/A'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Processing Summary</h3>
                <p><span className="font-medium">Expected Total:</span> {formatCurrency(selectedRecord.expected_total)}</p>
                <p><span className="font-medium">Processed Total:</span> {formatCurrency(selectedRecord.processed_total)}</p>
                <p><span className="font-medium">Difference:</span> {formatCurrency(selectedRecord.difference)}</p>
                <p><span className="font-medium">Match Status:</span> 
                  {selectedRecord.matched ? (
                    <span className="text-green-600 font-semibold"> Matched</span>
                  ) : (
                    <span className="text-red-600 font-semibold"> Mismatch</span>
                  )}
                </p>
                <p><span className="font-medium">Processed At:</span> {formatDate(selectedRecord.created_at)}</p>
              </div>
            </div>

            {/* Team Members Section */}
            {selectedRecord.team_members && selectedRecord.team_members.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-4">Team Members</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedRecord.team_members.map((member) => (
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

            {/* Denomination Comparison */}
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
                      const expected = selectedRecord[`expected_${denom.key}` as keyof CashProcessing] as number;
                      const processed = selectedRecord[`processed_${denom.key}` as keyof CashProcessing] as number;
                      const diff = getDenominationDifference(expected, processed);
                      
                      return (
                        <tr key={denom.key} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{denom.label}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{expected}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{processed}</td>
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

            {selectedRecord.comment && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Comment</h3>
                <p className="text-gray-600">{selectedRecord.comment}</p>
              </div>
            )}

            <div className="flex justify-end">
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

export default CashProcessingHistory; 