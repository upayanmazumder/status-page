import React from "react";
import StarOnGithub from "./StarOnGithub/StarOnGithub";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-400 mt-auto py-6 border-t border-gray-800 text-sm">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-center sm:text-left">
          © {year} Status Page. All rights reserved.
        </p>
        <div className="flex justify-center sm:justify-end">
          <StarOnGithub />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
