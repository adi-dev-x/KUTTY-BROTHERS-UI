import React from "react";
import { Link } from "react-router-dom";
import { AiOutlineHome } from "react-icons/ai"; // Home icon
import "./Header.css";
import logo from "/src/assets/logo.png";

const Header = ({ onLogout }) => {
  return (
    <header className="main-header">
      {/* Left side logo */}
      <h2 className="logo" style={{ color: "#000000ff" }}>
        <span style={{ color: "#ca8a04" }}>KUTTY</span>BROTHERS
      </h2>

      {/* Right side actions */}
      <div className="header-actions">
         {/* ✅ Home button with icon */}
        <Link to="/" className="home-btn">
          <AiOutlineHome className="home-icon" />
          Home
        </Link>

        <img src={logo} alt="Logo" className="profile-logo" />

       
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
