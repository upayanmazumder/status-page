'use client';

import { useState } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../Auth/AuthProvider/AuthProvider';
import { useNotification } from '../../Notification/Notification';

interface AddApplicationProps {
  onAdded?: () => void;
}

export default function AddApplication({ onAdded }: AddApplicationProps) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const { notify } = useNotification();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Application name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Application name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Application name must be less than 50 characters';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      try {
        const url = new URL(formData.url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          newErrors.url = 'URL must use HTTP or HTTPS protocol';
        }
      } catch {
        newErrors.url = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/applications', formData);

      // Reset form
      setFormData({ name: '', url: '' });
      setErrors({});

      notify('Application added successfully!', 'success');
      onAdded?.();
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: { message?: string; errors?: Record<string, string> };
        };
      };

      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        notify(
          error?.response?.data?.message || 'Failed to add application. Please try again.',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        `
        <div>
          <label
            htmlFor="app-name"
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Application Name *
          </label>
          <input
            id="app-name"
            type="text"
            value={formData.name}
            onChange={e => handleInputChange('name', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg bg-gray-900/80 text-white border transition-all duration-200 focus:outline-none focus:ring-2 backdrop-blur-sm ${
              errors.name
                ? 'border-red-500 focus:ring-red-500 bg-red-900/10'
                : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/50 hover:border-gray-500'
            }`}
            placeholder="e.g., My Website, API Service, Production App"
            disabled={loading}
          />
          {errors.name && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-400">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.name}
            </div>
          )}
        </div>
        <div>
          <label
            htmlFor="app-url"
            className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4 text-green-400"
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
            Application URL *
          </label>
          <input
            id="app-url"
            type="url"
            value={formData.url}
            onChange={e => handleInputChange('url', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg bg-gray-900/80 text-white border transition-all duration-200 focus:outline-none focus:ring-2 backdrop-blur-sm ${
              errors.url
                ? 'border-red-500 focus:ring-red-500 bg-red-900/10'
                : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/50 hover:border-gray-500'
            }`}
            placeholder="https://example.com"
            disabled={loading}
          />
          {errors.url ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-400">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.url}
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              This URL will be monitored for uptime and status checks
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            * Required fields
          </div>
          <button
            type="submit"
            disabled={loading}
            className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 shadow-lg hover:shadow-blue-500/50 disabled:shadow-none hover:scale-105 disabled:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
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
                <span>Adding Application...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Application
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
