import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import atmLoadingTableService, {
  ATMLoadingRecord,
  ATMLoadingDenominations,
  CreateATMLoadingData,
  UpdateATMLoadingData
} from '../services/atmLoadingTableService';
import { clientService } from '../services/clientService';
import { getATMs } from '../services/atmService';

interface Client {
  id: number;
  name: string;
}

interface ATM {
  id: string;
  atm_code: string;
  location: string;
  client_id: string;
}

const ATMLoadingHistory: React.FC = () => {
  const [records, setRecords] = useState<ATMLoadingRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [atms, setATMs] = useState<ATM[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedATM, setSelectedATM] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ATMLoadingRecord | null>(null);
  const [formData, setFormData] = useState<CreateATMLoadingData>({
    client_id: 0,
    atm_id: 0,
    denominations: {
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
    },
    loading_date: new Date().toISOString().split('T')[0],
    comment: ''
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsData, clientsData] = await Promise.all([
        atmLoadingTableService.getAllATMLoading(),
        clientService.getAllClients()
      ]);
      setRecords(recordsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchATMsForClient = async (clientId: number) => {
    try {
      const atmsData = await getATMs(clientId.toString());
      setATMs(atmsData);
    } catch (error) {
      console.error('Error fetching ATMs:', error);
      alert('Failed to fetch ATMs');
    }
  };

  const handleClientChange = (clientId: string) => {
    setFormData((prev: CreateATMLoadingData) => ({ ...prev, client_id: parseInt(clientId), atm_id: 0 }));
    setSelectedClient(clientId);
    if (clientId) {
      fetchATMsForClient(parseInt(clientId));
    } else {
      setATMs([]);
    }
  };

  const handleATMChange = (atmId: string) => {
    setFormData((prev: CreateATMLoadingData) => ({ ...prev, atm_id: parseInt(atmId) }));
    setSelectedATM(atmId);
  };

  const handleDenominationChange = (field: keyof ATMLoadingDenominations, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData((prev: CreateATMLoadingData) => ({
      ...prev,
      denominations: {
        ...prev.denominations,
        [field]: numValue
      }
    }));
  };

  const resetForm = () => {
    setFormData({
      client_id: 0,
      atm_id: 0,
      denominations: {
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
      },
      loading_date: new Date().toISOString().split('T')[0],
      comment: ''
    });
    setSelectedClient('');
    setSelectedATM('');
    setATMs([]);
  };

  const handleCreate = async () => {
    try {
      if (!formData.client_id || !formData.atm_id) {
        alert('Please select both client and ATM');
        return;
      }

      await atmLoadingTableService.createATMLoading(formData);
      alert('ATM loading record created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating record:', error);
      alert('Failed to create record');
    }
  };

  const handleEdit = async () => {
    try {
      if (!selectedRecord) return;

      await atmLoadingTableService.updateATMLoading(selectedRecord.id, formData);
      alert('ATM loading record updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error updating record:', error);
      alert('Failed to update record');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      await atmLoadingTableService.deleteATMLoading(id);
      alert('ATM loading record deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Failed to delete record');
    }
  };

  const openEditModal = (record: ATMLoadingRecord) => {
    setSelectedRecord(record);
    setFormData({
      client_id: record.client_id,
      atm_id: record.atm_id,
      denominations: atmLoadingTableService.formatDenominations(record),
      loading_date: record.loading_date,
      comment: record.comment || ''
    });
    setSelectedClient(record.client_id.toString());
    setSelectedATM(record.atm_id.toString());
    fetchATMsForClient(record.client_id);
    setIsEditModalOpen(true);
  };

  const openViewModal = (record: ATMLoadingRecord) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.atm_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.atm_location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClient = !selectedClient || record.client_id.toString() === selectedClient;
    const matchesATM = !selectedATM || record.atm_id.toString() === selectedATM;

    return matchesSearch && matchesClient && matchesATM;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const DenominationInputs = ({ disabled = false }: { disabled?: boolean }) => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {[
        { key: 'ones', label: '1s', value: 1 },
        { key: 'fives', label: '5s', value: 5 },
        { key: 'tens', label: '10s', value: 10 },
        { key: 'twenties', label: '20s', value: 20 },
        { key: 'forties', label: '40s', value: 40 },
        { key: 'fifties', label: '50s', value: 50 },
        { key: 'hundreds', label: '100s', value: 100 },
        { key: 'twoHundreds', label: '200s', value: 200 },
        { key: 'fiveHundreds', label: '500s', value: 500 },
        { key: 'thousands', label: '1000s', value: 1000 }
      ].map(({ key, label, value }) => (
        <div key={key} className="space-y-2">
          <label htmlFor={key} className="block text-sm font-medium text-gray-700">{label}</label>
          <input
            id={key}
            type="number"
            min="0"
            value={formData.denominations[key as keyof ATMLoadingDenominations]}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDenominationChange(key as keyof ATMLoadingDenominations, e.target.value)}
            disabled={disabled}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
          />
          <div className="text-sm text-gray-500">
            {formatCurrency((formData.denominations[key as keyof ATMLoadingDenominations] || 0) * value)}
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">ATM Loading History</h1>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add ATM Loading
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
            <div className="relative mt-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                id="search"
                type="text"
                placeholder="Search by client, ATM code, or location..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="filter-client" className="block text-sm font-medium text-gray-700">Filter by Client</label>
            <select
              id="filter-client"
              value={selectedClient}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedClient(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
            >
              <option value="">All clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id.toString()}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-atm" className="block text-sm font-medium text-gray-700">Filter by ATM</label>
            <select
              id="filter-atm"
              value={selectedATM}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedATM(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
            >
              <option value="">All ATMs</option>
              {atms.map(atm => (
                <option key={atm.id} value={atm.id.toString()}>
                  {atm.atm_code} - {atm.location}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedClient('');
                setSelectedATM('');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">ATM Loading Records ({filteredRecords.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ATM</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateOnly(record.loading_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {record.client_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {record.atm_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.atm_location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(record.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openViewModal(record)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(record)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add ATM Loading Record</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="client" className="block text-sm font-medium text-gray-700">Client</label>
                    <select
                      id="client"
                      value={selectedClient}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleClientChange(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    >
                      <option value="">Select client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id.toString()}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="atm" className="block text-sm font-medium text-gray-700">ATM</label>
                    <select
                      id="atm"
                      value={selectedATM}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleATMChange(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    >
                      <option value="">Select ATM</option>
                      {atms.map(atm => (
                        <option key={atm.id} value={atm.id.toString()}>
                          {atm.atm_code} - {atm.location}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="loading_date" className="block text-sm font-medium text-gray-700">Loading Date</label>
                  <input
                    id="loading_date"
                    type="date"
                    value={formData.loading_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: CreateATMLoadingData) => ({ ...prev, loading_date: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Denominations</label>
                  <DenominationInputs />
                  <div className="text-lg font-semibold mt-4">
                    Total Amount: {formatCurrency(atmLoadingTableService.calculateTotalAmount(formData.denominations))}
                  </div>
                </div>
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Comment</label>
                  <textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData((prev: CreateATMLoadingData) => ({ ...prev, comment: e.target.value }))}
                    placeholder="Optional comment..."
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Create Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit ATM Loading Record</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-client" className="block text-sm font-medium text-gray-700">Client</label>
                    <select
                      id="edit-client"
                      value={selectedClient}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleClientChange(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    >
                      <option value="">Select client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id.toString()}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-atm" className="block text-sm font-medium text-gray-700">ATM</label>
                    <select
                      id="edit-atm"
                      value={selectedATM}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleATMChange(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    >
                      <option value="">Select ATM</option>
                      {atms.map(atm => (
                        <option key={atm.id} value={atm.id.toString()}>
                          {atm.atm_code} - {atm.location}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="edit-loading_date" className="block text-sm font-medium text-gray-700">Loading Date</label>
                  <input
                    id="edit-loading_date"
                    type="date"
                    value={formData.loading_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: CreateATMLoadingData) => ({ ...prev, loading_date: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Denominations</label>
                  <DenominationInputs />
                  <div className="text-lg font-semibold mt-4">
                    Total Amount: {formatCurrency(atmLoadingTableService.calculateTotalAmount(formData.denominations))}
                  </div>
                </div>
                <div>
                  <label htmlFor="edit-comment" className="block text-sm font-medium text-gray-700">Comment</label>
                  <textarea
                    id="edit-comment"
                    value={formData.comment}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData((prev: CreateATMLoadingData) => ({ ...prev, comment: e.target.value }))}
                    placeholder="Optional comment..."
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Update Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">ATM Loading Record Details</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Client</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRecord.client_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ATM Code</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRecord.atm_code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRecord.atm_location}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Loading Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDateOnly(selectedRecord.loading_date)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(selectedRecord.total_amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(selectedRecord.created_at)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Denominations</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { key: 'ones', label: '1s', value: 1 },
                      { key: 'fives', label: '5s', value: 5 },
                      { key: 'tens', label: '10s', value: 10 },
                      { key: 'twenties', label: '20s', value: 20 },
                      { key: 'forties', label: '40s', value: 40 },
                      { key: 'fifties', label: '50s', value: 50 },
                      { key: 'hundreds', label: '100s', value: 100 },
                      { key: 'twoHundreds', label: '200s', value: 200 },
                      { key: 'fiveHundreds', label: '500s', value: 500 },
                      { key: 'thousands', label: '1000s', value: 1000 }
                    ].map(({ key, label, value }) => {
                      const count = selectedRecord[key as keyof ATMLoadingRecord] as number || 0;
                      return (
                        <div key={key} className="text-center p-2 border rounded">
                          <div className="text-sm font-medium">{label}</div>
                          <div className="text-lg">{count}</div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(count * value)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedRecord.comment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Comment</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRecord.comment}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsViewModalOpen(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ATMLoadingHistory; 