import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import AttendanceSidebar from "./AttendanceSidebar";
import { database } from "../../firebase";
import { ref, onValue } from "firebase/database";
import { Users, CheckCircle, XCircle, Clock } from "lucide-react";

// Get today's date in YYYY-MM-DD format as default
const getToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const AttendanceDashboard = ({ onLogout }) => {
    const [stats, setStats] = useState({
        total: 0,
        present: 0,
        absent: 0,
        halfDay: 0
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = () => {
            const today = getToday();
            let expectedTotal = 0;

            // 1. Fetch total employees count across all sites
            const sitesRef = ref(database, 'sites');
            onValue(sitesRef, (sitesSnapshot) => {
                const sitesData = sitesSnapshot.val();
                if (sitesData) {
                    Object.keys(sitesData).forEach(siteId => {
                        const site = sitesData[siteId];
                        if (site.employees) {
                            expectedTotal += Object.keys(site.employees).length;
                        }
                    });
                }

                // 2. Fetch today's attendance records
                const attendanceRef = ref(database, `attendance`);
                onValue(attendanceRef, (attendanceSnapshot) => {
                    const attData = attendanceSnapshot.val();
                    let checkedInCount = 0;
                    let checkedOutCount = 0;

                    if (attData) {
                        Object.keys(attData).forEach(siteId => {
                            if (attData[siteId] && attData[siteId][today]) {
                                const siteTodayAtt = attData[siteId][today];
                                Object.keys(siteTodayAtt).forEach(empId => {
                                    const raw = siteTodayAtt[empId];
                                    const status = typeof raw === 'string' ? raw : (raw?.status || "");

                                    if (status === "Checked In") checkedInCount++;
                                    else if (status === "Checked Out") checkedOutCount++;
                                });
                            }
                        });
                    }

                    setStats({
                        total: expectedTotal,
                        present: checkedInCount,
                        absent: 0,
                        halfDay: checkedOutCount
                    });
                    setIsLoading(false);
                });
            });
        };

        fetchDashboardData();
    }, []);

    const StatCard = ({ title, value, icon: Icon, colorClass, subText }) => (
        <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${colorClass}`}></div>
            <div className="relative flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="mt-2 text-3xl font-bold text-gray-900">{value}</h3>
                    {subText && (
                        <div className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-500">
                            <span>{subText}</span>
                        </div>
                    )}
                </div>
                <div className={`rounded-xl p-3 ${colorClass} bg-opacity-10 text-white`}>
                    <Icon className={`h-6 w-6 ${colorClass.replace("bg-", "text-")}`} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
            <Header onLogout={onLogout} />

            <div className="flex flex-1 overflow-hidden">
                <AttendanceSidebar />

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl space-y-8">
                        {/* Header Section */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Attendance & Payroll Dashboard</h1>
                                <p className="text-sm text-gray-500">Overview of today's attendance ({new Date().toLocaleDateString()})</p>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        {isLoading ? (
                            <div className="flex items-center justify-center p-12">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-600 border-t-transparent"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                <StatCard
                                    title="Total Employees"
                                    value={stats.total}
                                    icon={Users}
                                    colorClass="bg-blue-600"
                                    subText="Across all sites"
                                />
                                <StatCard
                                    title="Checked In"
                                    value={stats.present}
                                    icon={CheckCircle}
                                    colorClass="bg-green-600"
                                    subText="Currently on site"
                                />
                                <StatCard
                                    title="Checked Out"
                                    value={stats.halfDay}
                                    icon={Clock}
                                    colorClass="bg-yellow-600"
                                    subText="Completed shift"
                                />
                                <StatCard
                                    title="Not Checked In"
                                    value={stats.total - stats.present - stats.halfDay}
                                    icon={XCircle}
                                    colorClass="bg-red-600"
                                    subText={`Absent or unrecorded`}
                                />
                            </div>
                        )}

                        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Payroll Notes</h3>
                            <p className="text-gray-600 text-sm">
                                Payroll features and integrations flow into this dashboard. Please verify attendance before running monthly payroll calculations.
                            </p>
                        </div>
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    );
};

export default AttendanceDashboard;
