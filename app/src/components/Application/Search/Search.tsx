'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../Auth/AuthProvider/AuthProvider';
import { useNotification } from '../../Notification/Notification';
import Loader from '../../Loader/Loader';

interface Application {
  _id: string;
  name: string;
  url: string;
  owner: { email: string; username?: string };
  subscribers: { email: string; username?: string }[];
  createdAt?: string;
}

interface ApplicationsSearchProps {
  onSubscribedChange?: () => void;
}

export default function ApplicationsSearch({ onSubscribedChange }: ApplicationsSearchProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'subscribers' | 'newest'>('name');
  const [filterOwned, setFilterOwned] = useState(false);
  const [subscribingIds, setSubscribingIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { notify } = useNotification();

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/applications');
      setApplications(res.data.applications || []);
    } catch {
      notify('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleSubscriptionToggle = useCallback(
    async (appId: string, isSubscribed: boolean) => {
      if (subscribingIds.has(appId)) return;

      setSubscribingIds(prev => new Set(prev).add(appId));
      try {
        const endpoint = `/applications/${appId}/${isSubscribed ? 'unsubscribe' : 'subscribe'}`;
        await api.post(endpoint);

        // Update local state
        setApplications(prev =>
          prev.map(app => {
            if (app._id === appId) {
              const newSubscribers = isSubscribed
                ? app.subscribers.filter(s => s.email !== user?.email)
                : [...app.subscribers, { email: user!.email, username: user?.username }];
              return { ...app, subscribers: newSubscribers };
            }
            return app;
          })
        );

        notify(isSubscribed ? 'Unsubscribed successfully' : 'Subscribed successfully', 'success');
        onSubscribedChange?.();
      } catch {
        notify('Failed to update subscription', 'error');
      } finally {
        setSubscribingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(appId);
          return newSet;
        });
      }
    },
    [user, notify, onSubscribedChange, subscribingIds]
  );

  const filteredAndSortedApplications = useMemo(() => {
    const filtered = applications.filter(app => {
      const matchesSearch =
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.owner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.owner.username?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesFilter = !filterOwned || app.owner.email === user?.email;

      return matchesSearch && matchesFilter;
    });

    // Sort applications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'subscribers':
          return b.subscribers.length - a.subscribers.length;
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default: // name
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [applications, searchQuery, sortBy, filterOwned, user?.email]);

  const getApplicationStats = (app: Application) => {
    const isSubscribed = !!user && app.subscribers.some(s => s.email === user.email);
    const isOwner = app.owner.email === user?.email;
    const subscriberCount = app.subscribers.length;

    return { isSubscribed, isOwner, subscriberCount };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      {/* Search and Filters */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-800/30 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Search Applications
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Search by name, URL, or owner..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-900/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:border-gray-500 backdrop-blur-sm"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label
              htmlFor="sort"
              className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4 text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
              Sort By
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-4 py-3 rounded-lg bg-gray-900/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:border-gray-500 backdrop-blur-sm cursor-pointer"
            >
              <option value="name">Name (A-Z)</option>
              <option value="subscribers">Most Subscribers</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        {/* Filter Options */}
        <div className="mt-4 flex items-center space-x-4">
          <label className="flex items-center text-sm text-gray-300 cursor-pointer group">
            <input
              type="checkbox"
              checked={filterOwned}
              onChange={e => setFilterOwned(e.target.checked)}
              className="mr-2 rounded text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer w-4 h-4"
            />
            <span className="group-hover:text-white transition-colors">
              Show only my applications
            </span>
          </label>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm">
        <span>
          {filteredAndSortedApplications.length} application
          {filteredAndSortedApplications.length !== 1 ? 's' : ''} found
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Applications Grid */}
      {filteredAndSortedApplications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No applications found</h3>
          <p className="text-gray-400">
            {searchQuery
              ? 'Try adjusting your search criteria'
              : 'No applications available at the moment'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedApplications.map((app, index) => {
            const { isSubscribed, isOwner, subscriberCount } = getApplicationStats(app);
            const isProcessing = subscribingIds.has(app._id);

            return (
              <div
                key={app._id}
                className="group bg-gradient-to-br from-gray-800/50 to-gray-800/30 border border-gray-700 rounded-xl p-6 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 animate-slide-up min-w-0"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                      {app.name}
                    </h3>
                    {isOwner && (
                      <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs px-3 py-1 rounded-full flex-shrink-0 shadow-lg">
                        Owner
                      </span>
                    )}
                  </div>
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline break-words overflow-wrap-anywhere mb-3 block line-clamp-2"
                  >
                    {app.url}
                  </a>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{app.owner.username ? `@${app.owner.username}` : app.owner.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                      <span>
                        {subscriberCount} subscriber{subscriberCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {!isOwner && (
                  <button
                    onClick={() => handleSubscriptionToggle(app._id, isSubscribed)}
                    disabled={isProcessing}
                    className={`w-full py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed shadow-lg hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2 ${
                      isSubscribed
                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-500 text-white hover:shadow-red-500/50'
                        : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:ring-green-500 text-white hover:shadow-green-500/50'
                    } ${isProcessing ? 'opacity-75' : ''}`}
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                        <span>Processing...</span>
                      </>
                    ) : isSubscribed ? (
                      <>
                        <svg
                          className="w-5 h-5"
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
                        Unsubscribe
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Subscribe
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Animations */}
      <style jsx global>{`
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
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
      `}</style>
    </div>
  );
}
