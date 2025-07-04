import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from 'lucide-react';
import { CreateRequestData, requestService } from '../../services/requestService';
import { ServiceType, serviceTypeService } from '../../services/serviceTypeService';
import { useAuth } from '../../contexts/AuthContext';
import { Branch, getAllBranches } from '../../services/branchService';
import { ServiceCharge } from '../../services/serviceChargeService';
import serviceChargeService from '../../services/serviceChargeService';
import { ATM, getATMs } from '../../services/atmService';

interface RequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface RequestFormData {
  branch_id: string;
  service_type_id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_date: string;
  pickup_time: string;
  atm_id?: string;
}

const RequestFormModal: React.FC<RequestFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<RequestFormData>({
    branch_id: '',
    service_type_id: '',
    pickup_location: '',
    dropoff_location: '',
    pickup_date: '',
    pickup_time: '',
    atm_id: ''
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [serviceCharges, setServiceCharges] = useState<ServiceCharge[]>([]);
  const [atms, setATMs] = useState<ATM[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [branchesData, serviceTypesData] = await Promise.all([
          getAllBranches(),
          serviceTypeService.getServiceTypes()
        ]);
        setBranches(branchesData);
        setServiceTypes(serviceTypesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchServiceCharges = async () => {
      if (!formData.branch_id) {
        setServiceCharges([]);
        return;
      }

      try {
        const selectedBranch = branches.find(b => b.id.toString() === formData.branch_id);
        if (!selectedBranch?.client_id) {
          setError('Selected branch has no associated client');
          return;
        }

        const charges = await serviceChargeService.getServiceCharges(Number(selectedBranch.client_id));
        setServiceCharges(charges);
      } catch (error) {
        console.error('Error fetching service charges:', error);
        setError('Failed to load service charges');
      }
    };

    fetchServiceCharges();
  }, [formData.branch_id, branches]);

  useEffect(() => {
    const fetchATMs = async () => {
      if (!formData.branch_id) {
        setATMs([]);
        return;
      }

      try {
        const selectedBranch = branches.find(b => b.id.toString() === formData.branch_id);
        if (!selectedBranch?.client_id) {
          setError('Selected branch has no associated client');
          return;
        }

        const atms = await getATMs(selectedBranch.client_id.toString());
        setATMs(atms);
      } catch (error) {
        console.error('Error fetching ATMs:', error);
        setError('Failed to load ATMs');
      }
    };

    fetchATMs();
  }, [formData.branch_id, branches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!user?.id || !user?.username) {
        throw new Error('User information is required');
      }

      const selectedBranch = branches.find(b => b.id.toString() === formData.branch_id);
      if (!selectedBranch?.client_id) {
        throw new Error('Selected branch has no associated client');
      }

      const selectedServiceCharge = serviceCharges.find(
        sc => sc.service_type_id.toString() === formData.service_type_id
      );
      if (!selectedServiceCharge) {
        throw new Error('No service charge found for selected service type');
      }

      // Validate ATM selection for ATM Loading service
      if (isATMLoadingService() && !formData.atm_id) {
        throw new Error('Please select an ATM for ATM Loading service');
      }

      const requestData: CreateRequestData = {
        userId: user.id,
        userName: user.username,
        serviceTypeId: parseInt(formData.service_type_id),
        pickupLocation: formData.pickup_location,
        deliveryLocation: formData.dropoff_location,
        pickupDate: `${formData.pickup_date}T${formData.pickup_time}`,
        priority: 'medium',
        status: 'pending',
        myStatus: '0',
        branchId: parseInt(formData.branch_id),
        atmId: formData.atm_id ? parseInt(formData.atm_id) : undefined,
        price: selectedServiceCharge.price
      };

      await requestService.createRequest(requestData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if selected service type is ATM Loading
  const isATMLoadingService = () => {
    const selectedServiceCharge = serviceCharges.find(
      sc => sc.service_type_id.toString() === formData.service_type_id
    );
    return selectedServiceCharge?.service_type_name?.toLowerCase().includes('atm loading');
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Create Service Request
                </Dialog.Title>

                {error && (
                  <div className="mt-2 p-2 bg-red-50 text-red-700 rounded">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Branch
                      </label>
                      <select
                        value={formData.branch_id}
                        onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select a branch</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Service Type
                      </label>
                      <select
                        value={formData.service_type_id}
                        onChange={(e) => setFormData({ ...formData, service_type_id: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select a service type</option>
                        {serviceCharges.map((charge) => (
                          <option key={charge.service_type_id} value={charge.service_type_id}>
                            {charge.service_type_name} - {charge.price}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Pickup Location
                      </label>
                      <input
                        type="text"
                        value={formData.pickup_location}
                        onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Dropoff Location
                      </label>
                      <input
                        type="text"
                        value={formData.dropoff_location}
                        onChange={(e) => setFormData({ ...formData, dropoff_location: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Pickup Date
                      </label>
                      <input
                        type="date"
                        value={formData.pickup_date}
                        onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Pickup Time
                      </label>
                      <input
                        type="time"
                        value={formData.pickup_time}
                        onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* ATM Selection - Only show for ATM Loading service */}
                    {isATMLoadingService() && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Select ATM
                        </label>
                        <select
                          value={formData.atm_id}
                          onChange={(e) => setFormData({ ...formData, atm_id: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select an ATM</option>
                          {atms.map((atm) => (
                            <option key={atm.id} value={atm.id}>
                              {atm.atm_code} - {atm.location}
                            </option>
                          ))}
                        </select>
                        {atms.length === 0 && (
                          <p className="mt-1 text-sm text-gray-500">
                            No ATMs available for this client
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Request'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default RequestFormModal; 