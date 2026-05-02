import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Download,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

function initials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const CUSTOMERS_API = "https://ems.binlaundry.com/irrl/customers";
const GENERIC_DELETE_URL = "https://ems.binlaundry.com/irrl/genericDelete";
/** DB table name for genericDelete payload (`table_name`). Change if your backend expects another identifier. */
const CUSTOMER_TABLE_NAME = "customer";

function parseJsonSafe(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Handles shapes like `{ "msg": { "error": "..." } }` from the EMS API. */
function apiErrorMessage(body, rawFallback) {
  if (body?.msg != null && typeof body.msg === "object" && body.msg.error != null) {
    return String(body.msg.error);
  }
  if (typeof body?.msg === "string") return body.msg;
  if (body?.message != null) return String(body.message);
  if (typeof body?.error === "string") return body.error;
  return rawFallback?.trim() || "Request failed";
}

const Customer = ({ onLogout }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  /** Customer awaiting delete confirmation — modal open when set */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  /** Bottom toast after delete or fatal validation */
  const [notice, setNotice] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    short_name: "",
    phone: "",
    type: "",
    gst: "",
    address: "",
    email: "",
    customer_flag: "",
    status: "Active",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Fetch customers
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/genericApiUnjoin/customerlist")
      .then((res) => res.json())
      .then((data) => {
        setCustomers(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching customers:", err);
        setLoading(false);
      });
  }, []);

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
          (c.customer_id || "").toString().includes(search) ||
          (c.phone || "").includes(search)
      ),
    [customers, search]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    const tp = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
    setCurrentPage((p) => Math.min(p, tp));
  }, [filteredCustomers.length, itemsPerPage]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4200);
    return () => clearTimeout(t);
  }, [notice]);

  const closeDeleteModal = useCallback(() => {
    if (deletingId) return;
    setDeleteTarget(null);
    setDeleteError(null);
  }, [deletingId]);

  useEffect(() => {
    if (!deleteTarget || deletingId) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeDeleteModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteTarget, deletingId, closeDeleteModal]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredCustomers.slice(indexOfFirst, indexOfLast);

  const { totalCustomers, activeCustomers, matchingLines } = useMemo(() => {
    const active = customers.filter(
      (c) => (c.status || "").toLowerCase() === "active"
    ).length;
    return {
      totalCustomers: customers.length,
      activeCustomers: active,
      matchingLines: filteredCustomers.length,
    };
  }, [customers, filteredCustomers.length]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
      short_name: "",
      phone: "",
      type: "",
      gst: "",
      address: "",
      email: "",
      customer_flag: "",
      status: "Active",
    });
    setShowForm(true);
  };

  const openDeleteModal = (customer) => {
    const id = customer?.customer_id;
    if (id == null || id === "") {
      setNotice({
        variant: "error",
        title: "Cannot delete",
        message: "This row has no customer id.",
      });
      return;
    }
    setDeleteError(null);
    setDeleteTarget(customer);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.customer_id;
    const idStr = String(id);
    const label = deleteTarget.name || `Customer #${idStr}`;

    setDeleteError(null);
    setDeletingId(idStr);
    try {
      const res = await fetch(GENERIC_DELETE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          table_name: CUSTOMER_TABLE_NAME,
          id: idStr,
        }),
      });

      const raw = await res.text();
      const body = parseJsonSafe(raw);

      if (!res.ok) {
        throw new Error(apiErrorMessage(body, raw) || `HTTP ${res.status}`);
      }
      if (body?.msg?.error != null) {
        throw new Error(apiErrorMessage(body, raw));
      }

      setCustomers((prev) => prev.filter((c) => String(c.customer_id) !== idStr));
      setDeleteTarget(null);
      setNotice({
        variant: "success",
        title: "Customer removed",
        message: `${label} was deleted successfully.`,
      });
    } catch (err) {
      console.error("Error deleting customer:", err);
      setDeleteError(err?.message || "Delete failed. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      Name: formData.name,
      Short_Name: formData.short_name,
      Phone: formData.phone,
      Type: formData.type,
      GST: formData.gst,
      Address: formData.address,
      Email: formData.email || undefined,
      Customer_Flag: formData.customer_flag || undefined,
      Status: formData.status || "Active",
    };

    try {
      const res = await fetch(CUSTOMERS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API Error: ${errText}`);
      }

      const newCustomer = await res.json();
      setCustomers((prev) => [...prev, newCustomer]);
      window.location.reload();
      setShowForm(false);
    } catch (err) {
      console.error("Error saving customer:", err);
      alert("Failed to save customer. Check console.");
    }
  };

  const handleDownloadExcel = () => {
    const tableData = customers.map((c) => ({
      "ID": c.customer_id,
      "Name": c.name,
      "Phone": c.phone,
      "Type": c.type,
      "GST": c.gst,
      "Address": c.address,
      "Status": c.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "customers_report.xlsx");
  };

  const formFieldClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

  const thClass =
    "whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600";

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
                <h1 className="text-sm font-semibold text-slate-900">Customers</h1>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-1.5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                  <span className="tabular-nums">
                    <span className="text-slate-400">Total</span>{" "}
                    <span className="font-semibold text-slate-900">{totalCustomers}</span>
                  </span>
                  <span className="tabular-nums">
                    <span className="text-slate-400">Active</span>{" "}
                    <span className="font-semibold text-slate-900">{activeCustomers}</span>
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
                    onClick={handleAddClick}
                    className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-amber-700"
                  >
                    <Plus className="h-3 w-3" strokeWidth={2.5} />
                    Add customer
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
                        <th className={thClass}>ID</th>
                        <th className={thClass}>Customer</th>
                        <th className={thClass}>Contact</th>
                        <th className={thClass}>Type</th>
                        <th className={thClass}>GST</th>
                        <th className={thClass}>Status</th>
                        <th className="whitespace-nowrap px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center">
                            <div className="mx-auto max-w-sm">
                              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <Search className="h-7 w-7" />
                              </div>
                              <p className="text-sm font-medium text-slate-900">No rows match</p>
                              <p className="mt-1 text-sm text-slate-500">Try another search or add a customer.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((customer, idx) => (
                          <tr
                            key={customer.customer_id}
                            className={`transition-colors hover:bg-amber-50/50 ${(indexOfFirst + idx) % 2 === 1 ? "bg-slate-50/50" : "bg-white"}`}
                          >
                            <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-500">
                              #{customer.customer_id}
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-[10px] font-bold text-slate-950">
                                  {initials(customer.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="max-w-[140px] truncate font-medium text-slate-900" title={customer.name}>
                                    {customer.name}
                                  </p>
                                  {customer.short_name ? (
                                    <p className="truncate text-[11px] text-slate-500">{customer.short_name}</p>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td className="max-w-[180px] px-2 py-2">
                              <p className="truncate text-slate-800" title={customer.phone}>
                                {customer.phone || "—"}
                              </p>
                              {customer.email ? (
                                <p className="truncate text-[11px] text-slate-500">{customer.email}</p>
                              ) : null}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-slate-700">{customer.type || "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-600">
                              {customer.gst || "—"}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${(customer.status || "").toLowerCase() === "active"
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15"
                                  : "bg-rose-50 text-rose-700 ring-1 ring-rose-600/15"
                                  }`}
                              >
                                {customer.status || "—"}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => openDeleteModal(customer)}
                                disabled={deletingId === String(customer.customer_id)}
                                className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2 className="h-3 w-3" />
                                {deletingId === String(customer.customer_id) ? "…" : "Delete"}
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
                      <span className="font-semibold text-slate-900">{matchingLines === 0 ? 0 : indexOfFirst + 1}</span>
                      –
                      <span className="font-semibold text-slate-900">{Math.min(indexOfLast, matchingLines)}</span>
                      {" "}of{" "}
                      <span className="font-semibold text-slate-900">{matchingLines}</span>
                    </p>
                    <nav className="flex items-center gap-0.5" aria-label="Pagination">
                      <button
                        type="button"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          type="button"
                          key={i + 1}
                          onClick={() => handlePageChange(i + 1)}
                          className={`min-w-[2rem] rounded-md px-2 py-1 text-xs font-semibold ${currentPage === i + 1
                            ? "bg-amber-600 text-white"
                            : "text-slate-700 hover:bg-white"
                            }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handlePageChange(currentPage + 1)}
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

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[3px]"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-desc"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDeleteModal();
          }}
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.35)] ring-1 ring-black/5">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-400 via-rose-500 to-amber-400" aria-hidden />
            <div className="flex gap-4 p-6 pt-7">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-rose-50 shadow-inner ring-1 ring-rose-200/80">
                <AlertTriangle className="h-6 w-6 text-rose-600" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="delete-dialog-title" className="text-lg font-bold tracking-tight text-slate-900">
                  Delete customer?
                </h2>
                <p id="delete-dialog-desc" className="mt-2 text-sm leading-relaxed text-slate-600">
                  This permanently removes{" "}
                  <span className="font-semibold text-slate-900">
                    {deleteTarget.name || `Customer #${deleteTarget.customer_id}`}
                  </span>{" "}
                  from your directory. This action cannot be undone.
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-500 ring-1 ring-slate-100">
                  ID <span className="font-semibold text-slate-700">{deleteTarget.customer_id}</span>
                </p>
                {deleteError && (
                  <div className="mt-4 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800 ring-1 ring-rose-100">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <span>{deleteError}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={!!deletingId}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDelete()}
                disabled={!!deletingId}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:from-rose-700 hover:to-rose-600 disabled:opacity-60"
              >
                {deletingId ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete customer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {notice && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
          <div
            className={
              "animate-customer-toast pointer-events-auto flex gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md " +
              (notice.variant === "success"
                ? "border-emerald-200/90 bg-emerald-50/95 text-emerald-950 ring-1 ring-emerald-500/15"
                : "border-rose-200/90 bg-rose-50/95 text-rose-950 ring-1 ring-rose-500/15")
            }
          >
            <div
              className={
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner ring-1 " +
                (notice.variant === "success"
                  ? "bg-emerald-100 ring-emerald-200/80"
                  : "bg-rose-100 ring-rose-200/80")
              }
            >
              {notice.variant === "success" ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" strokeWidth={2} />
              ) : (
                <AlertTriangle className="h-5 w-5 text-rose-600" strokeWidth={2} />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-bold">{notice.title}</p>
              <p className="mt-0.5 text-sm opacity-90">{notice.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="shrink-0 rounded-lg p-1 text-current opacity-60 transition hover:bg-black/5 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 px-6 py-5 sm:px-8">
              <div>
                <h2 className="text-lg font-bold text-slate-900">New customer</h2>
                <p className="mt-0.5 text-sm text-slate-600">Fill in the essentials to create a profile.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full name</label>
                  <input
                    type="text"
                    required
                    className={formFieldClass}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Short name</label>
                  <input
                    type="text"
                    className={formFieldClass}
                    value={formData.short_name}
                    onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</label>
                  <input
                    type="text"
                    className={formFieldClass}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
                  <input
                    type="email"
                    className={formFieldClass}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</label>
                  <input
                    type="text"
                    placeholder="Individual / Company"
                    className={formFieldClass}
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">GST number</label>
                  <input
                    type="text"
                    className={formFieldClass}
                    value={formData.gst}
                    onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</label>
                  <textarea
                    rows={3}
                    className={`${formFieldClass} resize-y`}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 sm:max-w-xs">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                  <select
                    className={formFieldClass}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700"
                >
                  Save customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;
