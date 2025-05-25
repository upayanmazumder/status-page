import { useEffect, useState, useCallback } from "react";
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

interface StatusBlock {
  from: string;
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
  days = 30,
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
      .catch(() => setStatusBlocks([]))
      .finally(() => setLoading(false));
  }, [appId]);

  if (loading) return <Loader />;
  if (!statusBlocks.length)
    return (
      <div className="text-sm text-gray-400">No status history available.</div>
    );

  const groupedByDate: Record<string, StatusBlock[]> = {};
  for (const block of statusBlocks) {
    const date = new Date(block.from).toISOString().split("T")[0];
    groupedByDate[date] = groupedByDate[date] || [];
    groupedByDate[date].push(block);
  }

  const dailyStatus = Object.entries(groupedByDate)
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
    <div className="w-full">
      <div className="flex gap-0.5 my-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {dailyStatus.map(({ date, status }) => (
          <div
            key={date}
            className={`w-4 h-6 rounded-sm ${STATUS_COLORS[status]}`}
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

function useWindowWidth() {
  const [width, setWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
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
