"use client";

import { useEffect, useState } from "react";
import api from "../../../../utils/api";

const STATUS_PRIORITY = {
  offline: 2,
  unknown: 1,
  online: 0,
};

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-500 hover:bg-green-400",
  offline: "bg-red-500 hover:bg-red-400",
  unknown: "bg-gray-400 hover:bg-gray-300",
};

const STATUS_LABELS: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  unknown: "Unknown",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface StatusBlock {
  from: string;
  status: "online" | "offline" | "unknown";
  statusCode: number;
}

interface StatusTimelineProps {
  appId: string;
  days?: number;
}

export default function StatusTimeline({
  appId,
  days = 30,
}: StatusTimelineProps) {
  const [statusBlocks, setStatusBlocks] = useState<StatusBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatusHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/applications/${appId}/status-history`);
        setStatusBlocks(res.data.statusBlocks || []);
      } catch {
        setError("Failed to load status history");
        setStatusBlocks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStatusHistory();
  }, [appId]);

  if (loading) {
    return (
      <div className="flex justify-center py-6 sm:py-8">
        <div className="flex items-center space-x-2 sm:space-x-3 text-gray-400">
          <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm sm:text-base">Loading status history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 sm:py-8">
        <p className="text-sm sm:text-base text-red-400">{error}</p>
      </div>
    );
  }

  if (!statusBlocks.length) {
    return (
      <div className="text-center py-6 sm:py-8">
        <div className="text-gray-400 mb-2 sm:mb-3">
          <svg
            className="mx-auto h-8 w-8 sm:h-10 sm:w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <p className="text-sm sm:text-base text-gray-400 mb-1">No status history available</p>
        <p className="text-xs sm:text-sm text-gray-500">
          Status monitoring will begin once checks are enabled
        </p>
      </div>
    );
  }

  // Group status blocks by date
  const groupedByDate: Record<string, StatusBlock[]> = {};
  for (const block of statusBlocks) {
    const date = new Date(block.from).toISOString().split("T")[0];
    groupedByDate[date] = groupedByDate[date] || [];
    groupedByDate[date].push(block);
  }

  // Calculate daily status (worst status wins)
  const dailyStatus = Object.entries(groupedByDate)
    .map(([date, blocks]) => {
      const worst = blocks.reduce((worst, curr) =>
        STATUS_PRIORITY[curr.status] > STATUS_PRIORITY[worst.status]
          ? curr
          : worst
      );
      return {
        date,
        status: worst.status,
        statusCode: worst.statusCode,
        blockCount: blocks.length,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-days);

  if (!dailyStatus.length) {
    return (
      <div className="text-center py-6 sm:py-8">
        <p className="text-sm sm:text-base text-gray-400">
          No status data for the selected period
        </p>
      </div>
    );
  }

  const firstDate = dailyStatus[0]?.date;
  const lastDate = dailyStatus[dailyStatus.length - 1]?.date;

  // Calculate uptime percentage
  const onlineDays = dailyStatus.filter(
    (day) => day.status === "online"
  ).length;
  const uptimePercentage =
    dailyStatus.length > 0
      ? ((onlineDays / dailyStatus.length) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-4">
      {/* Uptime Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 text-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
            <span className="text-gray-300 font-medium">{uptimePercentage}% uptime</span>
          </div>
          <div className="text-gray-500 text-xs sm:text-sm">
            {dailyStatus.length} day{dailyStatus.length !== 1 ? "s" : ""}{" "}
            monitored
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-sm"></div>
            <span className="text-gray-400">Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div>
            <span className="text-gray-400">Offline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-gray-400 rounded-sm"></div>
            <span className="text-gray-400">Unknown</span>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="w-full">
        <div className="flex gap-0.5 sm:gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent pb-2 sm:pb-3">
          {dailyStatus.map(({ date, status, statusCode, blockCount }) => (
            <div
              key={date}
              className={`flex-shrink-0 w-3 sm:w-4 lg:w-5 h-6 sm:h-8 lg:h-10 rounded-sm cursor-pointer transition-all duration-200 ${STATUS_COLORS[status]} hover:scale-110`}
              title={`${formatDate(date)} - ${STATUS_LABELS[status]}${
                statusCode ? ` (${statusCode})` : ""
              }${blockCount > 1 ? ` - ${blockCount} checks` : ""}`}
            />
          ))}
        </div>

        {/* Date Range */}
        <div className="flex justify-between text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
          <span>{formatDate(firstDate)}</span>
          <span className="text-center">
            {days} day{days !== 1 ? "s" : ""} ago
          </span>
          <span>{formatDate(lastDate)}</span>
        </div>
      </div>

      {/* Recent Status Summary */}
      <div className="text-xs sm:text-sm text-gray-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            Current streak:{" "}
            {(() => {
              let streak = 0;
              const currentStatus = dailyStatus[dailyStatus.length - 1]?.status;
              for (let i = dailyStatus.length - 1; i >= 0; i--) {
                if (dailyStatus[i].status === currentStatus) {
                  streak++;
                } else {
                  break;
                }
              }
              return `${streak} day${streak !== 1 ? "s" : ""} ${currentStatus}`;
            })()}
          </span>
          {statusBlocks.length > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Last check: </span>
              <span className="sm:hidden">Last: </span>
              {formatTime(statusBlocks[statusBlocks.length - 1].from)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
