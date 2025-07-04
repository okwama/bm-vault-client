import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, FileTextIcon } from 'lucide-react';
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

const BalanceCertificate: React.FC = () => {
  const { vaultId = '1' } = useParams();
  const navigate = useNavigate();
  const [vaultData, setVaultData] = useState<VaultBalance | null>(null);
  const [vaultUpdates, setVaultUpdates] = useState<VaultUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificateData, setCertificateData] = useState<any>(null);
  const [certificateDate, setCertificateDate] = useState<string>('');

  useEffect(() => {
    fetchVaultData();
  }, [vaultId]);

  useEffect(() => {
    if (vaultData && vaultUpdates.length > 0) {
      generateCertificateForDate(certificateDate || new Date().toISOString().slice(0, 10));
    }
  }, [vaultData, vaultUpdates, certificateDate]);

  const fetchVaultData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const today = new Date().toISOString().slice(0, 10);
      setCertificateDate(today);
      
      const balanceData = await vaultService.getVaultBalance(Number(vaultId));
      setVaultData(balanceData);
      
      const updatesData = await vaultService.getVaultUpdates(Number(vaultId));
      setVaultUpdates(updatesData);
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vault data');
    } finally {
      setLoading(false);
    }
  };

  const generateCertificateForDate = (selectedDate: string) => {
    const sumDenoms = (updates: VaultUpdate[]) => {
      const result: Record<string, number> = {};
      denominationList.forEach(d => { result[d.key] = 0; });
      updates.forEach(u => {
        denominationList.forEach(d => {
          result[d.key] += Number(u[d.key as keyof VaultUpdate] || 0);
        });
      });
      return result;
    };

    const defaultDenoms = denominationList.reduce((acc, d) => {
      acc[d.key] = 0;
      return acc;
    }, {} as Record<string, number>);

    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    const prevDayStr = prevDay.toISOString().slice(0, 10);

    const prevDayUpdates = vaultUpdates.filter(u => u.created_at.slice(0, 10) <= prevDayStr);
    const prevClosing = prevDayUpdates.length > 0 ? prevDayUpdates[0] : null;
    const prevDenoms = prevClosing ? denominationList.reduce((acc, d) => {
      acc[d.key] = Number(prevClosing[d.key as keyof VaultUpdate] || 0);
      return acc;
    }, {} as Record<string, number>) : defaultDenoms;

    const dateReceived = vaultUpdates.filter(u => u.created_at.slice(0, 10) === selectedDate && u.amount_in > 0);
    const dateWithdrawn = vaultUpdates.filter(u => u.created_at.slice(0, 10) === selectedDate && u.amount_out > 0);
    const dateReceivedDenoms = sumDenoms(dateReceived);
    const dateWithdrawnDenoms = sumDenoms(dateWithdrawn);

    const transactionsUpToDate = vaultUpdates.filter(u => u.created_at.slice(0, 10) <= selectedDate);
    const closingBalance = transactionsUpToDate.length > 0 ? transactionsUpToDate[0].new_balance : (vaultData?.current_balance || 0);
    
    const closingDenoms = vaultData ? calculateClosingDenominationsForDate(selectedDate) : defaultDenoms;

    setCertificateData({
      selectedDate,
      prevClosing,
      prevDenoms,
      dateReceived,
      dateWithdrawn,
      dateReceivedDenoms,
      dateWithdrawnDenoms,
      closingDenoms,
      closingBalance
    });
  };

  const calculateClosingDenominationsForDate = (selectedDate: string) => {
    if (!vaultData) {
      return denominationList.reduce((acc, d) => {
        acc[d.key] = 0;
        return acc;
      }, {} as Record<string, number>);
    }

    const transactionsUpToDate = vaultUpdates
      .filter(u => u.created_at.slice(0, 10) <= selectedDate)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const closingDenoms: Record<string, number> = {};
    denominationList.forEach(d => {
      closingDenoms[d.key] = Number(vaultData[d.key as keyof VaultBalance] || 0);
    });

    transactionsUpToDate.forEach(update => {
      if (update.created_at.slice(0, 10) > selectedDate) {
        if (update.amount_in > 0) {
          denominationList.forEach(d => {
            closingDenoms[d.key] -= Number(update[d.key as keyof VaultUpdate] || 0);
          });
        } else if (update.amount_out > 0) {
          denominationList.forEach(d => {
            closingDenoms[d.key] += Number(update[d.key as keyof VaultUpdate] || 0);
          });
        }
      }
    });

    return closingDenoms;
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
            onClick={() => navigate('/vault')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <ArrowLeftIcon size={20} />
            Back to Vault
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Vault Balance Certificate</h1>
        </div>
        <div className="flex items-center gap-2">
          <FileTextIcon size={24} className="text-blue-600" />
          <span className="text-sm text-gray-600">Vault ID: {vaultId}</span>
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
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevDenoms.ones}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevDenoms.fives}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevDenoms.tens}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevDenoms.twenties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevDenoms.forties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevDenoms.fifties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevDenoms.hundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevDenoms.twoHundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevDenoms.fiveHundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.prevDenoms.thousands}</td>
                  </tr>
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={10} className="px-4 py-2 text-sm text-center text-blue-900">
                      TOTAL: KSh {denominationList.reduce((sum, d) => sum + (certificateData.prevDenoms[d.key] * d.value), 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Received Section */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Total Received on {new Date(certificateDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</h3>
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
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateReceivedDenoms.ones}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateReceivedDenoms.fives}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateReceivedDenoms.tens}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateReceivedDenoms.twenties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateReceivedDenoms.forties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateReceivedDenoms.fifties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateReceivedDenoms.hundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateReceivedDenoms.twoHundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateReceivedDenoms.fiveHundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateReceivedDenoms.thousands}</td>
                  </tr>
                  <tr className="bg-green-50 font-bold">
                    <td colSpan={10} className="px-4 py-2 text-sm text-center text-green-900">
                      TOTAL: KSh {denominationList.reduce((sum, d) => sum + (certificateData.dateReceivedDenoms[d.key] * d.value), 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Withdrawn Section */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Total Withdrawn on {new Date(certificateDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</h3>
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
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateWithdrawnDenoms.ones}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateWithdrawnDenoms.fives}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateWithdrawnDenoms.tens}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateWithdrawnDenoms.twenties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateWithdrawnDenoms.forties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateWithdrawnDenoms.fifties}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateWithdrawnDenoms.hundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateWithdrawnDenoms.twoHundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateWithdrawnDenoms.fiveHundreds}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-center text-gray-900">{certificateData.dateWithdrawnDenoms.thousands}</td>
                  </tr>
                  <tr className="bg-red-50 font-bold">
                    <td colSpan={10} className="px-4 py-2 text-sm text-center text-red-900">
                      TOTAL: KSh {denominationList.reduce((sum, d) => sum + (certificateData.dateWithdrawnDenoms[d.key] * d.value), 0).toLocaleString()}
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
                      TOTAL: KSh {denominationList.reduce((sum, d) => sum + (certificateData.closingDenoms[d.key] * d.value), 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-blue-100 rounded-lg">
              <div className="text-center">
                <span className="text-lg font-bold text-blue-900">
                  Closing Vault Balance: KSh {Number(certificateData.closingBalance).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceCertificate; 