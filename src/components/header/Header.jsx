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
          className="inline-flex items-center gap-2 rounded-lg border-2 border-primary bg-white px-3 py-2 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary hover:text-white"
        >
          <AiOutlineHome className="text-lg" />
          <span className="hidden sm:inline">Home</span>
        </Link>

        <img src={logo} alt="Logo" className="h-9 w-9 rounded-full object-cover" />

        <button
          className="group inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 hover:bg-yellow-700 active:scale-95"
          onClick={onLogout}
        >
          <AiOutlineLogout className="text-lg transition-transform group-hover:translate-x-0.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
