'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../utils/api';
import { useNotification } from '../../Notification/Notification';
import StatusTimeline from '../../Application/List/StatusTimeline/StatusTimeline';

interface Application {
  _id: string;
  name: string;
  url: string;
  currentStatus?: 'online' | 'offline' | 'unknown';
}

interface Dashboard {
  _id: string;
  name: string;
  applications: Application[];
}

export default function DashboardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dashboardId =
    typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const { notify } = useNotification();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        let found: Dashboard | undefined;
        try {
          const res = await api.get(`/dashboards/${dashboardId}`);
          found = res.data.dashboard;
        } catch {
          const res = await api.get(`/dashboards`);
          const dashboards: Dashboard[] = res.data.dashboards || [];
          found = dashboards.find(d => d._id === dashboardId);
        }
        setDashboard(found || null);
        if (!found) notify('Dashboard not found', 'error');
      } catch {
        notify('Failed to load dashboard', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (dashboardId) fetchDashboard();
  }, [dashboardId, notify]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/10 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/10 to-gray-900 flex items-center justify-center">
        <div className="text-center bg-red-900/20 border border-red-800 rounded-2xl p-12 max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-full mb-6">
            <svg
              className="w-10 h-10 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-3">Dashboard Not Found</h2>
          <p className="text-red-300 mb-6">
            The dashboard you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
          >
            Back to Dashboards
          </button>
        </div>
      </div>
    );
  }

  const onlineCount = dashboard.applications.filter(app => app.currentStatus === 'online').length;
  const offlineCount = dashboard.applications.filter(app => app.currentStatus === 'offline').length;
  const unknownCount = dashboard.applications.filter(
    app => !app.currentStatus || app.currentStatus === 'unknown'
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/10 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="mb-8 animate-fade-in-down">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
          >
            <svg
              className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboards
          </button>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {dashboard.name}
              </h1>
              <p className="text-gray-400 text-lg">
                Monitoring {dashboard.applications.length}{' '}
                {dashboard.applications.length === 1 ? 'application' : 'applications'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const url = `${window.location.origin}/dashboard/${dashboardId}`;
                  navigator.clipboard.writeText(url);
                  notify('Dashboard URL copied to clipboard!', 'success');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Online</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{onlineCount}</p>
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Offline</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{offlineCount}</p>
              </div>
              <div className="bg-red-500/20 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Unknown</p>
                <p className="text-3xl font-bold text-yellow-400 mt-1">{unknownCount}</p>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Applications Status</h2>
        </div>

        {dashboard.applications.length === 0 ? (
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Applications</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                This dashboard doesn&apos;t have any applications yet. Go to the dashboard
                management page to add applications.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
              >
                Manage Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {dashboard.applications.map((app, index) => (
              <div
                key={app._id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white truncate">{app.name}</h3>
                      {app.currentStatus === 'online' && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          Online
                        </span>
                      )}
                      {app.currentStatus === 'offline' && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                          Offline
                        </span>
                      )}
                      {(!app.currentStatus || app.currentStatus === 'unknown') && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
                          <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                          Unknown
                        </span>
                      )}
                    </div>
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 hover:underline break-all flex items-center gap-1 w-fit"
                    >
                      {app.url}
                      <svg
                        className="w-3 h-3 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="mt-4 bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-300">30-Day Status History</h4>
                    <span className="text-xs text-gray-500">Last 30 days</span>
                  </div>
                  <StatusTimeline appId={app._id} days={30} />
                </div>
              </div>
            ))}
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
        .animate-fade-in {
          animation: fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
      `}</style>
    </div>
  );
}
