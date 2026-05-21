"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api";

interface Maintenance {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  created_at: string;
}

export default function MaintenancePage() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduled_start: "",
    scheduled_end: "",
  });

  const fetchMaintenances = async () => {
    try {
      const response = await apiClient.get("/dashboard/maintenances?project_id=default");
      setMaintenances(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch maintenances:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenances();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/dashboard/maintenances?project_id=default", {
        ...formData,
        component_ids: [],
      });
      setShowForm(false);
      setFormData({ title: "", description: "", scheduled_start: "", scheduled_end: "" });
      fetchMaintenances();
    } catch (error) {
      alert("Failed to schedule maintenance");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-600">Schedule and manage maintenance windows</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          + Schedule Maintenance
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Maintenance</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_start}
                  onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_end}
                  onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {maintenances.map((m) => (
          <div key={m.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{m.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    m.status === "scheduled"
                      ? "bg-blue-100 text-blue-800"
                      : m.status === "in_progress"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {m.status}
                  </span>
                </div>
                {m.description && (
                  <p className="text-gray-600 text-sm mb-2">{m.description}</p>
                )}
                <div className="text-sm text-gray-500">
                  {new Date(m.scheduled_start).toLocaleString()} - {new Date(m.scheduled_end).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        {maintenances.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
            No maintenance windows scheduled.
          </div>
        )}
      </div>
    </div>
  );
}
