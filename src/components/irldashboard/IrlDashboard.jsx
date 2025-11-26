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
  ArrowRight,
  Activity, Wrench,
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
  AVAILABLE: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", ring: "ring-green-600/20" },
  RENTED: { icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-600/20" },
  DAMAGED: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", ring: "ring-red-600/20" },
  REPAIRING: { icon: Wrench, color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-600/20" },
  EXPIRED: { icon: XCircle, color: "text-gray-600", bg: "bg-gray-50", ring: "ring-gray-600/20" },
  BLOCKED: { icon: Ban, color: "text-rose-600", bg: "bg-rose-50", ring: "ring-rose-600/20" },
  RESERVED: { icon: Calendar, color: "text-purple-600", bg: "bg-purple-50", ring: "ring-purple-600/20" },
  PENDING: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", ring: "ring-yellow-600/20" },
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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-yellow-600 border-t-transparent"></div>
          <p className="animate-pulse text-lg font-medium text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <Header onLogout={onLogout} />

      <div className="flex flex-1 overflow-hidden">
        <Rentalsidebar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Header Section */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
                <p className="text-sm text-gray-500">Real-time overview of your inventory status.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-gray-200">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Status Cards Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {statuses.map((status) => {
                const config = statusConfig[status] || statusConfig.AVAILABLE;
                const Icon = config.icon;

                return (
                  <div
                    key={status}
                    onClick={() => navigate(`/dashboard-details/${status}`)}
                    className={`group relative cursor-pointer overflow-hidden rounded-xl bg-white p-5 shadow-sm ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${config.ring}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          {status}
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-gray-900">
                          {totals[status] || 0}
                        </h3>
                      </div>
                      <div className={`rounded-lg p-2 ${config.bg} ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    {/* Hover Effect Background */}
                    <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-10 ${config.bg.replace('bg-', 'bg-current text-')}`}></div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Section: Transactions & Top Products */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

              {/* Transaction Details */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 lg:col-span-1">
                <h3 className="mb-6 text-lg font-bold text-gray-900">Transaction Summary</h3>

                <div className="space-y-4">
                  <div className="group flex items-center justify-between rounded-xl border border-gray-100 p-4 transition-colors hover:bg-green-50/50 hover:border-green-100">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-green-100 p-3 text-green-600">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Completed</p>
                        <h4 className="text-xl font-bold text-gray-900">{transactions.completed}</h4>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-green-500" />
                  </div>

                  <div className="group flex items-center justify-between rounded-xl border border-gray-100 p-4 transition-colors hover:bg-yellow-50/50 hover:border-yellow-100">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-yellow-100 p-3 text-yellow-600">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Pending</p>
                        <h4 className="text-xl font-bold text-gray-900">{transactions.pending}</h4>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-yellow-500" />
                  </div>
                </div>
              </div>

              {/* Top Rented Products */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Top Rented Products</h3>
                  <button className="flex items-center gap-1 text-sm font-medium text-yellow-600 hover:text-yellow-700">
                    View All <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Product Name</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Times Rented</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {topProducts.length > 0 ? (
                        topProducts.map((p, i) => (
                          <tr key={i} className="transition-colors hover:bg-gray-50/50">
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              #{i + 1}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                                  <Package className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-gray-900">{p.item_name}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-gray-900">
                              {p.rented_count}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 text-xs font-medium text-green-600">
                                <TrendingUp className="h-3 w-3" />
                                <span>High</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">
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