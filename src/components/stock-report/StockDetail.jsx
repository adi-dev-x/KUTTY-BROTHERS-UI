import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Ban,
  X,
  Package,
  Filter,
} from "lucide-react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import Footer from "../footer/Footer";
import { API_BASE_URL } from "../../config/api";

const GENERIC_DELETE_URL = `${API_BASE_URL}/irrl/genericDelete`;
/** DB table name for genericDelete payload (`table_name`). */
const ITEMS_TABLE_NAME = "items";

function pickHsnFromRow(s) {
  if (!s || typeof s !== "object") return "";
  const v =
    s.hsn_code ??
    s.hsnCode ??
    s.HSN_Code ??
    s.HSNCode ??
    s.hsn ??
    s.HSN ??
    s.gst_hsn ??
    s.gst_hsn_code ??
    s.item_hsn_code ??
    s.Item_HSN_Code ??
    "";
  return v === null || v === undefined ? "" : String(v).trim();
}

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

const categoryBadgeClass = (category) => {
  const c = (category || "").toUpperCase();
  if (c === "RENTED") return "bg-amber-50 text-amber-800 ring-amber-200/70";
  if (c === "AVAILABLE") return "bg-emerald-50 text-emerald-700 ring-emerald-200/70";
  if (c === "DAMAGED") return "bg-rose-50 text-rose-700 ring-rose-200/70";
  if (c === "REPAIRING") return "bg-sky-50 text-sky-700 ring-sky-200/70";
  if (c === "EXPIRED") return "bg-slate-100 text-slate-600 ring-slate-200/70";
  if (c === "BLOCKED") return "bg-rose-50 text-rose-700 ring-rose-200/70";
  if (c === "RESERVED") return "bg-violet-50 text-violet-700 ring-violet-200/70";
  if (c === "SITE") return "bg-indigo-50 text-indigo-700 ring-indigo-200/70";
  return "bg-slate-100 text-slate-600 ring-slate-200/70";
};

