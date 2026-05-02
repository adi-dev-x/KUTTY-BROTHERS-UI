import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import {
  parseImageUrls,
  isImageColumnKey,
  ImagePreviewLightbox,
  DamageImagePreviewTrigger,
} from "./DamageImagePreview";

const REPAIR_HISTORY_URL = "https://ems.binlaundry.com/irrl/repairHistory";

const thClass =
  "whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600";

function formatCell(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s) || /^\d{4}-\d{2}-\d{2} \d/.test(s)) {
    try {
      const d = new Date(s);
      if (!Number.isNaN(d.getTime())) return d.toLocaleString();
    } catch {
      /* fall through */
    }
  }
  return s;
}

function extractRows(res) {
  const d = res?.data;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d)) return d;
  if (d?.data && typeof d.data === "object" && !Array.isArray(d.data)) return [d.data];
  return [];
}

/** GET /irrl/repairHistory?item_id=… — query: ?item_id=…&optional item_sub_code= for back link */
const RepairHistoryPage = ({ onLogout }) => {
  const [searchParams] = useSearchParams();
  const itemId = (searchParams.get("item_id") || "").trim();
  const itemSubCode = (searchParams.get("item_sub_code") || "").trim();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!itemId) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    axios
      .get(REPAIR_HISTORY_URL, { params: { item_id: itemId } })
      .then((res) => {
        if (cancelled) return;
        const list = extractRows(res);
        setRows(Array.isArray(list) ? list.filter((r) => r && typeof r === "object") : []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Repair history fetch failed:", err);
        setError(err.response?.data?.msg || err.message || "Request failed");
        setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const columns = useMemo(() => {
    if (!rows.length) return [];
    const keys = new Set();
    rows.forEach((r) => Object.keys(r).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [rows]);

  const imageCols = useMemo(() => {
    const set = new Set();
    columns.forEach((col) => {
      if (isImageColumnKey(col, rows)) set.add(col);
    });
    return set;
  }, [columns, rows]);

  const listBackPath = itemSubCode
    ? `/damage-report/list?item_sub_code=${encodeURIComponent(itemSubCode)}`
    : "/damage-report";

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
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:p-3">
            <div className="shrink-0 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-3 px-3 py-2">
                <Link
                  to={listBackPath}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 hover:text-amber-950"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {itemSubCode ? "Damaged units" : "Damage report"}
                </Link>
                <span className="text-slate-300">|</span>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm font-semibold text-slate-900">Repair history</h1>
                  <p className="font-mono text-[11px] text-slate-500">item_id={itemId || "—"}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5 text-[11px] text-slate-600">
                <span className="tabular-nums">
                  <span className="text-slate-400">Records</span>{" "}
                  <span className="font-semibold text-slate-900">{loading ? "—" : rows.length}</span>
                </span>
              </div>
            </div>

            {!itemId ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-16 shadow-sm">
                <p className="text-sm font-medium text-slate-900">Missing item_id</p>
                <p className="mt-1 text-sm text-slate-500">Open this page from a damaged unit row.</p>
                <Link
                  to="/damage-report"
                  className="mt-4 text-[11px] font-semibold text-amber-700 hover:text-amber-900"
                >
                  Back to damage report
                </Link>
              </div>
            ) : loading ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                <p className="mt-3 text-xs font-medium text-slate-500">Loading repair history…</p>
              </div>
            ) : error ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-red-100 bg-red-50/50 px-6 py-12">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-16 shadow-sm">
                <p className="text-sm font-medium text-slate-900">No repair history</p>
                <p className="mt-1 text-sm text-slate-500">No records returned for this item.</p>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="min-h-0 flex-1 overflow-auto">
                  <table className="min-w-full border-collapse text-xs [&_td]:border-r [&_td]:border-slate-200 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-200 [&_th:last-child]:border-r-0">
                    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100">
                      <tr>
                        <th className={thClass}>#</th>
                        {columns.map((col) => (
                          <th key={col} className={thClass}>
                            {col.replace(/_/g, " ")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, i) => (
                        <tr key={i} className={i % 2 === 1 ? "bg-slate-50/50" : "bg-white"}>
                          <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-500">
                            {i + 1}
                          </td>
                          {columns.map((col) => {
                            const imgUrls = parseImageUrls(row[col]);
                            if (imageCols.has(col)) {
                              return (
                                <td key={col} className="max-w-[240px] px-2 py-2 align-middle">
                                  <DamageImagePreviewTrigger
                                    urls={imgUrls}
                                    onOpen={(urls) => setImagePreview({ urls })}
                                    compact
                                  />
                                </td>
                              );
                            }
                            return (
                              <td
                                key={col}
                                className="max-w-[200px] truncate px-2 py-2 text-slate-800"
                                title={formatCell(row[col])}
                              >
                                {formatCell(row[col])}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <ImagePreviewLightbox
        open={Boolean(imagePreview?.urls?.length)}
        urls={imagePreview?.urls || []}
        onClose={() => setImagePreview(null)}
      />
    </div>
  );
};

export default RepairHistoryPage;
