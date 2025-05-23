"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "../Auth/ProtectedRoute/ProtectedRoute";
import Logout from "../Auth/Logout/Logout";
import { useAuth } from "../Auth/AuthProvider/AuthProvider";
import api from "../../utils/api";
import Loader from "../Loader/Loader";

export default function DashboardPage() {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    const fetchUsername = async () => {
      try {
        const res = await api.get("/auth/username");
        setUsername(res.data.username);
      } catch {
        setUsername(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchUsername();
  }, [user]);

  if (loading) {
    return <Loader />;
  }

  if (!username) {
    return (
      <ProtectedRoute>
        <main>
          <h1>Dashboard</h1>
          <p>You have not set a username yet.</p>
          <a
            href="/auth/onboarding"
            className="inline-block px-4 py-2 mt-4 bg-indigo-600 text-white rounded"
          >
            Set Username
          </a>
          <Logout />
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main>
        <h1>Dashboard</h1>
        <p>
          Welcome, <span className="font-bold">{username}</span>!
        </p>
        <Logout />
      </main>
    </ProtectedRoute>
  );
}
