import React from "react";
import { Link } from "react-router-dom";
import { AiOutlineHome, AiOutlineLogout } from "react-icons/ai";
import logo from "/src/assets/logo.png";

const Header = ({ onLogout }) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-white px-5 py-3 backdrop-blur">
      <h2 className="text-xl font-bold text-black">
        <span className="text-yellow-600">KUTTY</span>BROTHERS
      </h2>

      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center justify-center h-9 w-9 rounded-full border border-primary bg-white text-yellow-600 shadow-sm"
        >
          <AiOutlineHome className="text-lg" />
        </Link>

        <img src={logo} alt="Logo" className="h-9 w-9 rounded-full object-cover" />

        <button
          onClick={onLogout}
          className="flex items-center justify-center h-9 w-9 rounded-full border border-red-600 bg-white text-red-600 shadow-sm"
        >
          <AiOutlineLogout className="text-lg" />
        </button>
      </div>
    </header>
  );
};

export default Header;
