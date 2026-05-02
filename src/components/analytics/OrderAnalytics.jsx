import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import { AlertCircle, RefreshCw } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE = "https://ems.binlaundry.com/irrl/analytics";
const API_ITEM_DAMAGE = `${API_BASE}/item-damage`;
const API_ITEM_RENTAL = `${API_BASE}/item-rental`;
const API_ORDER_STATUS = `${API_BASE}/order-status`;
const API_COST_SUMMARY = `${API_BASE}/cost/summary`;
const API_COST_REPAIR = `${API_BASE}/cost/repair-costs`;
const API_COST_OUTSTANDING = `${API_BASE}/cost/outstanding-balances`;

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

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeCostSummary(payload) {
  const root = payload?.data ?? payload ?? {};
  const d = typeof root === "object" && root !== null && !Array.isArray(root) ? root : {};
  return {
    total_revenue: num(d.total_revenue ?? d.totalRevenue ?? d.revenue ?? d.generated_amount),
    total_orders: num(d.total_orders ?? d.totalOrders ?? d.order_count ?? d.orders),
    avg_order_value: num(d.avg_order_value ?? d.average_order_value ?? d.aov ?? d.avgOrderValue),
    advance_collected: num(d.advance_collected ?? d.advanceCollected ?? d.advance ?? d.total_advance),
    outstanding_dues: num(d.outstanding_dues ?? d.outstandingDues ?? d.outstanding ?? d.dues),
    repair_costs: num(d.repair_costs ?? d.repairCosts ?? d.damage_cost ?? d.total_repair_cost),
    discounts: num(d.discounts ?? d.total_discounts ?? d.discount_amount),
  };
}

function normalizeCostTrendRows(payload) {
  const raw = payload?.data ?? payload;
  let arr = [];
  if (Array.isArray(raw)) arr = raw;
  else if (Array.isArray(raw?.items)) arr = raw.items;
  else if (Array.isArray(raw?.series)) arr = raw.series;
  else if (Array.isArray(raw?.data)) arr = raw.data;
  if (!Array.isArray(arr)) return [];
  return arr.map((row, i) => {
    const period =
      row.period ??
      row.label ??
      row.month ??
      row.week ??
      row.date ??
      row.bucket ??
      row.time_period ??
      `P${i + 1}`;
    const revenue = num(
      row.revenue ??
        row.total_revenue ??
        row.amount ??
        row.value ??
        row.generated ??
        row.total ??
        0
    );
    return { period: String(period), revenue };
  });
}

function repairItemLabel(row) {
  return String(
    row.item_type ??
      row.itemType ??
      row.type ??
      row.category ??
      row.item_name ??
      row.name ??
      "—"
  );
}

function repairCostAmount(row) {
  return num(
    row.repair_cost ??
      row.repairCost ??
      row.cost ??
      row.total_cost ??
      row.amount ??
      row.damage_cost ??
      0
  );
}

function outstandingOrderLabel(row, i) {
  const id = row.order_id ?? row.orderId ?? row.order_no ?? row.order_number ?? row.id;
  if (id != null && id !== "") return String(id);
  return `#${i + 1}`;
}

function outstandingGenerated(row) {
  return num(row.generated_amount ?? row.generatedAmount ?? row.generated ?? row.total ?? row.invoice_amount);
}

function outstandingAdvance(row) {
  return num(row.advance ?? row.advance_collected ?? row.advanceCollected ?? row.paid ?? row.advance_amount);
}

