"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import ActivityFeed from "@/components/activity-feed";

interface Component {
  id: string;
  name: string;
  status: string;
  description: string | null;
}

interface Incident {
  id: string;
  title: string;
  status: string;
  impact: string;
  created_at: string;
}

export default function DashboardPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId] = useState("default"); // TODO: Get from context

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch components
        const compResponse = await apiClient.get(`/dashboard/components?project_id=${projectId}`);
        setComponents(compResponse.data.items || []);

        // Fetch active incidents
        const incResponse = await apiClient.get(`/dashboard/incidents?project_id=${projectId}&status=investigating`);
        setIncidents(incResponse.data.items || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Manage your status page</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">Components</div>
          <div className="text-2xl font-bold text-gray-900">{components.length}</div>
          <div className="text-sm text-gray-500 mt-2">
            {components.filter((c) => c.status === "operational").length} operational
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">Active Incidents</div>
          <div className="text-2xl font-bold text-red-600">{incidents.length}</div>
          <div className="text-sm text-gray-500 mt-2">
            {incidents.filter((i) => i.impact === "critical").length} critical
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">System Status</div>
          <div className="text-2xl font-bold text-green-600">
            {components.every((c) => c.status === "operational") ? "All Good" : "Issues"}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {components.filter((c) => c.status !== "operational").length} affected
          </div>
        </div>
      </div>

      {/* Components List */}
      <div className="bg-white rounded-lg shadow-sm border mb-8">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Components</h2>
          <Link
            href="/dashboard/components/new"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Component
          </Link>
        </div>
        <div className="divide-y">
          {components.map((component) => (
            <div
              key={component.id}
              className="px-6 py-4 flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-gray-900">{component.name}</div>
                {component.description && (
                  <div className="text-sm text-gray-500">{component.description}</div>
                )}
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  component.status === "operational"
                    ? "bg-green-100 text-green-800"
                    : component.status === "degraded_performance"
                    ? "bg-yellow-100 text-yellow-800"
                    : component.status === "partial_outage"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {component.status.replace("_", " ")}
              </span>
            </div>
          ))}
          {components.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              No components yet. Add your first component to start monitoring.
            </div>
          )}
        </div>
      </div>

      {/* Active Incidents */}
      <div className="bg-white rounded-lg shadow-sm border mb-8">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Active Incidents</h2>
          <Link
            href="/dashboard/incidents/new"
            className="text-sm text-red-600 hover:text-red-800"
          >
            + Report Incident
          </Link>
        </div>
        <div className="divide-y">
          {incidents.map((incident) => (
            <div key={incident.id} className="px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-900">{incident.title}</div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
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
          {incidents.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              No active incidents. Great job keeping things running!
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <ActivityFeed />
    </div>
  );
}
