"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function DarkModeStatusPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check system preference
    setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/status/demo/default`);
        setData(response.data);
      } catch (error) {
        // Use demo data
        setData({
          org_name: "Demo Org",
          project_name: "Services",
          overall_status: "operational",
          components: [
            { id: "1", name: "API", description: "REST API", status: "operational" },
            { id: "2", name: "Web App", description: "Frontend", status: "operational" },
            { id: "3", name: "Database", description: "Postgres", status: "operational" },
          ],
          active_incidents: [],
          upcoming_maintenances: [],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const statusColors: Record<string, string> = {
    operational: darkMode ? "bg-green-500" : "bg-green-500",
    degraded_performance: darkMode ? "bg-yellow-500" : "bg-yellow-500",
    partial_outage: darkMode ? "bg-orange-500" : "bg-orange-500",
    major_outage: darkMode ? "bg-red-500" : "bg-red-500",
    under_maintenance: darkMode ? "bg-blue-500" : "bg-blue-500",
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${darkMode ? "border-white" : "border-gray-900"}`}></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} shadow-sm border-b`}>
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{data?.org_name || "Status Page"}</h1>
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>{data?.project_name}</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className={`rounded-lg p-6 text-white ${statusColors[data?.overall_status || "operational"]}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">All Systems Operational</h2>
              <p className="mt-1 opacity-90">Last updated: {new Date().toLocaleString()}</p>
            </div>
            <div className="text-4xl">✓</div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Services</h3>
          <div className={`rounded-lg shadow-sm border divide-y ${darkMode ? "bg-gray-800 border-gray-700 divide-gray-700" : "bg-white border-gray-200"}`}>
            {(data?.components || []).map((component: any) => (
              <div key={component.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{component.name}</div>
                  {component.description && (
                    <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{component.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-3 h-3 rounded-full ${statusColors[component.status]}`} />
                  <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {component.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
