'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../../components/Auth/AuthProvider/AuthProvider';
import ApplicationsAdd from '../../../components/Application/Add/Add';
import ApplicationsSearch from '../../../components/Application/Search/Search';
import ApplicationsList from '../../../components/Application/List/List';

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState<'my-apps' | 'browse' | 'add'>('my-apps');
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  if (!user) {
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-400 mb-3">Access Denied</h1>
          <p className="text-red-300">Please log in to access your applications.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/10 to-gray-900 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="mb-8 animate-fade-in-down">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Applications
          </h1>
          <p className="text-gray-400 text-lg">
            Manage your applications, monitor their status, and discover new services to track
          </p>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="mb-8 animate-fade-in">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-2 backdrop-blur-sm">
            <nav className="flex gap-2">
              <button
                onClick={() => setActiveTab('my-apps')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'my-apps'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>My Applications</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('browse')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'browse'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Browse & Subscribe</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('add')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'add'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Add New</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === 'my-apps' && (
            <section className="animate-fade-in">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-800/30 border border-gray-700 rounded-xl p-6 mb-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/20 p-3 rounded-lg">
                    <svg
                      className="w-6 h-6 text-blue-400"
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
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">
                      Your Subscribed Applications
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Monitor the status and uptime of applications you&apos;re subscribed to
                    </p>
                  </div>
                </div>
              </div>
              <ApplicationsList key={`my-apps-${refreshKey}`} />
            </section>
          )}

          {activeTab === 'browse' && (
            <section className="animate-fade-in">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-800/30 border border-gray-700 rounded-xl p-6 mb-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-green-500/20 p-3 rounded-lg">
                    <svg
                      className="w-6 h-6 text-green-400"
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
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">Browse Applications</h2>
                    <p className="text-gray-400 text-sm">
                      Discover and subscribe to applications to monitor their status
                    </p>
                  </div>
                </div>
              </div>
              <ApplicationsSearch key={`browse-${refreshKey}`} onSubscribedChange={handleRefresh} />
            </section>
          )}

          {activeTab === 'add' && (
            <section className="animate-fade-in">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-800/30 border border-gray-700 rounded-xl p-6 mb-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-500/20 p-3 rounded-lg">
                    <svg
                      className="w-6 h-6 text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">Add New Application</h2>
                    <p className="text-gray-400 text-sm">
                      Add a new application to the platform for monitoring and sharing
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-800/30 border border-gray-700 rounded-xl p-8 backdrop-blur-sm">
                <ApplicationsAdd
                  onAdded={() => {
                    handleRefresh();
                    setActiveTab('my-apps');
                  }}
                />
              </div>
            </section>
          )}
        </div>
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
        .animate-fade-in {
          animation: fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
      `}</style>
    </main>
  );
}
