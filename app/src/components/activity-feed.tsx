"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api";

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_name: string;
  user: string;
  timestamp: string;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching activities
    setTimeout(() => {
      setActivities([
        { id: "1", action: "created", entity_type: "incident", entity_name: "API Latency", user: "Admin", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
        { id: "2", action: "updated", entity_type: "component", entity_name: "Database", user: "Admin", timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
        { id: "3", action: "resolved", entity_type: "incident", entity_name: "CDN Issue", user: "Admin", timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case "created": return "bg-blue-100 text-blue-800";
      case "updated": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "deleted": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const timeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
              {activity.user[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{activity.user}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(activity.action)}`}>
                  {activity.action}
                </span>
                <span className="text-gray-600">{activity.entity_type}</span>
                <span className="font-medium text-gray-900">{activity.entity_name}</span>
              </div>
              <div className="text-sm text-gray-500">{timeAgo(activity.timestamp)}</div>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="text-center text-gray-500 py-4">No recent activity</div>
        )}
      </div>
    </div>
  );
}
