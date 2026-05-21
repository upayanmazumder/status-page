"use client";

import { useState } from "react";

export default function EmbedPage() {
  const [orgSlug, setOrgSlug] = useState("my-org");
  const [projectSlug, setProjectSlug] = useState("default");

  const embedCode = `<iframe
  src="https://status.example.com/status/${orgSlug}/${projectSlug}"
  width="100%"
  height="600"
  frameborder="0"
  allowtransparency="true"
  scrolling="no"
></iframe>`;

  const badgeCode = `[![Status](https://status.example.com/badge/${orgSlug})](https://status.example.com/${orgSlug})`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Embed & Badge</h1>
        <p className="text-gray-600">Share your status page on your own site</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Page URL</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              placeholder="Organization slug"
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <input
              type="text"
              value={projectSlug}
              onChange={(e) => setProjectSlug(e.target.value)}
              placeholder="Project slug"
              className="flex-1 px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">HTML Embed</h2>
            <button
              onClick={() => copyToClipboard(embedCode)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Copy Code
            </button>
          </div>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{embedCode}</code>
          </pre>
          <p className="text-sm text-gray-500 mt-2">
            Add this iframe to your website to display your status page.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Markdown Badge</h2>
            <button
              onClick={() => copyToClipboard(badgeCode)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Copy Code
            </button>
          </div>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{badgeCode}</code>
          </pre>
          <p className="text-sm text-gray-500 mt-2">
            Add this badge to your README or documentation.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Direct Link</h2>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`https://status.example.com/${orgSlug}`}
              className="flex-1 px-3 py-2 border rounded-md bg-gray-50"
            />
            <button
              onClick={() => copyToClipboard(`https://status.example.com/${orgSlug}`)}
              className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
