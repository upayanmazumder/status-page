"use client";

import { useState, useEffect } from "react";
import axios from "axios";

interface ComponentStatus {
  id: string;
  name: string;
  status: string;
}

export default function DemoStatusPage() {
  const [status, setStatus] = useState({
    org_name: "Demo Organization",
    project_name: "Production Services",
    overall_status: "operational",
    components: [
      { id: "1", name: "API Gateway", description: "Main API entry point", status: "operational" },
      { id: "2", name: "Authentication Service", description: "User auth & tokens", status: "operational" },
      { id: "3", name: "Database", description: "Primary PostgreSQL cluster", status: "operational" },
      { id: "4", name: "CDN", description: "Content delivery network", status: "degraded_performance" },
      { id: "5", name: "Email Service", description: "Transactional emails", status: "operational" },
    ] as ComponentStatus[],
    active_incidents: [
      { id: "1", title: "CDN Response Time Degraded", status: "monitoring", impact: "minor", created_at: new Date().toISOString() },
    ],
    upcoming_maintenances: [],
    updated_at: new Date().toISOString(),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus((prev) => ({
        ...prev,
        updated_at: new Date().toISOString(),
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColors: Record<string, string> = {
    operational: "bg-green-500",
    degraded_performance: "bg-yellow-500",
    partial_outage: "bg-orange-500",
    major_outage: "bg-red-500",
    under_maintenance: "bg-blue-500",
  };

  const statusText: Record<string, string> = {
    operational: "All Systems Operational",
    degraded_performance: "Degraded Performance",
    partial_outage: "Partial Outage",
    major_outage: "Major Outage",
    under_maintenance: "Under Maintenance",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Demo Organization</h1>
          <p className="text-gray-600">Production Services</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className={`rounded-lg p-6 text-white ${statusColors[status.overall_status]}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{statusText[status.overall_status]}</h2>
              <p className="mt-1 opacity-90">Last updated: {new Date(status.updated_at).toLocaleString()}</p>
            </div>
            <div className="text-4xl">{status.overall_status === "operational" ? "✓" : "!"}</div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Services</h3>
          <div className="bg-white rounded-lg shadow-sm border divide-y">
            {status.components.map((component) => (
              <div key={component.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="font-medium text-gray-900">{component.name}</div>
                  <div className="text-sm text-gray-500">{component.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-3 h-3 rounded-full ${statusColors[component.status]}`} />
                  <span className="text-sm text-gray-600 capitalize">{component.status.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {status.active_incidents.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Incidents</h3>
            <div className="space-y-4">
              {status.active_incidents.map((incident) => (
                <div key={incident.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{incident.title}</h4>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      {incident.impact}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Status: {incident.status} Started: {new Date(incident.created_at).toLocaleString()}
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
