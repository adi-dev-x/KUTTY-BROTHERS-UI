import React, { useState, useEffect } from 'react';
import Header from "../header/Header";
import Footer from "../footer/Footer";
import AttendanceSidebar from "./AttendanceSidebar";
import { database } from "../../firebase";
import { ref, onValue, set } from "firebase/database";
import { Users, Building, Search, Banknote, Calendar, CheckCircle, ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const getTodayMonth = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
};

const PayrollInfo = ({ onLogout, isAllEmployees }) => {
    const { id: siteId } = useParams();
    const navigate = useNavigate();

    const [sitesData, setSitesData] = useState({});
    const [allEmployees, setAllEmployees] = useState([]);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSiteFilter, setSelectedSiteFilter] = useState("ALL");
    const [selectedMonth, setSelectedMonth] = useState(getTodayMonth());

    useEffect(() => {
        if (isAllEmployees) {
            setSelectedSiteFilter("ALL");
        } else if (siteId) {
            setSelectedSiteFilter(siteId);
        }
    }, [isAllEmployees, siteId]);

    // Data Maps
    const [attendanceData, setAttendanceData] = useState({});
    const [payrollData, setPayrollData] = useState({});

    // Payment Modal
    const [paymentModal, setPaymentModal] = useState({ isOpen: false, emp: null, amount: "", note: "" });

    useEffect(() => {
        // Fetch Sites & Employees
        const sitesRef = ref(database, 'sites');
        const unsubscribe = onValue(sitesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setSitesData(data);
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
        // Fetch Attendance for the selected month to calculate working days
        const attRef = ref(database, 'attendance');
        const unsubscribeAtt = onValue(attRef, (snapshot) => {
            setAttendanceData(snapshot.val() || {});
        });

        // Fetch Payroll for the selected month
        const payRef = ref(database, `payroll/${selectedMonth}`);
        const unsubscribePay = onValue(payRef, (snapshot) => {
            setPayrollData(snapshot.val() || {});
        });

        return () => {
            unsubscribeAtt();
            unsubscribePay();
        };
    }, [selectedMonth]);


    const calculateWorkedDays = (siteId, empId) => {
        let daysPresent = 0;
        let halfDays = 0;

        if (attendanceData[siteId]) {
            Object.keys(attendanceData[siteId]).forEach(dateStr => {
                if (dateStr.startsWith(selectedMonth)) {
                    const record = attendanceData[siteId][dateStr][empId];
                    if (record) {
                        const status = typeof record === 'string' ? record : record.status;
                        if (["Present", "Checked In", "Checked Out"].includes(status)) {
                            daysPresent++;
                        } else if (status === "Half Day") {
                            halfDays++;
                        }
                    }
                }
            });
        }
        return daysPresent + (halfDays * 0.5);
    };

    const handleOpenPaymentModal = (emp) => {
        const workedDays = calculateWorkedDays(emp.siteId, emp.id);
        const baseSalary = parseFloat(emp.salaryAmount) || 0;

        // Suggest a calculated amount (Base Salary / 30 days * worked days) or just default to Base Salary if it's 0 days yet they want to pay.
        // Let's just default to the employee's standard salary amount but let the user decide
        let suggestedAmount = baseSalary;
        if (workedDays > 0 && baseSalary > 0) {
            // Rough per-day calculation just for suggestion, user can overwrite
            // suggestedAmount = Math.round((baseSalary / 30) * workedDays); 
            // We'll just pre-fill their standard full salary for convenience 
        }

        setPaymentModal({
            isOpen: true,
            emp,
            amount: emp.salaryAmount || "",
            note: ""
        });
    };

    const handleConfirmPayment = async () => {
        if (!paymentModal.amount || isNaN(paymentModal.amount)) {
            return alert("Please enter a valid payment amount.");
        }

        try {
            const { emp, amount, note } = paymentModal;
            const payRef = ref(database, `payroll/${selectedMonth}/${emp.siteId}/${emp.id}`);

            await set(payRef, {
                amountPaid: parseFloat(amount),
                datePaid: new Date().toISOString(),
                note: note || "",
                status: "Paid"
            });

            setPaymentModal({ isOpen: false, emp: null, amount: "", note: "" });
        } catch (error) {
            console.error("Payment failed", error);
            alert("Failed to record payment.");
        }
    };


    const filteredEmployees = allEmployees.filter(emp => {
        if (selectedSiteFilter !== "ALL" && emp.siteId !== selectedSiteFilter) return false;

        const query = searchQuery.toLowerCase();
        const sName = String(emp.name || "").toLowerCase();
        const sDesig = String(emp.designation || "").toLowerCase();
        return sName.includes(query) || sDesig.includes(query);
    });

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
            <Header onLogout={onLogout} />

            <div className="flex flex-1 overflow-hidden">
                <AttendanceSidebar />

                <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">

                        <div className="mb-8">
                            <button
                                onClick={() => navigate('/attendance/sites')}
                                className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" /> Back to Attendance Options
                            </button>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                        <Banknote className="h-8 w-8 text-green-600" />
                                        {siteId && sitesData[siteId] ? `${sitesData[siteId].name} Payroll` : 'Payroll Management'}
                                    </h1>
                                    <p className="mt-2 text-sm text-gray-600">
                                        Process salaries and view payment history.
                                    </p>
                                </div>

                                <div className="relative w-full sm:w-64">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                        <Calendar className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="month"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="block w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm font-semibold text-gray-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all bg-white shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sites Filter Carousel (Only visible on All Employees) */}
                        {isAllEmployees && (
                            <div className="mb-8">
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Filter by Site</h2>
                                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbars -mx-4 px-4 sm:mx-0 sm:px-0">
                                    <button
                                        onClick={() => setSelectedSiteFilter('ALL')}
                                        className={`flex min-w-[160px] flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center transition-all ${selectedSiteFilter === 'ALL'
                                            ? 'bg-gradient-to-br from-green-600 to-green-500 text-white shadow-lg shadow-green-600/30 ring-1 ring-green-700'
                                            : 'bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 hover:-translate-y-1'
                                            }`}
                                    >
                                        <Users className={`h-8 w-8 ${selectedSiteFilter === 'ALL' ? 'text-green-100' : 'text-gray-400'}`} />
                                        <span className="font-bold text-sm">All Employees</span>
                                    </button>

                                    {Object.keys(sitesData).map(siteId => (
                                        <button
                                            key={siteId}
                                            onClick={() => setSelectedSiteFilter(siteId)}
                                            className={`flex min-w-[180px] flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center transition-all ${selectedSiteFilter === siteId
                                                ? 'bg-gradient-to-br from-green-600 to-green-500 text-white shadow-lg shadow-green-600/30 ring-1 ring-green-700'
                                                : 'bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 hover:-translate-y-1'
                                                }`}
                                        >
                                            <Building className={`h-8 w-8 ${selectedSiteFilter === siteId ? 'text-green-100' : 'text-gray-400'}`} />
                                            <span className="font-bold text-sm line-clamp-2">{sitesData[siteId].name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Search Bar */}
                        <div className="mb-6 relative w-full sm:max-w-md">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search employees by name or designation..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all bg-white shadow-sm"
                            />
                        </div>

                        {/* Payroll Table */}
                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Base Salary</th>
                                            <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Mth Attendance</th>
                                            <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Status & Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {filteredEmployees.length > 0 ? (
                                            filteredEmployees.map((emp) => {
                                                const workedDays = calculateWorkedDays(emp.siteId, emp.id);
                                                const payRecord = payrollData[emp.siteId]?.[emp.id];
                                                const isPaid = !!payRecord;

                                                return (
                                                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col border-l-4 border-green-500 pl-3">
                                                                <span className="text-sm font-bold text-gray-900">{emp.name}</span>
                                                                <span className="text-xs text-gray-500 mt-1">{emp.designation || "No Designation"} • {emp.siteName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-gray-900">₹{emp.salaryAmount || "0"}</span>
                                                                <span className="text-xs text-gray-500 mt-1">Date: {emp.salaryDate || "N/A"}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                                {workedDays} Days
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            {isPaid ? (
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <span className="inline-flex items-center gap-1 text-sm font-bold text-green-600">
                                                                        <CheckCircle className="h-4 w-4" /> Paid ₹{payRecord.amountPaid}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        {new Date(payRecord.datePaid).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleOpenPaymentModal(emp)}
                                                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition shadow-sm"
                                                                >
                                                                    Process Pay
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-16 text-center">
                                                    <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                                    <h3 className="text-lg font-bold text-gray-900">No employees found</h3>
                                                    <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                                                        Try adjusting your search or site filter.
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
            </div>

            {/* Payment Modal */}
            {paymentModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative mt-[-10vh]">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Process Payroll</h3>
                        <p className="text-sm text-gray-500 mb-6 border-b pb-4">
                            Processing payment for <span className="font-bold text-gray-900">{paymentModal.emp?.name}</span> for {selectedMonth}.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Payment Amount (₹)</label>
                                <input
                                    type="number"
                                    value={paymentModal.amount}
                                    onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 py-3 px-4 text-sm font-bold text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-gray-50"
                                    min="0"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Base Salary: ₹{paymentModal.emp?.salaryAmount || 0} | Days Worked: {calculateWorkedDays(paymentModal.emp?.siteId, paymentModal.emp?.id)}
                                </p>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Notes (Optional)</label>
                                <input
                                    type="text"
                                    value={paymentModal.note}
                                    onChange={(e) => setPaymentModal({ ...paymentModal, note: e.target.value })}
                                    placeholder="e.g. Include bonus or deductions..."
                                    className="w-full rounded-xl border border-gray-200 py-3 px-4 text-sm text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setPaymentModal({ isOpen: false, emp: null, amount: "", note: "" })}
                                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmPayment}
                                className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 transition shadow-sm"
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbars::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbars {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />

            <Footer />
        </div>
    );
};

export default PayrollInfo;
