"use client";

import { useState } from "react";

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([
    { id: "1", url: "https://hooks.slack.com/services/xxx", events: ["incident.created", "incident.resolved"], active: true },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const events = [
    "incident.created",
    "incident.updated",
    "incident.resolved",
    "maintenance.scheduled",
    "maintenance.started",
    "maintenance.completed",
    "component.status_changed",
  ];

  const handleAdd = () => {
    setWebhooks([...webhooks, { id: Date.now().toString(), url: newUrl, events: selectedEvents, active: true }]);
    setNewUrl("");
    setSelectedEvents([]);
    setShowForm(false);
  };

  const toggleWebhook = (id: string) => {
    setWebhooks(webhooks.map((w) => w.id === id ? { ...w, active: !w.active } : w));
  };

  const deleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter((w) => w.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
          <p className="text-gray-600">Configure webhook endpoints for real-time notifications</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Webhook
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Webhook</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
              <div className="space-y-2">
                {events.map((event) => (
                  <label key={event} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEvents([...selectedEvents, event]);
                        } else {
                          setSelectedEvents(selectedEvents.filter((ev) => ev !== event));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newUrl || selectedEvents.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Add Webhook
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="divide-y">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="p-6 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="font-medium text-gray-900">{webhook.url}</div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    webhook.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}>
                    {webhook.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {webhook.events.map((event) => (
                    <span key={event} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {event}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={webhook.active}
                    onChange={() => toggleWebhook(webhook.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <button
                  onClick={() => deleteWebhook(webhook.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {webhooks.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No webhooks configured. Add your first webhook to receive real-time notifications.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
