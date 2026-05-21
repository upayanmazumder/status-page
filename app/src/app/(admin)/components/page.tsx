"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import apiClient from "@/lib/api";
import CreateComponentModal from "@/components/modals/create-component";

interface Component {
  id: string;
  name: string;
  description: string | null;
  status: string;
  position: number;
  created_at: string;
}

export default function ComponentsPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchComponents = async () => {
    try {
      const response = await apiClient.get("/dashboard/components?project_id=default");
      setComponents(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch components:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`/dashboard/components/${id}`, { status: newStatus });
      fetchComponents();
    } catch (error) {
      alert("Failed to update status");
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
          <h1 className="text-2xl font-bold text-gray-900">Components</h1>
          <p className="text-gray-600">Manage your services and systems</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Component
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {components.map((component) => (
                <tr key={component.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{component.name}</div>
                    {component.description && (
                      <div className="text-sm text-gray-500">{component.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={component.status}
                      onChange={(e) => handleStatusChange(component.id, e.target.value)}
                      className="text-sm border rounded-md px-2 py-1"
                    >
                      <option value="operational">Operational</option>
                      <option value="degraded_performance">Degraded</option>
                      <option value="partial_outage">Partial Outage</option>
                      <option value="major_outage">Major Outage</option>
                      <option value="under_maintenance">Maintenance</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {component.position}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/components/${component.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {components.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No components yet. Add your first component to start monitoring.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <CreateComponentModal
          projectId="default"
          onClose={() => setShowModal(false)}
          onSuccess={fetchComponents}
        />
      )}
    </div>
  );
}
