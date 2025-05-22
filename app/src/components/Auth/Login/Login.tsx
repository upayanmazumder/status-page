"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "../AuthProvider/AuthProvider";
import axios from "../../../utils/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("/auth/login", { email, password });
      login(res.data.token);
    } catch (err) {
      alert("Login failed");
      console.log(err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md"
    >
      <h2 className="text-3xl font-semibold text-white mb-6 text-center">
        Login
      </h2>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full mb-4 px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full mb-6 px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
      />
      <button
        type="submit"
        className="w-full py-3 bg-indigo-600 rounded text-white font-semibold hover:bg-indigo-700 transition"
      >
        Login
      </button>

      <p className="mt-4 text-center text-gray-400">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          className="text-indigo-400 hover:underline"
          onClick={() => (window.location.href = "/auth/register")}
        >
          Register
        </button>
      </p>
    </form>
  );
}