const StockDetail = ({ onLogout }) => {
  const { product_code } = useParams();
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [deletingId, setDeletingId] = useState(null);
  /** Row awaiting delete confirmation — modal open when set */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  /** Row that is currently rented — shown as a blocking alert instead of a confirm dialog */
  const [blockedTarget, setBlockedTarget] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(
      `${API_BASE_URL}/irrl/genericApiUnjoin/productSingle?product_code='${product_code}'`
    )
      .then((res) => res.json())
      .then((data) => {
        const rows = Array.isArray(data?.data) ? data.data : [];
        setStocks(
          rows.map((row) => ({
            ...row,
            hsn_code: pickHsnFromRow(row),
          }))
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching stock:", err);
        setLoading(false);
      });
  }, [product_code]);

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
    if ((!deleteTarget && !blockedTarget) || deletingId) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        closeDeleteModal();
        setBlockedTarget(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteTarget, blockedTarget, deletingId, closeDeleteModal]);

  const openDeleteModal = (item) => {
    const id = item?.item_id;
    if (id == null || id === "") {
      setNotice({
        variant: "error",
        title: "Cannot delete",
        message: "This row has no item id.",
      });
      return;
    }
    if ((item.category || "").toUpperCase() === "RENTED") {
      setBlockedTarget(item);
      return;
    }
    setDeleteError(null);
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.item_id;
    const idStr = String(id);
    const label = deleteTarget.item_code || "This item";

    setDeleteError(null);
    setDeletingId(idStr);
    try {
      const res = await fetch(GENERIC_DELETE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          table_name: ITEMS_TABLE_NAME,
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

      setStocks((prev) => prev.filter((s) => String(s.item_id) !== idStr));
      setDeleteTarget(null);
      setNotice({
        variant: "success",
        title: "Item removed",
        message: `${label} was deleted successfully.`,
      });
    } catch (err) {
      console.error("Error deleting item:", err);
      setDeleteError(err?.message || "Delete failed. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredStocks = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return stocks;
    return stocks.filter((s) => {
      const category = (s.category || "").toLowerCase();
      const itemCode = (s.item_code || "").toLowerCase();
      return category.includes(q) || itemCode.includes(q);
    });
  }, [stocks, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentStocks = filteredStocks.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const s of stocks) {
      const c = (s.category || "UNKNOWN").toUpperCase();
      counts[c] = (counts[c] || 0) + 1;
    }
    return counts;
  }, [stocks]);

  const thClass =
    "whitespace-nowrap px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500";

  if (loading) {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f4f6fb]">
        <Header onLogout={onLogout} />
        <div className="flex flex-1 overflow-hidden">
          <Rentalsidebar />
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-amber-400 border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-slate-500">Loading stock…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stocks.length) {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f4f6fb]">
        <Header onLogout={onLogout} />
        <div className="flex flex-1 overflow-hidden">
          <Rentalsidebar />
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <p className="text-sm font-medium text-slate-500">Stock not found.</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const summary = stocks[0];

  return (
    <div className="relative flex h-[100dvh] max-h-screen flex-col overflow-hidden bg-[#f4f6fb]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_50%_-25%,rgba(251,191,36,0.14),transparent_55%)]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(59,130,246,0.06),transparent_50%)]"
        aria-hidden
      />
      <Header onLogout={onLogout} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <Rentalsidebar />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-5">
            <div className="shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-xl shadow-slate-900/[0.07] ring-1 ring-slate-200/70 backdrop-blur-md">
              <div className="relative px-4 py-4 sm:px-5">
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" aria-hidden />
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="mb-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to stock report
                </button>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 ring-2 ring-white/50">
                      <Package className="h-5 w-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700/85">
                        Product code · {product_code}
                      </p>
                      <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                        {summary.item_name}
                      </h1>
                      <p className="mt-1 max-w-2xl text-sm text-slate-500">
                        {summary.brand ? `${summary.brand} · ` : ""}
                        {summary.item_main_type ? `${summary.item_main_type} · ` : ""}
                        {summary.item_sub_type || ""}
                        {summary.description ? ` — ${summary.description}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {Object.entries(categoryCounts).map(([c, count]) => (
                      <div
                        key={c}
                        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] shadow-sm ring-1 ${categoryBadgeClass(c)} border-transparent`}
                      >
                        <span className="font-semibold">{c}</span>
                        <span className="font-bold tabular-nums">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100/90 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                  <div className="relative min-w-0 flex-1 sm:min-w-[min(100%,16rem)] sm:basis-[16rem]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by category or item code…"
                      className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-inner shadow-slate-900/5 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-slate-50/95 px-3.5 py-2 text-[11px] shadow-sm ring-1 ring-slate-100">
                    <Filter className="h-3.5 w-3.5 text-slate-500" strokeWidth={2.5} />
                    <span className="text-slate-500">Matching</span>
                    <span className="font-bold tabular-nums text-slate-900">{filteredStocks.length}</span>
                    <span className="text-slate-400">/ {stocks.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-900/[0.04] ring-1 ring-slate-100">
              <div className="min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
                <table className="min-w-full border-separate border-spacing-0 text-[13px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50/95 backdrop-blur-sm">
                      <th className={`${thClass} border-b border-slate-200/70`}>#</th>
                      <th className={`${thClass} border-b border-slate-200/70`}>Item code</th>
                      <th className={`${thClass} border-b border-slate-200/70`}>Category</th>
                      <th className={`${thClass} border-b border-slate-200/70`}>HSN code</th>
                      <th className={`${thClass} border-b border-slate-200/70`}>Created at</th>
                      <th className="whitespace-nowrap border-b border-slate-200/70 px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStocks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center text-sm text-slate-400">
                          No results
                        </td>
                      </tr>
                    ) : (
                      currentStocks.map((s, index) => (
                        <tr
                          key={s.item_id || index}
                          className="transition-colors hover:bg-amber-50/40 [&>td]:border-b [&>td]:border-slate-100/80"
                        >
                          <td className="whitespace-nowrap px-3 py-2.5 text-right text-[11px] font-medium tabular-nums text-slate-400">
                            {indexOfFirst + index + 1}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[12px] font-semibold text-slate-800">
                            {s.item_code || "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${categoryBadgeClass(s.category)}`}
                            >
                              {s.category || "—"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-slate-500">
                            {pickHsnFromRow(s) || "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">
                            {s.created_at ? new Date(s.created_at).toLocaleString() : "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => openDeleteModal(s)}
                              disabled={deletingId === String(s.item_id)}
                              className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              {deletingId === String(s.item_id) ? "…" : "Delete"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredStocks.length > 0 && (
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100/90 bg-gradient-to-r from-slate-50/95 via-white to-amber-50/30 px-3 py-2.5 sm:px-4">
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">{indexOfFirst + 1}</span>
                    –
                    <span className="font-semibold text-slate-900">
                      {Math.min(indexOfLast, filteredStocks.length)}
                    </span>{" "}
                    of <span className="font-semibold text-slate-900">{filteredStocks.length}</span>
                  </p>
                  {totalPages > 1 && (
                    <nav className="flex items-center gap-0.5 rounded-lg border border-slate-200/80 bg-white/90 p-0.5 shadow-sm" aria-label="Pagination">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-amber-50 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          type="button"
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`min-w-[2rem] rounded-md px-2 py-1 text-xs font-semibold transition ${
                            currentPage === i + 1
                              ? "bg-amber-600 text-white shadow-sm"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-amber-50 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </nav>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />

      {/* Blocked-delete alert (rented items) */}
      {blockedTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[3px]"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="blocked-dialog-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setBlockedTarget(null);
          }}
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.35)] ring-1 ring-black/5">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400" aria-hidden />
            <div className="flex gap-4 p-6 pt-7">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 shadow-inner ring-1 ring-amber-200/80">
                <Ban className="h-6 w-6 text-amber-600" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="blocked-dialog-title" className="text-lg font-bold tracking-tight text-slate-900">
                  Item can't be deleted
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  <span className="font-semibold text-slate-900">
                    {blockedTarget.item_code || "This item"}
                  </span>{" "}
                  is currently <span className="font-semibold text-amber-700">RENTED</span>. Rented
                  items can't be deleted until they're returned.
                </p>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-100 bg-slate-50/80 px-6 py-4">
              <button
                type="button"
                onClick={() => setBlockedTarget(null)}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Delete item?
                </h2>
                <p id="delete-dialog-desc" className="mt-2 text-sm leading-relaxed text-slate-600">
                  This permanently removes{" "}
                  <span className="font-semibold text-slate-900">
                    {deleteTarget.item_code || "this item"}
                  </span>{" "}
                  from inventory. This action cannot be undone.
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
                    Delete item
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
              "pointer-events-auto flex gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md " +
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
    </div>
  );
};

export default StockDetail;
