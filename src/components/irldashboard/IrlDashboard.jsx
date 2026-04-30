import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Ban,
  Calendar,
  Package,
  ShoppingCart,
  TrendingUp,
  Wrench,
} from "lucide-react";

import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";


const statuses = [
  "AVAILABLE",
  "RENTED",
  "DAMAGED",
  "REPAIRING",
  "EXPIRED",
  "BLOCKED",
  "RESERVED",
  "PENDING",
];

const statusConfig = {
  AVAILABLE: {
    icon: CheckCircle,
    label: "Available",
    gradient: "from-emerald-500 to-teal-400",
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    shadow: "shadow-emerald-100"
  },
  RENTED: {
    icon: ShoppingCart,
    label: "Rented",
    gradient: "from-blue-500 to-indigo-400",
    text: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    shadow: "shadow-blue-100"
  },
  DAMAGED: {
    icon: AlertTriangle,
    label: "Damaged",
    gradient: "from-red-500 to-rose-400",
    text: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
    shadow: "shadow-red-100"
  },
  REPAIRING: {
    icon: Wrench,
    label: "Repairing",
    gradient: "from-orange-500 to-amber-400",
    text: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    shadow: "shadow-orange-100"
  },
  EXPIRED: {
    icon: XCircle,
    label: "Expired",
    gradient: "from-gray-600 to-slate-500",
    text: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    shadow: "shadow-gray-100"
  },
  BLOCKED: {
    icon: Ban,
    label: "Blocked",
    gradient: "from-rose-600 to-pink-500",
    text: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    shadow: "shadow-rose-100"
  },
  RESERVED: {
    icon: Calendar,
    label: "Reserved",
    gradient: "from-purple-500 to-violet-400",
    text: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    shadow: "shadow-purple-100"
  },
  PENDING: {
    icon: Clock,
    label: "Pending",
    gradient: "from-yellow-400 to-amber-300",
    text: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-100",
    shadow: "shadow-yellow-100"
  },
};

const IrlDashboard = ({ onLogout }) => {
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState({ completed: 0, pending: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        const totalsData = {};
        for (let status of statuses) {
          const response = await axios.get(
            `https://ems.binlaundry.com/irrl/genericApiUnjoin/listProductCount?category='${status}'`
          );
          totalsData[status] = response.data?.data[0]?.count || 0;
        }
        setTotals(totalsData);
      } catch (err) {
        console.error("Error fetching totals:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchTransactions = async () => {
      try {
        const completedRes = await axios.get(
          "https://ems.binlaundry.com/irrl/genericApiUnjoin/listTransactionCount?status='COMPLETED'"
        );
        const pendingRes = await axios.get(
          "https://ems.binlaundry.com/irrl/genericApiUnjoin/listTransactionCount?status='PENDING'"
        );

        setTransactions({
          completed: completedRes.data?.data[0]?.count || 0,
          pending: pendingRes.data?.data[0]?.count || 0,
        });
      } catch (err) {
        console.error("Error fetching transaction counts:", err);
      }
    };

    const fetchTopProducts = async () => {
      try {
        const res = await axios.get(
          "https://ems.binlaundry.com/irrl/genericApiUnjoin/topRentedProduct"
        );
        setTopProducts(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching top products:", err);
      }
    };

    fetchTotals();
    fetchTransactions();
    fetchTopProducts();
  }, []);

  if (loading)
    return (
      <div className="relative flex h-screen items-center justify-center bg-slate-50">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(251,191,36,0.12),transparent)]"
          aria-hidden
        />
        <div className="relative flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-amber-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading dashboard…</p>
        </div>
      </div>
    );

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(251,191,36,0.12),transparent),radial-gradient(ellipse_80%_50%_at_100%_40%,rgba(59,130,246,0.06),transparent),radial-gradient(ellipse_60%_40%_at_0%_90%,rgba(16,185,129,0.05),transparent)]"
        aria-hidden
      />
      <Header onLogout={onLogout} />

      <div className="relative flex flex-1 overflow-hidden">
        <Rentalsidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <h1 className="text-sm font-semibold text-slate-900">Inventory overview</h1>
              <span className="text-[11px] font-medium tabular-nums text-slate-500">
                Updated {new Date().toLocaleTimeString()}
              </span>
            </section>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {statuses.map((status) => {
                const config = statusConfig[status] || statusConfig.AVAILABLE;
                const Icon = config.icon;

                return (
                  <button
                    type="button"
                    key={status}
                    onClick={() => navigate(`/dashboard-details/${status}`)}
                    className={`group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 text-left shadow-md shadow-slate-900/5 ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-200/80 hover:shadow-lg hover:shadow-amber-900/5 ${config.border}`}
                  >
                    <div className="relative z-10 flex h-full flex-col justify-between">
                      <div className="mb-4 flex items-center justify-between">
                        <div
                          className={`rounded-xl bg-gradient-to-br ${config.gradient} p-2.5 text-white shadow-md`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <span
                          className={`rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ring-1 ring-slate-100 ${config.text}`}
                        >
                          {config.label}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                          {totals[status] || 0}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-slate-500">Items</p>
                      </div>
                    </div>

                    <div
                      className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-[0.07] blur-xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-[0.14] ${config.gradient}`}
                    />
                    <div
                      className={`absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-gradient-to-tr opacity-[0.04] blur-lg ${config.gradient}`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 lg:col-span-1">
                <h3 className="mb-4 text-lg font-bold text-slate-900">Transactions</h3>

                <div className="space-y-3">
                  <div className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/60">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Completed</p>
                        <p className="text-xl font-bold tabular-nums text-slate-900">
                          {transactions.completed}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-amber-200 hover:bg-amber-50/60">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Pending</p>
                        <p className="text-xl font-bold tabular-nums text-slate-900">
                          {transactions.pending}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 lg:col-span-2">
                <h3 className="mb-4 text-lg font-bold text-slate-900">Top rented products</h3>

                <div className="max-h-[380px] overflow-y-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full border-collapse divide-y divide-slate-100 [&_td]:border-r [&_td]:border-slate-200 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-200 [&_th:last-child]:border-r-0">
                    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                          Product
                        </th>
                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                          Rentals
                        </th>
                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                          Trend
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {topProducts.length > 0 ? (
                        topProducts.map((p, i) => (
                          <tr
                            key={i}
                            className={`transition-colors hover:bg-amber-50/40 ${i % 2 === 1 ? "bg-slate-50/40" : ""}`}
                          >
                            <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-slate-500">
                              #{i + 1}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-800 ring-1 ring-amber-100">
                                  <Package className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-slate-900">{p.item_name}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold tabular-nums text-slate-900">
                              {p.rented_count}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/10">
                                <TrendingUp className="h-3 w-3" />
                                High
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default IrlDashboard;