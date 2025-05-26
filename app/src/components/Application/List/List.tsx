import { useEffect, useState, useCallback } from "react";
import api from "../../../utils/api";
import { useAuth } from "../../Auth/AuthProvider/AuthProvider";
import Loader from "../../Loader/Loader";
import StatusTimeline from "./StatusTimeline/StatusTimeline";
import useWindowWidth from "../../../utils/useWindowWidth";

interface Application {
  _id: string;
  name: string;
  url: string;
  owner: { email: string; username?: string };
  subscribers: { email: string; username?: string }[];
}

export default function ApplicationsList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const width = useWindowWidth();

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/applications");
      setApplications(
        res.data.applications.filter((app: Application) =>
          app.subscribers.some((s) => s.email === user?.email)
        )
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  if (loading) return <Loader />;

  let daysToShow = 30; // default phone
  if (width >= 1024) {
    daysToShow = 90; // desktop
  } else if (width >= 640) {
    daysToShow = 60; // tablet
  }

  return (
    <section className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Your Subscribed Applications</h2>

      {applications.length === 0 ? (
        <p className="text-gray-400">
          You&apos;re not subscribed to any applications.
        </p>
      ) : (
        <ul className="space-y-6">
          {applications.map((app) => (
            <li
              key={app._id}
              className="p-4 bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {app.name}
                  </h3>
                  <p className="text-sm text-gray-400 break-all">{app.url}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Owner:{" "}
                <span className="font-medium text-white">
                  {app.owner.username
                    ? `@${app.owner.username}`
                    : app.owner.email}
                </span>{" "}
                | Subscribers: {app.subscribers.length}
              </p>
              <StatusTimeline appId={app._id} days={daysToShow} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
