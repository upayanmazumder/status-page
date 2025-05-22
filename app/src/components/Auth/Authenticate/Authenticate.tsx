"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "../AuthProvider/AuthProvider";
import axios from "../../../utils/api";

export default function AuthenticatePage() {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
  });

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("/auth/login", loginData);
      login(res.data.token);
    } catch (err) {
      alert("Login failed");
      console.error(err);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/auth/register", registerData);
      setActiveTab("login");
    } catch (err) {
      alert("Registration failed");
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen flex items-center justify-center px-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        {/* Tabs */}
        <div className="flex justify-around mb-6 border-b border-gray-700">
          <button
            className={`w-1/2 py-2 text-lg font-semibold ${
              activeTab === "login"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-gray-400"
            }`}
            onClick={() => setActiveTab("login")}
          >
            Login
          </button>
          <button
            className={`w-1/2 py-2 text-lg font-semibold ${
              activeTab === "register"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-gray-400"
            }`}
            onClick={() => setActiveTab("register")}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit}>
            <input
              type="email"
              value={loginData.email}
              onChange={(e) =>
                setLoginData({ ...loginData, email: e.target.value })
              }
              placeholder="Email"
              className="w-full mb-4 px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({ ...loginData, password: e.target.value })
              }
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
          </form>
        )}

        {/* Register Form */}
        {activeTab === "register" && (
          <form onSubmit={handleRegisterSubmit}>
            <input
              name="name"
              value={registerData.name}
              onChange={(e) =>
                setRegisterData({ ...registerData, name: e.target.value })
              }
              placeholder="Name"
              className="w-full mb-4 px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              name="email"
              type="email"
              value={registerData.email}
              onChange={(e) =>
                setRegisterData({ ...registerData, email: e.target.value })
              }
              placeholder="Email"
              className="w-full mb-4 px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              name="username"
              value={registerData.username}
              onChange={(e) =>
                setRegisterData({ ...registerData, username: e.target.value })
              }
              placeholder="Username"
              className="w-full mb-4 px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              name="password"
              type="password"
              value={registerData.password}
              onChange={(e) =>
                setRegisterData({ ...registerData, password: e.target.value })
              }
              placeholder="Password"
              className="w-full mb-6 px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 rounded text-white font-semibold hover:bg-indigo-700 transition"
            >
              Register
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
