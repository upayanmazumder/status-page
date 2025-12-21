'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../Auth/AuthProvider/AuthProvider';
import { useNotification } from '../../Notification/Notification';
import Loader from '../../Loader/Loader';
import StatusTimeline from './StatusTimeline/StatusTimeline';
import useWindowWidth from '../../../utils/useWindowWidth';

interface Application {
  _id: string;
  name: string;
  url: string;
  owner: { email: string; username?: string };
  subscribers: { email: string; username?: string }[];
  createdAt?: string;
  lastChecked?: string;
  currentStatus?: 'online' | 'offline' | 'unknown';
}

export default function ApplicationsList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribingIds, setUnsubscribingIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { notify } = useNotification();
  const width = useWindowWidth();

  const fetchApplications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/applications');
      const subscribedApps = res.data.applications.filter((app: Application) =>
        app.subscribers.some(s => s.email === user.email)
      );
      setApplications(subscribedApps);
    } catch {
      setError('Failed to load your applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleUnsubscribe = useCallback(
    async (appId: string, appName: string) => {
      if (unsubscribingIds.has(appId)) return;

      setUnsubscribingIds(prev => new Set(prev).add(appId));
      try {
        await api.post(`/applications/${appId}/unsubscribe`);
        setApplications(prev => prev.filter(app => app._id !== appId));
        notify(`Unsubscribed from "${appName}"`, 'success');
      } catch {
        notify('Failed to unsubscribe. Please try again.', 'error');
      } finally {
        setUnsubscribingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(appId);
          return newSet;
        });
      }
    },
    [notify, unsubscribingIds]
  );

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Determine how many days to show based on screen width
  let daysToShow = 14; // default for very small mobile
  if (width >= 1536) {
    daysToShow = 90; // 2xl screens
  } else if (width >= 1280) {
    daysToShow = 75; // xl screens
  } else if (width >= 1024) {
    daysToShow = 60; // lg screens
  } else if (width >= 768) {
    daysToShow = 45; // md screens
  } else if (width >= 640) {
    daysToShow = 30; // sm screens
  } else if (width >= 475) {
    daysToShow = 21; // larger mobile
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12 sm:py-16 lg:py-20">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-900/20 via-red-900/10 to-gray-900/20 backdrop-blur-sm border border-red-800/50 rounded-2xl p-8 sm:p-12 text-center mx-4 sm:mx-0 animate-fade-in">
        <div className="text-red-400 mb-6">
          <svg
            className="mx-auto h-16 w-16 sm:h-20 sm:w-20 animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold text-red-400 mb-3">
          Error Loading Applications
        </h3>
        <p className="text-red-300/90 mb-8 text-base sm:text-lg max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchApplications}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/50 text-base min-h-[44px]"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-16 sm:py-20 lg:py-24 px-4 sm:px-0 animate-fade-in">
        <div className="bg-gradient-to-br from-gray-800/50 via-blue-900/20 to-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 sm:p-12 max-w-2xl mx-auto">
          <div className="text-gray-400 mb-6">
            <svg
              className="mx-auto h-20 w-20 sm:h-24 sm:w-24 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-2xl sm:text-3xl font-semibold text-gray-200 mb-4">
            No Subscribed Applications
          </h3>
          <p className="text-gray-400 mb-8 text-base sm:text-lg max-w-md mx-auto">
            You haven&apos;t subscribed to any applications yet. Browse available applications to
            get started.
          </p>
          <div className="space-y-4 text-base text-gray-400 max-w-lg mx-auto text-left">
            <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl hover:bg-green-500/20 transition-colors duration-300">
              <svg
                className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Subscribe to applications to monitor their status</span>
            </div>
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-colors duration-300">
              <svg
                className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>View historical uptime data and trends</span>
            </div>
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl hover:bg-yellow-500/20 transition-colors duration-300">
              <svg
                className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Get notified about service disruptions</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in w-full overflow-x-hidden">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-gradient-to-br from-gray-800/80 via-gray-800/50 to-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 group cursor-pointer">
          <div className="flex items-start justify-between mb-2">
            <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {applications.length}
            </div>
            <svg
              className="w-8 h-8 text-blue-400/50 group-hover:text-blue-400 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
            Subscribed Apps
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-900/30 via-gray-800/50 to-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 hover:border-green-500/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 group cursor-pointer">
          <div className="flex items-start justify-between mb-2">
            <div className="text-3xl sm:text-4xl font-bold text-green-400">
              {applications.filter(app => app.currentStatus === 'online').length}
            </div>
            <svg
              className="w-8 h-8 text-green-400/50 group-hover:text-green-400 transition-colors"
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
          <div className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
            Online
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-900/30 via-gray-800/50 to-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-red-500/30 hover:border-red-500/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 group cursor-pointer">
          <div className="flex items-start justify-between mb-2">
            <div className="text-3xl sm:text-4xl font-bold text-red-400">
              {applications.filter(app => app.currentStatus === 'offline').length}
            </div>
            <svg
              className="w-8 h-8 text-red-400/50 group-hover:text-red-400 transition-colors"
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
          <div className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
            Offline
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-6">
        {applications.map((app, index) => {
          const isUnsubscribing = unsubscribingIds.has(app._id);

          return (
            <div
              key={app._id}
              className="bg-gradient-to-br from-gray-800/80 via-gray-800/40 to-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700/50 hover:border-gray-600 overflow-hidden animate-slide-up group min-w-0 w-full"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Application Header */}
              <div className="p-6 sm:p-8 pb-4 sm:pb-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                      <h3 className="text-xl sm:text-2xl font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                        {app.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <div
                          className={`w-3 h-3 rounded-full animate-pulse ${
                            app.currentStatus === 'online'
                              ? 'bg-green-400 shadow-lg shadow-green-400/50'
                              : app.currentStatus === 'offline'
                                ? 'bg-red-400 shadow-lg shadow-red-400/50'
                                : 'bg-gray-400 shadow-lg shadow-gray-400/50'
                          }`}
                        />
                        <span
                          className={`capitalize ${
                            app.currentStatus === 'online'
                              ? 'text-green-400'
                              : app.currentStatus === 'offline'
                                ? 'text-red-400'
                                : 'text-gray-400'
                          }`}
                        >
                          {app.currentStatus || 'unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-2 min-w-0">
                        <svg
                          className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                        <p className="text-sm sm:text-base text-gray-400 break-words overflow-wrap-anywhere leading-relaxed min-w-0">
                          {app.url}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-2 bg-gray-700/30 px-3 py-1.5 rounded-lg min-w-0">
                          <svg
                            className="w-4 h-4 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="truncate">
                            {app.owner.username ? `@${app.owner.username}` : app.owner.email}
                          </span>
                        </span>
                        <span className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-lg">
                          <svg
                            className="w-4 h-4 text-blue-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                          </svg>
                          {app.subscribers.length} subscriber
                          {app.subscribers.length !== 1 ? 's' : ''}
                        </span>
                        {app.lastChecked && (
                          <span className="flex items-center gap-2 bg-gray-700/30 px-3 py-1.5 rounded-lg">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="hidden sm:inline">Checked </span>
                            {new Date(app.lastChecked).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0 mt-2 lg:mt-0">
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 min-h-[44px]"
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
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      <span className="hidden sm:inline">Visit</span>
                      <span className="sm:hidden">Open</span>
                    </a>

                    <button
                      onClick={() => handleUnsubscribe(app._id, app.name)}
                      disabled={isUnsubscribing}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 min-h-[44px]"
                    >
                      {isUnsubscribing ? (
                        <>
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span className="hidden sm:inline">Unsubscribing...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
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
                          <span className="hidden sm:inline">Unsubscribe</span>
                          <span className="sm:hidden">Leave</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-200 mb-1 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-blue-400"
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
                      Status History
                    </h4>
                    <p className="text-sm text-gray-400">
                      <span className="hidden sm:inline">
                        Last {daysToShow} days · Hover over blocks for details
                      </span>
                      <span className="sm:hidden">Last {daysToShow} days · Tap for details</span>
                    </p>
                  </div>
                </div>
                <StatusTimeline appId={app._id} days={daysToShow} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
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
          animation: fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
      `}</style>
    </div>
  );
}
