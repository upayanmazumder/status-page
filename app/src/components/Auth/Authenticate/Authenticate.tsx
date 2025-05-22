"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "../AuthProvider/AuthProvider";
import axios from "../../../utils/api";
import type { AxiosError } from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaGoogle } from "react-icons/fa";

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
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXTAUTH_URL}/auth/google`;
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await axios.post("/auth/login", loginData);
      login(res.data.token);
    } catch (err: unknown) {
      const error = err as AxiosError<{ message: string }>;
      setError(
        error?.response?.data?.message ||
          "Login failed. Please check your credentials and try again."
      );
      console.error(error);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await axios.post("/auth/register", registerData);
      setActiveTab("login");
    } catch (err: unknown) {
      const error = err as AxiosError<{ message: string }>;
      setError(
        error?.response?.data?.message ||
          "Registration failed. Please check your details and try again."
      );
      console.error(error);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-lg mx-auto">
      {error && (
        <div className="mb-4 p-3 bg-red-600 text-white rounded text-center">
          {error}
        </div>
      )}
      <div className="flex justify-around mb-6 border-b border-gray-700">
        {["login", "register"].map((tab) => (
          <button
            key={tab}
            className={`w-1/2 py-2 text-lg font-semibold transition-all duration-300 ${
              activeTab === tab
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-gray-400 hover:text-indigo-300"
            }`}
            onClick={() => {
              setActiveTab(tab as "login" | "register");
              setError(null);
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2 py-3 mb-6 bg-white text-gray-800 rounded font-semibold hover:bg-gray-100 transition"
      >
        <FaGoogle className="text-red-500" />
        Continue with Google
      </button>

      <AnimatePresence mode="wait">
        {activeTab === "login" ? (
          <motion.form
            key="login"
            onSubmit={handleLoginSubmit}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={formVariants}
            transition={{ duration: 0.3 }}
          >
            <div className="relative mb-4">
              <FaEnvelope className="absolute left-3 top-4 text-gray-400" />
              <input
                type="email"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                placeholder="Email"
                className="w-full pl-10 px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="relative mb-6">
              <FaLock className="absolute left-3 top-4 text-gray-400" />
              <input
                type="password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                placeholder="Password"
                className="w-full pl-10 px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 rounded text-white font-semibold hover:bg-indigo-700 transition"
            >
              Login
            </button>
          </motion.form>
        ) : (
          <motion.form
            key="register"
            onSubmit={handleRegisterSubmit}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={formVariants}
            transition={{ duration: 0.3 }}
          >
            <div className="relative mb-4">
              <FaUser className="absolute left-3 top-4 text-gray-400" />
              <input
                value={registerData.name}
                onChange={(e) =>
                  setRegisterData({ ...registerData, name: e.target.value })
                }
                placeholder="Name"
                className="w-full pl-10 px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="relative mb-4">
              <FaEnvelope className="absolute left-3 top-4 text-gray-400" />
              <input
                type="email"
                value={registerData.email}
                onChange={(e) =>
                  setRegisterData({ ...registerData, email: e.target.value })
                }
                placeholder="Email"
                className="w-full pl-10 px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="relative mb-4">
              <FaUser className="absolute left-3 top-4 text-gray-400" />
              <input
                value={registerData.username}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    username: e.target.value,
                  })
                }
                placeholder="Username"
                className="w-full pl-10 px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="relative mb-6">
              <FaLock className="absolute left-3 top-4 text-gray-400" />
              <input
                type="password"
                value={registerData.password}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    password: e.target.value,
                  })
                }
                placeholder="Password"
                className="w-full pl-10 px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 rounded text-white font-semibold hover:bg-indigo-700 transition"
            >
              Register
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
