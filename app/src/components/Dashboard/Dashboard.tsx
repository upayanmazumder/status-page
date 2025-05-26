"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../Auth/AuthProvider/AuthProvider";
import { useNotification } from "../Notification/Notification";
import api from "../../utils/api";
import { useRouter } from "next/navigation";

interface Application {
  _id: string;
  name: string;
  url: string;
}

interface Dashboard {
  _id: string;
  name: string;
  applications: Application[];
}

const ApplicationDashboard = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const router = useRouter();

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [newDashboardName, setNewDashboardName] = useState("");
  const [editingDashboardId, setEditingDashboardId] = useState<string | null>(
    null
  );
  const [editingDashboardName, setEditingDashboardName] = useState("");
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(
    null
  );
  const [addingAppId, setAddingAppId] = useState<string>("");

  const fetchDashboards = async () => {
    try {
      const res = await api.get("/dashboards");
      setDashboards(res.data.dashboards || []);

      if (selectedDashboard) {
        const updated = res.data.dashboards.find(
          (d: Dashboard) => d._id === selectedDashboard._id
        );
        setSelectedDashboard(updated || null);
      }
    } catch {
      notify("Failed to load dashboards", "error");
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await api.get("/applications");
      setApplications(res.data.applications || []);
    } catch {
      notify("Failed to load applications", "error");
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboards();
      fetchApplications();
    }
    // eslint-disable-next-line
  }, [user]);

  const handleCreateDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDashboardName.trim()) return;
    try {
      await api.post("/dashboards", { name: newDashboardName });
      setNewDashboardName("");
      notify("Dashboard created!", "success");
      fetchDashboards();
    } catch {
      notify("Failed to create dashboard", "error");
    }
  };

  const handleEditDashboard = async (dashboardId: string) => {
    if (!editingDashboardName.trim()) return;
    try {
      await api.put(`/dashboards/${dashboardId}`, {
        name: editingDashboardName,
      });
      setEditingDashboardId(null);
      setEditingDashboardName("");
      notify("Dashboard updated!", "success");
      fetchDashboards();
    } catch {
      notify("Failed to update dashboard", "error");
    }
  };

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (!window.confirm("Delete this dashboard?")) return;
    try {
      await api.delete(`/dashboards/${dashboardId}`);
      notify("Dashboard deleted", "info");
      setSelectedDashboard(null);
      fetchDashboards();
    } catch {
      notify("Failed to delete dashboard", "error");
    }
  };

  const handleAddAppToDashboard = async (dashboardId: string) => {
    if (!addingAppId) return;
    try {
      await api.post(`/dashboards/${dashboardId}/applications`, {
        appId: addingAppId,
      });
      notify("Application added!", "success");
      setAddingAppId("");
      fetchDashboards();
    } catch {
      notify("Failed to add application", "error");
    }
  };

  const handleRemoveAppFromDashboard = async (
    dashboardId: string,
    appId: string
  ) => {
    try {
      await api.delete(`/dashboards/${dashboardId}/applications/${appId}`);
      notify("Application removed", "info");
      fetchDashboards();
    } catch {
      notify("Failed to remove application", "error");
    }
  };

  const handleCopyDashboardUrl = (dashboardId: string) => {
    const url = `${window.location.origin}/dashboard/${dashboardId}`;
    navigator.clipboard.writeText(url);
    notify("Dashboard URL copied!", "success");
  };

  return (
    <div className="max-w-3xl mx-auto p-4  transition-colors duration-500">
      <h2 className="text-3xl font-extrabold mb-6 text-center animate-fade-in-down">
        Your Dashboards
      </h2>
      <form
        onSubmit={handleCreateDashboard}
        className="flex flex-col sm:flex-row gap-2 mb-8 animate-fade-in"
      >
        <input
          type="text"
          placeholder="New dashboard name"
          value={newDashboardName}
          onChange={(e) => setNewDashboardName(e.target.value)}
          className="border border-gray-700 bg-gray-800 rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Create
        </button>
      </form>

      <div className="mb-8 animate-fade-in">
        <h3 className="text-lg font-semibold mb-2">All Applications</h3>
        <ul className="space-y-2">
          {applications.map((app) => (
            <li
              key={app._id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-gray-700 rounded px-3 py-2 bg-gray-800 transition hover:scale-[1.01] hover:shadow-lg"
            >
              <span>
                {app.name} <span className="text-gray-400">({app.url})</span>
              </span>
              {selectedDashboard &&
                !selectedDashboard.applications.some(
                  (a) => a._id === app._id
                ) && (
                  <button
                    className="mt-2 sm:mt-0 ml-0 sm:ml-4 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                    onClick={() => {
                      setAddingAppId(app._id);
                      handleAddAppToDashboard(selectedDashboard._id);
                    }}
                  >
                    Add to Dashboard
                  </button>
                )}
            </li>
          ))}
        </ul>
      </div>

      <ul className="mb-8 space-y-2 animate-fade-in">
        {dashboards.map((dashboard) => (
          <li
            key={dashboard._id}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2 border border-gray-700 rounded px-3 py-2 bg-gray-800 transition hover:scale-[1.01] hover:shadow-lg"
          >
            {editingDashboardId === dashboard._id ? (
              <>
                <input
                  type="text"
                  value={editingDashboardName}
                  onChange={(e) => setEditingDashboardName(e.target.value)}
                  placeholder="Edit dashboard name"
                  className="border border-gray-700 bg-gray-900 rounded px-2 py-1 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                    onClick={() => handleEditDashboard(dashboard._id)}
                  >
                    Save
                  </button>
                  <button
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 transition"
                    onClick={() => {
                      setEditingDashboardId(null);
                      setEditingDashboardName("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <strong
                  className="cursor-pointer flex-1"
                  onClick={() => setSelectedDashboard(dashboard)}
                >
                  {dashboard.name}
                </strong>
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                    onClick={() => router.push(`/dashboard/${dashboard._id}`)}
                  >
                    Open
                  </button>
                  <button
                    className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
                    onClick={() => handleCopyDashboardUrl(dashboard._id)}
                  >
                    Copy Link
                  </button>
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                    onClick={() => {
                      setEditingDashboardId(dashboard._id);
                      setEditingDashboardName(dashboard.name);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                    onClick={() => handleDeleteDashboard(dashboard._id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {selectedDashboard && (
        <div className="mt-8 border border-gray-700 rounded p-4 bg-gray-800 animate-fade-in-up shadow-lg">
          <h3 className="text-xl font-semibold mb-2 flex items-center">
            Dashboard: {selectedDashboard.name}
            <button
              className="ml-auto bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 transition"
              onClick={() => setSelectedDashboard(null)}
            >
              Close
            </button>
          </h3>
          <h4 className="font-semibold mb-2">Applications</h4>
          <ul className="space-y-2 mb-4">
            {selectedDashboard.applications.map((app) => (
              <li
                key={app._id}
                className="flex items-center justify-between border border-gray-700 rounded px-3 py-2 bg-gray-900 transition hover:scale-[1.01]"
              >
                <span>
                  {app.name} <span className="text-gray-400">({app.url})</span>
                </span>
                <button
                  className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                  onClick={() =>
                    handleRemoveAppFromDashboard(selectedDashboard._id, app._id)
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <select
              aria-label="Select application to add"
              value={addingAppId}
              onChange={(e) => setAddingAppId(e.target.value)}
              className="border border-gray-700 bg-gray-900 rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="">Add application...</option>
              {applications
                .filter(
                  (app) =>
                    !selectedDashboard.applications.some(
                      (a) => a._id === app._id
                    )
                )
                .map((app) => (
                  <option key={app._id} value={app._id}>
                    {app.name}
                  </option>
                ))}
            </select>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              onClick={() => handleAddAppToDashboard(selectedDashboard._id)}
              disabled={!addingAppId}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(32px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
      `}</style>
    </div>
  );
};

export default ApplicationDashboard;
