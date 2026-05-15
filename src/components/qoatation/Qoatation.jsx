import React, { useState, useEffect, useMemo } from "react";
import {
  Download,
  Plus,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import * as XLSX from "xlsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import QoatationForm from "./QoatationForm";

const fieldSelect =
  "rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

const thClass =
  "whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600";


const Qoatation = ({ onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          "https://ems.binlaundry.com/irrl/quotation"
        );
        setOrders(response.data?.data || []);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleAddOrder = (newOrder) => {
    setOrders([...orders, newOrder]);
    setShowForm(false);
  };

  const handleStatusChange = async (delivery_id, newStatus) => {
    try {
      await axios.get(
        `https://ems.binlaundry.com/irrl/quotation/${delivery_id}?status=${newStatus}`
      );
      setOrders(
        orders.map((o) =>
          o.delivery_id === delivery_id ? { ...o, status: newStatus } : o
        )
      );
    } catch (err) {
      console.error("Status update failed", err);
      alert("Failed to update status");
    }
  };

  const handleDelete = async (quotation_id) => {
    try {
      await axios.delete(
        `https://ems.binlaundry.com/irrl/quotation/${quotation_id}`
      );
      setOrders(orders.filter((o) => o.quotation_id !== quotation_id));
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete quotation");
    }
  };

  const handleDownloadExcel = () => {
    const tableData = orders.flatMap((o, i) =>
      (o.items || [{}]).map((it, j) => ({
        "S.No": j === 0 ? i + 1 : "",
        "Quotation No": j === 0 ? o.quotation_number || "-" : "",
        "Contact Name": j === 0 ? o.contact_name || "-" : "",
        "Contact Number": j === 0 ? o.contact_number || "-" : "",
        "Shipping Address": j === 0 ? o.shipping_address || "-" : "",
        "Total Amount": j === 0 ? o.total_amount ?? "-" : "",
        "Placed At": j === 0 ? o.placed_at || "-" : "",
        "Item Name": it.item_name || "-",
        "Description": it.description || "-",
        "Rent Amount": it.rent_amount ?? "-",
        "Start Date": it.start_date || "-",
        "End Date": it.end_date || "-",
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Qoatations");
    XLSX.writeFile(workbook, "qoatations_report.xlsx");
  };

  const filteredOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          (o.contact_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (o.contact_number || "").toLowerCase().includes(search.toLowerCase()) ||
          (o.quotation_number || "").toLowerCase().includes(search.toLowerCase()) ||
          (o.shipping_address || "").toLowerCase().includes(search.toLowerCase()) ||
          (o.items || []).some((it) =>
            (it.item_name || "").toLowerCase().includes(search.toLowerCase())
          )
      ),
    [orders, search]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const { totalOrders, matchingLines } = useMemo(() => ({
    totalOrders: orders.length,
    matchingLines: filteredOrders.length,
  }), [orders.length, filteredOrders.length]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredOrders.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

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
                <h1 className="text-sm font-semibold text-slate-900">Qoatation</h1>
              </div>
              <div className="flex min-w-0 flex-nowrap items-center gap-x-4 overflow-x-auto px-3 py-1.5 [-webkit-overflow-scrolling:touch]">
                <div className="flex shrink-0 flex-nowrap items-center gap-x-4 text-[11px] text-slate-600">
                  <span className="tabular-nums">
                    <span className="text-slate-400">Total</span>{" "}
                    <span className="font-semibold text-slate-900">{totalOrders}</span>
                  </span>
                  <span className="tabular-nums">
                    <span className="text-slate-400">Matching search</span>{" "}
                    <span className="font-semibold text-slate-900">{matchingLines}</span>
                  </span>
                </div>
                <div className="relative min-w-[min(100%,10rem)] flex-1 basis-[8rem]">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search…"
                    className="w-full rounded-md border border-slate-200 bg-slate-50 py-1 pl-7 pr-2 text-[11px] text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500/25"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-amber-700"
                  >
                    <Plus className="h-3 w-3" strokeWidth={2.5} />
                    Add Qoatation
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadExcel}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-3 w-3" />
                    Export Excel
                  </button>
                </div>
              </div>
            </div>

            {showForm && (
              <QoatationForm onAddOrder={handleAddOrder} onClose={() => setShowForm(false)} />
            )}

            {loading ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                <p className="mt-3 text-xs font-medium text-slate-500">Loading…</p>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="min-h-0 flex-1 overflow-auto">
                  <table className="min-w-full border-collapse text-xs [&_td]:border-r [&_td]:border-slate-200 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-200 [&_th:last-child]:border-r-0">
                    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100">
                      <tr>
                        <th className={thClass}>#</th>
                        <th className={thClass}>Qtn No.</th>
                        <th className={thClass}>Name</th>
                        <th className={thClass}>Phone</th>
                        <th className={thClass}>Items</th>
                        <th className={thClass}>Placed</th>
                        <th className={`${thClass} text-right`}>Total (₹)</th>
                        <th className={`${thClass} text-right`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-16 text-center">
                            <div className="mx-auto max-w-sm">
                              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <Search className="h-7 w-7" />
                              </div>
                              <p className="text-sm font-medium text-slate-900">No items found</p>
                              <p className="mt-1 text-sm text-slate-500">Try another search or add a qoatation.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentRows.map((o, i) => {
                          return (
                          <tr
                            key={o.quotation_id ?? i}
                            onClick={() => navigate(`/qoatation-details/${o.quotation_id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                navigate(`/qoatation-details/${o.quotation_id}`);
                              }
                            }}
                            className={`cursor-pointer transition-colors hover:bg-amber-50/50 focus:bg-amber-50/50 focus:outline-none ${(indexOfFirstRow + i) % 2 === 1 ? "bg-slate-50/50" : "bg-white"}`}
                          >
                            <td className="whitespace-nowrap px-2 py-2 font-mono text-slate-500">{indexOfFirstRow + i + 1}</td>
                            <td className="whitespace-nowrap px-2 py-2 font-mono font-semibold text-amber-700">{o.quotation_number || "—"}</td>
                            <td className="max-w-[150px] truncate px-2 py-2 font-medium text-slate-900" title={o.contact_name}>{o.contact_name || "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-slate-700">{o.contact_number || "—"}</td>
                            <td className="max-w-[200px] truncate px-2 py-2 text-[11px] text-slate-600">
                              {(o.items || []).length > 0
                                ? (o.items || []).map((it) => it.item_name).filter(Boolean).join(", ") || `${o.items.length} item(s)`
                                : "—"}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-[11px] text-slate-500">
                              {o.placed_at ? new Date(o.placed_at).toLocaleDateString("en-IN") : "—"}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-right font-semibold tabular-nums text-slate-900">
                              {o.total_amount != null ? `₹${Number(o.total_amount).toLocaleString("en-IN")}` : "—"}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 p-1.5 text-rose-700 transition hover:bg-rose-100"
                                title="Delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(o.quotation_id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/90 px-3 py-2">
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">{matchingLines === 0 ? 0 : indexOfFirstRow + 1}</span>
                      –
                      <span className="font-semibold text-slate-900">{Math.min(indexOfLastRow, matchingLines)}</span>
                      {" "}of{" "}
                      <span className="font-semibold text-slate-900">{matchingLines}</span>
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
                      {Array.from({ length: totalPages }, (_, idx) => (
                        <button
                          type="button"
                          key={idx + 1}
                          onClick={() => setCurrentPage(idx + 1)}
                          className={`min-w-[2rem] rounded-md px-2 py-1 text-xs font-semibold ${currentPage === idx + 1
                            ? "bg-amber-600 text-white"
                            : "text-slate-700 hover:bg-white"
                            }`}
                        >
                          {idx + 1}
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

export default Qoatation;
