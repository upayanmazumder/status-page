"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "../../utils/api";
import { useNotification } from "../Notification/Notification";
import StatusTimeline from "../Application/List/StatusTimeline/StatusTimeline";

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

export default function DashboardDetailPage() {
  const params = useParams();
  const dashboardId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";
  const { notify } = useNotification();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        let found: Dashboard | undefined;
        try {
          const res = await api.get(`/dashboards/${dashboardId}`);
          found = res.data.dashboard;
        } catch {
          const res = await api.get(`/dashboards`);
          const dashboards: Dashboard[] = res.data.dashboards || [];
          found = dashboards.find((d) => d._id === dashboardId);
        }
        setDashboard(found || null);
        if (!found) notify("Dashboard not found", "error");
      } catch {
        notify("Failed to load dashboard", "error");
      } finally {
        setLoading(false);
      }
    };
    if (dashboardId) fetchDashboard();
  }, [dashboardId, notify]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh] text-lg text-gray-300">
        Loading dashboard...
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex justify-center items-center min-h-[40vh] text-lg text-red-400">
        Dashboard not found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 text-gray-100 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">{dashboard.name}</h1>
      <h2 className="text-xl font-semibold mb-2">Applications</h2>
      <ul className="space-y-3">
        {dashboard.applications.length === 0 && (
          <li className="text-gray-400">No applications in this dashboard.</li>
        )}
        {dashboard.applications.map((app) => (
          <li
            key={app._id}
            className="border border-gray-700 rounded px-4 py-3 bg-gray-800 flex flex-col sm:flex-row sm:items-center justify-between transition hover:scale-[1.01] hover:shadow-lg"
          >
            <div className="flex-1">
              <div>
                <span className="font-semibold">{app.name}</span>
                <span className="ml-2 text-gray-400 break-all">{app.url}</span>
              </div>
              <div className="mt-2">
                <StatusTimeline appId={app._id} days={30} />
              </div>
            </div>
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 sm:mt-0 sm:ml-4 text-blue-400 hover:underline"
            >
              Visit
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
