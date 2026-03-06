import React, { useState } from 'react';
import { X, Download, Calendar } from 'lucide-react';
import { ref, get } from "firebase/database";
import { database } from "../../firebase";

const DownloadAttendanceModal = ({ isOpen, onClose }) => {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [isDownloading, setIsDownloading] = useState(false);

    if (!isOpen) return null;

    const generateDatesList = (start, end) => {
        const dateArr = [];
        let currDate = new Date(start);
        const lastDate = new Date(end);

        while (currDate <= lastDate) {
            dateArr.push(new Date(currDate).toISOString().split('T')[0]);
            currDate.setDate(currDate.getDate() + 1);
        }
        return dateArr;
    };

    const handleDownload = async () => {
        if (!startDate || !endDate) return alert("Please select both dates");
        if (new Date(startDate) > new Date(endDate)) return alert("Start Date cannot be after End Date");

        setIsDownloading(true);
        try {
            // 1. Fetch all sites and employees
            const sitesRef = ref(database, 'sites');
            const sitesSnap = await get(sitesRef);
            const sitesData = sitesSnap.val() || {};

            // 2. Fetch all attendance
            const attendanceRef = ref(database, 'attendance');
            const attSnap = await get(attendanceRef);
            const attData = attSnap.val() || {};

            const dateList = generateDatesList(startDate, endDate);

            // Generate CSV content
            let csvContent = "Date,Site Name,Employee Name,Designation,Status,Check In Time,Check Out Time\n";

            dateList.forEach(date => {
                Object.keys(sitesData).forEach(siteId => {
                    const site = sitesData[siteId];
                    if (site.employees) {
                        Object.keys(site.employees).forEach(empId => {
                            const emp = site.employees[empId];

                            // Get status
                            let status = "Not Marked";
                            let inTime = "--";
                            let outTime = "--";

                            if (attData[siteId] && attData[siteId][date] && attData[siteId][date][empId]) {
                                const raw = attData[siteId][date][empId];
                                if (typeof raw === 'string') {
                                    status = raw;
                                } else {
                                    status = raw.status || "Not Marked";
                                    inTime = raw.checkInTime || "--";
                                    outTime = raw.checkOutTime || "--";
                                }
                            }

                            // Escape fields for CSV
                            const safeDate = date;
                            const safeSiteName = `"${(site.name || '').replace(/"/g, '""')}"`;
                            const safeEmpName = `"${(emp.name || '').replace(/"/g, '""')}"`;
                            const safeDesig = `"${(emp.designation || '').replace(/"/g, '""')}"`;
                            const safeStatus = `"${status}"`;
                            const safeIn = `"${inTime}"`;
                            const safeOut = `"${outTime}"`;

                            csvContent += `${safeDate},${safeSiteName},${safeEmpName},${safeDesig},${safeStatus},${safeIn},${safeOut}\n`;
                        });
                    }
                });
            });

            // Trigger download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `Attendance_Report_${startDate}_to_${endDate}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            onClose();
        } catch (error) {
            console.error("Download Error", error);
            alert("Failed to download report");
        }
        setIsDownloading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative mt-[-10vh]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Download Report</h3>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">From Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 py-3 pl-10 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">To Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 py-3 pl-10 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-yellow-600 py-3 text-sm font-semibold text-white hover:bg-yellow-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {isDownloading ? (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                Download CSV
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DownloadAttendanceModal;
