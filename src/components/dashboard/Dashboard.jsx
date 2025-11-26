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

import Header from "../header/Header";
import Footer from "../footer/Footer";

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

  if (!data) return <div className="p-6 text-gray-600">Loading Dashboard...</div>;

  // Chart.js config
  const chartData = {
    labels: ["M", "T", "W", "Th", "F", "S"],
    datasets: [
      {
        label: "Attendance",
        data: data.attendance,
        backgroundColor: "#ca8a04",
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header onLogout={onLogout} />

      <div className="flex flex-1 bg-gray-100">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-gray-200 bg-white p-6 lg:block">
          <nav>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">General</h4>
            <ul className="space-y-2 text-sm">
              <li className="rounded-lg bg-yellow-50 px-3 py-2 font-semibold text-yellow-700">Dashboard</li>
              <li className="rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50">Attendance</li>
              <ul className="ml-3 space-y-1 border-l border-gray-200 pl-3 text-gray-600">
                <li className="px-2 py-1 hover:text-gray-800">Team Attendance</li>
                <li className="px-2 py-1 hover:text-gray-800">OT Approval</li>
                <li className="px-2 py-1 hover:text-gray-800">Reports</li>
              </ul>
            </ul>
          </nav>
          <div className="mt-6 space-y-2 text-sm text-gray-600">
            <p className="cursor-pointer hover:text-gray-800">Help</p>
            <p className="cursor-pointer hover:text-gray-800">Settings</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">
          {/* Top Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="text-sm text-gray-600">Present Today</div>
              <h2 className="mt-1 text-2xl font-bold text-yellow-700">{data.presentToday}%</h2>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="text-sm text-gray-600">OT Approvals</div>
              <h2 className="mt-1 text-2xl font-bold text-yellow-700">{data.otApprovals}</h2>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="text-sm text-gray-600">Outstanding Receivables</div>
              <h2 className="mt-1 text-2xl font-bold text-yellow-700">₹{data.receivables.toLocaleString()}</h2>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="text-sm text-gray-600">Approve Rentals</div>
              <h2 className="mt-1 text-2xl font-bold text-yellow-700">{data.rentals}</h2>
            </div>
          </div>

          {/* Chart + Upcoming Rentals */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 lg:col-span-3">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Attendance Summary</h3>
              <Bar data={chartData} options={chartOptions} />
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 lg:col-span-2">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Upcoming Rentals</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-left">Invoice #</th>
                      <th className="px-4 py-2 text-left">Asset</th>
                      <th className="px-4 py-2 text-left">Tenant</th>
                      <th className="px-4 py-2 text-left">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.upcomingRentals.map((r, i) => (
                      <tr key={i} className="hover:bg-yellow-50/40">
                        <td className="px-4 py-2">{r.invoice}</td>
                        <td className="px-4 py-2">{r.asset}</td>
                        <td className="px-4 py-2">{r.tenant}</td>
                        <td className="px-4 py-2">{r.due}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Transactions (Two tables side by side) */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Recent Transactions 1</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-left">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.transactions.map((t, i) => (
                      <tr key={i} className="hover:bg-yellow-50/40">
                        <td className="px-4 py-2">{t.date}</td>
                        <td className="px-4 py-2">{t.desc}</td>
                        <td className="px-4 py-2">₹ {t.credit.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Recent Transactions 2</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-left">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.transactions.map((t, i) => (
                      <tr key={i} className="hover:bg-yellow-50/40">
                        <td className="px-4 py-2">{t.date}</td>
                        <td className="px-4 py-2">{t.desc}</td>
                        <td className="px-4 py-2">₹ {t.credit.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
