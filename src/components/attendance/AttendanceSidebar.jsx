import React, { useEffect, useState } from "react";
import {
    LayoutDashboard,
    CheckSquare,
    Banknote,
    ChevronDown
} from "lucide-react";
import { NavLink } from "react-router-dom";

const AttendanceSidebar = () => {
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("attendanceSidebarCollapsed");
        if (saved) setCollapsed(saved === "true");
    }, []);

    const toggle = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem("attendanceSidebarCollapsed", String(next));
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
                        HR Panel
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
                <li className="py-2">
                    <NavLink
                        to="/attendance"
                        end
                        className={({ isActive }) =>
                            `${linkBase} ${isActive ? activeBase : ""}`
                        }
                        title="Dashboard"
                    >
                        <LayoutDashboard className={iconCls} />
                        {!collapsed && <span>Dashboard</span>}
                    </NavLink>
                </li>

                <li className="py-2">
                    <NavLink
                        to="/attendance/sites"
                        className={({ isActive }) =>
                            `${linkBase} ${isActive ? activeBase : ""}`
                        }
                        title="Attendance"
                    >
                        <CheckSquare className={iconCls} />
                        {!collapsed && <span>Attendance</span>}
                    </NavLink>
                </li>

                <li className="py-2">
                    <NavLink
                        to="/attendance/payroll"
                        className={({ isActive }) =>
                            `${linkBase} ${isActive ? activeBase : ""}`
                        }
                        title="Payroll"
                    >
                        <Banknote className={iconCls} />
                        {!collapsed && <span>Payroll</span>}
                    </NavLink>
                </li>
            </ul>
        </aside>
    );
};

export default AttendanceSidebar;
