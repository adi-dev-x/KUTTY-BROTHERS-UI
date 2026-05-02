import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import { AlertCircle, RefreshCw } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_DAMAGE = "https://ems.binlaundry.com/irrl/analytics/customer-damage";
const API_BLOCKED = "https://ems.binlaundry.com/irrl/analytics/customer-blocked";
const API_REVENUE = "https://ems.binlaundry.com/irrl/analytics/customer-revenue";

const chartFillClass = "relative min-h-0 w-full flex-1";

const rupee = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function truncateLabel(s, max = 18) {
  const t = String(s ?? "");
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

const CustomerAnalytics = ({ onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [damageRows, setDamageRows] = useState([]);
  const [blockedRows, setBlockedRows] = useState([]);
  const [revenueRows, setRevenueRows] = useState([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, b, r] = await Promise.all([
        axios.get(API_DAMAGE),
        axios.get(API_BLOCKED),
        axios.get(API_REVENUE),
      ]);
      setDamageRows(Array.isArray(d.data?.data) ? d.data.data : []);
      setBlockedRows(Array.isArray(b.data?.data) ? b.data.data : []);
      setRevenueRows(Array.isArray(r.data?.data) ? r.data.data : []);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.msg || e.message || "Failed to load analytics");
      setDamageRows([]);
      setBlockedRows([]);
      setRevenueRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const damageChart = useMemo(() => {
    const labels = damageRows.map((r) => truncateLabel(r.customer_name));
    return {
      labels,
      datasets: [
        {
          label: "Damaged items",
          data: damageRows.map((r) => Number(r.damage_count) || 0),
          backgroundColor: damageRows.map((_, i) =>
            `hsla(${12 + (i * 37) % 80}, 75%, 52%, 0.85)`
          ),
          borderColor: damageRows.map((_, i) => `hsla(${12 + (i * 37) % 80}, 75%, 38%, 1)`),
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [damageRows]);

  const blockedChart = useMemo(() => {
    const labels = blockedRows.map((r) => truncateLabel(r.customer_name));
    return {
      labels,
      datasets: [
        {
          label: "Blocked orders",
          data: blockedRows.map((r) => Number(r.blocked_count) || 0),
          backgroundColor: "rgba(225, 29, 72, 0.75)",
          borderColor: "rgba(190, 18, 60, 1)",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [blockedRows]);

  const revenueChart = useMemo(() => {
    const labels = revenueRows.map((r) => truncateLabel(r.customer_name));
    return {
      labels,
      datasets: [
        {
          label: "Revenue (₹)",
          data: revenueRows.map((r) => Number(r.total_revenue) || 0),
          backgroundColor: "rgba(245, 158, 11, 0.75)",
          borderColor: "rgba(217, 119, 6, 1)",
          borderWidth: 1,
          borderRadius: 6,
          yAxisID: "y",
        },
        {
          label: "Order count",
          data: revenueRows.map((r) => Number(r.order_count) || 0),
          backgroundColor: "rgba(71, 85, 105, 0.55)",
          borderColor: "rgba(51, 65, 85, 0.9)",
          borderWidth: 1,
          borderRadius: 6,
          yAxisID: "y1",
        },
      ],
    };
  }, [revenueRows]);

  const barOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: { boxWidth: 10, font: { size: 9 }, padding: 6 },
        },
        tooltip: {
          callbacks: {
            title: (items) => {
              const i = items[0]?.dataIndex;
              const rows =
                items[0]?.dataset?.label === "Damaged items"
                  ? damageRows
                  : items[0]?.dataset?.label === "Blocked orders"
                    ? blockedRows
                    : revenueRows;
              return rows[i]?.customer_name ?? items[0]?.label;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { font: { size: 10 }, maxRotation: 45 },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
          grid: { color: "rgba(148, 163, 184, 0.2)" },
        },
      },
    }),
    [damageRows, blockedRows, revenueRows]
  );

  const revenueBarOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: { boxWidth: 10, font: { size: 9 }, padding: 6 },
        },
        tooltip: {
          callbacks: {
            title: (items) => {
              const i = items[0]?.dataIndex;
              return revenueRows[i]?.customer_name ?? "";
            },
            label: (ctx) => {
              if (ctx.dataset.label === "Revenue (₹)") {
                return ` Revenue: ${rupee(ctx.raw)}`;
              }
              return ` Orders: ${ctx.raw}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { font: { size: 10 }, maxRotation: 45 },
          grid: { display: false },
        },
        y: {
          type: "linear",
          position: "left",
          beginAtZero: true,
          title: { display: true, text: "Revenue (₹)", font: { size: 11 } },
          ticks: {
            callback: (v) =>
              Number(v) >= 1e5 ? `${(v / 1e5).toFixed(1)}L` : Number(v).toLocaleString("en-IN"),
          },
          grid: { color: "rgba(148, 163, 184, 0.2)" },
        },
        y1: {
          type: "linear",
          position: "right",
          beginAtZero: true,
          title: { display: true, text: "Orders", font: { size: 11 } },
          grid: { drawOnChartArea: false },
        },
      },
    }),
    [revenueRows]
  );

  const th = "px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500";
  const td = "px-2 py-1.5 text-xs text-slate-800";

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
          <div className="shrink-0 border-b border-slate-200/80 bg-white/90 px-3 py-2 backdrop-blur sm:px-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h1 className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                  Customer analytics
                </h1>
                <p className="truncate text-[10px] text-slate-500 sm:text-[11px]">
                  Damage · blocked · revenue — IRRL
                </p>
              </div>
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-3">
            {error && (
              <div className="mb-2 flex shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-800">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                <p className="mt-2 text-xs font-medium text-slate-500">Loading analytics…</p>
              </div>
            ) : (
              <div className="mx-auto grid min-h-0 w-full max-w-[1800px] flex-1 grid-cols-1 gap-2 lg:grid-cols-2 lg:grid-rows-2 lg:gap-3 lg:[grid-template-rows:minmax(0,1fr)_minmax(0,1fr)]">
                {/* Damage */}
                <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100">
                  <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-amber-50/80 to-white px-2.5 py-1.5">
                    <h2 className="text-xs font-bold text-slate-900">Damage returns</h2>
                    <p className="text-[10px] leading-tight text-slate-500">By damaged items returned</p>
                  </div>
                  {damageRows.length === 0 ? (
                    <p className="flex flex-1 items-center justify-center py-6 text-xs text-slate-500">
                      No data
                    </p>
                  ) : (
                    <>
                      <div className={`${chartFillClass} px-2 pt-1`}>
                        <div className="absolute bottom-2 left-2 right-2 top-1">
                          <Bar data={damageChart} options={barOptions} />
                        </div>
                      </div>
                      <div className="max-h-[min(22vh,140px)] shrink-0 overflow-auto rounded border border-slate-100 mx-2 mb-2">
                        <table className="min-w-full border-collapse text-left">
                          <thead className="sticky top-0 bg-slate-50/95">
                            <tr className="border-b border-slate-100">
                              <th className={th}>#</th>
                              <th className={th}>Customer</th>
                              <th className={`${th} text-right`}>Damage</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {damageRows.map((row, i) => (
                              <tr key={`${row.customer_name}-${i}`} className="hover:bg-amber-50/40">
                                <td className={`${td} py-1 font-mono text-slate-500`}>{i + 1}</td>
                                <td className={`${td} py-1 font-medium`}>{row.customer_name || "—"}</td>
                                <td className={`${td} py-1 text-right tabular-nums font-semibold text-rose-700`}>
                                  {row.damage_count ?? "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </section>

                {/* Blocked */}
                <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100">
                  <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-rose-50/80 to-white px-2.5 py-1.5">
                    <h2 className="text-xs font-bold text-slate-900">Blocked orders</h2>
                    <p className="text-[10px] leading-tight text-slate-500">Most blocked first</p>
                  </div>
                  {blockedRows.length === 0 ? (
                    <p className="flex flex-1 items-center justify-center py-6 text-xs text-slate-500">
                      No data
                    </p>
                  ) : (
                    <>
                      <div className={`${chartFillClass} px-2 pt-1`}>
                        <div className="absolute bottom-2 left-2 right-2 top-1">
                          <Bar data={blockedChart} options={barOptions} />
                        </div>
                      </div>
                      <div className="max-h-[min(22vh,140px)] shrink-0 overflow-auto rounded border border-slate-100 mx-2 mb-2">
                        <table className="min-w-full border-collapse text-left">
                          <thead className="sticky top-0 bg-slate-50/95">
                            <tr className="border-b border-slate-100">
                              <th className={th}>#</th>
                              <th className={th}>Customer</th>
                              <th className={`${th} text-right`}>Blocked</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {blockedRows.map((row, i) => (
                              <tr key={`${row.customer_name}-${i}`} className="hover:bg-rose-50/40">
                                <td className={`${td} py-1 font-mono text-slate-500`}>{i + 1}</td>
                                <td className={`${td} py-1 font-medium`}>{row.customer_name || "—"}</td>
                                <td className={`${td} py-1 text-right tabular-nums font-semibold text-rose-800`}>
                                  {row.blocked_count ?? "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </section>

                {/* Revenue full width */}
                <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100 lg:col-span-2">
                  <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 via-amber-50/40 to-white px-2.5 py-1.5">
                    <h2 className="text-xs font-bold text-slate-900">Revenue & order volume</h2>
                    <p className="text-[10px] leading-tight text-slate-500">
                      Revenue vs order count per customer
                    </p>
                  </div>
                  {revenueRows.length === 0 ? (
                    <p className="flex flex-1 items-center justify-center py-6 text-xs text-slate-500">
                      No data
                    </p>
                  ) : (
                    <>
                      <div className={`${chartFillClass} px-2 pt-1`}>
                        <div className="absolute bottom-2 left-2 right-2 top-1">
                          <Bar data={revenueChart} options={revenueBarOptions} />
                        </div>
                      </div>
                      <div className="max-h-[min(22vh,140px)] shrink-0 overflow-auto rounded border border-slate-100 mx-2 mb-2">
                        <table className="min-w-full border-collapse text-left">
                          <thead className="sticky top-0 bg-slate-50/95">
                            <tr className="border-b border-slate-100">
                              <th className={th}>#</th>
                              <th className={th}>Customer</th>
                              <th className={`${th} text-right`}>Revenue</th>
                              <th className={`${th} text-right`}>Orders</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {revenueRows.map((row, i) => (
                              <tr key={`${row.customer_name}-${i}`} className="hover:bg-amber-50/40">
                                <td className={`${td} py-1 font-mono text-slate-500`}>{i + 1}</td>
                                <td className={`${td} py-1 font-medium`}>{row.customer_name || "—"}</td>
                                <td className={`${td} py-1 text-right tabular-nums font-semibold text-amber-800`}>
                                  {rupee(row.total_revenue)}
                                </td>
                                <td className={`${td} py-1 text-right tabular-nums text-slate-700`}>
                                  {row.order_count ?? "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerAnalytics;
