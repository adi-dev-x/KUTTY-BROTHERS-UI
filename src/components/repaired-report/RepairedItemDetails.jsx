import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Package } from "lucide-react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

const REPAIRING_LIST_URL = "https://ems.binlaundry.com/irrl/repairing/list";
const MARK_REPAIRING_URL = "https://ems.binlaundry.com/irrl/markRepairing";

const thClass =
  "whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600";

function getRowItemId(row) {
  const itemId =
    row?.item_id ?? row?.Item_Id ?? row?.itemId ?? row?.inventory_id ?? row?.inventoryId;
  if (itemId === null || itemId === undefined) return "";
  return String(itemId).trim();
}

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

const RepairedItemDetails = ({ onLogout }) => {
  const { item_sub_code: itemSubCodeParam } = useParams();
  const navigate = useNavigate();
  const itemSubCode = itemSubCodeParam ? decodeURIComponent(itemSubCodeParam) : "";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  /** `item_id` string currently clearing via markRepairing — disables buttons while set */
  const [clearingId, setClearingId] = useState(null);

  const handleMarkAsRepaired = async (e, row) => {
    e.preventDefault();
    e.stopPropagation();
    const idStr = getRowItemId(row);
    if (!idStr) {
      alert("Missing item id for this row.");
      return;
    }
    try {
      setClearingId(idStr);
      await axios.post(
        MARK_REPAIRING_URL,
        { item_id: idStr, clear: true },
        { headers: { "Content-Type": "application/json" } }
      );
      const res = await axios.get(REPAIRING_LIST_URL, {
        params: { item_sub_code: itemSubCode },
      });
      const list = res.data?.data;
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("markRepairing failed:", err);
      alert(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          err.message ||
          "Could not update repair status."
      );
    } finally {
      setClearingId(null);
    }
  };

  useEffect(() => {
    if (!itemSubCode) {
      setLoading(false);
      setRows([]);
      setError("Missing item sub code.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = `${REPAIRING_LIST_URL}?item_sub_code=${encodeURIComponent(itemSubCode)}`;

    fetch(url)
      .then((res) => res.json().then((body) => ({ ok: res.ok, status: res.status, body })))
      .then(({ ok, status, body }) => {
        if (cancelled) return;
        if (!ok) {
          setError(body?.msg || `Request failed (${status})`);
          setRows([]);
          return;
        }
        const list = Array.isArray(body?.data) ? body.data : [];
        setRows(list);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Repaired item details fetch failed:", err);
        setError(err?.message || "Failed to load details");
        setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [itemSubCode]);

  const titleSub = useMemo(() => itemSubCode || "—", [itemSubCode]);

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
              <div className="flex flex-wrap items-start justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => navigate("/repaired-report")}
                    className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to repaired report
                  </button>
                  <h1 className="text-sm font-semibold text-slate-900">Repaired item details</h1>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-600">
                    <span className="text-slate-400">item_sub_code</span> {titleSub}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    <span className="font-mono text-slate-600">GET /irrl/repairing/list?item_sub_code=…</span>
                  </p>
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
                <p className="mt-3 text-xs font-medium text-slate-500">Loading details…</p>
              </div>
            ) : !itemSubCode ? null : rows.length === 0 ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-16 shadow-sm">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Package className="h-7 w-7" />
                </div>
                <p className="text-sm font-medium text-slate-900">No repairing rows</p>
                <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
                  The API returned no records for this sub code.
                </p>
              </div>
            ) : (
              <div className="flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="min-h-0 flex-1 overflow-auto">
                  <table className="min-w-full border-collapse text-xs [&_td]:border-r [&_td]:border-slate-200 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-200 [&_th:last-child]:border-r-0">
                    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100">
                      <tr>
                        <th className={thClass}>Item ID</th>
                        <th className={thClass}>Item code</th>
                        <th className={thClass}>Sub code</th>
                        <th className={thClass}>Item name</th>
                        <th className={thClass}>Main type</th>
                        <th className={thClass}>Sub type</th>
                        <th className={thClass}>Brand</th>
                        <th className={thClass}>Category</th>
                        <th className={thClass}>Main code</th>
                        <th className={thClass}>HSN</th>
                        <th className={thClass}>Description</th>
                        <th className={thClass}>Created</th>
                        <th className={`${thClass} w-[1%]`}>Repair</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, index) => (
                        <tr
                          key={row.item_id || `${row.item_code}-${index}`}
                          className={index % 2 === 1 ? "bg-slate-50/50" : "bg-white"}
                        >
                          <td
                            className="max-w-[120px] truncate px-2 py-2 font-mono text-[10px] text-slate-500"
                            title={row.item_id || ""}
                          >
                            {row.item_id || "—"}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-800">
                            {row.item_code || "—"}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] font-medium text-emerald-800">
                            {row.sub_code || "—"}
                          </td>
                          <td className="max-w-[200px] truncate px-2 py-2 font-medium text-slate-900" title={row.item_name}>
                            {row.item_name || "—"}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-slate-700">{row.item_main_type || "—"}</td>
                          <td className="whitespace-nowrap px-2 py-2 text-slate-700">{row.item_sub_type || "—"}</td>
                          <td className="whitespace-nowrap px-2 py-2 text-slate-700">{row.brand || "—"}</td>
                          <td className="whitespace-nowrap px-2 py-2 text-slate-700">{row.category || "—"}</td>
                          <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-800">
                            {row.main_code || "—"}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-700">
                            {row.hsn_code || "—"}
                          </td>
                          <td className="max-w-[180px] truncate px-2 py-2 text-slate-600" title={row.description}>
                            {row.description || "—"}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-slate-600">{formatWhen(row.created_at)}</td>
                          <td
                            className="whitespace-nowrap px-2 py-2 align-middle"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              disabled={clearingId !== null}
                              onClick={(e) => handleMarkAsRepaired(e, row)}
                              className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs"
                            >
                              {clearingId === getRowItemId(row) ? "…" : "Mark as repaired"}
                            </button>
                          </td>
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
    </div>
  );
};

export default RepairedItemDetails;
