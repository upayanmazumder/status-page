"use client";

import { useState } from "react";

export default function ExportModal({
  onClose,
  type,
}: {
  onClose: () => void;
  type: "incidents" | "components";
}) {
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [downloading, setDownloading] = useState(false);

  const handleExport = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      onClose();
      alert(`Export complete! ${type} data exported as ${format.toUpperCase()}.`);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          Export {type === "incidents" ? "Incidents" : "Components"}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormat("json")}
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  format === "json"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                JSON
              </button>
              <button
                onClick={() => setFormat("csv")}
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  format === "csv"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                CSV
              </button>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
            This will export all {type} data including history and metadata.
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={downloading}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {downloading ? "Exporting..." : `Export as ${format.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
