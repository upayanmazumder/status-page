"use client";

import { useState } from "react";
import api from "../../../utils/api";
import { useAuth } from "../AuthProvider/AuthProvider";
import axios from "axios";
import Loading from "../../Loader/Loader";

export default function SetUsername() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (/\s/.test(username)) {
      setError("Username must not contain spaces");
      return;
    }

    try {
      const res = await api.post("/auth/username", { username });
      login(res.data.token);
      setSuccess(true);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to set username");
      } else {
        setError("Failed to set username");
      }
    }
  };

  if (success) return <Loading />;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">Set your username</h2>
      <input
        className="px-4 py-2 rounded bg-gray-700 text-white"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          if (/\s/.test(e.target.value)) {
            setError("Username must not contain spaces");
          } else {
            setError(null);
          }
        }}
        placeholder="Choose a username"
        required
      />
      <button
        type="submit"
        className="px-4 py-2 bg-indigo-600 text-white rounded"
        disabled={!username || !!error}
      >
        Save
      </button>
      {error && <div className="text-red-500">{error}</div>}
    </form>
  );
}
