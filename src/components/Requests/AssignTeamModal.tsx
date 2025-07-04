import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from 'lucide-react';
import { Team, teamService } from '../../services/teamService';
import { RequestData, requestService } from '../../services/requestService';

interface AssignTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: RequestData;
}

const AssignTeamModal: React.FC<AssignTeamModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  request 
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        const teamsData = await teamService.getTeams();
        setTeams(teamsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('Failed to load teams');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchTeams();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setError('Please select a team');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Get the selected team to find the crew commander
      const selectedTeam = teams.find(team => team.id === selectedTeamId);
      if (!selectedTeam) {
        setError('Selected team not found');
        return;
      }

      // Get the crew commander ID from the team
      const crewCommanderId = selectedTeam.crew_commander_id;
      if (!crewCommanderId) {
        setError('Selected team does not have a crew commander assigned');
        return;
      }

      await requestService.updateRequest(request.id!.toString(), {
        teamId: selectedTeamId,
        staffId: crewCommanderId, // Add the crew commander's ID as staff_id
        status: 'in_progress',
        myStatus: 1 // Update to pending status
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error assigning team:', err);
      setError('Failed to assign team');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
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
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="div"
                  className="flex items-center justify-between mb-4"
                >
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Assign Team to Request
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                {error && (
                  <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="team" className="block text-sm font-medium text-gray-700">
                      Select Team
                    </label>
                    <select
                      id="team"
                      value={selectedTeamId || ''}
                      onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                      disabled={isLoading}
                    >
                      <option value="">Select a team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.members.length} members)
                          {team.crew_commander ? ` - ${team.crew_commander.name} (Commander)` : ' - No Commander'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Show selected team details */}
                  {selectedTeamId && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-3">Selected Team Details</p>
                      {(() => {
                        const selectedTeam = teams.find(team => team.id === selectedTeamId);
                        if (!selectedTeam) return null;
                        
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-blue-800">Team Name:</span>
                              <span className="text-sm text-blue-900">{selectedTeam.name}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-blue-800">Team Members:</span>
                              <span className="text-sm text-blue-900">{selectedTeam.members.length} members</span>
                            </div>
                            
                            {selectedTeam.crew_commander ? (
                              <div className="bg-green-50 p-3 rounded border border-green-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-green-800">Crew Commander:</span>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    ✓ Assigned
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    {selectedTeam.crew_commander.photo_url && (
                                      <img
                                        src={selectedTeam.crew_commander.photo_url}
                                        alt={selectedTeam.crew_commander.name}
                                        className="h-8 w-8 rounded-full object-cover"
                                      />
                                    )}
                                    <div>
                                      <p className="text-sm font-medium text-green-900">{selectedTeam.crew_commander.name}</p>
                                      <p className="text-xs text-green-700">{selectedTeam.crew_commander.role}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-red-50 p-3 rounded border border-red-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-red-800">Crew Commander:</span>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    ⚠ No Commander
                                  </span>
                                </div>
                                <p className="text-sm text-red-700">
                                  This team does not have a crew commander assigned. Please assign a crew commander before proceeding.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isLoading}
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Assigning...' : 'Assign Team'}
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

export default AssignTeamModal; 