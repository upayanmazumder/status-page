"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import apiClient from "@/lib/api";

interface Component {
  id: string;
  name: string;
  description: string | null;
  status: string;
  position: number;
  created_at: string;
}

export default function ComponentDetailPage() {
  const params = useParams();
  const [component, setComponent] = useState<Component | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", status: "operational" });

  const componentId = params.id as string;

  const fetchComponent = async () => {
    try {
      // For now, fetch all and find by ID (in production, add GET /components/:id endpoint)
      const response = await apiClient.get("/dashboard/components?project_id=default");
      const found = response.data.items?.find((c: Component) => c.id === componentId);
      if (found) {
        setComponent(found);
        setFormData({
          name: found.name,
          description: found.description || "",
          status: found.status,
        });
      }
    } catch (error) {
      console.error("Failed to fetch component:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponent();
  }, [componentId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.patch(`/dashboard/components/${componentId}`, formData);
      setEditing(false);
      fetchComponent();
    } catch (error) {
      alert("Failed to update component");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!component) {
    return <div className="text-center text-gray-500 py-12">Component not found</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{component.name}</h1>
          <p className="text-gray-600">Component Details</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {editing ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="operational">Operational</option>
                <option value="degraded_performance">Degraded Performance</option>
                <option value="partial_outage">Partial Outage</option>
                <option value="major_outage">Major Outage</option>
                <option value="under_maintenance">Under Maintenance</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Status</div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                component.status === "operational"
                  ? "bg-green-100 text-green-800"
                  : component.status === "degraded_performance"
                  ? "bg-yellow-100 text-yellow-800"
                  : component.status === "partial_outage"
                  ? "bg-orange-100 text-orange-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {component.status.replace("_", " ")}
              </span>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Position</div>
              <div className="font-medium">{component.position}</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-gray-500 mb-1">Description</div>
              <div className="text-gray-900">{component.description || "No description"}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Created</div>
              <div className="font-medium">{new Date(component.created_at).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
