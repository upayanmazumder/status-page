"use client";

import { FormEvent, useState } from "react";
import axios from "../../../utils/api";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/auth/register", form);
      router.push("/auth/login");
    } catch (err) {
      alert("Registration failed");
      console.error(err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md"
    >
      <h2 className="text-3xl font-semibold text-white mb-6 text-center">
        Register
      </h2>

      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Name"
        className="w-full mb-4 px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
      />
      <input
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        className="w-full mb-4 px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
      />
      <input
        name="username"
        value={form.username}
        onChange={handleChange}
        placeholder="Username"
        className="w-full mb-4 px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
      />
      <input
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
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

      <p className="mt-4 text-center text-gray-400">
        Already have an account?{" "}
        <button
          type="button"
          className="text-indigo-400 hover:underline"
          onClick={() => router.push("/auth/login")}
        >
          Login
        </button>
      </p>
    </form>
  );
}
