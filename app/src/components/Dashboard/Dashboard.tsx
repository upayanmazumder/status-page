'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../Auth/AuthProvider/AuthProvider';
import { useNotification } from '../Notification/Notification';
import api from '../../utils/api';
import { useRouter } from 'next/navigation';
import { Button, Modal, Input, Spinner } from '../ui';

interface Application {
  _id: string;
  name: string;
  url: string;
}

interface Dashboard {
  _id: string;
  name: string;
  applications: Application[];
}

const ApplicationDashboard = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const router = useRouter();

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [editingDashboardId, setEditingDashboardId] = useState<string | null>(null);
  const [editingDashboardName, setEditingDashboardName] = useState('');
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [addingAppId, setAddingAppId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboards = async () => {
    try {
      const res = await api.get('/dashboards');
      setDashboards(res.data.dashboards || []);

      if (selectedDashboard) {
        const updated = res.data.dashboards.find((d: Dashboard) => d._id === selectedDashboard._id);
        setSelectedDashboard(updated || null);
      }
    } catch {
      notify('Failed to load dashboards', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await api.get('/applications');
      setApplications(res.data.applications || []);
    } catch {
      notify('Failed to load applications', 'error');
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboards();
      fetchApplications();
    }
    // eslint-disable-next-line
  }, [user]);

  const handleCreateDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDashboardName.trim()) return;
    try {
      await api.post('/dashboards', { name: newDashboardName });
      setNewDashboardName('');
      notify('Dashboard created successfully!', 'success');
      fetchDashboards();
      setIsModalOpen(false);
    } catch {
      notify('Failed to create dashboard', 'error');
    }
  };

  const handleEditDashboard = async (dashboardId: string) => {
    if (!editingDashboardName.trim()) return;
    try {
      await api.put(`/dashboards/${dashboardId}`, {
        name: editingDashboardName,
      });
      setEditingDashboardId(null);
      setEditingDashboardName('');
      notify('Dashboard updated successfully!', 'success');
      fetchDashboards();
    } catch {
      notify('Failed to update dashboard', 'error');
    }
  };

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (!window.confirm('Are you sure you want to delete this dashboard?')) return;
    try {
      await api.delete(`/dashboards/${dashboardId}`);
      notify('Dashboard deleted', 'info');
      setSelectedDashboard(null);
      fetchDashboards();
    } catch {
      notify('Failed to delete dashboard', 'error');
    }
  };

  const handleAddAppToDashboard = async (dashboardId: string) => {
    if (!addingAppId) return;
    try {
      await api.post(`/dashboards/${dashboardId}/applications`, {
        appId: addingAppId,
      });
      notify('Application added successfully!', 'success');
      setAddingAppId('');
      fetchDashboards();
    } catch {
      notify('Failed to add application', 'error');
    }
  };

  const handleRemoveAppFromDashboard = async (dashboardId: string, appId: string) => {
    try {
      await api.delete(`/dashboards/${dashboardId}/applications/${appId}`);
      notify('Application removed', 'info');
      fetchDashboards();
    } catch {
      notify('Failed to remove application', 'error');
    }
  };

  const handleCopyDashboardUrl = (dashboardId: string) => {
    const url = `${window.location.origin}/dashboard/${dashboardId}`;
    navigator.clipboard.writeText(url);
    notify('Dashboard URL copied to clipboard!', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/10 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-400">Loading dashboards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/10 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in-down">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Dashboard Management
              </h1>
              <p className="text-gray-400 text-lg">
                Create, organize, and monitor your application dashboards
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              }
            >
              New Dashboard
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Dashboards</p>
                <p className="text-3xl font-bold text-blue-400 mt-1">{dashboards.length}</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Applications</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{applications.length}</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Monitoring</p>
                <p className="text-3xl font-bold text-purple-400 mt-1">
                  {dashboards.reduce((acc, d) => acc + d.applications.length, 0)}
                </p>
              </div>
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboards Grid */}
        {dashboards.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 backdrop-blur-sm">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/10 rounded-full mb-6">
                <svg
                  className="w-10 h-10 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Dashboards Yet</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Get started by creating your first dashboard to organize and monitor your
                applications
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Your First Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {dashboards.map((dashboard, index) => (
              <div
                key={dashboard._id}
                className="group bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {editingDashboardId === dashboard._id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingDashboardName}
                      onChange={e => setEditingDashboardName(e.target.value)}
                      placeholder="Dashboard name"
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditDashboard(dashboard._id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingDashboardId(null);
                          setEditingDashboardName('');
                        }}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                          {dashboard.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span>{dashboard.applications.length} applications</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <button
                        onClick={() => router.push(`/dashboard/${dashboard._id}`)}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View
                      </button>
                      <button
                        onClick={() => setSelectedDashboard(dashboard)}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Manage
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyDashboardUrl(dashboard._id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                        title="Copy dashboard link"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Copy
                      </button>
                      <button
                        onClick={() => {
                          setEditingDashboardId(dashboard._id);
                          setEditingDashboardName(dashboard.name);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                        title="Edit dashboard"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDashboard(dashboard._id)}
                        className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                        title="Delete dashboard"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Dashboard Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setNewDashboardName('');
          }}
          title="Create New Dashboard"
          size="md"
        >
          <form onSubmit={handleCreateDashboard} className="space-y-4">
            <Input
              id="dashboardName"
              type="text"
              placeholder="e.g., Production Services, Dev Environment"
              value={newDashboardName}
              onChange={e => setNewDashboardName(e.target.value)}
              helperText="Choose a descriptive name for your dashboard"
              autoFocus
            />
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={!newDashboardName.trim()} fullWidth>
                Create Dashboard
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setNewDashboardName('');
                }}
                variant="secondary"
                fullWidth
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Manage Dashboard Modal */}
        {selectedDashboard && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-scale-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Manage: {selectedDashboard.name}</h2>
                <button
                  onClick={() => setSelectedDashboard(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Applications in Dashboard */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Current Applications</h3>
                {selectedDashboard.applications.length === 0 ? (
                  <p className="text-gray-400 text-center py-8 bg-gray-900/50 rounded-lg">
                    No applications added yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedDashboard.applications.map(app => (
                      <div
                        key={app._id}
                        className="flex items-center justify-between bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-white">{app.name}</p>
                          <p className="text-sm text-gray-400 break-all">{app.url}</p>
                        </div>
                        <button
                          onClick={() =>
                            handleRemoveAppFromDashboard(selectedDashboard._id, app._id)
                          }
                          className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Application */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Add Application</h3>
                <div className="flex gap-3">
                  <select
                    aria-label="Select application to add"
                    value={addingAppId}
                    onChange={e => setAddingAppId(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select an application...</option>
                    {applications
                      .filter(app => !selectedDashboard.applications.some(a => a._id === app._id))
                      .map(app => (
                        <option key={app._id} value={app._id}>
                          {app.name} ({app.url})
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => handleAddAppToDashboard(selectedDashboard._id)}
                    disabled={!addingAppId}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scale-up {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .animate-scale-up {
          animation: scale-up 0.3s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
      `}</style>
    </div>
  );
};

export default ApplicationDashboard;
