"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const step = parseInt(searchParams.get("step") || "1");
  const [orgSlug, setOrgSlug] = useState("");

  const steps = [
    { number: 1, title: "Create Organization", description: "Set up your organization's status page" },
    { number: 2, title: "Add Components", description: "Add the services you want to monitor" },
    { number: 3, title: "Customize", description: "Configure your status page appearance" },
    { number: 4, title: "Share", description: "Share your status page with customers" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s) => (
              <div key={s.number} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s.number <= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {s.number}
                </div>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-200 rounded-full -mt-5 mx-4 relative z-0">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Organization</h1>
                <p className="text-gray-600">Let's set up your status page</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  placeholder="My Company"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Slug</label>
                <input
                  type="text"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="my-company"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">Your status page URL: status.example.com/{orgSlug || "my-company"}</p>
              </div>
              <Link
                href="/onboarding?step=2"
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue
              </Link>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Add Components</h1>
                <p className="text-gray-600">Add the services you want to monitor</p>
              </div>
              <div className="space-y-3">
                {["API", "Web App", "Database", "CDN"].map((name) => (
                  <label key={name} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="font-medium">{name}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <Link href="/onboarding?step=1" className="flex-1 text-center px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Back
                </Link>
                <Link href="/onboarding?step=3" className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Continue
                </Link>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Customize</h1>
                <p className="text-gray-600">Make it your own</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
                <div className="flex gap-2">
                  {["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"].map((color) => (
                    <button
                      key={color}
                      className="w-10 h-10 rounded-full border-2 border-transparent hover:border-gray-300 focus:border-gray-900"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex gap-3">
                <Link href="/onboarding?step=2" className="flex-1 text-center px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Back
                </Link>
                <Link href="/onboarding?step=4" className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Continue
                </Link>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h1>
                <p className="text-gray-600">Your status page is ready to share</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Your Status Page URL</div>
                <div className="font-medium text-gray-900">https://status.example.com/{orgSlug || "my-company"}</div>
              </div>
              <div className="space-y-3">
                <Link href="/dashboard" className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Go to Dashboard
                </Link>
                <Link href={`/status/${orgSlug || "my-company"}`} className="block w-full text-center px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Preview Status Page
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
