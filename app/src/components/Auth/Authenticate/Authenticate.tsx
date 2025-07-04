"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "../AuthProvider/AuthProvider";
import axios, { baseURL } from "../../../utils/api";
import type { AxiosError } from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaGoogle } from "react-icons/fa";
import md5 from "md5";
import { useNotification } from "../../Notification/Notification";

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
  const { notify } = useNotification();
  const [error, setError] = useState<string | null>(null);

  const getGravatarUrl = (email: string) => {
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
  };

  const handleGoogleLogin = () => {
    window.location.href = `${baseURL}/auth/google`;
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await axios.post("/auth/login", loginData);
      login(res.data.token);
    } catch (err: unknown) {
      const error = err as AxiosError<{ message: string }>;
      notify(
        error?.response?.data?.message ||
          "Login failed. Please check your credentials.",
        "error"
      );
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const profilePicture = getGravatarUrl(registerData.email);
      await axios.post("/auth/register", {
        ...registerData,
        profilePicture,
        name: registerData.name,
      });
      notify("Registration successful! You can now login.", "success");
      setActiveTab("login");
    } catch (err: unknown) {
      const error = err as AxiosError<{ message: string }>;
      notify(error?.response?.data?.message || "Registration failed.", "error");
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const inputStyle =
    "w-full pl-10 pr-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <motion.div
      className="bg-gray-900 p-8 rounded-3xl  w-full max-w-lg mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {error && (
        <motion.div
          className="mb-4 p-4 bg-red-600 text-white rounded-lg text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {error}
        </motion.div>
      )}

      <div className="flex justify-center gap-6 mb-6 border-b border-gray-700 pb-2">
        {["login", "register"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab as "login" | "register");
              setError(null);
            }}
            className={`text-lg font-semibold pb-1 transition-all duration-300 ${
              activeTab === tab
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-gray-400 hover:text-indigo-300"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 py-3 mb-6 bg-white text-gray-800 rounded-xl font-semibold shadow hover:bg-gray-100 transition"
      >
        <FaGoogle className="text-red-500" />
        Sign in with Google
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
                placeholder="Email"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                className={inputStyle}
                required
              />
            </div>
            <div className="relative mb-6">
              <FaLock className="absolute left-3 top-4 text-gray-400" />
              <input
                type="password"
                placeholder="Password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                className={inputStyle}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 rounded-xl text-white font-semibold hover:bg-indigo-700 transition"
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
                className={inputStyle}
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
                className={inputStyle}
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
                className={inputStyle}
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
                className={inputStyle}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 rounded-xl text-white font-semibold hover:bg-indigo-700 transition"
            >
              Register
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
