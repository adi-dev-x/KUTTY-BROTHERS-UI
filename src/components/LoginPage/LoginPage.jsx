import React, { useState } from "react";
import "./LoginPage.css";
import { RiLockPasswordLine } from "react-icons/ri";
import { FaRegUserCircle } from "react-icons/fa";
import Footer from "../footer/Footer";
import logo from "/src/assets/logo.png"; // ✅ Import logo

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // ✅ Temporary credentials
    const validUsername = "admin";
    const validPassword = "1234";

    if (email === validUsername && password === validPassword) {
      setError("");
      onLoginSuccess(); // 🔥 Switch to MainPage
    } else {
      setError("Invalid username or password!");
    }
  };

  return (
    <div className="page-wrapper">
      <div className="login-container">
        {/* Left Section */}
        <div className="welcome-panel">
          <img src={logo} alt="Logo" className="welcome-logo" /> {/* ✅ Logo added */}
          <h1>Welcome Back!</h1>
          <p>To keep connected with us please login with your personal info</p>
        </div>

        {/* Right Section */}
        <div className="form-panel">
          <div className="form-box">
            <h2>Login to Account</h2>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <span><FaRegUserCircle /></span>
                <input
                  type="text"
                  placeholder="Username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <span><RiLockPasswordLine /></span>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <button type="submit" className="login-btn">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LoginPage;
