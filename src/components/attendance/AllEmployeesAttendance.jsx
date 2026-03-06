import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import { database } from "../../firebase";
import { ref, get, set, onValue } from "firebase/database";
import { Users, ArrowLeft, Search, Calendar, CheckSquare, Filter } from "lucide-react";

// Get today's date in YYYY-MM-DD format as default
const getToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const AllEmployeesAttendance = ({ onLogout }) => {
    const navigate = useNavigate();

    const [allEmployees, setAllEmployees] = useState([]);
    const [sitesData, setSitesData] = useState({});

    // Filters and search
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSiteFilter, setSelectedSiteFilter] = useState("ALL");
    const [selectedDate, setSelectedDate] = useState(getToday());

    const [attendanceRecords, setAttendanceRecords] = useState({}); // { [siteId]: { [empId]: status } }

    useEffect(() => {
        // Fetch All Sites and Employees
        const sitesRef = ref(database, `sites`);
        const unsubscribe = onValue(sitesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setSitesData(data); // store sites directly for name mapping

                const globalEmpList = [];
                Object.keys(data).forEach(siteId => {
                    const siteObj = data[siteId];
                    if (siteObj.employees) {
                        Object.keys(siteObj.employees).forEach(empId => {
                            globalEmpList.push({
                                ...siteObj.employees[empId],
                                id: empId,
                                siteId: siteId,
                                siteName: siteObj.name
                            });
                        });
                    }
                });

                globalEmpList.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
                setAllEmployees(globalEmpList);
            } else {
                setAllEmployees([]);
                setSitesData({});
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Fetch Attendance across all sites for the selected date
        if (!selectedDate) return;

        const mainAttendanceRef = ref(database, `attendance`);
        const unsubscribe = onValue(mainAttendanceRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // data format: { siteId: { date: { empId: status } } }
                const formattedRecords = {};
                Object.keys(data).forEach(siteId => {
                    if (data[siteId] && data[siteId][selectedDate]) {
                        formattedRecords[siteId] = data[siteId][selectedDate];
                    }
                });
                setAttendanceRecords(formattedRecords);
            } else {
                setAttendanceRecords({});
            }
        });

        return () => unsubscribe();
    }, [selectedDate]);

    const handleMarkAttendance = async (siteId, empId, status) => {
        try {
            const attendanceRef = ref(database, `attendance/${siteId}/${selectedDate}/${empId}`);

            const currentStatus = attendanceRecords[siteId] ? attendanceRecords[siteId][empId] : null;
            if (currentStatus === status) {
                await set(attendanceRef, null); // toggle off
            } else {
                await set(attendanceRef, status);
            }
        } catch (error) {
            console.error("Error marking attendance:", error);
            alert("Failed to mark attendance.");
        }
    };

    // Filter employees
    const filteredEmployees = allEmployees.filter(emp => {
        // Site filter
        if (selectedSiteFilter !== "ALL" && emp.siteId !== selectedSiteFilter) {
            return false;
        }

        // Search query
        const query = searchQuery.toLowerCase();
        const safeName = emp.name ? String(emp.name).toLowerCase() : "";
        const safeDesignation = emp.designation ? String(emp.designation).toLowerCase() : "";

        return safeName.includes(query) || safeDesignation.includes(query);
    });

    const getStatusClasses = (siteId, empId, status) => {
        const currentStatus = attendanceRecords[siteId] ? attendanceRecords[siteId][empId] : null;
        const isSelected = currentStatus === status;
        const baseClasses = "flex-1 rounded-lg py-1.5 text-xs sm:text-sm font-semibold transition-all border outline-none";

        if (!isSelected) return `${baseClasses} border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300`;

        if (status === "Present") return `${baseClasses} bg-green-500 text-white border-green-500 shadow-md shadow-green-500/20`;
        if (status === "Absent") return `${baseClasses} bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20`;
        if (status === "Half Day") return `${baseClasses} bg-yellow-500 text-white border-yellow-500 shadow-md shadow-yellow-500/20`;
        return baseClasses;
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
            <Header onLogout={onLogout} />

            <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8">
                        <button
                            onClick={() => navigate('/attendance')}
                            className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Attendance Options
                        </button>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                    <Users className="h-8 w-8 text-yellow-600" />
                                    All Employees Attendance
                                </h1>
                                <p className="mt-2 text-sm text-gray-600">
                                    View and manage attendance across all sites globally.
                                </p>
                            </div>
                        </div>

                        {/* Filters Row */}
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            {/* Search */}
                            <div className="relative w-full">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm placeholder-gray-400 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 transition-all bg-gray-50"
                                />
                            </div>

                            {/* Site Filter */}
                            <div className="relative w-full">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <Filter className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    value={selectedSiteFilter}
                                    onChange={(e) => setSelectedSiteFilter(e.target.value)}
                                    className="block w-full rounded-xl border border-gray-200 py-3 pl-11 pr-10 text-sm placeholder-gray-400 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 transition-all bg-gray-50 appearance-none text-gray-900 font-medium"
                                >
                                    <option value="ALL">All Sites</option>
                                    {Object.keys(sitesData).map(siteId => (
                                        <option key={siteId} value={siteId}>
                                            {sitesData[siteId].name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Picker */}
                            <div className="relative w-full">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="block w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 transition-all bg-gray-50 text-gray-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Employee Global Attendance Table */}
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Site Info</th>
                                        <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Mark Attendance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {filteredEmployees.length > 0 ? (
                                        filteredEmployees.map((emp) => (
                                            <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col border-l-4 border-yellow-500 pl-3">
                                                        <span className="text-sm font-bold text-gray-900">{emp.name}</span>
                                                        <span className="text-xs text-gray-500 mt-1">{emp.designation || "No Designation"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                        {emp.siteName}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2 max-w-sm mx-auto min-w-[200px]">
                                                        <button
                                                            onClick={() => handleMarkAttendance(emp.siteId, emp.id, "Present")}
                                                            className={getStatusClasses(emp.siteId, emp.id, "Present")}
                                                        >
                                                            Present
                                                        </button>
                                                        <button
                                                            onClick={() => handleMarkAttendance(emp.siteId, emp.id, "Half Day")}
                                                            className={getStatusClasses(emp.siteId, emp.id, "Half Day")}
                                                        >
                                                            Half Day
                                                        </button>
                                                        <button
                                                            onClick={() => handleMarkAttendance(emp.siteId, emp.id, "Absent")}
                                                            className={getStatusClasses(emp.siteId, emp.id, "Absent")}
                                                        >
                                                            Absent
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-16 text-center">
                                                <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                                <h3 className="text-lg font-bold text-gray-900">No employees found</h3>
                                                <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                                                    We couldn't find any employees matching your current search or filter criteria.
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AllEmployeesAttendance;
