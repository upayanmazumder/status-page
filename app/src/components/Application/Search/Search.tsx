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
    <section>
      <h2 className="text-xl font-bold mb-2">Search Applications</h2>
      <input
        type="text"
        placeholder="Search by name or URL"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 px-3 py-2 rounded bg-gray-800 text-white w-full"
      />
      {loading ? (
        <Loader />
      ) : (
        <ul className="space-y-2">
          {filtered.map((app) => {
            const isSubscribed =
              !!user && app.subscribers.some((s) => s.email === user.email);
            return (
              <li
                key={app._id}
                className="p-3 bg-gray-800 rounded flex justify-between items-center"
              >
                <div>
                  <span className="font-semibold">{app.name}</span>
                  <span className="ml-2 text-gray-400 text-sm">{app.url}</span>
                </div>
                <button
                  className={`px-3 py-1 rounded text-white text-sm ${
                    isSubscribed ? "bg-red-600" : "bg-green-600"
                  }`}
                  onClick={() => handleSubscribe(app._id, isSubscribed)}
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
