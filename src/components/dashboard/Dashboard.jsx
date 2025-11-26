import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Users,
  CheckCircle,
  IndianRupee,
  ClipboardList,
  Calendar,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

import Header from "../header/Header";
import Footer from "../footer/Footer";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

// ✅ Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = ({ onLogout }) => {
  const [data, setData] = useState(null);

  // Temporary mock data
  useEffect(() => {
    const mockData = {
      presentToday: 87,
      otApprovals: 12,
      receivables: 125000,
      rentals: 18,
      attendance: [200, 280, 150, 230, 250, 180],
      upcomingRentals: [
        { invoice: "INVO-21", asset: "Cement", tenant: "John", due: "22/10/2024" },
        { invoice: "INVO-24", asset: "Brick", tenant: "Aarav", due: "25/10/2024" },
        { invoice: "INVO-91", asset: "Steel Rods", tenant: "Maya", due: "28/10/2024" },
        { invoice: "INVO-11", asset: "Board", tenant: "Ravi", due: "30/10/2024" },
        { invoice: "INVO-22", asset: "Paint", tenant: "Anya", due: "01/11/2024" },
      ],
      transactions: [
        { date: "20/10/2024", desc: "Office Supplies", credit: 5000 },
        { date: "21/10/2024", desc: "Rental Payment", credit: 10000 },
        { date: "22/10/2024", desc: "Asset Maintenance", credit: 2500 },
        { date: "23/10/2024", desc: "Utility Bill", credit: 3500 },
      ],
    };

    setTimeout(() => setData(mockData), 1000);
  }, []);

  if (!data)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-yellow-600 border-t-transparent"></div>
          <p className="animate-pulse text-lg font-medium text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );

  // Chart.js config
  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        label: "Attendance",
        data: data.attendance,
        backgroundColor: "rgba(202, 138, 4, 0.8)", // yellow-600
        hoverBackgroundColor: "#ca8a04",
        borderRadius: 8,
        barThickness: 30,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1f2937",
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#f3f4f6" },
        ticks: { font: { size: 12 }, color: "#6b7280" },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 12 }, color: "#6b7280" },
        border: { display: false },
      },
    },
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, subText }) => (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${colorClass}`}></div>
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-900">{value}</h3>
          {subText && (
            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>{subText}</span>
            </div>
          )}
        </div>
        <div className={`rounded-xl p-3 ${colorClass} bg-opacity-10 text-white`}>
          <Icon className={`h-6 w-6 ${colorClass.replace("bg-", "text-")}`} />
        </div>
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
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-sm text-gray-500">Welcome back! Here's what's happening today.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Present Today"
                value={`${data.presentToday}%`}
                icon={Users}
                colorClass="bg-blue-600"
                subText="+2.5% from yesterday"
              />
              <StatCard
                title="OT Approvals"
                value={data.otApprovals}
                icon={CheckCircle}
                colorClass="bg-green-600"
                subText="4 pending review"
              />
              <StatCard
                title="Receivables"
                value={`₹${data.receivables.toLocaleString()}`}
                icon={IndianRupee}
                colorClass="bg-yellow-600"
                subText="+12% this month"
              />
              <StatCard
                title="Active Rentals"
                value={data.rentals}
                icon={ClipboardList}
                colorClass="bg-purple-600"
                subText="3 due today"
              />
            </div>

            {/* Charts & Tables Section */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Attendance Chart */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Attendance Trends</h3>
                  <select className="rounded-lg border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-yellow-500/20">
                    <option>This Week</option>
                    <option>Last Week</option>
                  </select>
                </div>
                <div className="h-[300px] w-full">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>

              {/* Upcoming Rentals */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Upcoming Rentals</h3>
                  <button className="text-sm font-medium text-yellow-600 hover:text-yellow-700">View All</button>
                </div>
                <div className="space-y-4">
                  {data.upcomingRentals.map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 transition-colors hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{r.asset}</p>
                          <p className="text-xs text-gray-500">{r.tenant}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{r.due}</p>
                        <p className="text-xs text-gray-500">{r.invoice}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
                  <button className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                    Export <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Description</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {data.transactions.map((t, i) => (
                        <tr key={i} className="transition-colors hover:bg-gray-50/50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{t.date}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{t.desc}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-green-600">
                            +₹{t.credit.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Expense Overview</h3>
                  <button className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                    Details <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Description</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {data.transactions.map((t, i) => (
                        <tr key={i} className="transition-colors hover:bg-gray-50/50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{t.date}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{t.desc}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-red-600">
                            -₹{(t.credit * 0.4).toLocaleString()} {/* Mock expense */}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
