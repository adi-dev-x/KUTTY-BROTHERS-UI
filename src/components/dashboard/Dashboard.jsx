import React, { useState, useEffect } from "react";
import "./Dashboard.css";
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

  if (!data) return <div>Loading Dashboard...</div>;

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
    <div className="dashboard-container">
      <Header onLogout={onLogout} />

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav>
            <h4 className="sidebar-section">General</h4>
            <ul>
              <li className="active">Dashboard</li>
              <li>Attendance</li>
              <ul className="sub-menu">
                <li>Team Attendance</li>
                <li>OT Approval</li>
                <li>Reports</li>
              </ul>
            </ul>
          </nav>
          <div className="sidebar-support">
            <p>Help</p>
            <p>Settings</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Top Cards */}
          <div className="stats-cards">
            <div className="card yellow">
              Present Today <h2>{data.presentToday}%</h2>
            </div>
            <div className="card yellow">
              OT Approvals <h2>{data.otApprovals}</h2>
            </div>
            <div className="card yellow">
              Outstanding Receivables <h2>₹{data.receivables.toLocaleString()}</h2>
            </div>
            <div className="card yellow">
              Approve Rentals <h2>{data.rentals}</h2>
            </div>
          </div>

          {/* Chart + Upcoming Rentals */}
          <div className="chart-row">
            <div className="chart-card">
              <h3>Attendance Summary</h3>
              <Bar data={chartData} options={chartOptions} />
            </div>

            <div className="table-card">
              <h3>Upcoming Rentals</h3>
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Asset</th>
                    <th>Tenant</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.upcomingRentals.map((r, i) => (
                    <tr key={i}>
                      <td>{r.invoice}</td>
                      <td>{r.asset}</td>
                      <td>{r.tenant}</td>
                      <td>{r.due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Transactions (Two tables side by side) */}
          <div className="transactions-row">
            <div className="table-card">
              <h3>Recent Transactions 1</h3>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((t, i) => (
                    <tr key={i}>
                      <td>{t.date}</td>
                      <td>{t.desc}</td>
                      <td>₹ {t.credit.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-card">
              <h3>Recent Transactions 2</h3>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((t, i) => (
                    <tr key={i}>
                      <td>{t.date}</td>
                      <td>{t.desc}</td>
                      <td>₹ {t.credit.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
