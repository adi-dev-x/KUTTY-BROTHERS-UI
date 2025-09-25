import React from "react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import "./irlDashboard.css";

const statuses = [
  "Available",
  "Rented",
  "Damaged",
  "Repairing",
  "Expired",
  "Blocked",
  "Reserved",
  "Pending",
];

const IrlDashboard = ({ onLogout }) => {
  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />
        <div className="main-content">
          <h2 className="dashboard-title">IRL Dashboard</h2>
          <div className="card-grid">
            {statuses.map((status) => (
              <div className="status-card" key={status}>
                <h3>{status}</h3>
                <p className="status-count">0</p>
                {/* You can fetch and display actual counts here */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IrlDashboard;
