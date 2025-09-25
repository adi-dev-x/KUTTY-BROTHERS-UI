// src/components/Footer.jsx
import React from "react";
import "./Footer.css"; // Separate CSS file

const Footer = () => {
  return (
    <footer className="footer">
      {/* Left side */}
      <div className="footer-left">
        <h3 style={{ color: "#000000ff" }}>
          <span className="green">KUTTY</span>BROTHERS
        </h3>
        <p>
          Empower Your Financial Insights with Our Intuitive Accounting System –
          Simplifying Complexity, Maximizing Efficiency.
        </p>
        <a href="#">Privacy Policy</a>
      </div>

      {/* Right side */}
      <div className="footer-right">
        
        <p>© 2025 Hevinka.</p>
        <a href="#">Terms & Conditions</a>
      </div>
    </footer>
  );
};

export default Footer;
