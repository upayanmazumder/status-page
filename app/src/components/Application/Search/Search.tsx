"use client";

import { useEffect, useState } from "react";
import api from "../../../utils/api";
import { useAuth } from "../../Auth/AuthProvider/AuthProvider";
import Loader from "../../Loader/Loader";

interface Application {
  _id: string;
  name: string;
  url: string;
  owner: { email: string; username?: string };
  subscribers: { email: string; username?: string }[];
}

export default function ApplicationsSearch({
  onSubscribedChange,
}: {
  onSubscribedChange?: () => void;
}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    api
      .get("/applications")
      .then((res) => setApplications(res.data.applications))
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (appId: string, subscribed: boolean) => {
    const url = `/applications/${appId}/${
      subscribed ? "unsubscribe" : "subscribe"
    }`;
    await api.post(url);
    const res = await api.get("/applications");
    setApplications(res.data.applications);
    onSubscribedChange?.();
  };

  const filtered = applications.filter(
    (app) =>
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Search Applications</h2>

      <input
        type="text"
        placeholder="Search by name or URL"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 mb-6 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-center">No applications found.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {filtered.map((app) => {
            const isSubscribed =
              !!user && app.subscribers.some((s) => s.email === user.email);
            return (
              <li
                key={app._id}
                className="bg-gray-800 rounded-lg p-4 flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div className="mb-4">
                  <p className="text-lg font-semibold text-white">{app.name}</p>
                  <p className="text-sm text-gray-400 break-all">{app.url}</p>
                </div>
                <button
                  onClick={() => handleSubscribe(app._id, isSubscribed)}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    isSubscribed
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white`}
                >
                  {isSubscribed ? "Unsubscribe" : "Subscribe"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
