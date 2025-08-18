import React from "react";
import "./Header.css";
import logo from "/src/assets/logo.png"; // ✅ safer import path in Vite

const Header = ({ onLogout }) => {
  return (
    <header className="main-header">
      <h2 className="logo" style={{ color: "#000000ff" }}>
        <span style={{ color: "#ca8a04" }}>KUTTY</span>BROTHERS
      </h2>
      <div className="header-actions">
        <img src={logo} alt="Logo" className="profile-logo" />
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
