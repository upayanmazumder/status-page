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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">Please log in to access your applications.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Applications</h1>
          <p className="text-gray-400">
            Manage your applications, monitor their status, and discover new services to track.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my-apps')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'my-apps'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              My Applications
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'browse'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Browse & Subscribe
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'add'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Add New Application
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="transition-opacity duration-200">
          {activeTab === 'my-apps' && (
            <section>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Your Subscribed Applications
                </h2>
                <p className="text-gray-400 text-sm">
                  Monitor the status and uptime of applications you&apos;re subscribed to.
                </p>
              </div>
              <ApplicationsList key={`my-apps-${refreshKey}`} />
            </section>
          )}

          {activeTab === 'browse' && (
            <section>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Browse Applications</h2>
                <p className="text-gray-400 text-sm">
                  Discover and subscribe to applications to monitor their status.
                </p>
              </div>
              <ApplicationsSearch key={`browse-${refreshKey}`} onSubscribedChange={handleRefresh} />
            </section>
          )}

          {activeTab === 'add' && (
            <section>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Add New Application</h2>
                <p className="text-gray-400 text-sm">
                  Add a new application to the platform for monitoring and sharing.
                </p>
              </div>
              <div className="max-w-2xl">
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
    </main>
  );
}
