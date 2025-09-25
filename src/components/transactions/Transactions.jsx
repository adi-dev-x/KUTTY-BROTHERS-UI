import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import "./Transactions.css";

const Transactions = ({ onLogout }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState(null); 
  const [statusOptions] = useState(["PENDING", "COMPLETED"]); 
  const location = useLocation();
  const navigate = useNavigate();
  const orderIdFromNav = location.state?.order_id || null;

  const fetchTransactions = async () => {
    if (!orderIdFromNav) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `http://192.168.0.202:8080/irrl/genericApiUnjoin/mainTransaction?order_id='${orderIdFromNav}'`
      );
      setTransactions(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [orderIdFromNav]);

  const handleSave = async () => {
    try {
      const { transaction_id, amount, status } = editingTransaction;
      await axios.get(
        `http://192.168.0.202:8080/irrl/editTransaction/${transaction_id}?status=${status}&amount=${amount}`
      );
      setEditingTransaction(null);
      fetchTransactions();
    } catch (err) {
      console.error("Failed to update transaction", err);
      alert("Failed to update transaction");
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />
        <div className="main-content">
          <div className="table-card">
            <h3>Transactions</h3>

            {loading ? (
              <p>Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <p>No transactions found.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr
                      key={t.transaction_id}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        navigate("/transaction-details", {
                          state: { transaction_id: t.transaction_id },
                        })
                      }
                    >
                      <td>{t.transaction_id}</td>
                      <td>{t.amount !== null ? t.amount : "-"}</td>
                      <td>{t.status}</td>
                      <td>
                        <button
                          className="view-btn"
                          onClick={(e) => {
                            e.stopPropagation(); // prevent row click
                            setEditingTransaction({ ...t });
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Popup Form */}
          {editingTransaction && (
            <div className="modal-overlay">
              <div className="modal-card">
                <h3>Edit Transaction</h3>
                <div className="form-grid">
                  <div>
                    <label>Amount</label>
                    <input
                      type="number"
                      value={editingTransaction.amount || ""}
                      onChange={(e) =>
                        setEditingTransaction({ ...editingTransaction, amount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label>Status</label>
                    <select
                      value={editingTransaction.status}
                      onChange={(e) =>
                        setEditingTransaction({ ...editingTransaction, status: e.target.value })
                      }
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="save-btn" onClick={handleSave}>
                    Save
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => setEditingTransaction(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
