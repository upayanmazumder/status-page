import React from "react";
import { Github, ExternalLink } from "lucide-react";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-400 mt-auto py-6 border-t border-gray-800 text-sm">
      <div className="max-w-6xl mx-auto px-4 flex flex-col gap-4">
        {/* First Row - Centered Project Info */}
        <div className="text-center">
          <p>
            © {year}{" "}
            <a
              href="https://github.com/upayanmazumder/status-page"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors font-medium inline-flex items-center gap-1"
            >
              Status Page <Github className="w-4 h-4" />
            </a>
            . All rights reserved.
          </p>
        </div>

        {/* Second Row - Right Aligned Author Info */}
        <div className="flex justify-center sm:justify-end">
          <p className="inline-flex items-center gap-1">
            Built by{" "}
            <a
              href="https://upayan.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors font-medium inline-flex items-center gap-1"
            >
              Upayan Mazumder <ExternalLink className="w-4 h-4" />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
