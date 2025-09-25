import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import "./Transactions.css";

const TransactionDetails = ({ onLogout }) => {
  const [subTransactions, setSubTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    status: "PENDING",
    type: "",
    imageFile: null,
    uploadedImage: "",
  });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const statusOptions = ["PENDING", "COMPLETED", "FAILED"];
  const location = useLocation();
  const mainTransactionId = location.state?.transaction_id || null;

  // Fetch sub-transactions
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

  // Handle Status Change in Table
  const handleStatusChange = async (transactionId, newStatus) => {
    try {
      await axios.get(
        `http://192.168.0.202:8080/irrl/editTransaction/${transactionId}?status=${newStatus}&table=transac`
      );
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

  // Handle Edit Save
  const handleEditSave = async () => {
    try {
      const { id, amount, status, type } = editingTransaction;
      await axios.get(
        `http://192.168.0.202:8080/irrl/editTransaction/${id}?status=${status}&amount=${parseInt(
          amount,
          10
        )}&type=${type}&table=transac`
      );
      setEditingTransaction(null);
      fetchSubTransactions();
    } catch (err) {
      console.error("Failed to update transaction", err);
      alert("Failed to update transaction");
    }
  };

  // Handle Add Transaction
  const handleAddTransaction = async () => {
    try {
      const imageToSend = newTransaction.uploadedImage || "sample_image.png";

      const payload = {
        main_transaction_id: mainTransactionId,
        amount: parseInt(newTransaction.amount, 10),
        status: newTransaction.status,
        type: newTransaction.type,
        image: imageToSend,
      };

      await axios.post(
        "http://192.168.0.202:8080/irrl/addSubTransaction",
        payload
      );

      setShowAddPopup(false);
      setNewTransaction({
        amount: "",
        status: "PENDING",
        type: "",
        imageFile: null,
        uploadedImage: "",
      });
      fetchSubTransactions();
    } catch (err) {
      console.error("Failed to add transaction", err);
      alert("Failed to add transaction");
    }
  };

  // Handle Image Upload
  const handleImageUpload = async () => {
    if (!newTransaction.imageFile) return;
    const formData = new FormData();
    formData.append("file", newTransaction.imageFile);
    try {
      const res = await axios.post(
        "http://192.168.0.202:8080/irrl/uploadImage",
        formData
      );
      // Assuming API returns the uploaded file path or name
      setNewTransaction({ ...newTransaction, uploadedImage: res.data.filePath });
      alert("Image uploaded successfully!");
    } catch (err) {
      console.error("Failed to upload image", err);
      alert("Failed to upload image");
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />
        <div className="main-content">
          <div className="table-card">
            <h3>
              Sub Transactions
              <button
                className="btn"
                style={{ float: "right" }}
                onClick={() => setShowAddPopup(true)}
              >
                Add Transaction
              </button>
            </h3>

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
                    <th>Type</th>
                    <th>Image</th>
                    <th>Actions</th>
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
                      <td>
                        <button
                          className="view-btn"
                          onClick={() => setEditingTransaction({ ...t })}
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

          {/* Add Transaction Popup */}
          {showAddPopup && (
            <div className="modal-overlay">
              <div className="modal-card">
                <h3>Add Transaction</h3>
                <div className="form-grid">
                  <div>
                    <label>Amount</label>
                    <input
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          amount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label>Status</label>
                    <select
                      value={newTransaction.status}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          status: e.target.value,
                        })
                      }
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Type</label>
                    <input
                      type="text"
                      value={newTransaction.type}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          type: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label>Image</label>
                    <input
                      type="file"
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          imageFile: e.target.files[0],
                        })
                      }
                    />
                    <button
                      className="btn"
                      type="button"
                      onClick={handleImageUpload}
                      style={{ marginTop: "5px" }}
                    >
                      Upload Image
                    </button>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="save-btn" onClick={handleAddTransaction}>
                    Add
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => setShowAddPopup(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Transaction Popup */}
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
                        setEditingTransaction({
                          ...editingTransaction,
                          amount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label>Status</label>
                    <select
                      value={editingTransaction.status}
                      onChange={(e) =>
                        setEditingTransaction({
                          ...editingTransaction,
                          status: e.target.value,
                        })
                      }
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Type</label>
                    <input
                      type="text"
                      value={editingTransaction.type || ""}
                      onChange={(e) =>
                        setEditingTransaction({
                          ...editingTransaction,
                          type: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="save-btn" onClick={handleEditSave}>
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

export default TransactionDetails;
