import React from "react";
import "../Rental-sidebar/Rentalsidebar.css";
import {
  Users,
  Layers,
  FileText,
  ShoppingCart,
  Tag,
  Grid,
  Boxes,
  LayoutDashboard,
  List,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const Rentalsidebar = () => {
  return (
    <aside className="rental-sidebar">
      <div className="sidebar-header">
        <h2>Rental Panel</h2>
      </div>
      <ul className="sidebar-menu">
        {/* Dashboard */}
        <li>
          <NavLink
            to="/irl-dashboard"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            <LayoutDashboard className="icon" />
            <span>Dashboard</span>
          </NavLink>
        </li>

        {/* Customers */}
        <li>
          <NavLink
            to="/rental-dashboard"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            <Users className="icon" />
            <span>Customers</span>
          </NavLink>
        </li>

        {/* Attributes (always open with dropdown icon) */}
        <li className="menu-item has-submenu">
          <div className="menu-link">
            <Layers className="icon" />
            <span>Attributes</span>
            <ChevronDown className="chevron" />
          </div>
        </li>
        <ul className="submenu">
          <li>
            <NavLink
              to="/brand"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              <Tag className="submenu-icon" />
              <span>Brand</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/maintype"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              <Grid className="submenu-icon" />
              <span>Main Type</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/subtype"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              <Boxes className="submenu-icon" />
              <span>Sub Type</span>
            </NavLink>
          </li>
        </ul>

        {/* Stock Report */}
        <li>
          <NavLink
            to="/stock-report"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            <FileText className="icon" />
            <span>Stock Report</span>
          </NavLink>
        </li>

        {/* Orders */}
        <li>
          <NavLink
            to="/orders"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            <ShoppingCart className="icon" />
            <span>Orders</span>
          </NavLink>
        </li>

        {/* List Orders */}
        <li>
          <NavLink
            to="/list-orders"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            <List className="icon" />
            <span>List Orders</span>
          </NavLink>
        </li>
      </ul>
    </aside>
  );
};

export default Rentalsidebar;
