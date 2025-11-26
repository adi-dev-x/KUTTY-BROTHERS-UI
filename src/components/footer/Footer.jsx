// src/components/Footer.jsx
import React from "react";

const Footer = () => {
  return (
    <footer className="flex h-16 flex-shrink-0 items-center justify-between border-t border-gray-200 bg-white px-8 py-3 text-xs">
      <div className="flex items-center gap-2">
        <h3 className="m-0 font-bold text-black">
          <span className="text-yellow-600">KUTTY</span>BROTHERS
        </h3>
        <span className="text-gray-400">|</span>
        <p className="text-gray-600">© 2025 Hevinka</p>
      </div>

      <div className="flex items-center gap-4">
        <a href="#" className="text-yellow-600 transition-colors hover:text-yellow-700 hover:underline">Privacy Policy</a>
        <a href="#" className="text-yellow-600 transition-colors hover:text-yellow-700 hover:underline">Terms & Conditions</a>
      </div>
    </footer>
  );
};

export default Footer;
