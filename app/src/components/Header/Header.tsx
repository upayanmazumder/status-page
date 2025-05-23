"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "../../utils/api";

function formatUptime(seconds: number) {
  const y = Math.floor(seconds / (365 * 24 * 3600));
  seconds %= 365 * 24 * 3600;
  const mo = Math.floor(seconds / (30 * 24 * 3600));
  seconds %= 30 * 24 * 3600;
  const d = Math.floor(seconds / (24 * 3600));
  seconds %= 24 * 3600;
  const h = Math.floor(seconds / 3600);
  seconds %= 3600;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return [
    y ? `${y}y` : "",
    mo ? `${mo}mo` : "",
    d ? `${d}d` : "",
    h ? `${h}h` : "",
    m ? `${m}m` : "",
    s ? `${s}s` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

const Header: React.FC = () => {
  const [status, setStatus] = useState<"online" | "offline" | "loading">(
    "loading"
  );
  const [uptime, setUptime] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .get("/")
      .then((res) => {
        if (mounted) {
          setStatus("online");
          setUptime(res.data.uptime);
        }
      })
      .catch(() => {
        if (mounted) setStatus("offline");
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="bg-gray-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Image
            src="/icon.webp"
            alt="Logo"
            width={50}
            height={50}
            className="h-10 w-10"
          />
          <span className="text-2xl font-bold tracking-tight">Status Page</span>
          <span
            className={`relative bg-${
              status === "online" ? "green" : "red"
            }-500 text-xs px-2 py-1 rounded-full font-semibold cursor-pointer transition-colors`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {status === "loading"
              ? "Checking..."
              : status === "online"
              ? "All Systems Operational"
              : "API Offline"}
            {showTooltip && status === "online" && uptime !== null && (
              <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-10 whitespace-nowrap">
                Uptime: {formatUptime(uptime)}
              </span>
            )}
            {showTooltip && status === "offline" && (
              <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-10 whitespace-nowrap">
                API is unreachable
              </span>
            )}
          </span>
        </div>
        <nav className="flex space-x-6 px-4 py-2">
          <Link href="/" className="hover:text-green-400 transition-colors">
            Home
          </Link>
          <Link
            href="/history"
            className="hover:text-green-400 transition-colors"
          >
            History
          </Link>
          <Link
            href="/contact"
            className="hover:text-green-400 transition-colors"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
