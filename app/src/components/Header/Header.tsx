import React from "react";
import Link from "next/link";
import Image from "next/image";

const Header: React.FC = () => (
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
        <span className="bg-green-500 text-xs px-2 py-1 rounded-full font-semibold">
          All Systems Operational
        </span>
      </div>
      <nav>
        <Link href="/" className="hover:text-green-400 transition-colors">
          Home
        </Link>

        <a href="/history" className="hover:text-green-400 transition-colors">
          History
        </a>
        <a href="/contact" className="hover:text-green-400 transition-colors">
          Contact
        </a>
      </nav>
    </div>
  </header>
);

export default Header;
