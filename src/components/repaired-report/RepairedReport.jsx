import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import { Search, Download, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

const REPAIRING_GROUPED_URL = "https://ems.binlaundry.com/irrl/repairing/grouped";

const thClass =
  "whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600";

function normalizeGroupedRow(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    item_name: raw.item_name ?? raw.itemName ?? raw.Item_Name ?? "",
    hsn_code:
      raw.hsn_code ??
      raw.hsnCode ??
      raw.HSN_Code ??
      (raw.hsn != null ? String(raw.hsn) : "") ??
      "",
    item_main_code:
      raw.item_main_code ??
      raw.itemMainCode ??
      raw.main_code ??
      raw.item_main ??
      "",
    item_sub_code:
      raw.item_sub_code ??
      raw.itemSubCode ??
      raw.sub_code ??
      raw.new_sub_code ??
      "",
    count: Number(raw.count ?? raw.repair_count ?? raw.total ?? 0) || 0,
  };
}

const RepairedReport = ({ onLogout }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(REPAIRING_GROUPED_URL);
      const raw = res.data?.data;
      const list = Array.isArray(raw) ? raw.map(normalizeGroupedRow).filter(Boolean) : [];
      setRows(list);
    } catch (err) {
      console.error("Repaired report fetch failed:", err);
      setError(err.response?.data?.msg || err.message || "Failed to load report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    const list = [...rows].sort((a, b) => (b.count || 0) - (a.count || 0));
    if (!q) return list;
    return list.filter((r) => {
      const blob = [
        r.item_name,
        r.hsn_code,
        r.item_main_code,
        r.item_sub_code,
      ]
        .map((x) => String(x ?? "").toLowerCase())
        .join(" ");
      return blob.includes(q);
    });
  }, [rows, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const { skuCount, matchingLines, totalRepairedUnits } = useMemo(() => {
    const totalRepairedUnits = filtered.reduce((sum, r) => sum + (Number(r.count) || 0), 0);
    return {
      skuCount: rows.length,
      matchingLines: filtered.length,
      totalRepairedUnits,
    };
  }, [rows.length, filtered]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  const openItemDetails = (itemSubCode) => {
    const code = (itemSubCode || "").trim();
    if (!code) return;
    navigate(`/repaired-item-details/${encodeURIComponent(code)}`);
  };

  const handleDownloadExcel = () => {
    const tableData = filtered.map((r, i) => ({
      "S.No": i + 1,
      "Item name": r.item_name || "—",
      "HSN code": r.hsn_code || "—",
      "Main code": r.item_main_code || "—",
      "Sub code": r.item_sub_code || "—",
      Count: r.count ?? 0,
    }));
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Repaired report");
    XLSX.writeFile(workbook, "repaired_report.xlsx");
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(16,185,129,0.06),transparent)]"
        aria-hidden
      />
      <Header onLogout={onLogout} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <Rentalsidebar />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:p-3">
            <div className="shrink-0 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="px-3 py-1.5">
                <h1 className="text-sm font-semibold text-slate-900">Repaired report</h1>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Grouped repairs from{" "}
                  <span className="font-mono text-slate-600">GET /irrl/repairing/grouped</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-1.5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                  <span className="tabular-nums">
                    <span className="text-slate-400">SKUs</span>{" "}
                    <span className="font-semibold text-slate-900">{loading ? "—" : skuCount}</span>
                  </span>
                  <span className="tabular-nums">
                    <span className="text-slate-400">Matching search</span>{" "}
                    <span className="font-semibold text-slate-900">{loading ? "—" : matchingLines}</span>
                  </span>
                  <span className="tabular-nums">
                    <span className="text-slate-400">Repaired units (in view)</span>{" "}
                    <span className="font-semibold text-emerald-700">
                      {loading ? "—" : totalRepairedUnits}
                    </span>
                  </span>
                </div>
                <div className="relative min-w-[min(100%,10rem)] flex-1 basis-[8rem]">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, HSN, main / sub code…"
                    className="w-full rounded-md border border-slate-200 bg-slate-50 py-1 pl-7 pr-2 text-[11px] text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500/25"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => load()}
                    disabled={loading}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadExcel}
                    disabled={!filtered.length}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="h-3 w-3" />
                    Export Excel
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <p className="mt-3 text-xs font-medium text-slate-500">Loading repaired report…</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-16 shadow-sm">
                <p className="text-sm font-medium text-slate-900">No repaired groups</p>
                <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
                  The API returned no rows for grouped repairs.
                </p>
              </div>
            ) : (
              <div className="flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="min-h-0 flex-1 overflow-auto">
                  <table className="min-w-full border-collapse text-xs [&_td]:border-r [&_td]:border-slate-200 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-200 [&_th:last-child]:border-r-0">
                    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100">
                      <tr>
                        <th className={thClass}>#</th>
                        <th className={thClass}>Item name</th>
                        <th className={thClass}>HSN</th>
                        <th className={thClass}>Main code</th>
                        <th className={thClass}>Sub code</th>
                        <th className={thClass}>Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-16 text-center">
                            <div className="mx-auto max-w-sm">
                              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <Search className="h-7 w-7" />
                              </div>
                              <p className="text-sm font-medium text-slate-900">No rows match</p>
                              <p className="mt-1 text-sm text-slate-500">Try another search.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((item, index) => {
                          const stripe = (indexOfFirst + index) % 2 === 1;
                          const canOpen = !!(item.item_sub_code || "").trim();
                          return (
                            <tr
                              key={`${item.item_sub_code || item.item_main_code}-${indexOfFirst + index}`}
                              role={canOpen ? "button" : undefined}
                              tabIndex={canOpen ? 0 : undefined}
                              onClick={() => canOpen && openItemDetails(item.item_sub_code)}
                              onKeyDown={(e) => {
                                if (!canOpen) return;
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  openItemDetails(item.item_sub_code);
                                }
                              }}
                              className={
                                (stripe ? "bg-slate-50/50" : "bg-white") +
                                (canOpen
                                  ? " cursor-pointer transition-colors hover:bg-emerald-50/60 focus:bg-emerald-50/60 focus:outline-none"
                                  : "")
                              }
                            >
                              <td className="whitespace-nowrap px-2 py-2 font-mono text-slate-500">
                                {indexOfFirst + index + 1}
                              </td>
                              <td
                                className="max-w-[min(100vw,280px)] truncate px-2 py-2 font-medium text-slate-900 sm:max-w-md"
                                title={item.item_name}
                              >
                                {item.item_name || "—"}
                              </td>
                              <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-700">
                                {item.hsn_code || "—"}
                              </td>
                              <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-800">
                                {item.item_main_code || "—"}
                              </td>
                              <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-800">
                                {item.item_sub_code || "—"}
                              </td>
                              <td className="whitespace-nowrap px-2 py-2 tabular-nums font-semibold text-emerald-700">
                                {item.count}
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
                      <span className="font-semibold text-slate-900">
                        {matchingLines === 0 ? 0 : indexOfFirst + 1}
                      </span>
                      –
                      <span className="font-semibold text-slate-900">
                        {Math.min(indexOfLast, matchingLines)}
                      </span>{" "}
                      of <span className="font-semibold text-slate-900">{matchingLines}</span>
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
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          type="button"
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`min-w-[2rem] rounded-md px-2 py-1 text-xs font-semibold ${
                            currentPage === i + 1
                              ? "bg-emerald-600 text-white"
                              : "text-slate-700 hover:bg-white"
                          }`}
                        >
                          {i + 1}
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

export default RepairedReport;
