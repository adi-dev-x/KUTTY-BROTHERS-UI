import React, { useState, useEffect } from "react";
import { FiDownload, FiPlus, FiTrash2 } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import OrderForm from "./OrderForm";
import "./Orders.css";

const Orders = ({ onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Dummy initial orders for testing
    const dummyOrders = [
      {
        customer_id: "CUST001",
        customer_name: "Krishna Engineering",
        contact_person: "John Doe",
        contact_number: "9876543210",
        contact_address: "123 Main St",
        inventory_id: "INV001",
        advance_amount: 500,
        returned_at: "2025-09-25",
        status: "Pending",
        items: [
          {
            item_id: "1",
            item_name: "Nike Air Max",
            amount: 200,
            expired_at: "2025-09-23",
            status: "INITIATED",
            images: [],
          },
        ],
      },
    ];
    setOrders(dummyOrders);
    setLoading(false);
  }, []);

  const handleAddOrder = async (newOrder) => {
    try {
      // Prepare FormData for backend
      const formData = new FormData();
      newOrder.items.forEach((item, idx) => {
        item.images.forEach((img) => {
          formData.append("images", img.file);
        });
      });
      formData.append("order", JSON.stringify(newOrder));

      await axios.post("http://localhost:8080/irrl/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setOrders([...orders, newOrder]);
      setShowForm(false);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to save order");
    }
  };

  const handleDelete = (inventory_id) => {
    setOrders(orders.filter((o) => o.inventory_id !== inventory_id));
  };

  const handleStatusChange = (inventory_id, newStatus) => {
    setOrders(
      orders.map((o) => (o.inventory_id === inventory_id ? { ...o, status: newStatus } : o))
    );
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
      "Contact Address",
      "Inventory ID",
      "Advance Amount",
      "Returned At",
      "Status",
      "Items",
    ];
    const tableRows = [];

    orders.forEach((o, i) => {
      const itemText = o.items
        .map((it, idx) => `${idx + 1}. ${it.item_name} (${it.amount}, ${it.expired_at}, ${it.status})`)
        .join(", ");
      tableRows.push([
        i + 1,
        o.customer_name || "-",
        o.customer_id || "-",
        o.contact_person || "-",
        o.contact_number || "-",
        o.contact_address || "-",
        o.inventory_id,
        o.advance_amount,
        o.returned_at || "-",
        o.status,
        itemText || "-",
      ]);
    });

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30 });
    doc.save("orders_report.pdf");
  };

  const filteredOrders = orders.filter(
    (o) =>
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_id || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.status || "").toLowerCase().includes(search.toLowerCase())
  );

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

          {showForm && <OrderForm onAddOrder={handleAddOrder} />}

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
                    <th>Contact Address</th>
                    <th>Inventory ID</th>
                    <th>Advance Amount</th>
                    <th>Returned At</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr key={o.inventory_id}>
                      <td>{orders.indexOf(o) + 1}</td>
                      <td>{o.customer_name || "-"}</td>
                      <td>{o.customer_id || "-"}</td>
                      <td>{o.contact_person || "-"}</td>
                      <td>{o.contact_number || "-"}</td>
                      <td>{o.contact_address || "-"}</td>
                      <td>{o.inventory_id}</td>
                      <td>{o.advance_amount}</td>
                      <td>{o.returned_at || "-"}</td>
                      <td>
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.inventory_id, e.target.value)}
                        >
                          <option value="INITIATED">INITIATED</option>
                          <option value="Pending">Pending</option>
                          <option value="Returned">Returned</option>
                          <option value="Declined">Declined</option>
                        </select>
                      </td>
                      <td>
                        {o.items.map((it) => (
                          <div key={it.item_id || it.item_name} className="item-card-table">
                            <strong>{it.item_name}</strong> | {it.amount} | {it.expired_at} | {it.status}
                            {it.images?.length > 0 && (
                              <div className="thumbs">
                                {it.images.map((img, i) => (
                                  <img key={i} src={img.url} alt={img.name} width="40" />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </td>
                      <td>
                        <button className="delete-btn" onClick={() => handleDelete(o.inventory_id)}>
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
