import React from "react";
import "./AttendancePage.css";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import { FaMapMarkerAlt, FaUsers } from "react-icons/fa";

const AttendancePage = ({ onLogout }) => {
  return (
    <div className="attendance-wrapper">
      {/* Header */}
      <Header onLogout={onLogout} />

     

      {/* Cards Section */}
      <div className="card-grid">
        <div className="card">
          <FaMapMarkerAlt className="card-icon" />
          <h3>Site 1</h3>
          <p>Track performance and activities of Site 1</p>
        </div>

        <div className="card">
          <FaMapMarkerAlt className="card-icon" />
          <h3>Site 2</h3>
          <p>Track performance and activities of Site 2</p>
        </div>

        <div className="card">
          <FaMapMarkerAlt className="card-icon" />
          <h3>Site 3</h3>
          <p>Track performance and activities of Site 3</p>
        </div>

        <div className="card">
          <FaUsers className="card-icon" />
          <h3>All Employees</h3>
          <p>Track performance and activities of all employees</p>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AttendancePage;
