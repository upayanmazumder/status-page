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
    const fetchActivities = async () => {
      try {
        const response = await apiClient.get("/dashboard/audit-logs?project_id=default&limit=10");
        const items = response.data.items || [];
        
        const mapped = items.map((log: any) => {
          const actionParts = log.action.split(".");
          const action = actionParts.length > 1 ? actionParts[1] : log.action;
          const entityName = log.changes?.name || log.changes?.title || log.meta?.name || "Unknown";
          
          return {
            id: log.id,
            action: action,
            entity_type: log.entity_type,
            entity_name: entityName,
            user: "Admin", // TODO: fetch user name from actor_id
            timestamp: log.created_at,
          };
        });
        
        setActivities(mapped);
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        // Fallback to empty state
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
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
