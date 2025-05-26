"use client";

import { useState } from "react";
import api from "../../../utils/api";
import { useAuth } from "../../Auth/AuthProvider/AuthProvider";

export default function AddApplication({ onAdded }: { onAdded?: () => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      await api.post("/applications", { name, url });
      setSuccess(true);
      setName("");
      setUrl("");
      onAdded?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error?.response?.data?.message ||
          "Failed to add application. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto p-4 bg-gray-800 rounded-lg shadow-md mb-8"
    >
      <h2 className="text-xl font-bold mb-4 text-white">Add New Application</h2>
      <div className="mb-4">
        <label className="block text-gray-300 mb-1" htmlFor="app-name">
          Name
        </label>
        <input
          id="app-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 rounded bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. My Website"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-300 mb-1" htmlFor="app-url">
          URL
        </label>
        <input
          id="app-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="w-full px-3 py-2 rounded bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. https://example.com"
        />
      </div>
      {error && <div className="mb-2 text-red-400 text-sm">{error}</div>}
      {success && (
        <div className="mb-2 text-green-400 text-sm">
          Application added successfully!
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Application"}
      </button>
    </form>
  );
}
