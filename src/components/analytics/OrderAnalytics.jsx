import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import { AlertCircle, RefreshCw } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const API_ITEM_DAMAGE = "https://ems.binlaundry.com/irrl/analytics/item-damage";
const API_ITEM_RENTAL = "https://ems.binlaundry.com/irrl/analytics/item-rental";
const API_ORDER_STATUS = "https://ems.binlaundry.com/irrl/analytics/order-status";

/** Bar chart outer wrapper (relative + flex-1 + min-h-0 so grid cells split height) */
const chartFillClass = "relative min-h-0 w-full flex-1";

const rupee = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function truncateLabel(s, max = 16) {
  const t = String(s ?? "");
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/** Normalize API row keys */
function itemDisplayName(row) {
  return (
    row.item_name ??
    row.itemName ??
    row.name ??
    row.item_code ??
    row.sub_code ??
    row.item ??
    "—"
  );
}

function itemDamageCount(row) {
  return (
    Number(
      row.damage_count ??
        row.damage_frequency ??
        row.damageCount ??
        row.count ??
        row.damaged_count ??
        0
    ) || 0
  );
}

function itemRentalCount(row) {
  return (
    Number(
      row.rental_count ??
        row.rent_count ??
        row.rentalCount ??
        row.order_count ??
        row.orders ??
        0
    ) || 0
  );
}

function itemRentalRevenue(row) {
  return (
    Number(
      row.total_revenue ??
        row.total_revenue_amount ??
        row.revenue ??
        row.generated_amount ??
        0
    ) || 0
  );
}

function statusLabel(row) {
  return String(row.status ?? row.order_status ?? row.Status ?? "").trim() || "Unknown";
}

function statusCount(row) {
  return Number(row.count ?? row.order_count ?? row.total ?? row.orders ?? 0) || 0;
}

const STATUS_COLORS = [
  "rgba(245, 158, 11, 0.85)",
  "rgba(59, 130, 246, 0.85)",
  "rgba(16, 185, 129, 0.85)",
  "rgba(239, 68, 68, 0.85)",
  "rgba(139, 92, 246, 0.85)",
  "rgba(236, 72, 153, 0.85)",
  "rgba(71, 85, 105, 0.85)",
  "rgba(20, 184, 166, 0.85)",
];

const OrderAnalytics = ({ onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemDamageRows, setItemDamageRows] = useState([]);
  const [itemRentalRows, setItemRentalRows] = useState([]);
  const [orderStatusRows, setOrderStatusRows] = useState([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dmg, rent, st] = await Promise.all([
        axios.get(API_ITEM_DAMAGE),
        axios.get(API_ITEM_RENTAL),
        axios.get(API_ORDER_STATUS),
      ]);
      setItemDamageRows(Array.isArray(dmg.data?.data) ? dmg.data.data : []);
      setItemRentalRows(Array.isArray(rent.data?.data) ? rent.data.data : []);
      setOrderStatusRows(Array.isArray(st.data?.data) ? st.data.data : []);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.msg || e.message || "Failed to load analytics");
      setItemDamageRows([]);
      setItemRentalRows([]);
      setOrderStatusRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const itemDamageChart = useMemo(() => {
    const labels = itemDamageRows.map((r) => truncateLabel(itemDisplayName(r)));
    return {
      labels,
      datasets: [
        {
          label: "Damage frequency",
          data: itemDamageRows.map((r) => itemDamageCount(r)),
          backgroundColor: itemDamageRows.map((_, i) =>
            `hsla(${18 + (i * 41) % 75}, 72%, 48%, 0.85)`
          ),
          borderColor: itemDamageRows.map((_, i) => `hsla(${18 + (i * 41) % 75}, 72%, 36%, 1)`),
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [itemDamageRows]);

  const itemRentalChart = useMemo(() => {
    const labels = itemRentalRows.map((r) => truncateLabel(itemDisplayName(r)));
    return {
      labels,
      datasets: [
        {
          label: "Rental count",
          data: itemRentalRows.map((r) => itemRentalCount(r)),
          backgroundColor: "rgba(59, 130, 246, 0.72)",
          borderColor: "rgba(37, 99, 235, 1)",
          borderWidth: 1,
          borderRadius: 6,
          yAxisID: "y1",
        },
        {
          label: "Revenue (₹)",
          data: itemRentalRows.map((r) => itemRentalRevenue(r)),
          backgroundColor: "rgba(245, 158, 11, 0.75)",
          borderColor: "rgba(217, 119, 6, 1)",
          borderWidth: 1,
          borderRadius: 6,
          yAxisID: "y",
        },
      ],
    };
  }, [itemRentalRows]);

  const orderStatusChart = useMemo(() => {
    const labels = orderStatusRows.map((r) => statusLabel(r));
    const counts = orderStatusRows.map((r) => statusCount(r));
    return {
      labels,
      datasets: [
        {
          data: counts,
          backgroundColor: orderStatusRows.map((_, i) => STATUS_COLORS[i % STATUS_COLORS.length]),
          borderColor: "#fff",
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    };
  }, [orderStatusRows]);

  const barOptionsBase = useMemo(
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
              if (items[0]?.dataset?.label === "Damage frequency") {
                return String(itemDisplayName(itemDamageRows[i]));
              }
              return items[0]?.label ?? "";
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { font: { size: 10 }, maxRotation: 50 },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
          grid: { color: "rgba(148, 163, 184, 0.2)" },
        },
      },
    }),
    [itemDamageRows]
  );

  const itemRentalOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "top", labels: { boxWidth: 10, font: { size: 9 }, padding: 6 } },
        tooltip: {
          callbacks: {
            title: (items) => {
              const i = items[0]?.dataIndex;
              return String(itemDisplayName(itemRentalRows[i]));
            },
            label: (ctx) => {
              if (ctx.dataset.label === "Revenue (₹)") {
                return ` ${ctx.dataset.label}: ${rupee(ctx.raw)}`;
              }
              return ` ${ctx.dataset.label}: ${ctx.raw}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { font: { size: 10 }, maxRotation: 50 },
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
          title: { display: true, text: "Rentals", font: { size: 11 } },
          grid: { drawOnChartArea: false },
        },
      },
    }),
    [itemRentalRows]
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 8, font: { size: 8 }, padding: 4 },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const v = ctx.raw;
              const pct = total ? ((v / total) * 100).toFixed(1) : 0;
              return ` ${ctx.label}: ${v} (${pct}%)`;
            },
          },
        },
      },
    }),
    []
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
                  Order analytics
                </h1>
                <p className="truncate text-[10px] text-slate-500 sm:text-[11px]">
                  Damage · rentals & revenue · status — IRRL
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
                {/* Item damage */}
                <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100">
                  <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-orange-50/90 to-white px-2.5 py-1.5">
                    <h2 className="text-xs font-bold text-slate-900">Item damage frequency</h2>
                    <p className="text-[10px] leading-tight text-slate-500">
                      Most damaged items first
                    </p>
                  </div>
                  {itemDamageRows.length === 0 ? (
                    <p className="flex flex-1 items-center justify-center py-6 text-xs text-slate-500">
                      No data
                    </p>
                  ) : (
                    <>
                      <div className={`${chartFillClass} px-2 pt-1`}>
                        <div className="absolute bottom-2 left-2 right-2 top-1">
                          <Bar data={itemDamageChart} options={barOptionsBase} />
                        </div>
                      </div>
                      <div className="max-h-[min(22vh,140px)] shrink-0 overflow-auto rounded border border-slate-100 mx-2 mb-2">
                        <table className="min-w-full border-collapse text-left">
                          <thead className="sticky top-0 bg-slate-50/95">
                            <tr className="border-b border-slate-100">
                              <th className={th}>#</th>
                              <th className={th}>Item</th>
                              <th className={`${th} text-right`}>Freq.</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {itemDamageRows.map((row, i) => (
                              <tr key={`${itemDisplayName(row)}-${i}`} className="hover:bg-orange-50/50">
                                <td className={`${td} py-1 font-mono text-slate-500`}>{i + 1}</td>
                                <td className={`${td} py-1 font-medium`}>{itemDisplayName(row)}</td>
                                <td className={`${td} py-1 text-right tabular-nums font-semibold text-orange-800`}>
                                  {itemDamageCount(row)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </section>

                {/* Order status */}
                <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100">
                  <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-violet-50/80 to-white px-2.5 py-1.5">
                    <h2 className="text-xs font-bold text-slate-900">Orders by status</h2>
                    <p className="text-[10px] leading-tight text-slate-500">
                      INITIATED, BLOCKED, COMPLETED…
                    </p>
                  </div>
                  {orderStatusRows.length === 0 ? (
                    <p className="flex flex-1 items-center justify-center py-6 text-xs text-slate-500">
                      No data
                    </p>
                  ) : (
                    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                      <div className="relative flex min-h-[100px] flex-1 items-center justify-center px-2 pt-1 lg:min-h-0">
                        <div className="relative aspect-square h-full max-h-[min(36vh,240px)] w-full max-w-[min(100%,240px)]">
                          <div className="absolute inset-0">
                            <Doughnut data={orderStatusChart} options={doughnutOptions} />
                          </div>
                        </div>
                      </div>
                      <div className="max-h-[min(22vh,140px)] shrink-0 overflow-auto rounded border border-slate-100 mx-2 mb-2">
                        <table className="min-w-full border-collapse text-left">
                          <thead className="sticky top-0 bg-slate-50/95">
                            <tr className="border-b border-slate-100">
                              <th className={th}>Status</th>
                              <th className={`${th} text-right`}>Orders</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {orderStatusRows.map((row, i) => (
                              <tr key={`${statusLabel(row)}-${i}`} className="hover:bg-violet-50/40">
                                <td className={`${td} py-1 font-semibold uppercase tracking-wide text-slate-800`}>
                                  {statusLabel(row)}
                                </td>
                                <td className={`${td} py-1 text-right tabular-nums font-semibold text-violet-900`}>
                                  {statusCount(row)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>

                {/* Item rental — full width bottom row */}
                <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100 lg:col-span-2">
                  <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-sky-50/70 via-amber-50/40 to-white px-2.5 py-1.5">
                    <h2 className="text-xs font-bold text-slate-900">Item rentals & revenue</h2>
                    <p className="text-[10px] leading-tight text-slate-500">
                      Rentals vs revenue per item
                    </p>
                  </div>
                  {itemRentalRows.length === 0 ? (
                    <p className="flex flex-1 items-center justify-center py-6 text-xs text-slate-500">
                      No data
                    </p>
                  ) : (
                    <>
                      <div className={`${chartFillClass} px-2 pt-1`}>
                        <div className="absolute bottom-2 left-2 right-2 top-1">
                          <Bar data={itemRentalChart} options={itemRentalOptions} />
                        </div>
                      </div>
                      <div className="max-h-[min(22vh,140px)] shrink-0 overflow-auto rounded border border-slate-100 mx-2 mb-2">
                        <table className="min-w-full border-collapse text-left">
                          <thead className="sticky top-0 bg-slate-50/95">
                            <tr className="border-b border-slate-100">
                              <th className={th}>#</th>
                              <th className={th}>Item</th>
                              <th className={`${th} text-right`}>Rentals</th>
                              <th className={`${th} text-right`}>Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {itemRentalRows.map((row, i) => (
                              <tr key={`${itemDisplayName(row)}-${i}`} className="hover:bg-sky-50/40">
                                <td className={`${td} py-1 font-mono text-slate-500`}>{i + 1}</td>
                                <td className={`${td} py-1 font-medium`}>{itemDisplayName(row)}</td>
                                <td className={`${td} py-1 text-right tabular-nums text-slate-800`}>
                                  {itemRentalCount(row)}
                                </td>
                                <td className={`${td} py-1 text-right tabular-nums font-semibold text-amber-800`}>
                                  {rupee(itemRentalRevenue(row))}
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

export default OrderAnalytics;
