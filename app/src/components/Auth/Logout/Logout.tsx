"use client";

import { useAuth } from "../AuthProvider/AuthProvider";

export default function Logout() {
  const { logout } = useAuth();

  return (
    <button
      onClick={logout}
      className="px-6 py-3 bg-red-600 rounded text-white font-semibold hover:bg-red-700 transition"
    >
      Logout
    </button>
  );
}
