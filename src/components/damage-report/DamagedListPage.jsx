import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import {
  collectImageUrlsFromRecord,
  ImagePreviewLightbox,
  DamageImagePreviewTrigger,
} from "./DamageImagePreview";

const DAMAGED_LIST_URL = "https://ems.binlaundry.com/irrl/damaged/list";

const thClass =
  "whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString();
  } catch {
    return String(iso);
  }
}

/** Separate page: GET /irrl/damaged/list?item_sub_code=… via query ?item_sub_code= */
const DamagedListPage = ({ onLogout }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const itemSubCode = (searchParams.get("item_sub_code") || "").trim();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!itemSubCode) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    axios
      .get(DAMAGED_LIST_URL, { params: { item_sub_code: itemSubCode } })
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data;
        setRows(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Damaged list fetch failed:", err);
        setError(err.response?.data?.msg || err.message || "Request failed");
        setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [itemSubCode]);

  const goToRepairHistory = (d) => {
    const id =
      d.item_id ??
      d.Item_Id ??
      d.itemId ??
      d.inventory_id ??
      d.inventoryId;
    if (id === null || id === undefined || String(id).trim() === "") {
      alert("Missing item id for this row. Cannot open repair history.");
      return;
    }
    const q = new URLSearchParams();
    q.set("item_id", String(id).trim());
    if (itemSubCode) q.set("item_sub_code", itemSubCode);
    navigate(`/repairHistory?${q.toString()}`);
  };

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
                  to="/damage-report"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 hover:text-amber-950"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Damage report
                </Link>
                <span className="text-slate-300">|</span>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm font-semibold text-slate-900">Damaged units</h1>
                  <p className="font-mono text-[11px] text-slate-500">item_sub_code={itemSubCode || "—"}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5 text-[11px] text-slate-600">
                <span className="tabular-nums">
                  <span className="text-slate-400">Records</span>{" "}
                  <span className="font-semibold text-slate-900">{loading ? "—" : rows.length}</span>
                </span>
                {itemSubCode && !loading && rows.length > 0 ? (
                  <span className="text-slate-500">Click a row for repair history.</span>
                ) : null}
              </div>
            </div>

            {!itemSubCode ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-16 shadow-sm">
                <p className="text-sm font-medium text-slate-900">Missing item_sub_code</p>
                <p className="mt-1 text-sm text-slate-500">Choose a row on the damage report to open this page.</p>
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
                <p className="mt-3 text-xs font-medium text-slate-500">Loading damaged units…</p>
              </div>
            ) : error ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-red-100 bg-red-50/50 px-6 py-12">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="min-h-0 flex-1 overflow-auto">
                  {rows.length === 0 ? (
                    <p className="px-4 py-12 text-center text-sm text-slate-600">No damaged unit records returned.</p>
                  ) : (
                    <table className="min-w-full border-collapse text-xs [&_td]:border-r [&_td]:border-slate-200 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-200 [&_th:last-child]:border-r-0">
                      <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100">
                        <tr>
                          <th className={thClass}>Item code</th>
                          <th className={thClass}>Sub code</th>
                          <th className={thClass}>Item name</th>
                          <th className={thClass}>Brand</th>
                          <th className={thClass}>Main type</th>
                          <th className={thClass}>Sub type</th>
                          <th className={thClass}>Category</th>
                          <th className={thClass}>Description</th>
                          <th className={thClass}>Main code</th>
                          <th className={thClass}>HSN</th>
                          <th className={thClass}>Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((d, i) => (
                          <tr
                            key={d.item_id || `${d.sub_code}-${i}`}
                            onClick={() => goToRepairHistory(d)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                goToRepairHistory(d);
                              }
                            }}
                            className={`cursor-pointer transition-colors hover:bg-amber-50/50 focus:bg-amber-50/50 focus:outline-none ${i % 2 === 1 ? "bg-slate-50/50" : "bg-white"}`}
                          >
                            <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-800">
                              {d.item_code || "—"}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-700">
                              {d.sub_code || "—"}
                            </td>
                            <td className="max-w-[140px] truncate px-2 py-2 text-slate-900" title={d.item_name}>
                              {d.item_name || "—"}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-slate-700">{d.brand || "—"}</td>
                            <td className="max-w-[100px] truncate px-2 py-2 text-slate-600" title={d.item_main_type}>
                              {d.item_main_type || "—"}
                            </td>
                            <td className="max-w-[100px] truncate px-2 py-2 text-slate-600" title={d.item_sub_type}>
                              {d.item_sub_type || "—"}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-slate-700">{d.category || "—"}</td>
                            <td className="max-w-[160px] truncate px-2 py-2 text-slate-600" title={d.description}>
                              {d.description || "—"}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-700">
                              {d.main_code || "—"}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-700">
                              {d.hsn_code ?? "—"}
                            </td>
                            <td
                              className="whitespace-nowrap px-2 py-2 align-middle"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              <DamageImagePreviewTrigger
                                urls={collectImageUrlsFromRecord(d)}
                                onOpen={(urls) => setImagePreview({ urls })}
                              />
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-slate-600">{formatWhen(d.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
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

export default DamagedListPage;
