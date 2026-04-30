import React, { useState, useEffect } from "react";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import axios from "axios";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

const thClass =
  "whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600";

const ListOrders = ({ onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchContact, setSearchContact] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  const [showExcelPopup, setShowExcelPopup] = useState(false);
  const [excelStatus, setExcelStatus] = useState("");
  const [excelDays, setExcelDays] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          "https://ems.binlaundry.com/irrl/genericApiJoin/listAllOrders"
        );
        const data = res.data?.data || [];
        setOrders(data);
        setFilteredOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleDownloadExcel = async () => {
    try {
      const response = await axios.get(
        "https://ems.binlaundry.com/irrl/reports/delivery",
        {
          params: {
            date_range: excelDays || "",
            remark: excelStatus || "",
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "delivery_report.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowExcelPopup(false);
    } catch (err) {
      console.error("Error downloading Excel:", err);
    }
  };

  const handleFilter = () => {
    const filtered = orders.filter(
      (o) =>
        (o.contact_name || "").toLowerCase().includes(searchContact.toLowerCase()) &&
        (statusFilter === "" || (o.status || "").toLowerCase() === statusFilter.toLowerCase())
    );
    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredOrders.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

  const getPageNumbers = () => {
    const maxVisible = 9;
    let start = Math.max(currentPage - Math.floor(maxVisible / 2), 1);
    let end = start + maxVisible - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(end - maxVisible + 1, 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const selectCompact =
    "rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500/25";

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(251,191,36,0.08),transparent)]"
        aria-hidden
      />
      <Header onLogout={onLogout} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <Rentalsidebar />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3">
            <div className="shrink-0 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="px-3 py-1.5">
                <h1 className="text-sm font-semibold text-slate-900">List orders</h1>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-1.5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                  <span className="tabular-nums">
                    <span className="text-slate-400">Loaded rows</span>{" "}
                    <span className="font-semibold text-slate-900">{orders.length}</span>
                  </span>
                  <span className="tabular-nums">
                    <span className="text-slate-400">Result set</span>{" "}
                    <span className="font-semibold text-slate-900">{filteredOrders.length}</span>
                  </span>
                  <span className="tabular-nums">
                    <span className="text-slate-400">Pages</span>{" "}
                    <span className="font-semibold text-slate-900">{Math.max(1, totalPages)}</span>
                  </span>
                </div>
                <div className="relative min-w-[min(100%,8rem)] flex-1 basis-[7rem]">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Contact…"
                    value={searchContact}
                    onChange={(e) => setSearchContact(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 py-1 pl-7 pr-2 text-[11px] text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500/25"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`${selectCompact} min-w-[7rem]`}
                >
                  <option value="">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="RENTED">Rented</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="INITIATED">Initiated</option>
                  <option value="RESERVED">Reserved</option>
                </select>
                <button
                  type="button"
                  onClick={handleFilter}
                  className="rounded-md bg-amber-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-amber-700"
                >
                  Apply
                </button>
                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowExcelPopup(true)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-3 w-3" />
                    Delivery report
                  </button>
                </div>
              </div>
            </div>

            {showExcelPopup && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
                  <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 px-6 py-5">
                    <h3 className="text-lg font-bold text-slate-900">Download delivery report</h3>
                    <p className="mt-1 text-sm text-slate-600">Choose range and status for the export.</p>
                  </div>
                  <div className="space-y-4 p-6">
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date range</span>
                      <select
                        value={excelDays}
                        onChange={(e) => setExcelDays(e.target.value)}
                        className={`${selectCompact} mt-1.5 w-full py-2 px-3 text-sm`}
                      >
                        <option value="">Select…</option>
                        <option value="7 days">7 days</option>
                        <option value="14 days">14 days</option>
                        <option value="21 days">21 days</option>
                        <option value="30 days">1 month</option>
                        <option value="180 days">6 months</option>
                        <option value="365 days">1 year</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                      <select
                        value={excelStatus}
                        onChange={(e) => setExcelStatus(e.target.value)}
                        className={`${selectCompact} mt-1.5 w-full py-2 px-3 text-sm`}
                      >
                        <option value="">Select…</option>
                        <option value="PENDING">Pending</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="BLOCKED">Blocked</option>
                        <option value="INITIATED">Initiated</option>
                        <option value="RESERVED">Reserved</option>
                      </select>
                    </label>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        onClick={() => setShowExcelPopup(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700"
                        onClick={handleDownloadExcel}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                <p className="mt-3 text-xs font-medium text-slate-500">Loading…</p>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="min-h-0 flex-1 overflow-auto">
                  <table className="min-w-full border-collapse divide-y divide-slate-100 text-xs [&_td]:border-r [&_td]:border-slate-200 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-200 [&_th:last-child]:border-r-0">
                      <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100">
                        <tr>
                          <th className={thClass}>#</th>
                          <th className={thClass}>Customer</th>
                          <th className={thClass}>Cust. ID</th>
                          <th className={thClass}>Contact</th>
                          <th className={thClass}>Phone</th>
                          <th className={thClass}>Address</th>
                          <th className={thClass}>Inventory</th>
                          <th className={thClass}>Item ID</th>
                          <th className={thClass}>Order ID</th>
                          <th className={thClass}>Gen. amt</th>
                          <th className={thClass}>Current</th>
                          <th className={thClass}>Rent</th>
                          <th className={thClass}>Placed</th>
                          <th className={thClass}>Returned</th>
                          <th className={thClass}>Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {currentRows.length === 0 ? (
                          <tr>
                            <td colSpan={15} className="px-6 py-16 text-center">
                              <div className="mx-auto max-w-sm">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                  <Search className="h-7 w-7" />
                                </div>
                                <p className="text-sm font-medium text-slate-900">No rows match</p>
                                <p className="mt-1 text-sm text-slate-500">Adjust filters and apply again.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          currentRows.map((o, i) => (
                            <tr
                              key={`${o.order_id}-${indexOfFirstRow + i}`}
                              className={`transition-colors hover:bg-amber-50/40 ${(indexOfFirstRow + i) % 2 === 1 ? "bg-slate-50/40" : ""}`}
                            >
                              <td className="whitespace-nowrap px-2 py-2 font-mono text-slate-500">{indexOfFirstRow + i + 1}</td>
                              <td className="max-w-[120px] truncate px-2 py-2 font-medium text-slate-900">{o.customer_name || "—"}</td>
                              <td className="whitespace-nowrap px-2 py-2 text-slate-700">{o.customer_id || "—"}</td>
                              <td className="whitespace-nowrap px-2 py-2 text-slate-700">{o.contact_name || "—"}</td>
                              <td className="whitespace-nowrap px-2 py-2 text-slate-700">{o.contact_number || "—"}</td>
                              <td className="max-w-[140px] truncate px-2 py-2 text-slate-600" title={o.shipping_address}>{o.shipping_address || "—"}</td>
                              <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-600">{o.inventory_id || "—"}</td>
                              <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-600">{o.item_id || "—"}</td>
                              <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] font-medium text-amber-800">{o.order_id || "—"}</td>
                              <td className="whitespace-nowrap px-2 py-2 tabular-nums text-slate-800">{o.generated_amount ?? "—"}</td>
                              <td className="whitespace-nowrap px-2 py-2 tabular-nums text-slate-800">{o.current_amount ?? "—"}</td>
                              <td className="whitespace-nowrap px-2 py-2 tabular-nums text-slate-800">{o.rent_amount ?? "—"}</td>
                              <td className="whitespace-nowrap px-2 py-2 text-[11px] text-slate-600">{o.placed_at ? new Date(o.placed_at).toLocaleDateString() : "—"}</td>
                              <td className="whitespace-nowrap px-2 py-2 text-[11px] text-slate-600">{o.returned_at ? new Date(o.returned_at).toLocaleDateString() : "—"}</td>
                              <td className="whitespace-nowrap px-2 py-2">
                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200/80">
                                  {o.status || "—"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/90 px-3 py-2">
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">{filteredOrders.length === 0 ? 0 : indexOfFirstRow + 1}</span>
                      –
                      <span className="font-semibold text-slate-900">{Math.min(indexOfLastRow, filteredOrders.length)}</span>
                      {" "}of{" "}
                      <span className="font-semibold text-slate-900">{filteredOrders.length}</span>
                    </p>
                    <nav className="flex items-center gap-0.5" aria-label="Pagination">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {getPageNumbers().map((page) => (
                        <button
                          type="button"
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[2rem] rounded-md px-2 py-1 text-xs font-semibold ${currentPage === page
                            ? "bg-amber-600 text-white"
                            : "text-slate-700 hover:bg-white"
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ListOrders;
