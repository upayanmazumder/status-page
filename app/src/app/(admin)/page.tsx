"use client";

import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Manage your status page</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Overall Status
          </div>
          <div className="text-2xl font-bold text-green-600">Operational</div>
          <div className="text-sm text-gray-500 mt-2">All systems running</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Active Incidents
          </div>
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-500 mt-2">No active incidents</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Uptime (30d)
          </div>
          <div className="text-2xl font-bold text-green-600">99.9%</div>
          <div className="text-sm text-gray-500 mt-2">
            Excellent availability
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashboard/incidents/new"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Report Incident
          </Link>
          <Link
            href="/dashboard/components/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Component
          </Link>
          <Link
            href="/dashboard/maintenance/new"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Schedule Maintenance
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="text-gray-500 text-sm">
          No recent activity to display
        </div>
      </div>
    </div>
  );
}
