import React, { useEffect, useState } from "react";
import {
  Users,
  FileText,
  ShoppingCart,
  Tag,
  Grid,
  Boxes,
  LayoutDashboard,
  List,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Warehouse,
  AlertTriangle,
  Wrench,
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

  const navLinkClass = ({ isActive }) =>
    [
      "group relative flex items-center gap-3 rounded-xl transition-all duration-200 outline-none",
      "focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
      collapsed ? "justify-center px-2 py-2.5" : "px-2.5 py-2",
      isActive
        ? "bg-gradient-to-r from-amber-100/90 via-amber-50/80 to-transparent text-amber-950 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.35)] before:absolute before:left-0 before:top-1/2 before:h-[60%] before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-gradient-to-b before:from-amber-400 before:to-amber-600"
        : "text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_4px_14px_-8px_rgba(15,23,42,0.12)]",
    ].join(" ");

  const iconWrapClass = (isActive) =>
    [
      "flex shrink-0 items-center justify-center rounded-lg transition-all duration-200",
      collapsed ? "h-10 w-10" : "h-9 w-9",
      isActive
        ? "bg-white/90 text-amber-700 shadow-sm ring-1 ring-amber-200/70"
        : "bg-slate-100/90 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] group-hover:bg-amber-50 group-hover:text-amber-700 group-hover:ring-1 group-hover:ring-amber-100",
    ].join(" ");

  const iconSize = collapsed ? "h-[18px] w-[18px]" : "h-[17px] w-[17px]";

  const NavItem = ({ to, end, title, Icon, children }) => (
    <li>
      <NavLink
        end={end}
        to={to}
        title={title}
        className={navLinkClass}
      >
        {({ isActive }) => (
          <>
            <span className={iconWrapClass(isActive)}>
              <Icon className={iconSize} strokeWidth={isActive ? 2.25 : 2} />
            </span>
            {!collapsed && (
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium tracking-tight">
                {children}
              </span>
            )}
            {!collapsed && isActive && (
              <ChevronRight className="h-4 w-4 shrink-0 text-amber-600/70" aria-hidden />
            )}
          </>
        )}
      </NavLink>
    </li>
  );

  return (
    <aside
      className={
        "relative flex h-screen shrink-0 flex-col overflow-hidden border-r border-slate-200/90 bg-gradient-to-b from-slate-50 via-white to-amber-50/[0.35] shadow-[6px_0_32px_-18px_rgba(15,23,42,0.18)] transition-[width] duration-300 ease-out " +
        (collapsed ? "w-[4.75rem]" : "w-[17rem]")
      }
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_-10%,rgba(251,191,36,0.09),transparent_50%),radial-gradient(80%_50%_at_100%_100%,rgba(148,163,184,0.06),transparent_45%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-amber-100/[0.12] to-transparent" aria-hidden />

      <div
        className={
          "relative z-[1] flex shrink-0 items-center gap-3 border-b border-slate-200/70 bg-white/75 px-3 py-3 backdrop-blur-md " +
          (collapsed ? "flex-col justify-center pb-4 pt-4" : "justify-between")
        }
      >
        {!collapsed && (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-lg shadow-amber-500/25 ring-2 ring-white/80">
              <Warehouse className="h-5 w-5 text-white drop-shadow-sm" strokeWidth={2} />
              <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="truncate bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-base font-bold tracking-tight text-transparent">
                Rentals
              </h2>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="relative mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20 ring-1 ring-white/50">
            <Warehouse className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          className={
            "z-[1] rounded-xl border border-slate-200/90 bg-white/95 p-2 text-slate-600 shadow-sm backdrop-blur-sm transition hover:border-amber-300/60 hover:bg-amber-50 hover:text-amber-800 hover:shadow-md active:scale-[0.97] " +
            (collapsed ? "mt-1" : "")
          }
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" strokeWidth={2} />
          ) : (
            <PanelLeftClose className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
      </div>

      <nav className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden">
        <ul className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2.5 py-3 pb-6 [scrollbar-color:rgba(148,163,184,0.5)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80 [&::-webkit-scrollbar-track]:bg-transparent">
          <NavItem end to="/irl-dashboard" title="Dashboard" Icon={LayoutDashboard}>
            Dashboard
          </NavItem>
          <NavItem to="/rental-dashboard" title="Customers" Icon={Users}>
            Customers
          </NavItem>

          {!collapsed && (
            <ul className="ml-1 space-y-0.5 border-l border-amber-200/40 pl-2.5 pt-0.5">
              <NavItem to="/brand" title="Brand" Icon={Tag}>
                Brand
              </NavItem>
              <NavItem to="/maintype" title="Main Type" Icon={Grid}>
                Main Type
              </NavItem>
              <NavItem to="/subtype" title="Sub Type" Icon={Boxes}>
                Sub Type
              </NavItem>
            </ul>
          )}

          {collapsed && (
            <>
              <NavItem to="/brand" title="Brand" Icon={Tag} />
              <NavItem to="/maintype" title="Main Type" Icon={Grid} />
              <NavItem to="/subtype" title="Sub Type" Icon={Boxes} />
            </>
          )}

          <NavItem to="/stock-report" title="Stock Report" Icon={FileText}>
            Stock Report
          </NavItem>
          <NavItem to="/damage-report" title="Damage report" Icon={AlertTriangle}>
            Damage report
          </NavItem>
          <NavItem to="/repaired-report" title="Repaired report" Icon={Wrench}>
            Repaired report
          </NavItem>
          <NavItem to="/orders" title="Orders" Icon={ShoppingCart}>
            Orders
          </NavItem>
          <NavItem to="/list-orders" title="List Orders" Icon={List}>
            List Orders
          </NavItem>

          <NavItem to="/analytics/customers" title="Customer analytics" Icon={Users}>
            Customer analytics
          </NavItem>
          <NavItem to="/analytics/orders" title="Order analytics" Icon={ShoppingCart}>
            Order analytics
          </NavItem>
        </ul>

        <div
          className="h-1 shrink-0 bg-gradient-to-r from-transparent via-amber-400/35 to-transparent"
          aria-hidden
        />
      </nav>
    </aside>
  );
};

export default Rentalsidebar;
