"use client";

import { useEffect, useState } from "react";
import api from "../../utils/api";
import { useAuth } from "../Auth/AuthProvider/AuthProvider";

interface Application {
  _id: string;
  name: string;
  url: string;
  owner: { email: string; username?: string };
  subscribers: { email: string; username?: string }[];
}

interface StatusBlock {
  from: string; // ISO string
  status: "online" | "offline" | "unknown";
  statusCode: number;
}

const STATUS_PRIORITY = {
  offline: 2,
  unknown: 1,
  online: 0,
};

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-500",
  offline: "bg-red-500",
  unknown: "bg-gray-400",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString();
}

function StatusTimeline({
  appId,
  days = 90,
}: {
  appId: string;
  days?: number;
}) {
  const [statusBlocks, setStatusBlocks] = useState<StatusBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/applications/${appId}/status-history`)
      .then((res) => setStatusBlocks(res.data.statusBlocks || []))
      .catch((err) => console.error("Failed to load status history", err))
      .finally(() => setLoading(false));
  }, [appId]);

  if (loading)
    return <div className="text-xs text-gray-400">Loading status...</div>;
  if (!statusBlocks.length)
    return <div className="text-xs text-gray-400">No status history.</div>;

  // Group blocks by date, keeping the worst status of each day
  const groupedByDate: Record<string, StatusBlock[]> = {};
  for (const block of statusBlocks) {
    const date = new Date(block.from).toISOString().split("T")[0];
    groupedByDate[date] = groupedByDate[date] || [];
    groupedByDate[date].push(block);
  }

  const dailyStatus: { date: string; status: string }[] = Object.entries(
    groupedByDate
  )
    .map(([date, blocks]) => {
      const worst = blocks.reduce((worst, curr) =>
        STATUS_PRIORITY[curr.status] > STATUS_PRIORITY[worst.status]
          ? curr
          : worst
      );
      return { date, status: worst.status };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-days);

  const firstDate = dailyStatus[0]?.date;
  const lastDate = dailyStatus[dailyStatus.length - 1]?.date;

  return (
    <div>
      <div className="flex gap-[1px] my-2 overflow-x-auto">
        {dailyStatus.map(({ date, status }) => (
          <div
            key={date}
            className={`w-2 h-4 rounded-sm ${STATUS_COLORS[status]}`}
            title={`${formatDate(date)} (${status.toUpperCase()})`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatDate(firstDate)}</span>
        <span>{formatDate(lastDate)}</span>
      </div>
    </div>
  );
}

export default function ApplicationList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const { user } = useAuth();

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/applications");
      setApplications(res.data.applications);
    } catch {
      setError("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/applications", { name, url });
      setName("");
      setUrl("");
      fetchApplications();
    } catch {
      setError("Failed to add application.");
    }
  };

  const toggleSubscription = async (appId: string, subscribed: boolean) => {
    try {
      const url = `/applications/${appId}/${
        subscribed ? "unsubscribe" : "subscribe"
      }`;
      await api.post(url);
      fetchApplications();
    } catch {}
  };

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Monitored Applications</h2>
      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Site Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="px-3 py-2 rounded bg-gray-800 text-white"
        />
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="px-3 py-2 rounded bg-gray-800 text-white"
        />
        <button
          type="submit"
          className="bg-indigo-600 px-4 py-2 rounded text-white font-semibold"
        >
          Add
        </button>
      </form>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul className="space-y-4">
          {applications.map((app) => {
            const isSubscribed =
              !!user && app.subscribers.some((s) => s.email === user.email);
            return (
              <li key={app._id} className="p-4 bg-gray-800 rounded">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <span className="font-semibold">{app.name}</span>
                    <span className="ml-2 text-gray-400 text-sm">
                      {app.url}
                    </span>
                  </div>
                  <button
                    className={`px-3 py-1 rounded text-white text-sm ${
                      isSubscribed ? "bg-red-600" : "bg-green-600"
                    }`}
                    onClick={() => toggleSubscription(app._id, isSubscribed)}
                  >
                    {isSubscribed ? "Unsubscribe" : "Subscribe"}
                  </button>
                </div>
                <div className="text-xs text-gray-400 mb-1">
                  Owner:{" "}
                  {app.owner.username
                    ? `@${app.owner.username}`
                    : app.owner.email}{" "}
                  | Subscribers: {app.subscribers.length}
                </div>
                <StatusTimeline appId={app._id} days={90} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
