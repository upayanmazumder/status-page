import { useEffect, useState } from "react";
import api from "../../../../utils/api";
import Loader from "../../../Loader/Loader";

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

interface StatusBlock {
  from: string;
  status: "online" | "offline" | "unknown";
  statusCode: number;
}

export default function StatusTimeline({
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
