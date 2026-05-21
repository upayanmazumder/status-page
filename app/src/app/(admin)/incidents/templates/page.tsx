"use client";

import { useState } from "react";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  title: string;
  status: string;
  impact: string;
  message: string;
}

const templates: Template[] = [
  {
    id: "1",
    name: "API Degradation",
    title: "API Response Time Degraded",
    status: "investigating",
    impact: "minor",
    message: "We are investigating reports of increased API response times.",
  },
  {
    id: "2",
    name: "Database Issue",
    title: "Database Connectivity Issues",
    status: "investigating",
    impact: "major",
    message: "We are investigating connectivity issues with our primary database.",
  },
  {
    id: "3",
    name: "DDoS Attack",
    title: "Mitigating DDoS Attack",
    status: "identified",
    impact: "critical",
    message: "We have identified a DDoS attack and are implementing mitigation measures.",
  },
  {
    id: "4",
    name: "Deploy Failed",
    title: "Deployment Rollback",
    status: "identified",
    impact: "minor",
    message: "A deployment has been rolled back due to detected issues.",
  },
  {
    id: "5",
    name: "Third Party Outage",
    title: "Third Party Service Outage",
    status: "monitoring",
    impact: "minor",
    message: "A third-party service we depend on is experiencing issues.",
  },
];

export default function IncidentTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Incident Templates</h1>
        <p className="text-gray-600">Quick-start common incident types</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedTemplate(template)}
          >
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                template.impact === "critical"
                  ? "bg-red-100 text-red-800"
                  : template.impact === "major"
                  ? "bg-orange-100 text-orange-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {template.impact}
              </span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{template.title}</p>
          </div>
        ))}
      </div>

      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Use Template: {selectedTemplate.name}
            </h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  defaultValue={selectedTemplate.title}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Message</label>
                <textarea
                  defaultValue={selectedTemplate.message}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select defaultValue={selectedTemplate.status} className="w-full px-3 py-2 border rounded-md">
                    <option value="investigating">Investigating</option>
                    <option value="identified">Identified</option>
                    <option value="monitoring">Monitoring</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
                  <select defaultValue={selectedTemplate.impact} className="w-full px-3 py-2 border rounded-md">
                    <option value="none">None</option>
                    <option value="minor">Minor</option>
                    <option value="major">Major</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <Link
                href="/dashboard/incidents/new"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-center"
              >
                Create Incident
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
