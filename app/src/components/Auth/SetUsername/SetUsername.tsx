"use client";

import { useState } from "react";
import api from "../../../utils/api";
import { useAuth } from "../AuthProvider/AuthProvider";
import axios from "axios";
import Loading from "../../Loader/Loader";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

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
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-sm mx-auto mt-12 p-6 bg-gray-800 rounded-2xl shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold text-white">Choose a username</h2>

      <div>
        <input
          className={`w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            error ? "ring-2 ring-red-500" : ""
          }`}
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (/\s/.test(e.target.value)) {
              setError("Username must not contain spaces");
            } else {
              setError(null);
            }
          }}
          placeholder="e.g. johndoe123"
          required
        />
        <AnimatePresence>
          {error && (
            <motion.div
              className="flex items-center gap-2 text-sm text-red-400 mt-2"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="submit"
        className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!username || !!error}
      >
        Save
      </button>
    </motion.form>
  );
}
