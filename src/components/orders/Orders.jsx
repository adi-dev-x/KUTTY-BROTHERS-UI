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
import OrderForm from "./OrderForm";

const fieldSelect =
  "rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

const thClass =
  "whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600";

const Orders = ({ onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [statuses, setStatuses] = useState(["COMPLETED", "BLOCKED", "INITIATED", "RESERVED"]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          "https://ems.binlaundry.com/irrl/genericApiUnjoin/listOrders"
        );
        setOrders(response.data?.data || []);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchStatuses = async () => {
      try {
        const res = await axios.get(
          "https://ems.binlaundry.com/irrl/genericApiUnjoin/statusOptions"
        );
        const apiStatuses = res.data?.data || [];
        setStatuses(apiStatuses.filter((s) => ["COMPLETED", "BLOCKED", "INITIATED"].includes(s)));
      } catch (err) {
        console.error("Failed to fetch status options, using defaults", err);
      }
    };

    fetchOrders();
    fetchStatuses();
  }, []);

  const handleAddOrder = (newOrder) => {
    setOrders([...orders, newOrder]);
    setShowForm(false);
  };

  const handleStatusChange = async (delivery_id, newStatus) => {
    try {
      await axios.get(
        `https://ems.binlaundry.com/irrl/updateOrder/${delivery_id}?status=${newStatus}`
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

  const handleDelete = async (delivery_id) => {
    try {
      await axios.get(
        `https://ems.binlaundry.com/irrl/updateOrder/${delivery_id}?status=DELETED`
      );
      setOrders(orders.filter((o) => o.delivery_id !== delivery_id));
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete order");
    }
  };

  const handleDownloadExcel = () => {
    const tableData = orders.map((o, i) => ({
      "S.No": i + 1,
      "Customer Name": o.customer_name || "-",
      "Customer ID": o.customer_id || "-",
      "Contact Person": o.contact_name || "-",
      "Contact Number": o.contact_number || "-",
      "Shipping Address": o.shipping_address || "-",
      "Inventory ID": o.inventory_id || "-",
      "Generated Amount": o.generated_amount || "-",
      "Current Amount": o.current_amount || "-",
      "Advance Amount": o.advance_amount || "-",
      "Placed At": o.placed_at || "-",
      "Returned At": o.declined_at || "-",
      "Status": o.status || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "orders_report.xlsx");
  };

  const filteredOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (o.customer_id || "").toLowerCase().includes(search.toLowerCase()) ||
          (o.status || "").toLowerCase().includes(search.toLowerCase())
      ),
    [orders, search]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const { totalOrders, matchingLines, completedCount } = useMemo(() => ({
    totalOrders: orders.length,
    matchingLines: filteredOrders.length,
    completedCount: orders.filter((o) => (o.status || "").toUpperCase() === "COMPLETED").length,
  }), [orders, filteredOrders.length]);

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
                <h1 className="text-sm font-semibold text-slate-900">Orders</h1>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-1.5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                  <span className="tabular-nums">
                    <span className="text-slate-400">Total orders</span>{" "}
                    <span className="font-semibold text-slate-900">{totalOrders}</span>
                  </span>
                  <span className="tabular-nums">
                    <span className="text-slate-400">Matching search</span>{" "}
                    <span className="font-semibold text-slate-900">{matchingLines}</span>
                  </span>
                  <span className="tabular-nums">
                    <span className="text-slate-400">Completed</span>{" "}
                    <span className="font-semibold text-slate-900">{completedCount}</span>
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
                    Add order
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
              <OrderForm onAddOrder={handleAddOrder} onClose={() => setShowForm(false)} />
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
                        <th className={thClass}>Customer</th>
                        <th className={thClass}>Cust. ID</th>
                        <th className={thClass}>Contact</th>
                        <th className={thClass}>Phone</th>
                        <th className={thClass}>Address</th>
                        <th className={thClass}>Inventory</th>
                        <th className={thClass}>Gen. amt</th>
                        <th className={thClass}>Current</th>
                        <th className={thClass}>Advance</th>
                        <th className={thClass}>Placed</th>
                        <th className={thClass}>Returned</th>
                        <th className={thClass}>Transactions</th>
                        <th className={thClass}>Status</th>
                        <th className={`${thClass} text-right`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentRows.length === 0 ? (
                        <tr>
                          <td colSpan={15} className="px-6 py-16 text-center">
                            <div className="mx-auto max-w-sm">
                              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <Search className="h-7 w-7" />
                              </div>
                              <p className="text-sm font-medium text-slate-900">No orders found</p>
                              <p className="mt-1 text-sm text-slate-500">Try another search or add an order.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentRows.map((o, i) => (
                          <tr
                            key={o.delivery_id}
                            onClick={() => navigate(`/order-details/${o.delivery_id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                navigate(`/order-details/${o.delivery_id}`);
                              }
                            }}
                            className={`cursor-pointer transition-colors hover:bg-amber-50/50 focus:bg-amber-50/50 focus:outline-none ${(indexOfFirstRow + i) % 2 === 1 ? "bg-slate-50/50" : "bg-white"}`}
                          >
                            <td className="whitespace-nowrap px-2 py-2 font-mono text-slate-500">{indexOfFirstRow + i + 1}</td>
                            <td className="max-w-[120px] truncate px-2 py-2 font-medium text-slate-900" title={o.customer_name}>{o.customer_name || "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-slate-700">{o.customer_id || "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-slate-700">{o.contact_name || "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-slate-700">{o.contact_number || "—"}</td>
                            <td className="max-w-[140px] truncate px-2 py-2 text-slate-600" title={o.shipping_address}>{o.shipping_address || "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-600">{o.inventory_id || "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 tabular-nums text-slate-800">{o.generated_amount ?? "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 tabular-nums text-slate-800">{o.current_amount ?? "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 tabular-nums text-slate-800">{o.advance_amount ?? "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-[11px] text-slate-600">{o.placed_at || "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-[11px] text-slate-600">{o.declined_at || "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate("/transaction", {
                                    state: { order_id: o.delivery_id },
                                  });
                                }}
                              >
                                View
                              </button>
                            </td>
                            <td className="whitespace-nowrap px-2 py-2" onClick={(e) => e.stopPropagation()}>
                              <select
                                className={fieldSelect}
                                value={o.status}
                                onChange={(e) =>
                                  handleStatusChange(o.delivery_id, e.target.value)
                                }
                              >
                                {statuses.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 p-1.5 text-rose-700 transition hover:bg-rose-100"
                                title="Delete order"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(o.delivery_id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
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

export default Orders;
