import React, { useEffect, useState } from "react";
import api from "../../utils/api";

interface StatusPeriod {
  status: "online" | "offline";
  statusCode: number;
  from: string;
  to?: string;
}

interface Props {
  appId: string;
  days?: number;
}

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-500",
  offline: "bg-red-500",
  nodata: "bg-gray-400",
};

function getDayKey(date: Date) {
  // YYYY-MM-DD
  return date.toISOString().slice(0, 10);
}

export default function StatusTimeline({ appId, days = 10 }: Props) {
  const [history, setHistory] = useState<StatusPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/applications/${appId}/status-history`).then((res) => {
      setHistory(res.data.statusHistory);
      setLoading(false);
    });
  }, [appId]);

  if (loading) return <div>Loading status...</div>;
  if (!history.length) return <div>No status history.</div>;

  // Build a map of dayKey -> array of periods for that day
  const now = new Date();
  const dayMap: Record<string, StatusPeriod[]> = {};

  history.forEach((period) => {
    const start = new Date(period.from);
    const end = new Date(period.to || now);
    let d = new Date(start);
    d.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);

    while (d <= endDay) {
      const key = getDayKey(d);
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push(period);
      d = new Date(d.getTime() + 24 * 60 * 60 * 1000);
    }
  });

  // Build the last N days, oldest to newest
  const bars: { key: string; color: string; tooltip: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = getDayKey(day);
    const periods = dayMap[key] || [];
    let color = STATUS_COLORS.nodata;
    let tooltip = day.toLocaleDateString();
    if (periods.length > 0) {
      // If any period is offline, mark as offline
      if (periods.some((p) => p.status === "offline")) {
        color = STATUS_COLORS.offline;
        tooltip += ": Offline";
      } else {
        color = STATUS_COLORS.online;
        tooltip += ": Online";
      }
    } else {
      tooltip += ": No data";
    }
    bars.push({ key, color, tooltip });
  }

  return (
    <div>
      <div className="flex gap-[1px] my-2">
        {bars.map((bar) => (
          <div
            key={bar.key}
            className={`${bar.color} h-4 w-2 rounded-sm`}
            title={bar.tooltip}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {new Date(
            now.getTime() - (days - 1) * 24 * 60 * 60 * 1000
          ).toLocaleDateString()}
        </span>
        <span>{now.toLocaleDateString()}</span>
      </div>
    </div>
  );
}