function outstandingBalance(row) {
  const bal = row.outstanding ?? row.balance ?? row.due ?? row.outstanding_balance ?? row.outstandingBalance;
  if (bal != null && bal !== "") return num(bal);
  const gen = outstandingGenerated(row);
  const adv = outstandingAdvance(row);
  return Math.max(0, gen - adv);
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
  const [mainTab, setMainTab] = useState("orders");
  const [itemDamageRows, setItemDamageRows] = useState([]);
  const [itemRentalRows, setItemRentalRows] = useState([]);
  const [orderStatusRows, setOrderStatusRows] = useState([]);
  const [costSummary, setCostSummary] = useState(null);
  const [revenueTrendRows, setRevenueTrendRows] = useState([]);
  const [repairCostRows, setRepairCostRows] = useState([]);
  const [outstandingRows, setOutstandingRows] = useState([]);
  const [trendPeriod, setTrendPeriod] = useState("monthly");
  const [trendLimit, setTrendLimit] = useState(12);
  const [costErrors, setCostErrors] = useState({});
  const [trendLoading, setTrendLoading] = useState(false);
  const trendBoot = useRef(false);

  const loadRevenueTrendOnly = useCallback(async () => {
    const url = `${API_BASE}/cost/revenue-trend?period=${encodeURIComponent(trendPeriod)}&limit=${encodeURIComponent(String(trendLimit))}`;
    setTrendLoading(true);
    try {
      const tr = await axios.get(url);
      setRevenueTrendRows(normalizeCostTrendRows(tr.data));
      setCostErrors((prev) => {
        const next = { ...prev };
        delete next.trend;
        return next;
      });
    } catch (e) {
      console.error(e);
      setRevenueTrendRows([]);
      setCostErrors((prev) => ({
        ...prev,
        trend: e.response?.data?.msg || e.message || "Failed to load trend",
      }));
    } finally {
      setTrendLoading(false);
    }
  }, [trendPeriod, trendLimit]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const trendUrl = `${API_BASE}/cost/revenue-trend?period=${encodeURIComponent(trendPeriod)}&limit=${encodeURIComponent(String(trendLimit))}`;
      const settled = await Promise.allSettled([
        axios.get(API_ITEM_DAMAGE),
        axios.get(API_ITEM_RENTAL),
        axios.get(API_ORDER_STATUS),
        axios.get(API_COST_SUMMARY),
        axios.get(trendUrl),
        axios.get(API_COST_REPAIR),
        axios.get(API_COST_OUTSTANDING),
      ]);

      const nextCostErrors = {};

      const failMsg = (r) =>
        r.status === "rejected"
          ? r.reason?.response?.data?.msg || r.reason?.message || "Failed"
          : null;

      if (settled[0].status === "fulfilled") {
        const dmg = settled[0].value;
        setItemDamageRows(Array.isArray(dmg.data?.data) ? dmg.data.data : []);
      } else {
        setItemDamageRows([]);
        nextCostErrors.damage = failMsg(settled[0]);
      }

      if (settled[1].status === "fulfilled") {
        const rent = settled[1].value;
        setItemRentalRows(Array.isArray(rent.data?.data) ? rent.data.data : []);
      } else {
        setItemRentalRows([]);
        nextCostErrors.rental = failMsg(settled[1]);
      }

      if (settled[2].status === "fulfilled") {
        const st = settled[2].value;
        setOrderStatusRows(Array.isArray(st.data?.data) ? st.data.data : []);
      } else {
        setOrderStatusRows([]);
        nextCostErrors.status = failMsg(settled[2]);
      }

      if (settled[3].status === "fulfilled") {
        setCostSummary(normalizeCostSummary(settled[3].value.data));
      } else {
        setCostSummary(null);
        nextCostErrors.summary = failMsg(settled[3]);
      }

      if (settled[4].status === "fulfilled") {
        setRevenueTrendRows(normalizeCostTrendRows(settled[4].value.data));
      } else {
        setRevenueTrendRows([]);
        nextCostErrors.trend = failMsg(settled[4]);
      }

      if (settled[5].status === "fulfilled") {
        const raw = settled[5].value.data?.data ?? settled[5].value.data;
        setRepairCostRows(Array.isArray(raw) ? raw : []);
      } else {
        setRepairCostRows([]);
        nextCostErrors.repair = failMsg(settled[5]);
      }

      if (settled[6].status === "fulfilled") {
        const raw = settled[6].value.data?.data ?? settled[6].value.data;
        setOutstandingRows(Array.isArray(raw) ? raw : []);
      } else {
        setOutstandingRows([]);
        nextCostErrors.outstanding = failMsg(settled[6]);
      }

      setCostErrors(nextCostErrors);
      const allFailed = settled.every((s) => s.status === "rejected");
      if (allFailed) {
        setError("Failed to load analytics");
      }
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.msg || e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!trendBoot.current) {
      trendBoot.current = true;
      return;
    }
    loadRevenueTrendOnly();
  }, [trendPeriod, trendLimit, loadRevenueTrendOnly]);

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

  const revenueTrendChart = useMemo(() => {
    const labels = revenueTrendRows.map((r) => truncateLabel(r.period, 14));
    return {
      labels,
      datasets: [
        {
          label: "Revenue (₹)",
          data: revenueTrendRows.map((r) => r.revenue),
          borderColor: "rgb(217, 119, 6)",
          backgroundColor: "rgba(245, 158, 11, 0.18)",
          fill: true,
          tension: 0.28,
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [revenueTrendRows]);

  const revenueTrendOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: { boxWidth: 10, font: { size: 9 }, padding: 4 },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${rupee(ctx.raw)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { font: { size: 9 }, maxRotation: 45 },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) =>
              Number(v) >= 1e5 ? `${(v / 1e5).toFixed(1)}L` : Number(v).toLocaleString("en-IN"),
          },
          grid: { color: "rgba(148, 163, 184, 0.2)" },
        },
      },
    }),
    []
  );

  const repairCostChartData = useMemo(() => {
    const labels = repairCostRows.map((r) => truncateLabel(repairItemLabel(r)));
    return {
      labels,
      datasets: [
        {
          label: "Repair cost (₹)",
          data: repairCostRows.map((r) => repairCostAmount(r)),
          backgroundColor: repairCostRows.map((_, i) =>
            `hsla(${8 + (i * 37) % 72}, 70%, 46%, 0.82)`
          ),
          borderColor: repairCostRows.map((_, i) => `hsla(${8 + (i * 37) % 72}, 70%, 34%, 1)`),
          borderWidth: 1,
          borderRadius: 5,
        },
      ],
    };
  }, [repairCostRows]);

  const repairCostBarOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => {
              const i = items[0]?.dataIndex;
              return String(repairItemLabel(repairCostRows[i]));
            },
            label: (ctx) => ` ${rupee(ctx.raw)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { font: { size: 9 }, maxRotation: 55 },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) =>
              Number(v) >= 1e5 ? `${(v / 1e5).toFixed(1)}L` : Number(v).toLocaleString("en-IN"),
          },
          grid: { color: "rgba(148, 163, 184, 0.2)" },
        },
      },
    }),
    [repairCostRows]
  );

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
                  Inventory · cost summary · revenue trend — IRRL
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
              <>
                <div className="mb-2 shrink-0 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
                  {[
                    { key: "rev", label: "Total revenue", val: !costErrors.summary && costSummary ? rupee(costSummary.total_revenue) : "—" },
                    { key: "ord", label: "Orders", val: !costErrors.summary && costSummary ? String(Math.round(costSummary.total_orders || 0).toLocaleString("en-IN")) : "—" },
                    { key: "aov", label: "Avg order value", val: !costErrors.summary && costSummary ? rupee(costSummary.avg_order_value) : "—" },
                    { key: "adv", label: "Advance collected", val: !costErrors.summary && costSummary ? rupee(costSummary.advance_collected) : "—" },
                    { key: "out", label: "Outstanding", val: !costErrors.summary && costSummary ? rupee(costSummary.outstanding_dues) : "—" },
                    { key: "rep", label: "Repair costs", val: !costErrors.summary && costSummary ? rupee(costSummary.repair_costs) : "—" },
                    { key: "disc", label: "Discounts", val: !costErrors.summary && costSummary ? rupee(costSummary.discounts) : "—" },
                  ].map((m) => (
                    <div
                      key={m.key}
                      className="rounded-lg border border-slate-100 bg-white px-2 py-1.5 shadow-sm ring-1 ring-slate-50"
                    >
                      <div className="text-[9px] font-semibold uppercase leading-tight tracking-wide text-slate-500">
                        {m.label}
                      </div>
                      <div className="truncate text-[11px] font-bold tabular-nums text-slate-900 sm:text-xs">{m.val}</div>
                    </div>
                  ))}
                </div>

                <div className="mb-2 flex shrink-0 gap-1 rounded-lg border border-slate-200 bg-slate-100/90 p-0.5">
                  <button
                    type="button"
                    onClick={() => setMainTab("orders")}
                    className={`flex-1 rounded-md px-2 py-1.5 text-center text-[11px] font-semibold transition ${
                      mainTab === "orders"
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Orders & items
                  </button>
                  <button
                    type="button"
                    onClick={() => setMainTab("cost")}
                    className={`flex-1 rounded-md px-2 py-1.5 text-center text-[11px] font-semibold transition ${
                      mainTab === "cost"
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Cost & collections
                  </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {mainTab === "orders" ? (
                    <div className="mx-auto grid min-h-0 h-full w-full max-w-[1800px] flex-1 grid-cols-1 gap-2 lg:grid-cols-2 lg:grid-rows-2 lg:gap-3 lg:[grid-template-rows:minmax(0,1fr)_minmax(0,1fr)]">
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
                  ) : (
                    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                      <section className="flex min-h-0 flex-[1.1] flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100">
                        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-amber-50/60 to-white px-2.5 py-1.5">
                          <div className="min-w-0">
                            <h2 className="text-xs font-bold text-slate-900">Revenue trend</h2>
                            <p className="text-[10px] leading-tight text-slate-500">
                              Period & limit refresh the chart below
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <select
                              value={trendPeriod}
                              onChange={(e) => setTrendPeriod(e.target.value)}
                              className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-medium text-slate-800 shadow-sm"
                              aria-label="Trend period"
                            >
                              <option value="monthly">Monthly</option>
                              <option value="weekly">Weekly</option>
                              <option value="daily">Daily</option>
                            </select>
                            <select
                              value={trendLimit}
                              onChange={(e) => setTrendLimit(Number(e.target.value))}
                              className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-medium text-slate-800 shadow-sm"
                              aria-label="Number of periods"
                            >
                              <option value={6}>6 periods</option>
                              <option value={12}>12 periods</option>
                              <option value={24}>24 periods</option>
                              <option value={36}>36 periods</option>
                            </select>
                            {trendLoading && (
                              <span className="text-[10px] text-slate-400">Updating…</span>
                            )}
                          </div>
                        </div>
                        {costErrors.trend && (
                          <p className="shrink-0 px-2 py-1 text-[10px] text-red-600">{costErrors.trend}</p>
                        )}
                        {revenueTrendRows.length === 0 && !trendLoading ? (
                          <p className="flex flex-1 items-center justify-center py-8 text-xs text-slate-500">
                            No trend data
                          </p>
                        ) : (
                          <div className={`${chartFillClass} px-2 pt-1`}>
                            <div className="absolute bottom-2 left-2 right-2 top-1">
                              <Line data={revenueTrendChart} options={revenueTrendOptions} />
                            </div>
                          </div>
                        )}
                      </section>

                      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-3">
                        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100">
                          <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-red-50/70 to-white px-2.5 py-1.5">
                            <h2 className="text-xs font-bold text-slate-900">Repair costs by item type</h2>
                            <p className="text-[10px] leading-tight text-slate-500">
                              By item type · highest repair cost first
                            </p>
                          </div>
                          {costErrors.repair && (
                            <p className="shrink-0 px-2 py-1 text-[10px] text-red-600">{costErrors.repair}</p>
                          )}
                          {repairCostRows.length === 0 ? (
                            <p className="flex flex-1 items-center justify-center py-6 text-xs text-slate-500">
                              No data
                            </p>
                          ) : (
                            <>
                              <div className={`${chartFillClass} px-2 pt-1`}>
                                <div className="absolute bottom-2 left-2 right-2 top-1">
                                  <Bar data={repairCostChartData} options={repairCostBarOptions} />
                                </div>
                              </div>
                              <div className="max-h-[min(20vh,120px)] shrink-0 overflow-auto rounded border border-slate-100 mx-2 mb-2">
                                <table className="min-w-full border-collapse text-left">
                                  <thead className="sticky top-0 bg-slate-50/95">
                                    <tr className="border-b border-slate-100">
                                      <th className={th}>#</th>
                                      <th className={th}>Item type</th>
                                      <th className={`${th} text-right`}>Repair</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {repairCostRows.map((row, i) => (
                                      <tr key={`${repairItemLabel(row)}-${i}`} className="hover:bg-red-50/40">
                                        <td className={`${td} py-1 font-mono text-slate-500`}>{i + 1}</td>
                                        <td className={`${td} py-1 font-medium`}>{repairItemLabel(row)}</td>
                                        <td className={`${td} py-1 text-right tabular-nums font-semibold text-red-800`}>
                                          {rupee(repairCostAmount(row))}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )}
                        </section>

                        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100">
                          <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-teal-50/70 to-white px-2.5 py-1.5">
                            <h2 className="text-xs font-bold text-slate-900">Outstanding balances</h2>
                            <p className="text-[10px] leading-tight text-slate-500">
                              Active orders · highest outstanding first
                            </p>
                          </div>
                          {costErrors.outstanding && (
                            <p className="shrink-0 px-2 py-1 text-[10px] text-red-600">{costErrors.outstanding}</p>
                          )}
                          <div className="min-h-0 flex-1 overflow-auto px-2 pb-2 pt-1">
                            {outstandingRows.length === 0 ? (
                              <p className="py-8 text-center text-xs text-slate-500">No data</p>
                            ) : (
                              <table className="min-w-full border-collapse text-left">
                                <thead className="sticky top-0 bg-slate-50/95">
                                  <tr className="border-b border-slate-100">
                                    <th className={th}>Order</th>
                                    <th className={`${th} text-right`}>Generated</th>
                                    <th className={`${th} text-right`}>Advance</th>
                                    <th className={`${th} text-right`}>Outstanding</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {outstandingRows.map((row, i) => (
                                    <tr key={outstandingOrderLabel(row, i)} className="hover:bg-teal-50/40">
                                      <td className={`${td} py-1 font-mono font-semibold text-slate-800`}>
                                        {outstandingOrderLabel(row, i)}
                                      </td>
                                      <td className={`${td} py-1 text-right tabular-nums text-slate-700`}>
                                        {rupee(outstandingGenerated(row))}
                                      </td>
                                      <td className={`${td} py-1 text-right tabular-nums text-slate-700`}>
                                        {rupee(outstandingAdvance(row))}
                                      </td>
                                      <td className={`${td} py-1 text-right tabular-nums font-semibold text-teal-900`}>
                                        {rupee(outstandingBalance(row))}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </section>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderAnalytics;
