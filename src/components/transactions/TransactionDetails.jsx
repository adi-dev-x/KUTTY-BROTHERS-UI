import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import "./Transactions.css";

const TransactionDetails = ({ onLogout }) => {
  const [subTransactions, setSubTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const mainTransactionId = location.state?.transaction_id || null;
  const statusOptions = ["PENDING", "COMPLETED", "FAILED"];

  const fetchSubTransactions = async () => {
    if (!mainTransactionId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `http://192.168.0.202:8080/irrl/genericApiUnjoin/subTransaction?main_transaction_id=${mainTransactionId}`
      );
      setSubTransactions(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching sub-transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubTransactions();
  }, [mainTransactionId]);

  const handleStatusChange = async (transactionId, newStatus) => {
    try {
      await axios.get(
        `http://192.168.0.202:8080/irrl/editTransaction/${transactionId}?status=${newStatus}&table=transac`
      );
      // Update locally
      setSubTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId ? { ...t, status: newStatus } : t
        )
      );
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />
        <div className="main-content">
          <div className="table-card">
            <h3>Sub Transactions</h3>

            {loading ? (
              <p>Loading sub-transactions...</p>
            ) : subTransactions.length === 0 ? (
              <p>No sub-transactions found.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Transaction Type</th>
                    <th>Image</th>
                  </tr>
                </thead>
                <tbody>
                  {subTransactions.map((t) => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>{t.amount !== null ? t.amount : "-"}</td>
                      <td>
                        <select
                          value={t.status}
                          onChange={(e) =>
                            handleStatusChange(t.id, e.target.value)
                          }
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{t.transaction_type || "-"}</td>
                      <td>
                        {t.image ? (
                          <a
                            href={
                              t.image.startsWith("http")
                                ? t.image
                                : `http://192.168.0.202:8080/${t.image}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Image
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;
