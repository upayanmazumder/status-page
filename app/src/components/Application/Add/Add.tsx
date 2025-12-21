'use client';

import { useState } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../Auth/AuthProvider/AuthProvider';
import { useNotification } from '../../Notification/Notification';
import { Button, FormField, Card } from '../../ui';

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
    <Card variant="bordered" padding="lg" className="w-full overflow-x-hidden">
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <FormField
          label="Application Name"
          required
          labelIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          type="text"
          value={formData.name}
          onChange={e => handleInputChange('name', e.target.value)}
          placeholder="e.g., My Website, API Service, Production App"
          disabled={loading}
          error={errors.name}
        />

        <FormField
          label="Application URL"
          required
          labelIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          }
          type="url"
          value={formData.url}
          onChange={e => handleInputChange('url', e.target.value)}
          placeholder="https://example.com"
          disabled={loading}
          error={errors.url}
          helperText={
            !errors.url ? 'This URL will be monitored for uptime and status checks' : undefined
          }
        />

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
          <Button
            type="submit"
            disabled={loading}
            isLoading={loading}
            leftIcon={
              !loading && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              )
            }
          >
            {loading ? 'Adding Application...' : 'Add Application'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
