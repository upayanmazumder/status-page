"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import apiClient from "@/lib/api";
import CreateIncidentModal from "@/components/modals/create-incident";
import Pagination from "@/components/pagination";
import { ListSkeleton } from "@/components/skeletons";

interface Incident {
  id: string;
  title: string;
  status: string;
  impact: string;
  created_at: string;
  resolved_at: string | null;
}

const statusColors: Record<string, string> = {
  investigating: "bg-yellow-100 text-yellow-800",
  identified: "bg-orange-100 text-orange-800",
  monitoring: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
};

const impactColors: Record<string, string> = {
  none: "bg-gray-100 text-gray-800",
  minor: "bg-yellow-100 text-yellow-800",
  major: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, hasNext: false, hasPrev: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchIncidents = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      let url = `/dashboard/incidents?project_id=default&page=${page}&limit=20`;
      if (filter !== "all") {
        url += `&status_filter=${filter}`;
      }
      const response = await apiClient.get(url);
      setIncidents(response.data.items || []);
      setPagination({
        page: response.data.page,
        pages: response.data.pages,
        hasNext: response.data.has_next,
        hasPrev: response.data.has_prev,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents(1);
  }, [filter]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchIncidents(1);
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.get(`/dashboard/search?q=${encodeURIComponent(searchQuery)}&project_id=default`);
      const incidentResults = (response.data.incidents || []).map((i: any) => ({
        ...i,
        impact: "minor",
        resolved_at: null,
      }));
      setIncidents(incidentResults);
      setPagination({ page: 1, pages: 1, hasNext: false, hasPrev: false });
    } catch (err) {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-700 font-medium mb-2">Error loading incidents</div>
        <div className="text-red-600 text-sm">{error}</div>
        <button
          onClick={() => fetchIncidents(1)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-gray-600">Track and manage incidents</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          + Report Incident
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incidents..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); fetchIncidents(1); }}
              className="px-4 py-2 text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {["all", "investigating", "identified", "monitoring", "resolved"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              filter === s
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <ListSkeleton count={5} />
      ) : (
        <>
          <div className="space-y-4">
            {incidents.map((incident) => (
              <Link
                key={incident.id}
                href={`/dashboard/incidents/${incident.id}`}
                className="block bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[incident.status]}`}>
                        {incident.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${impactColors[incident.impact]}`}>
                        {incident.impact}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Created {new Date(incident.created_at).toLocaleString()}
                      {incident.resolved_at && (
                        <span className="ml-2 text-green-600">
                          Resolved {new Date(incident.resolved_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
            {incidents.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
                No incidents found. Great job keeping things running!
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6">
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
                onPageChange={fetchIncidents}
              />
            </div>
          )}
        </>
      )}

      {showModal && (
        <CreateIncidentModal
          projectId="default"
          onClose={() => setShowModal(false)}
          onSuccess={() => fetchIncidents(1)}
        />
      )}
    </div>
  );
}
