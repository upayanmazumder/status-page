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
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 sm:p-8 text-center mx-4 sm:mx-0">
        <div className="text-red-400 mb-4 sm:mb-6">
          <svg
            className="mx-auto h-12 w-12 sm:h-16 sm:w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg sm:text-xl font-medium text-red-400 mb-2 sm:mb-3">
          Error Loading Applications
        </h3>
        <p className="text-red-300 mb-4 sm:mb-6 text-sm sm:text-base">{error}</p>
        <button
          onClick={fetchApplications}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-200 text-sm sm:text-base min-h-[44px]"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16 lg:py-20 px-4 sm:px-0">
        <div className="text-gray-400 mb-4 sm:mb-6">
          <svg
            className="mx-auto h-16 w-16 sm:h-20 sm:w-20"
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
        <h3 className="text-xl sm:text-2xl font-medium text-gray-300 mb-2 sm:mb-3">
          No Subscribed Applications
        </h3>
        <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base max-w-md mx-auto">
          You haven&apos;t subscribed to any applications yet. Browse available applications to get
          started.
        </p>
        <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-500 max-w-lg mx-auto">
          <p className="flex items-center justify-center sm:justify-start gap-2">
            <svg
              className="w-4 h-4 text-green-400 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Subscribe to applications to monitor their status
          </p>
          <p className="flex items-center justify-center sm:justify-start gap-2">
            <svg
              className="w-4 h-4 text-blue-400 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            View historical uptime data and trends
          </p>
          <p className="flex items-center justify-center sm:justify-start gap-2">
            <svg
              className="w-4 h-4 text-yellow-400 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Get notified about service disruptions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-gray-800 rounded-lg p-4 sm:p-5 lg:p-6 border border-gray-700 hover:border-gray-600 transition-colors duration-200">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
            {applications.length}
          </div>
          <div className="text-sm sm:text-base text-gray-400">Subscribed Apps</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 sm:p-5 lg:p-6 border border-gray-700 hover:border-gray-600 transition-colors duration-200">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-400 mb-1">
            {applications.filter(app => app.currentStatus === 'online').length}
          </div>
          <div className="text-sm sm:text-base text-gray-400">Online</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 sm:p-5 lg:p-6 border border-gray-700 hover:border-gray-600 transition-colors duration-200">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-400 mb-1">
            {applications.filter(app => app.currentStatus === 'offline').length}
          </div>
          <div className="text-sm sm:text-base text-gray-400">Offline</div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4 md:space-y-6">
        {applications.map(app => {
          const isUnsubscribing = unsubscribingIds.has(app._id);

          return (
            <div
              key={app._id}
              className="bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-700 hover:border-gray-600 overflow-hidden"
            >
              {/* Application Header */}
              <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <h3 className="text-lg sm:text-xl font-semibold text-white truncate">
                        {app.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                        <div
                          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                            app.currentStatus === 'online'
                              ? 'bg-green-400'
                              : app.currentStatus === 'offline'
                                ? 'bg-red-400'
                                : 'bg-gray-400'
                          }`}
                        />
                        <span
                          className={`font-medium capitalize ${
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

                    <div className="space-y-2">
                      <p className="text-sm sm:text-base text-gray-400 break-all leading-relaxed">
                        {app.url}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Owner: {app.owner.username ? `@${app.owner.username}` : app.owner.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                          </svg>
                          {app.subscribers.length} subscriber
                          {app.subscribers.length !== 1 ? 's' : ''}
                        </span>
                        {app.lastChecked && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="hidden sm:inline">Last checked: </span>
                            <span className="sm:hidden">Checked: </span>
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
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 mt-2 lg:mt-0">
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-md transition-all duration-200 min-h-[36px] sm:min-h-[40px]"
                    >
                      <svg
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4"
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
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-all duration-200 min-h-[36px] sm:min-h-[40px]"
                    >
                      {isUnsubscribing ? (
                        <>
                          <svg
                            className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
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
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6z"
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
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="mb-3 sm:mb-4">
                  <h4 className="text-sm sm:text-base font-medium text-gray-300 mb-1">
                    Status History ({daysToShow} days)
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500">
                    <span className="hidden sm:inline">
                      Hover over blocks to see detailed status information
                    </span>
                    <span className="sm:hidden">Tap blocks for status details</span>
                  </p>
                </div>
                <StatusTimeline appId={app._id} days={daysToShow} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
