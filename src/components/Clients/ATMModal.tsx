import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ATM, createATM, updateATM } from '../../services/atmService';

interface ATMModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  atm?: ATM;
  onSuccess: (atm: ATM) => void;
}

const ATMModal: React.FC<ATMModalProps> = ({ isOpen, onClose, clientId, atm, onSuccess }) => {
  const [formData, setFormData] = useState({
    atm_code: atm?.atm_code || '',
    location: atm?.location || '',
    comment: atm?.comment || '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (atm) {
      setFormData({
        atm_code: atm.atm_code,
        location: atm.location,
        comment: atm.comment || '',
      });
    } else {
      // Reset form when opening for new ATM
      setFormData({
        atm_code: '',
        location: '',
        comment: '',
      });
    }
  }, [atm, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      if (atm) {
        result = await updateATM(clientId, atm.id, formData);
      } else {
        result = await createATM(clientId, formData);
      }
      onSuccess(result);
      onClose();
    } catch (err: any) {
      console.error('Error submitting ATM:', err);
      if (err.response?.status === 404) {
        setError('ATM functionality is not available yet. Please contact your administrator.');
      } else {
        setError(err.message || 'Failed to save ATM');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {atm ? 'Edit ATM' : 'Add New ATM'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              ATM Code *
            </label>
            <input
              type="text"
              name="atm_code"
              value={formData.atm_code}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter ATM code"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter ATM location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Comment
            </label>
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter any additional comments"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : atm ? 'Update ATM' : 'Add ATM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ATMModal; 