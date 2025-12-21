'use client';

import { useEffect, useState } from 'react';
import api from '../../../../utils/api';

const STATUS_PRIORITY = {
  offline: 2,
  unknown: 1,
  online: 0,
};

const STATUS_LABELS: Record<string, string> = {
  online: 'Online',
  offline: 'Offline',
  unknown: 'Unknown',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface StatusBlock {
  from: string;
  status: 'online' | 'offline' | 'unknown';
  statusCode: number;
}

interface StatusTimelineProps {
  appId: string;
  days?: number;
}

export default function StatusTimeline({ appId, days = 30 }: StatusTimelineProps) {
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
        setError('Failed to load status history');
        setStatusBlocks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStatusHistory();
  }, [appId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8 sm:py-10">
        <div className="flex items-center space-x-3 text-gray-400 bg-gray-800/30 backdrop-blur-sm px-6 py-3 rounded-xl border border-gray-700/50">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm font-medium">Loading status history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-gradient-to-br from-red-900/20 to-gray-900/20 backdrop-blur-sm border border-red-800/30 rounded-xl">
        <p className="text-base text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  if (!statusBlocks.length) {
    return (
      <div className="text-center py-10 bg-gradient-to-br from-gray-800/30 via-blue-900/10 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl">
        <div className="text-gray-400 mb-3">
          <svg
            className="mx-auto h-12 w-12 animate-pulse"
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
        <p className="text-base font-medium text-gray-300 mb-2">No status history available</p>
        <p className="text-sm text-gray-500">
          Status monitoring will begin once checks are enabled
        </p>
      </div>
    );
  }

  // Group status blocks by date
  const groupedByDate: Record<string, StatusBlock[]> = {};
  for (const block of statusBlocks) {
    const date = new Date(block.from).toISOString().split('T')[0];
    groupedByDate[date] = groupedByDate[date] || [];
    groupedByDate[date].push(block);
  }

  // Calculate daily status (worst status wins)
  const dailyStatus = Object.entries(groupedByDate)
    .map(([date, blocks]) => {
      const worst = blocks.reduce((worst, curr) =>
        STATUS_PRIORITY[curr.status] > STATUS_PRIORITY[worst.status] ? curr : worst
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
      <div className="text-center py-8 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-xl">
        <p className="text-base text-gray-400">No status data for the selected period</p>
      </div>
    );
  }

  const firstDate = dailyStatus[0]?.date;
  const lastDate = dailyStatus[dailyStatus.length - 1]?.date;

  // Calculate uptime percentage
  const onlineDays = dailyStatus.filter(day => day.status === 'online').length;
  const uptimePercentage =
    dailyStatus.length > 0 ? ((onlineDays / dailyStatus.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-4">
      {/* Uptime Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-3 py-2 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
            <span className="text-green-400 font-semibold text-base">
              {uptimePercentage}% uptime
            </span>
          </div>
          <div className="text-gray-400 text-sm px-3 py-2 bg-gray-700/30 rounded-lg">
            {dailyStatus.length} day{dailyStatus.length !== 1 ? 's' : ''} monitored
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs">
          <div className="flex items-center gap-2 bg-green-500/10 px-2 py-1 rounded-md">
            <div className="w-3 h-3 bg-green-500 rounded-sm shadow-sm shadow-green-500/50"></div>
            <span className="text-gray-300 font-medium">Online</span>
          </div>
          <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded-md">
            <div className="w-3 h-3 bg-red-500 rounded-sm shadow-sm shadow-red-500/50"></div>
            <span className="text-gray-300 font-medium">Offline</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-500/10 px-2 py-1 rounded-md">
            <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
            <span className="text-gray-300 font-medium">Unknown</span>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="w-full bg-gradient-to-br from-gray-800/20 to-gray-900/20 backdrop-blur-sm border border-gray-700/30 rounded-xl p-4 overflow-hidden">
        <div className="flex gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent pb-3 -mx-4 px-4">
          {dailyStatus.map(({ date, status, statusCode, blockCount }) => (
            <div
              key={date}
              className={`flex-shrink-0 w-4 sm:w-5 lg:w-6 h-8 sm:h-10 lg:h-12 rounded-md cursor-pointer transition-all duration-200 ${
                status === 'online'
                  ? 'bg-green-500 hover:bg-green-400 shadow-md shadow-green-500/30 hover:shadow-lg hover:shadow-green-500/50'
                  : status === 'offline'
                    ? 'bg-red-500 hover:bg-red-400 shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/50'
                    : 'bg-gray-400 hover:bg-gray-300 shadow-md shadow-gray-400/30'
              } hover:scale-110 hover:-translate-y-1`}
              title={`${formatDate(date)} - ${STATUS_LABELS[status]}${
                statusCode ? ` (${statusCode})` : ''
              }${blockCount > 1 ? ` - ${blockCount} checks` : ''}`}
            />
          ))}
        </div>

        {/* Date Range */}
        <div className="flex justify-between text-xs text-gray-400 mt-3 px-1 font-medium">
          <span className="bg-gray-700/30 px-2 py-1 rounded">{formatDate(firstDate)}</span>
          <span className="text-center bg-blue-500/10 px-2 py-1 rounded">
            {days} day{days !== 1 ? 's' : ''}
          </span>
          <span className="bg-gray-700/30 px-2 py-1 rounded">{formatDate(lastDate)}</span>
        </div>
      </div>

      {/* Recent Status Summary */}
      <div className="text-sm bg-gradient-to-br from-gray-800/20 to-gray-900/20 backdrop-blur-sm border border-gray-700/30 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 px-3 py-2 rounded-lg">
            <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-300 font-medium">
              Current streak:{' '}
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
                return (
                  <span
                    className={
                      currentStatus === 'online'
                        ? 'text-green-400'
                        : currentStatus === 'offline'
                          ? 'text-red-400'
                          : 'text-gray-400'
                    }
                  >
                    {streak} day{streak !== 1 ? 's' : ''} {currentStatus}
                  </span>
                );
              })()}
            </span>
          </span>
          {statusBlocks.length > 0 && (
            <span className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3 py-2 rounded-lg">
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-300 font-medium">
                <span className="hidden sm:inline">Last check: </span>
                <span className="sm:hidden">Last: </span>
                <span className="text-blue-400">
                  {formatTime(statusBlocks[statusBlocks.length - 1].from)}
                </span>
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
