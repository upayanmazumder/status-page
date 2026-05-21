"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

interface Component {
  id: string;
  name: string;
  description: string | null;
  status: string;
  group_name: string | null;
}

interface Incident {
  id: string;
  title: string;
  status: string;
  impact: string;
  created_at: string;
  resolved_at: string | null;
}

interface Maintenance {
  id: string;
  title: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
}

interface StatusData {
  org_name: string;
  project_name: string;
  overall_status: string;
  components: Component[];
  active_incidents: Incident[];
  upcoming_maintenances: Maintenance[];
  updated_at: string;
}

const statusColors: Record<string, string> = {
  operational: "bg-green-500",
  degraded_performance: "bg-yellow-500",
  partial_outage: "bg-orange-500",
  major_outage: "bg-red-500",
  under_maintenance: "bg-blue-500",
};

const statusText: Record<string, string> = {
  operational: "Operational",
  degraded_performance: "Degraded Performance",
  partial_outage: "Partial Outage",
  major_outage: "Major Outage",
  under_maintenance: "Under Maintenance",
};

export default function StatusPage() {
  const params = useParams();
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const orgSlug = params.orgSlug as string;
        // For MVP, assume project slug is same as org slug or use "default"
        const projectSlug = "default";

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/status/${orgSlug}/${projectSlug}`
        );
        setData(response.data);
      } catch (err) {
        setError("Failed to load status page");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [params.orgSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error || "Status page not found"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">{data.org_name}</h1>
          <p className="text-gray-600">{data.project_name}</p>
        </div>
      </div>

      {/* Overall Status */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div
          className={`rounded-lg p-6 text-white ${
            statusColors[data.overall_status] || "bg-gray-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {statusText[data.overall_status] || data.overall_status}
              </h2>
              <p className="mt-1 opacity-90">
                Last updated: {new Date(data.updated_at).toLocaleString()}
              </p>
            </div>
            <div className="text-4xl">
              {data.overall_status === "operational" ? "✓" : "!"}
            </div>
          </div>
        </div>

        {/* Components */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Services</h3>
          <div className="bg-white rounded-lg shadow-sm border divide-y">
            {data.components.map((component) => (
              <div
                key={component.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {component.name}
                  </div>
                  {component.description && (
                    <div className="text-sm text-gray-500">
                      {component.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${
                      statusColors[component.status] || "bg-gray-500"
                    }`}
                  />
                  <span className="text-sm text-gray-600">
                    {statusText[component.status] || component.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Incidents */}
        {data.active_incidents.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Active Incidents
            </h3>
            <div className="space-y-4">
              {data.active_incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-white rounded-lg shadow-sm border p-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {incident.title}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        incident.impact === "critical"
                          ? "bg-red-100 text-red-800"
                          : incident.impact === "major"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {incident.impact}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Status: {incident.status} • Started:{" "}
                    {new Date(incident.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Maintenance */}
        {data.upcoming_maintenances.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Scheduled Maintenance
            </h3>
            <div className="space-y-4">
              {data.upcoming_maintenances.map((maintenance) => (
                <div
                  key={maintenance.id}
                  className="bg-white rounded-lg shadow-sm border p-6"
                >
                  <h4 className="font-medium text-gray-900 mb-2">
                    {maintenance.title}
                  </h4>
                  <div className="text-sm text-gray-500">
                    Scheduled:{" "}
                    {new Date(maintenance.scheduled_start).toLocaleString()} -{" "}
                    {new Date(maintenance.scheduled_end).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
