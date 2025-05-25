import { useEffect, useState } from "react";
import api from "../../../utils/api";
import { useAuth } from "../../Auth/AuthProvider/AuthProvider";
import Loader from "../../Loader/Loader";
import { useCallback } from "react";

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
    return <div className="text-xs text-gray-400">No status history.</div>;

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
      <div className="flex gap-1 my-2 overflow-x-auto">
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

export default function ApplicationsList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">Your Subscribed Applications</h2>
      <ul className="space-y-4">
        {applications.map((app) => (
          <li key={app._id} className="p-4 bg-gray-800 rounded">
            <div className="flex justify-between items-center mb-1">
              <div>
                <span className="font-semibold">{app.name}</span>
                <span className="ml-2 text-gray-400 text-sm">{app.url}</span>
              </div>
            </div>
            <div className="text-xs text-gray-400 mb-1">
              Owner:{" "}
              {app.owner.username ? `@${app.owner.username}` : app.owner.email}{" "}
              | Subscribers: {app.subscribers.length}
            </div>
            <StatusTimeline appId={app._id} days={30} />
          </li>
        ))}
      </ul>
    </section>
  );
}
