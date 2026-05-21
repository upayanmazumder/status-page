"use client";

import { useState, useEffect } from "react";

export default function KeyboardShortcuts() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShow(true);
      }
      if (e.key === "Escape") {
        setShow(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!show) return null;

  const shortcuts = [
    { key: "?", description: "Show keyboard shortcuts" },
    { key: "g d", description: "Go to Dashboard" },
    { key: "g i", description: "Go to Incidents" },
    { key: "g c", description: "Go to Components" },
    { key: "n i", description: "New Incident" },
    { key: "n c", description: "New Component" },
    { key: "Escape", description: "Close modal / Go back" },
    { key: "/", description: "Search" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShow(false)}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
          <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600">
            x
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-gray-600">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-700">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
