"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import apiClient from "@/lib/api";
import CreateIncidentModal from "@/components/modals/create-incident";

interface Incident {
  id: string;
  title: string;
  status: string;
  impact: string;
  created_at: string;
  resolved_at: string | null;
}

const statusColors: Record<string, string> = {
  investigating: "bg-yellow-100 text-yellow-800",
  identified: "bg-orange-100 text-orange-800",
  monitoring: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
};

const impactColors: Record<string, string> = {
  none: "bg-gray-100 text-gray-800",
  minor: "bg-yellow-100 text-yellow-800",
  major: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchIncidents = async () => {
    try {
      const url = filter === "all"
        ? "/dashboard/incidents?project_id=default"
        : `/dashboard/incidents?project_id=default&status_filter=${filter}`;
      const response = await apiClient.get(url);
      setIncidents(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [filter]);

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
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-gray-600">Track and manage incidents</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          + Report Incident
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {["all", "investigating", "identified", "monitoring", "resolved"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              filter === s
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {incidents.map((incident) => (
          <Link
            key={incident.id}
            href={`/dashboard/incidents/${incident.id}`}
            className="block bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[incident.status]}`}>
                    {incident.status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${impactColors[incident.impact]}`}>
                    {incident.impact}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Created {new Date(incident.created_at).toLocaleString()}
                  {incident.resolved_at && (
                    <span className="ml-2 text-green-600">
                      Resolved {new Date(incident.resolved_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
        {incidents.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
            No incidents found. Great job keeping things running!
          </div>
        )}
      </div>

      {showModal && (
        <CreateIncidentModal
          projectId="default"
          onClose={() => setShowModal(false)}
          onSuccess={fetchIncidents}
        />
      )}
    </div>
  );
}
