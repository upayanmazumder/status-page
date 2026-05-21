"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import apiClient from "@/lib/api";

interface IncidentUpdate {
  id: string;
  message: string;
  status: string;
  created_at: string;
}

interface IncidentDetail {
  id: string;
  title: string;
  status: string;
  impact: string;
  created_at: string;
  resolved_at: string | null;
  updates: IncidentUpdate[];
}

const statusColors: Record<string, string> = {
  investigating: "bg-yellow-100 text-yellow-800 border-yellow-200",
  identified: "bg-orange-100 text-orange-800 border-orange-200",
  monitoring: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
};

export default function IncidentDetailPage() {
  const params = useParams();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newUpdate, setNewUpdate] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const incidentId = params.id as string;

  const fetchIncident = async () => {
    try {
      const response = await apiClient.get(`/dashboard/incidents/${incidentId}`);
      setIncident(response.data);
      setNewStatus(response.data.status);
    } catch (error) {
      console.error("Failed to fetch incident:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [incidentId]);

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdate.trim()) return;

    setSubmitting(true);
    try {
      await apiClient.patch(`/dashboard/incidents/${incidentId}`, {
        message: newUpdate,
        status: newStatus,
      });
      setNewUpdate("");
      fetchIncident();
    } catch (error) {
      alert("Failed to add update");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center text-gray-500 py-12">Incident not found</div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{incident.title}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[incident.status]}`}>
            {incident.status}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          Started {new Date(incident.created_at).toLocaleString()}
          {incident.resolved_at && (
            <span className="ml-4 text-green-600">
              Resolved {new Date(incident.resolved_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
        <div className="space-y-4">
          {incident.updates.map((update, index) => (
            <div key={update.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${
                  index === 0 ? "bg-blue-500" : "bg-gray-300"
                }`} />
                {index < incident.updates.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-200 mt-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColors[update.status]}`}>
                    {update.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(update.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700">{update.message}</p>
              </div>
            </div>
          ))}
          {incident.updates.length === 0 && (
            <div className="text-gray-500 text-sm">No updates yet.</div>
          )}
        </div>
      </div>

      {/* Add Update */}
      {!incident.resolved_at && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Update</h2>
          <form onSubmit={handleAddUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="investigating">Investigating</option>
                <option value="identified">Identified</option>
                <option value="monitoring">Monitoring</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Message
              </label>
              <textarea
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                rows={3}
                placeholder="What's the current status?"
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Update"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
