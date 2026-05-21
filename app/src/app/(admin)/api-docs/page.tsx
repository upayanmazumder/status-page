"use client";

export default function ApiDocsPage() {
  const endpoints = [
    {
      category: "Auth",
      methods: [
        { method: "POST", path: "/auth/register", description: "Register new user and organization" },
        { method: "POST", path: "/auth/login", description: "Login and get tokens" },
        { method: "GET", path: "/auth/me", description: "Get current user info" },
        { method: "POST", path: "/auth/refresh", description: "Refresh access token" },
      ],
    },
    {
      category: "Components",
      methods: [
        { method: "POST", path: "/dashboard/components", description: "Create component" },
        { method: "GET", path: "/dashboard/components", description: "List components" },
        { method: "PATCH", path: "/dashboard/components/:id", description: "Update component" },
        { method: "DELETE", path: "/dashboard/components/:id", description: "Delete component" },
      ],
    },
    {
      category: "Incidents",
      methods: [
        { method: "POST", path: "/dashboard/incidents", description: "Create incident" },
        { method: "GET", path: "/dashboard/incidents", description: "List incidents" },
        { method: "GET", path: "/dashboard/incidents/:id", description: "Get incident details" },
        { method: "PATCH", path: "/dashboard/incidents/:id", description: "Update incident" },
      ],
    },
    {
      category: "Public",
      methods: [
        { method: "GET", path: "/status/:org/:project", description: "Get public status page" },
        { method: "GET", path: "/status/:org/:project/metrics", description: "Get uptime metrics" },
        { method: "GET", path: "/events/:org/:project", description: "SSE real-time updates" },
      ],
    },
  ];

  const methodColors: Record<string, string> = {
    GET: "bg-green-100 text-green-800",
    POST: "bg-blue-100 text-blue-800",
    PATCH: "bg-yellow-100 text-yellow-800",
    DELETE: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
        <p className="text-gray-600">REST API reference for the Status Page Platform</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h3 className="font-semibold text-blue-900 mb-2">Base URL</h3>
        <code className="text-sm bg-blue-100 px-2 py-1 rounded">https://api.statuspage.example.com</code>
        <h3 className="font-semibold text-blue-900 mt-4 mb-2">Authentication</h3>
        <p className="text-sm text-blue-800">
          Include the header <code className="bg-blue-100 px-1 rounded">Authorization: Bearer YOUR_TOKEN</code>
        </p>
      </div>

      <div className="space-y-8">
        {endpoints.map((category) => (
          <div key={category.category}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{category.category}</h2>
            <div className="bg-white rounded-lg shadow-sm border divide-y">
              {category.methods.map((endpoint) => (
                <div key={endpoint.path} className="p-4 flex items-center gap-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${methodColors[endpoint.method]}`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm text-gray-700 font-mono">{endpoint.path}</code>
                  <span className="text-sm text-gray-500 flex-1">{endpoint.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
