"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import apiClient from "@/lib/api";
import CreateComponentModal from "@/components/modals/create-component";
import Pagination from "@/components/pagination";
import { TableSkeleton } from "@/components/skeletons";

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
  const [pagination, setPagination] = useState({ page: 1, pages: 1, hasNext: false, hasPrev: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchComponents = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(`/dashboard/components?project_id=default&page=${page}&limit=20`);
      setComponents(response.data.items || []);
      setPagination({
        page: response.data.page,
        pages: response.data.pages,
        hasNext: response.data.has_next,
        hasPrev: response.data.has_prev,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load components");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents(1);
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`/dashboard/components/${id}`, { status: newStatus });
      fetchComponents(pagination.page);
    } catch (error) {
      alert("Failed to update status");
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-700 font-medium mb-2">Error loading components</div>
        <div className="text-red-600 text-sm">{error}</div>
        <button
          onClick={() => fetchComponents(1)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
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

      {loading ? (
        <TableSkeleton rows={5} />
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                      <td className="px-6 py-4 text-sm text-gray-500">{component.position}</td>
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/components/${component.id}`} className="text-blue-600 hover:text-blue-800 text-sm">
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

          {pagination.pages > 1 && (
            <div className="mt-6">
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
                onPageChange={fetchComponents}
              />
            </div>
          )}
        </>
      )}

      {showModal && (
        <CreateComponentModal
          projectId="default"
          onClose={() => setShowModal(false)}
          onSuccess={() => fetchComponents(1)}
        />
      )}
    </div>
  );
}
