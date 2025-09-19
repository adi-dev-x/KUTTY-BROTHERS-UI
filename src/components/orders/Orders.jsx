import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import "./Orders.css";
import { FiDownload, FiPlus, FiTrash2 } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";

const Orders = ({ onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    contact_person: "",
    contact_number: "",
    contact_address: "",
    inventory_id: "INV001",
    advance_amount: 0,
    returned_at: "",
    status: "INITIATED",
    items: [],
  });
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemData, setItemData] = useState({ amount: 0, returned_at: "" });

  const navigate = useNavigate();

  useEffect(() => {
    // Dummy orders for testing
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
        items: [{ amount: 200, returned_at: "2025-09-23" }],
      },
    ];
    setOrders(dummyOrders);
    setLoading(false);
  }, []);

  // Fetch customers from API
  useEffect(() => {
    axios
      .get("http://localhost:8080/irrl/genericApiUnjoin/customer")
      .then((res) => setCustomers(res.data.data || []))
      .catch((err) => console.error(err));
  }, []);

  const handleCustomerSelect = (name) => {
    const customer = customers.find((c) => c.name === name);
    if (customer) {
      setFormData({ ...formData, customer_name: name, customer_id: customer.customer_id });
    } else {
      setFormData({ ...formData, customer_name: name, customer_id: "" });
    }
  };

  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, itemData] });
    setItemData({ amount: 0, returned_at: "" });
    setShowItemForm(false);
  };

  const handleAddOrder = () => {
    setOrders([...orders, formData]);
    setFormData({
      customer_id: "",
      customer_name: "",
      contact_person: "",
      contact_number: "",
      contact_address: "",
      inventory_id: "INV001",
      advance_amount: 0,
      returned_at: "",
      status: "INITIATED",
      items: [],
    });
    setShowForm(false);
    setShowItemForm(false);
  };

  const handleDelete = (inventory_id) => {
    setOrders(orders.filter((o) => o.inventory_id !== inventory_id));
  };

  const handleStatusChange = (inventory_id, newStatus) => {
    setOrders(
      orders.map((o) => (o.inventory_id === inventory_id ? { ...o, status: newStatus } : o))
    );
  };

  const calculateNetAmount = (order) => {
    const totalItemAmount = order.items.reduce((acc, i) => acc + (i.amount || 0), 0);
    return order.advance_amount + totalItemAmount;
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
      const itemText = o.items.map((it, idx) => `${idx + 1}. ${it.amount} (${it.returned_at})`).join(", ");
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

          {showForm && (
            <div className="add-stock-form">
              {/* Customer Name & hidden ID */}
              <div>
                <label>Customer Name</label>
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={formData.customer_name}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  list="customers-list"
                />
                <datalist id="customers-list">
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label>Customer ID (hidden)</label>
                <input type="text" value={formData.customer_id} readOnly hidden />
              </div>

              {/* Contact Person & Number */}
              <div>
                <label>Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
              </div>
              <div>
                <label>Contact Number</label>
                <input
                  type="text"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                />
              </div>

              {/* Contact Address & Inventory ID */}
              <div>
                <label>Contact Address</label>
                <input
                  type="text"
                  value={formData.contact_address}
                  onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
                />
              </div>
              <div>
                <label>Inventory ID</label>
                <input type="text" value={formData.inventory_id} readOnly />
              </div>

              {/* Advance Amount & Returned At */}
              <div>
                <label>Advance Amount</label>
                <input
                  type="number"
                  value={formData.advance_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, advance_amount: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label>Returned At</label>
                <input
                  type="date"
                  value={formData.returned_at}
                  onChange={(e) => setFormData({ ...formData, returned_at: e.target.value })}
                />
              </div>

              {/* Status */}
              <div>
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="INITIATED">INITIATED</option>
                  <option value="Pending">Pending</option>
                  <option value="Returned">Returned</option>
                  <option value="Declined">Declined</option>
                </select>
              </div>

              {/* Add Item Fields */}
              <div style={{ gridColumn: "span 2" }}>
                <button type="button" onClick={() => setShowItemForm(!showItemForm)}>
                  Add Item
                </button>
                {showItemForm && (
                  <div style={{ marginTop: "10px" }}>
                    <input
                      type="number"
                      placeholder="Item Amount"
                      value={itemData.amount}
                      onChange={(e) =>
                        setItemData({ ...itemData, amount: parseInt(e.target.value) || 0 })
                      }
                    />
                    <input
                      type="date"
                      value={itemData.returned_at}
                      onChange={(e) => setItemData({ ...itemData, returned_at: e.target.value })}
                    />
                    <button onClick={handleAddItem}>Save Item</button>
                  </div>
                )}
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <button onClick={handleAddOrder}>Add Order</button>
              </div>
            </div>
          )}

          {/* Orders Table */}
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
                  {filteredOrders.map((o, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
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
                        {o.items.map((it, idx) => (
                          <div key={idx}>
                            {it.amount} ({it.returned_at})
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
