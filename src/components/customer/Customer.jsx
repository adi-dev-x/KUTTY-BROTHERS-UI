import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import { FiDownload } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./Customer.css";

const RentalDashboard = ({ onLogout }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    short_name: "",
    phone: "",
    type: "",
    gst: "",
    address: "",
    email: "",
    customer_flag: "",
    status: "Active", // default to Active
  });

  // Fetch customers
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/genericApiUnjoin/customerlist")
      .then((res) => res.json())
      .then((data) => {
        setCustomers(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching customers:", err);
        setLoading(false);
      });
  }, []);

  // Search suggestions
  const suggestions = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_id.toString().includes(search)
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 10;
  const indexOfLast = currentPage * customersPerPage;
  const indexOfFirst = indexOfLast - customersPerPage;
  const currentCustomers = customers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(customers.length / customersPerPage);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer.customer_id);
    setCustomers((prev) => {
      const filtered = prev.filter((c) => c.customer_id !== customer.customer_id);
      return [customer, ...filtered];
    });
    setSearch("");
  };

  const handleAddClick = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      short_name: "",
      phone: "",
      type: "",
      gst: "",
      address: "",
      email: "",
      customer_flag: "",
      status: "Active",
    });
    setShowForm(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || "",
      short_name: customer.short_name || "",
      phone: customer.phone || "",
      type: customer.type || "",
      gst: customer.gst || "",
      address: customer.address || "",
      email: customer.email || "",
      customer_flag: customer.customer_flag || "",
      status: customer.status || "Active",
    });
    setShowForm(true);
  };

  // Submit handler with API POST
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      Name: formData.name,
      Short_Name: formData.short_name,
      Phone: formData.phone,
      Type: formData.type,
      GST: formData.gst,
      Address: formData.address,
      Email: formData.email || undefined,
      Customer_Flag: formData.customer_flag || undefined,
      Status: formData.status || "Active",
    };

    try {
      const res = await fetch("https://ems.binlaundry.com/irrl/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API Error: ${errText}`);
      }

      const newCustomer = await res.json();
      setCustomers((prev) => [...prev, newCustomer]);
      alert("Customer added successfully!");
      setShowForm(false);
      setFormData({
        name: "",
        short_name: "",
        phone: "",
        type: "",
        gst: "",
        address: "",
        email: "",
        customer_flag: "",
        status: "Active",
      });
    } catch (err) {
      console.error("Error adding customer:", err);
      alert("Failed to add customer. Check console.");
    }
  };

  // PDF Download
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Customer Report", 14, 20);

    const tableColumn = [
      "ID",
      "Name",
      "Short Name",
      "Phone",
      "Type",
      "GST",
      "Address",
      "Email",
      "Customer Flag",
      "Status",
    ];
    const tableRows = [];

    customers.forEach((c) => {
      tableRows.push([
        c.customer_id,
        c.name,
        c.short_name,
        c.phone,
        c.type,
        c.gst,
        c.address,
        c.email,
        c.customer_flag,
        c.status,
      ]);
    });

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30 });
    doc.save("customers.pdf");
  };

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />

        <div className="main-content">
          {/* Top bar */}
          <div className="top-bar">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search customers by Name or ID..."
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <ul className="suggestions">
                  {suggestions.map((s) => (
                    <li key={s.customer_id} onClick={() => handleSelectCustomer(s)}>
                      {s.customer_id} - {s.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="top-bar-buttons">
              <button className="add-btn" onClick={handleAddClick}>
                + Add Customer
              </button>
              <button className="download-btn" onClick={handleDownloadPDF}>
                <FiDownload /> Download PDF
              </button>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <form className="add-customer-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Customer Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Short Name"
                value={formData.short_name}
                onChange={(e) =>
                  setFormData({ ...formData, short_name: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <input
                type="text"
                placeholder="Type (Individual/Company)"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              />
              <input
                type="text"
                placeholder="GST Number"
                value={formData.gst}
                onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
              />
              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <input
                type="text"
                placeholder="Customer Flag (Yes/No)"
                value={formData.customer_flag}
                onChange={(e) =>
                  setFormData({ ...formData, customer_flag: e.target.value })
                }
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <button type="submit">{editingCustomer ? "Update" : "Add"}</button>
            </form>
          )}

          {/* Customers Table */}
          {loading ? (
            <p>Loading customers...</p>
          ) : (
            <div className="table-card">
              <h3>Customer List</h3>
              <table>
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Name</th>
                    <th>Short Name</th>
                    <th>Phone</th>
                    <th>Type</th>
                    <th>GST</th>
                    <th>Address</th>
                    <th>Email</th>
                    <th>Customer Flag</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCustomers.map((c) => (
                    <tr
                      key={c.customer_id}
                      className={selectedCustomer === c.customer_id ? "highlight" : ""}
                    >
                      <td>{c.customer_id}</td>
                      <td>{c.name}</td>
                      <td>{c.short_name}</td>
                      <td>{c.phone}</td>
                      <td>{c.type}</td>
                      <td>{c.gst}</td>
                      <td>{c.address}</td>
                      <td>{c.email}</td>
                      <td>{c.customer_flag}</td>
                      <td>{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={currentPage === i + 1 ? "active" : ""}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RentalDashboard;
