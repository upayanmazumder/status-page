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
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
