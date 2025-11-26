import React from "react";
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
    <div className="flex h-screen flex-col overflow-hidden">
      <Header onLogout={onLogout} />

      <main className="flex-1 overflow-y-auto bg-gray-100 px-8 py-10">
        <div className="mx-auto max-w-7xl">
          {/* Welcome Section */}
          <div className="mb-10 text-center">
            <h1 className="mb-3 bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-4xl font-bold text-transparent">
              Welcome to KUTTYBROTHERS
            </h1>
            <p className="text-lg text-gray-600">
              Choose a module to get started with your management system
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
              <button
                key={index}
                onClick={() => handleCardClick(card.path)}
                className="group relative overflow-hidden rounded-2xl bg-white p-8 text-left shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-600/20"
              >
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="mb-5 inline-flex rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50 p-4 text-yellow-600 transition-transform duration-300 group-hover:scale-110">
                    {card.icon}
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900 transition-colors group-hover:text-yellow-600">
                    {card.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {card.description}
                  </p>
                </div>

                {/* Bottom Border Accent */}
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-yellow-600 to-yellow-500 transition-all duration-300 group-hover:w-full"></div>
              </button>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MainPage;
