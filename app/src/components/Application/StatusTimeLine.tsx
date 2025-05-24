import React, { useEffect, useState } from "react";
import api from "../../utils/api";

interface StatusPeriod {
  status: "online" | "offline";
  statusCode: number;
  from: string;
  to?: string;
}

interface StatusTimelineProps {
  appId: string;
  days?: number;
}

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-500",
  offline: "bg-red-500",
  nodata: "bg-gray-400",
};

const getDayKey = (date: Date) => date.toISOString().split("T")[0];

const StatusTimeline: React.FC<StatusTimelineProps> = ({
  appId,
  days = 10,
}) => {
  const [statusHistory, setStatusHistory] = useState<StatusPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .get(`/applications/${appId}/status-history`)
      .then((res) => {
        if (mounted) setStatusHistory(res.data.statusHistory || []);
      })
      .catch((err) => {
        console.error("Failed to load status history", err);
      })
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, [appId]);

  if (loading) {
    return <div className="text-xs text-gray-400">Loading status...</div>;
  }

  if (!statusHistory.length) {
    return <div className="text-xs text-gray-400">No status history.</div>;
  }

  const now = new Date();
  now.setHours(23, 59, 59, 999);

  const summaryBars: {
    dateKey: string;
    tooltip: string;
    color: string;
  }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    const dateKey = getDayKey(day);

    const periodsOnDay = statusHistory.filter((period) => {
      const from = new Date(period.from);
      const to = new Date(period.to || now);
      return from <= dayEnd && to >= dayStart;
    });

    let color = STATUS_COLORS.nodata;
    let tooltip = `${day.toLocaleDateString()}: No data`;

    if (periodsOnDay.length > 0) {
      const anyOffline = periodsOnDay.some((p) => p.status === "offline");
      const allOnline = periodsOnDay.every((p) => p.status === "online");

      if (anyOffline) {
        color = STATUS_COLORS.offline;
        tooltip = `${day.toLocaleDateString()}: Offline`;
      } else if (allOnline) {
        color = STATUS_COLORS.online;
        tooltip = `${day.toLocaleDateString()}: Online`;
      }
    }

    summaryBars.push({ dateKey, tooltip, color });
  }

  return (
    <div>
      <div className="flex gap-[2px] my-2">
        {summaryBars.map((bar) => (
          <div
            key={bar.dateKey}
            className={`w-4 h-4 rounded-sm ${bar.color}`}
            title={bar.tooltip}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{summaryBars[0].dateKey}</span>
        <span>{summaryBars[summaryBars.length - 1].dateKey}</span>
      </div>
    </div>
  );
};

export default StatusTimeline;
