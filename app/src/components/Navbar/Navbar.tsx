"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Settings, LayoutDashboard } from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/profile", icon: User, label: "Profile" },
  {
    href: "/profile/applications",
    icon: Settings,
    label: "Applications",
  },
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 sm:static w-full bg-gray-900 text-white border-t border-gray-800 sm:border-none z-40">
      <ul className="flex sm:justify-center justify-around sm:gap-6 sm:px-6 py-4 sm:py-3 text-sm sm:text-base">
        {links.map(({ href, icon: Icon, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={clsx(
                "flex flex-col sm:flex-row items-center sm:gap-2 px-2 py-1 sm:px-3 rounded transition hover:bg-gray-800",
                pathname === href && "bg-gray-800 text-green-400"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs sm:text-sm hidden sm:inline">
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
