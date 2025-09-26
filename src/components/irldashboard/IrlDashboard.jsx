import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import "./irlDashboard.css";

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

const IrlDashboard = ({ onLogout }) => {
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);

  const [transactions, setTransactions] = useState({
    completed: 0,
    pending: 0,
  });

  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    // Fetch status totals
    const fetchTotals = async () => {
      try {
        const totalsData = {};
        for (let status of statuses) {
          const response = await axios.get(
            `http://192.168.29.125:8080/irrl/genericApiUnjoin/listProductCount?category='${status}'`
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

    // Fetch completed and pending transactions
    const fetchTransactions = async () => {
      try {
        const completedRes = await axios.get(
          "http://192.168.29.125:8080/irrl/genericApiUnjoin/listTransactionCount?status='COMPLETED'"
        );
        const pendingRes = await axios.get(
          "http://192.168.29.125:8080/irrl/genericApiUnjoin/listTransactionCount?status='PENDING'"
        );

        setTransactions({
          completed: completedRes.data?.data[0]?.count || 0,
          pending: pendingRes.data?.data[0]?.count || 0,
        });
      } catch (err) {
        console.error("Error fetching transaction counts:", err);
      }
    };

    // Fetch top rented products
    const fetchTopProducts = async () => {
      try {
        const res = await axios.get(
          "http://192.168.29.125:8080/irrl/genericApiUnjoin/topRentedProducts"
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

  if (loading) return <div>Loading Dashboard...</div>;

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />
        <div className="main-content">
          <h2 className="dashboard-title">IRL Dashboard</h2>

          {/* Top Bar Cards */}
          <div className="top-bar-cards">
            {statuses.map((status) => (
              <div className="status-card" key={status}>
                <h3>Total {status.charAt(0) + status.slice(1).toLowerCase()}</h3>
                <p className="status-count">{totals[status]}</p>
              </div>
            ))}
          </div>

          {/* Bottom Row */}
          <div className="bottom-row">
            {/* Left Card - Transaction Details */}
            <div className="left-card">
              <h3>Transaction Details</h3>
              <div className="sub-cards-vertical">
                <div className="sub-card completed">
                  <h4>Completed Transactions</h4>
                  <p>{transactions.completed}</p>
                </div>
                <div className="sub-card pending">
                  <h4>Pending Transactions</h4>
                  <p>{transactions.pending}</p>
                </div>
              </div>
            </div>

            {/* Right Card - Top Rented Products */}
            <div className="right-card">
              <h3>Top Rented Products</h3>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Times Rented</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i}>
                      <td>{p.name}</td>
                      <td>{p.rented}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IrlDashboard;
