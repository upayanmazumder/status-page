"use client";

import { useState } from "react";
import api from "../../../utils/api";
import { useAuth } from "../../Auth/AuthProvider/AuthProvider";
import { useNotification } from "../../Notification/Notification";

interface AddApplicationProps {
  onAdded?: () => void;
}

export default function AddApplication({ onAdded }: AddApplicationProps) {
  const [formData, setFormData] = useState({
    name: "",
    url: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const { notify } = useNotification();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Application name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Application name must be at least 2 characters";
    } else if (formData.name.length > 50) {
      newErrors.name = "Application name must be less than 50 characters";
    }

    if (!formData.url.trim()) {
      newErrors.url = "URL is required";
    } else {
      try {
        const url = new URL(formData.url);
        if (!["http:", "https:"].includes(url.protocol)) {
          newErrors.url = "URL must use HTTP or HTTPS protocol";
        }
      } catch {
        newErrors.url = "Please enter a valid URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await api.post("/applications", formData);

      // Reset form
      setFormData({ name: "", url: "" });
      setErrors({});

      notify("Application added successfully!", "success");
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
          error?.response?.data?.message ||
            "Failed to add application. Please try again.",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          Application Details
        </h3>
        <p className="text-gray-400 text-sm">
          Provide the basic information about your application. The URL will be
          monitored for status updates.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="app-name"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Application Name *
          </label>
          <input
            id="app-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className={`w-full px-4 py-3 rounded-lg bg-gray-900 text-white border transition-colors duration-200 focus:outline-none focus:ring-2 ${
              errors.name
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            }`}
            placeholder="e.g. My Website, API Service, etc."
            disabled={loading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-400">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="app-url"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Application URL *
          </label>
          <input
            id="app-url"
            type="url"
            value={formData.url}
            onChange={(e) => handleInputChange("url", e.target.value)}
            className={`w-full px-4 py-3 rounded-lg bg-gray-900 text-white border transition-colors duration-200 focus:outline-none focus:ring-2 ${
              errors.url
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            }`}
            placeholder="https://example.com"
            disabled={loading}
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-400">{errors.url}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            This URL will be monitored for uptime and status checks
          </p>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="text-xs text-gray-500">* Required fields</div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                <span>Adding...</span>
              </span>
            ) : (
              "Add Application"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
