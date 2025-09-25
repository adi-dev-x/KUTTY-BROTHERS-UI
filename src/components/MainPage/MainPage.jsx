import React from "react";
import "./MainPage.css";
import Footer from "../footer/Footer";
import {
  FaUserTie,
  FaClipboardList,
  FaCog,
  FaFileInvoice,
  FaUsers,
  FaMoneyBill,
} from "react-icons/fa";
import Header from "../header/Header";
import { useNavigate } from "react-router-dom";

const MainPage = ({ onLogout }) => {
  const navigate = useNavigate();

  const cards = [
    {
      icon: <FaMoneyBill size={30} />,
      title: "Accounts",
      description: "Manage your ledgers, balances, and transactions easily.",
      path: "/accounts",
    },
    {
      icon: <FaUsers size={30} />,
      title: "Employees",
      description: "Track employee records, payroll, and attendance.",
      path: "/employees",
    },
    {
      icon: <FaClipboardList size={30} />,
      title: "Attendance",
      description: "Assign, monitor, and manage project finances.",
      path: "/attendance",
    },
    {
      icon: <FaFileInvoice size={30} />,
      title: "Invoices",
      description: "Create and manage client invoices with ease.",
      path: "/invoices",
    },
    {
      icon: <FaUserTie size={30} />,
      title: "Rentals",
      description: "Providing rental tools and details.",
      path: "/irl-dashboard", // ✅ updated path
    },
    {
      icon: <FaCog size={30} />,
      title: "Settings",
      description: "Configure system preferences and user permissions.",
      path: "/settings",
    },
  ];

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <div className="main-wrapper">
      <Header onLogout={onLogout} />

      <main className="main-content">
        <div className="cards-grid">
          {cards.map((card, index) => (
            <div
              key={index}
              className="card"
              onClick={() => handleCardClick(card.path)}
              style={{ cursor: "pointer" }}
            >
              <div className="card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MainPage;
