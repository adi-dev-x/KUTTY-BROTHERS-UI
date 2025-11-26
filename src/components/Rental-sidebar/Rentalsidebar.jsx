import React, { useEffect, useState } from "react";
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
  Home,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const Rentalsidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("rentalSidebarCollapsed");
    if (saved) setCollapsed(saved === "true");
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("rentalSidebarCollapsed", String(next));
  };

  const linkBase =
    "group flex items-center gap-3 rounded-xl px-4 py-3 text-gray-600 transition-all duration-300 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-yellow-100/50 hover:text-yellow-600 hover:shadow-sm hover:translate-x-1";
  const activeBase = "bg-gradient-to-r from-yellow-50 to-yellow-100/50 text-yellow-600 font-semibold shadow-md border-l-4 border-yellow-600";
  const iconCls = collapsed ? "h-6 w-6 transition-transform group-hover:scale-110" : "h-5 w-5 transition-transform group-hover:scale-110";

  return (
    <aside
      className={
        "relative h-screen overflow-y-auto bg-gradient-to-b from-white to-gray-50/50 p-5 text-gray-800 shadow-2xl transition-all duration-300 border-r border-gray-200/50 backdrop-blur-sm " +
        (collapsed ? "w-20" : "w-64")
      }
    >
      <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
        {!collapsed && (
          <h2 className="bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-lg font-bold tracking-tight text-transparent">
            Rental Panel
          </h2>
        )}
        <button
          onClick={toggle}
          className="rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 p-2 text-yellow-600 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-110 active:scale-95"
          aria-label="Toggle sidebar"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <ChevronDown className={"h-4 w-4 transition-transform duration-300 " + (collapsed ? "-rotate-90" : "rotate-0")} />
        </button>
      </div>

      <ul className="space-y-1.5 pb-24">
        <li>
          <NavLink
            to="/irl-dashboard"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? activeBase : ""}`
            }
            title="Dashboard"
          >
            <LayoutDashboard className={iconCls} />
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/rental-dashboard"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? activeBase : ""}`
            }
            title="Customers"
          >
            <Users className={iconCls} />
            {!collapsed && <span>Customers</span>}
          </NavLink>
        </li>

        <li>
          <div className={linkBase} title="Attributes">
            <Layers className={iconCls} />
            {!collapsed && <span className="flex-1">Attributes</span>}
            {!collapsed && <ChevronDown className="h-4 w-4 opacity-80" />}
          </div>
        </li>
        {/* Submenu */}
        {!collapsed && (
          <ul className="ml-6 space-y-1">
            <li>
              <NavLink
                to="/brand"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? activeBase : ""}`
                }
              >
                <Tag className={iconCls} />
                <span>Brand</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/maintype"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? activeBase : ""}`
                }
              >
                <Grid className={iconCls} />
                <span>Main Type</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/subtype"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? activeBase : ""}`
                }
              >
                <Boxes className={iconCls} />
                <span>Sub Type</span>
              </NavLink>
            </li>
          </ul>
        )}

        <li>
          <NavLink
            to="/stock-report"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? activeBase : ""}`
            }
            title="Stock Report"
          >
            <FileText className={iconCls} />
            {!collapsed && <span>Stock Report</span>}
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? activeBase : ""}`
            }
            title="Orders"
          >
            <ShoppingCart className={iconCls} />
            {!collapsed && <span>Orders</span>}
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/list-orders"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? activeBase : ""}`
            }
            title="List Orders"
          >
            <List className={iconCls} />
            {!collapsed && <span>List Orders</span>}
          </NavLink>
        </li>
      </ul>

      {/* Homepage Button at Bottom */}
      <div className="absolute bottom-20 left-0 right-0 px-5">
        <NavLink
          to="/"
          className="group flex items-center justify-center gap-3 rounded-xl border-2 border-yellow-600 bg-white px-4 py-3 text-yellow-600 shadow-md transition-all duration-300 hover:bg-yellow-600 hover:text-white hover:shadow-lg hover:scale-105 active:scale-95"
        >
          <Home className={collapsed ? "h-6 w-6" : "h-5 w-5"} />
          {!collapsed && <span className="font-semibold">Home</span>}
        </NavLink>
      </div>
    </aside>
  );
};

export default Rentalsidebar;
