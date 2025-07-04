import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, FileTextIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import clientUpdateService, { type ClientBalanceCertificate } from '../services/clientUpdateService';

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

const ClientBalanceCertificate: React.FC = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [certificateData, setCertificateData] = useState<ClientBalanceCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificateDate, setCertificateDate] = useState<string>('');

  useEffect(() => {
    if (clientId) {
      fetchCertificateData();
    }
  }, [clientId]);

  useEffect(() => {
    if (certificateDate && clientId) {
      generateCertificateForDate(certificateDate);
    }
  }, [certificateDate, clientId]);

  const fetchCertificateData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const today = new Date().toISOString().slice(0, 10);
      setCertificateDate(today);
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch certificate data');
    } finally {
      setLoading(false);
    }
  };

  const generateCertificateForDate = async (selectedDate: string) => {
    try {
      if (!clientId) return;
      
      const data = await clientUpdateService.getClientBalanceCertificate(Number(clientId), selectedDate);
      setCertificateData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate certificate');
    }
  };

  const handleCertificateDateChange = (newDate: string) => {
    setCertificateDate(newDate);
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/client-vault-history')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <ArrowLeftIcon size={20} />
            Back to Client Vault History
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Client Balance Certificate</h1>
        </div>
        <div className="flex items-center gap-2">
          <FileTextIcon size={24} className="text-blue-600" />
          <span className="text-sm text-gray-600">Client ID: {clientId}</span>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Select Date:</label>
          <input
            type="date"
            value={certificateDate}
            onChange={(e) => handleCertificateDateChange(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">
            Balance as of {new Date(certificateDate).toLocaleDateString('en-KE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>

      {certificateData && (
        <div className="space-y-6">
          {/* Client Information */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Client Name</p>
                <p className="font-semibold text-gray-900">{certificateData.client.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Number</p>
                <p className="font-semibold text-gray-900">{certificateData.client.account_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-900">{certificateData.client.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold text-gray-900">{certificateData.client.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Brought Forward Section */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Brought Forward (Previous Day's Closing)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Ones (1)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Fives (5)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Tens (10)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Twenties (20)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Forties (40)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Fifties (50)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Hundreds (100)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Two Hundreds (200)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Five Hundreds (500)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Thousands (1000)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevClosingDenoms.ones}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevClosingDenoms.fives}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevClosingDenoms.tens}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevClosingDenoms.twenties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevClosingDenoms.forties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevClosingDenoms.fifties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevClosingDenoms.hundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevClosingDenoms.twoHundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevClosingDenoms.fiveHundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevClosingDenoms.thousands}</td>
                  </tr>
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={10} className="px-4 py-2 text-sm text-center text-blue-900">
                      TOTAL: KSh {denominationList.reduce((sum, d) => sum + (certificateData.prevClosingDenoms[d.key as keyof typeof certificateData.prevClosingDenoms] * d.value), 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-blue-100 rounded-lg">
              <div className="text-center">
                <span className="text-lg font-bold text-blue-900">
                  Previous Closing Balance: KSh {Number(certificateData.prevClosingBalance).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Credits Section */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Total Credits on {new Date(certificateDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Ones (1)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Fives (5)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Tens (10)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Twenties (20)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Forties (40)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Fifties (50)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Hundreds (100)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Two Hundreds (200)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Five Hundreds (500)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Thousands (1000)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateCreditsDenoms.ones}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateCreditsDenoms.fives}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateCreditsDenoms.tens}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateCreditsDenoms.twenties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateCreditsDenoms.forties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateCreditsDenoms.fifties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateCreditsDenoms.hundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateCreditsDenoms.twoHundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateCreditsDenoms.fiveHundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateCreditsDenoms.thousands}</td>
                  </tr>
                  <tr className="bg-green-50 font-bold">
                    <td colSpan={10} className="px-4 py-2 text-sm text-center text-green-900">
                      TOTAL: KSh {denominationList.reduce((sum, d) => sum + (certificateData.dateCreditsDenoms[d.key as keyof typeof certificateData.dateCreditsDenoms] * d.value), 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Debits Section */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Total Debits on {new Date(certificateDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-red-50">
                  <tr>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Ones (1)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Fives (5)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Tens (10)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Twenties (20)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Forties (40)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Fifties (50)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Hundreds (100)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Two Hundreds (200)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Five Hundreds (500)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Thousands (1000)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateDebitsDenoms.ones}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateDebitsDenoms.fives}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateDebitsDenoms.tens}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateDebitsDenoms.twenties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateDebitsDenoms.forties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateDebitsDenoms.fifties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateDebitsDenoms.hundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateDebitsDenoms.twoHundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateDebitsDenoms.fiveHundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateDebitsDenoms.thousands}</td>
                  </tr>
                  <tr className="bg-red-50 font-bold">
                    <td colSpan={10} className="px-4 py-2 text-sm text-center text-red-900">
                      TOTAL: KSh {denominationList.reduce((sum, d) => sum + (certificateData.dateDebitsDenoms[d.key as keyof typeof certificateData.dateDebitsDenoms] * d.value), 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Closing Balance Section */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Closing Balance as of {new Date(certificateDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Ones (1)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Fives (5)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Tens (10)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Twenties (20)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Forties (40)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Fifties (50)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Hundreds (100)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Two Hundreds (200)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Five Hundreds (500)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Thousands (1000)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.closingDenoms.ones}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.closingDenoms.fives}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.closingDenoms.tens}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.closingDenoms.twenties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.closingDenoms.forties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.closingDenoms.fifties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.closingDenoms.hundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.closingDenoms.twoHundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.closingDenoms.fiveHundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.closingDenoms.thousands}</td>
                  </tr>
                  <tr className="bg-blue-50 font-bold">
                    <td colSpan={10} className="px-4 py-2 text-sm text-center text-blue-900">
                      TOTAL: KSh {denominationList.reduce((sum, d) => sum + (certificateData.closingDenoms[d.key as keyof typeof certificateData.closingDenoms] * d.value), 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-blue-100 rounded-lg">
              <div className="text-center">
                <span className="text-lg font-bold text-blue-900">
                  Closing Client Balance: KSh {Number(certificateData.closingBalance).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          {certificateData.dateTransactions.length > 0 && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Transaction Details for {new Date(certificateDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">Time</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">New Balance</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">Branch</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">Team</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificateData.dateTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {transaction.type === 'credit' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              <TrendingUpIcon size={12} className="mr-1" />
                              Credit
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              <TrendingDownIcon size={12} className="mr-1" />
                              Debit
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm font-semibold">
                          {transaction.type === 'credit' ? (
                            <span className="text-green-600">+{formatCurrency(transaction.amount)}</span>
                          ) : (
                            <span className="text-red-600">-{formatCurrency(transaction.amount)}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formatCurrency(transaction.new_balance)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {transaction.branch_name || 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {transaction.team_name || 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                          {transaction.comment || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientBalanceCertificate; 