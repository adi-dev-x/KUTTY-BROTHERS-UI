import React, { useState } from "react";
import "./LoginPage.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Email:", email, "Password:", password);
  };

  return (
    <div className="page-wrapper">
      {/* Main Section */}
      <div className="login-container">
        {/* Left Section */}
        <div className="welcome-panel">
          <h1>Welcome Back!</h1>
          <p>
            To keep connected with us please login with your personal info
          </p>
        </div>

        {/* Right Section */}
        <div className="form-panel">
          <div className="form-box">
            <h2>Login to Account</h2>

            

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <span>📧</span>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <span>🔒</span>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="login-btn">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="footer">
        <div className="footer-left">
          <h3><span className="green">KUTTY</span>BROTHERS</h3>
          <p>
            Empower Your Financial Insights with Our Intuitive Accounting System –
            Simplifying Complexity, Maximizing Efficiency.
          </p>
          <a href="#">Privacy Policy</a>
        </div>

        <div className="footer-right">
         
          <p>© 2025 Adithya Technologies, Inc.</p>
          <a href="#">Terms & Conditions</a>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
