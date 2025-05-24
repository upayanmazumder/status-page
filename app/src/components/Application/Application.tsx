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

interface StatusPeriod {
  status: "online" | "offline";
  statusCode: number;
  from: string;
  to?: string;
}

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-500",
  offline: "bg-red-500",
};

function StatusTimeline({
  appId,
  hours = 24,
}: {
  appId: string;
  hours?: number;
}) {
  const [history, setHistory] = useState<StatusPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get(`/applications/${appId}/status-history`).then((res) => {
      if (mounted) {
        setHistory(res.data.statusHistory);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [appId]);

  if (loading)
    return <div className="text-xs text-gray-400">Loading status...</div>;
  if (!history.length)
    return <div className="text-xs text-gray-400">No status history.</div>;

  const now = new Date();
  const fromTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

  const filtered = history.filter((p) => new Date(p.to || now) >= fromTime);

  const totalMs = hours * 60 * 60 * 1000;
  const timeline: {
    left: number;
    width: number;
    status: string;
    from: string;
    to: string;
  }[] = [];

  filtered.forEach((period) => {
    const start = Math.max(new Date(period.from).getTime(), fromTime.getTime());
    const end = Math.min(new Date(period.to || now).getTime(), now.getTime());
    if (end <= start) return;
    const left = ((start - fromTime.getTime()) / totalMs) * 100;
    const width = ((end - start) / totalMs) * 100;
    timeline.push({
      left,
      width,
      status: period.status,
      from: new Date(start).toLocaleTimeString(),
      to: new Date(end).toLocaleTimeString(),
    });
  });

  return (
    <div>
      <div className="relative h-4 w-full bg-gray-300 rounded overflow-hidden my-2">
        {timeline.map((seg, i) => (
          <div
            key={i}
            className={`absolute top-0 h-full ${STATUS_COLORS[seg.status]}`}
            style={{
              left: `${seg.left}%`,
              width: `${seg.width}%`,
            }}
            title={`${seg.status.toUpperCase()}: ${seg.from} - ${seg.to}`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{fromTime.toLocaleString()}</span>
        <span>{now.toLocaleString()}</span>
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
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
      ) {
        setError(
          (err.response as { message?: string }).message ||
            "Failed to add application."
        );
      } else {
        setError("Failed to add application.");
      }
    }
  };

  const handleSubscribe = async (appId: string) => {
    try {
      await api.post(`/applications/${appId}/subscribe`);
      fetchApplications();
    } catch {}
  };

  const handleUnsubscribe = async (appId: string) => {
    try {
      await api.post(`/applications/${appId}/unsubscribe`);
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
              <li
                key={app._id}
                className="p-4 bg-gray-800 rounded flex flex-col gap-1"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold">{app.name}</span>
                    <span className="ml-2 text-gray-400 text-sm">
                      {app.url}
                    </span>
                  </div>
                  <div>
                    {isSubscribed ? (
                      <button
                        className="bg-red-600 px-3 py-1 rounded text-white text-sm"
                        onClick={() => handleUnsubscribe(app._id)}
                      >
                        Unsubscribe
                      </button>
                    ) : (
                      <button
                        className="bg-green-600 px-3 py-1 rounded text-white text-sm"
                        onClick={() => handleSubscribe(app._id)}
                      >
                        Subscribe
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Owner:{" "}
                  {app.owner.username
                    ? `@${app.owner.username}`
                    : app.owner.email}
                  {" | "}
                  Subscribers: {app.subscribers.length}
                </div>
                <StatusTimeline appId={app._id} hours={240} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
