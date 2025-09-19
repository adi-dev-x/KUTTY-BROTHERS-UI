import React, { useState } from "react";
import "../Rental-sidebar/Rentalsidebar.css";
import {
  Users,
  Layers,
  FileText,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const Rentalsidebar = () => {
  const [isAttributeOpen, setIsAttributeOpen] = useState(false);

  // Function to handle top-level menu clicks
  const handleMenuClick = (menu) => {
    if (menu === "attributes") {
      setIsAttributeOpen(!isAttributeOpen);
    } else {
      setIsAttributeOpen(false); // Close attributes submenu if another menu clicked
    }
  };

  return (
    <aside className="rental-sidebar">
      <div className="sidebar-header">
        <h2>Rental Panel</h2>
      </div>
      <ul className="sidebar-menu">
        {/* Customers */}
        <li onClick={() => handleMenuClick("customers")}>
          <NavLink
            to="/rental-dashboard"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            <Users className="icon" />
            <span>Customers</span>
          </NavLink>
        </li>

        {/* Attributes */}
        <li
          className={`menu-item has-submenu ${isAttributeOpen ? "open" : ""}`}
          onClick={() => handleMenuClick("attributes")}
        >
          <div className="menu-link">
            <Layers className="icon" />
            <span>Attributes</span>
          </div>
          {isAttributeOpen ? (
            <ChevronDown className="chevron" />
          ) : (
            <ChevronRight className="chevron" />
          )}
        </li>

        {/* Submenu */}
        {isAttributeOpen && (
          <ul className="submenu">
            <li>
              <NavLink
                to="/brand"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                Brand
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/maintype"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                Main Type
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/subtype"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                Sub Type
              </NavLink>
            </li>
          </ul>
        )}

        {/* Stock Report */}
        <li onClick={() => handleMenuClick("stock")}>
          <NavLink
            to="/stock-report"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            <FileText className="icon" />
            <span>Stock Report</span>
          </NavLink>
        </li>

        {/* Orders */}
        <li onClick={() => handleMenuClick("orders")}>
          <NavLink
            to="/orders"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            <ShoppingCart className="icon" />
            <span>Orders</span>
          </NavLink>
        </li>
      </ul>
    </aside>
  );
};

export default Rentalsidebar;
