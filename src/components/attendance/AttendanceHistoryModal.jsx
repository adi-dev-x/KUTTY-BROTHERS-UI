import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Download } from 'lucide-react';
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase";

const AttendanceHistoryModal = ({ isOpen, onClose, empId, siteId, empName }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [monthFilter, setMonthFilter] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    useEffect(() => {
        if (!isOpen || !empId || !siteId) return;

        setLoading(true);
        const attRef = ref(database, `attendance/${siteId}`);
        const unsubscribe = onValue(attRef, (snapshot) => {
            const data = snapshot.val();
            const records = [];

            if (data) {
                // data is { dateStr: { empId: record } }
                Object.keys(data).forEach(dateStr => {
                    const empRecord = data[dateStr][empId];
                    if (empRecord) {
                        // match monthFilter
                        if (dateStr.startsWith(monthFilter)) {
                            records.push({
                                date: dateStr,
                                ...(typeof empRecord === 'string' ? { status: empRecord } : empRecord)
                            });
                        }
                    }
                });
            }

            // Sort by date descending
            records.sort((a, b) => new Date(b.date) - new Date(a.date));
            setHistory(records);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen, empId, siteId, monthFilter]);

    if (!isOpen) return null;

    const formatMsToHours = (ms) => {
        if (!ms) return "0h 0m";
        const totalSec = Math.floor(ms / 1000);
        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl relative flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-yellow-600" />
                            Attendance History
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Viewing records for <span className="font-bold text-gray-900">{empName}</span></p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-700">Filter Month:</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="month"
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                                className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                        </div>
                    ) : history.length > 0 ? (
                        <div className="space-y-4">
                            {history.map((record, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-yellow-200 hover:shadow-sm transition-all">
                                    <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                        <div className="bg-yellow-50 text-yellow-700 p-3 rounded-xl font-bold text-center min-w-[60px]">
                                            <div className="text-xs uppercase">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                            <div className="text-lg">{new Date(record.date).getDate()}</div>
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{record.status || 'Not Marked'}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                                <span>In: {record.checkInTime || '--'}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                <span>Out: {record.checkOutTime || '--'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span className="font-semibold text-gray-700 text-sm">
                                            {formatMsToHours(record.totalAccumulatedMs)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No records found</h3>
                            <p className="text-sm text-gray-500">No attendance data for the selected month.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceHistoryModal;
