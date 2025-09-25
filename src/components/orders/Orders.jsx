import React, { useState, useEffect } from "react";
import { FiDownload, FiPlus, FiTrash2 } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import OrderForm from "./OrderForm";
import "./Orders.css";

const Orders = ({ onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [statuses, setStatuses] = useState(["COMPLETED", "BLOCKED", "INITIATED"]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;
  const navigate = useNavigate();

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          "http://192.168.0.202:8080/irrl/genericApiUnjoin/listOrders"
        );
        setOrders(response.data?.data || []);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchStatuses = async () => {
      try {
        const res = await axios.get(
          "http://192.168.0.202:8080/irrl/genericApiUnjoin/statusOptions"
        );
        const apiStatuses = res.data?.data || [];
        setStatuses(apiStatuses.filter((s) => ["COMPLETED", "BLOCKED", "INITIATED"].includes(s)));
      } catch (err) {
        console.error("Failed to fetch status options, using defaults", err);
      }
    };

    fetchOrders();
    fetchStatuses();
  }, []);

  // Add new order locally
  const handleAddOrder = (newOrder) => {
    setOrders([...orders, newOrder]);
    setShowForm(false);
  };

  // Update status
  const handleStatusChange = async (delivery_id, newStatus) => {
    try {
      await axios.get(
        `http://192.168.0.202:8080/irrl/updateOrder/${delivery_id}?status=${newStatus}`
      );
      setOrders(
        orders.map((o) =>
          o.delivery_id === delivery_id ? { ...o, status: newStatus } : o
        )
      );
    } catch (err) {
      console.error("Status update failed", err);
      alert("Failed to update status");
    }
  };

  // Delete order
  const handleDelete = async (delivery_id) => {
    try {
      await axios.get(
        `http://192.168.0.202:8080/irrl/updateOrder/${delivery_id}?status=DELETED`
      );
      setOrders(orders.filter((o) => o.delivery_id !== delivery_id));
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete order");
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Orders Report", 14, 20);

    const tableColumn = [
      "S.No",
      "Customer Name",
      "Customer ID",
      "Contact Person",
      "Contact Number",
      "Shipping Address",
      "Inventory ID",
      "Generated Amount",
      "Current Amount",
      "Advance Amount",
      "Placed At",
      "Returned At",
      "Transactions",
      "Status",
    ];

    const tableRows = orders.map((o, i) => [
      i + 1,
      o.customer_name || "-",
      o.customer_id || "-",
      o.contact_name || "-",
      o.contact_number || "-",
      o.shipping_address || "-",
      o.inventory_id || "-",
      o.generated_amount || "-",
      o.current_amount || "-",
      o.advance_amount || "-",
      o.placed_at || "-",
      o.declined_at || "-",
      "View Transaction", // In PDF just show text
      o.status || "-",
    ]);

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30 });
    doc.save("orders_report.pdf");
  };

  const filteredOrders = orders.filter(
    (o) =>
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_id || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.status || "").toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredOrders.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />
        <div className="main-content">
          <div className="stock-top-bar">
            <input
              type="text"
              placeholder="Search orders..."
              className="search-input small-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="add-btn" onClick={() => setShowForm(!showForm)}>
              <FiPlus /> Add Order
            </button>
            <button className="download-btn" onClick={handleDownloadPDF}>
              <FiDownload /> Download PDF
            </button>
          </div>

          {showForm && (
            <OrderForm
              onAddOrder={handleAddOrder}
              onClose={() => setShowForm(false)}
            />
          )}

          {loading ? (
            <p>Loading orders...</p>
          ) : (
            <div className="table-card">
              <h3>Orders Report</h3>
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Customer Name</th>
                    <th>Customer ID</th>
                    <th>Contact Person</th>
                    <th>Contact Number</th>
                    <th>Shipping Address</th>
                    <th>Inventory ID</th>
                    <th>Generated Amount</th>
                    <th>Current Amount</th>
                    <th>Advance Amount</th>
                    <th>Placed At</th>
                    <th>Returned At</th>
                    <th>Transactions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((o, i) => (
                    <tr
                      key={o.delivery_id}
                      onClick={() => navigate(`/order-details/${o.delivery_id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{indexOfFirstRow + i + 1}</td>
                      <td>{o.customer_name || "-"}</td>
                      <td>{o.customer_id || "-"}</td>
                      <td>{o.contact_name || "-"}</td>
                      <td>{o.contact_number || "-"}</td>
                      <td>{o.shipping_address || "-"}</td>
                      <td>{o.inventory_id || "-"}</td>
                      <td>{o.generated_amount || "-"}</td>
                      <td>{o.current_amount || "-"}</td>
                      <td>{o.advance_amount || "-"}</td>
                      <td>{o.placed_at || "-"}</td>
                      <td>{o.declined_at || "-"}</td>
                      <td>
                        <button
                          className="view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/transaction", {
                              state: { order_id: o.delivery_id },
                            });
                          }}
                        >
                          View Transaction
                        </button>
                      </td>
                      <td>
                        <select
                          value={o.status}
                          onClick={(e) => e.stopPropagation()} // prevent row click
                          onChange={(e) =>
                            handleStatusChange(o.delivery_id, e.target.value)
                          }
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation(); // prevent row click
                            handleDelete(o.delivery_id);
                          }}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
