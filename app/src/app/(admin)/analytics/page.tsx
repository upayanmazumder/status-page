"use client";

import { useState } from "react";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Monitor your system health and uptime</p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                period === p
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Uptime", value: "99.9%", change: "+0.1%", color: "text-green-600" },
          { label: "Avg Response Time", value: "145ms", change: "-12ms", color: "text-green-600" },
          { label: "Total Incidents", value: "3", change: "-2", color: "text-green-600" },
          { label: "MTTR", value: "23m", change: "+5m", color: "text-red-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className={`text-sm mt-1 ${stat.color}`}>{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Uptime History</h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-gray-400 text-sm">Uptime chart will be rendered here</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Response Time</h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-gray-400 text-sm">Response time chart will be rendered here</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Frequency</h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-gray-400 text-sm">Incident frequency chart will be rendered here</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Component Status Distribution</h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-gray-400 text-sm">Status distribution chart will be rendered here</div>
          </div>
        </div>
      </div>
    </div>
  );
}
