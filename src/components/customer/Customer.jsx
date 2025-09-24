import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import "./Customer.css";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import { FiEdit, FiTrash2, FiDownload } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const RentalDashboard = ({ onLogout }) => {
  // ✅ State
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 10;

  // ✅ Search + Highlight
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // ✅ Form state
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
    status: "",
  });

  // ✅ Menu state (track which row’s menu is open)
  const [menuOpen, setMenuOpen] = useState(null);

  // ✅ Fetch customers from API
  useEffect(() => {
    fetch("http://192.168.0.202:8080/irrl/genericApiUnjoin/customerlist")
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        setCustomers(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching customers:", err);
        setLoading(false);
      });
  }, []);

  // ✅ Suggestions (search by name or ID)
  const suggestions = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_id.toString().includes(search)
  );

  // ✅ Pagination slice
  const indexOfLast = currentPage * customersPerPage;
  const indexOfFirst = indexOfLast - customersPerPage;
  const currentCustomers = customers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(customers.length / customersPerPage);

  // ✅ Select suggestion
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer.customer_id);

    // Move searched customer to the top
    setCustomers((prev) => {
      const filtered = prev.filter((c) => c.customer_id !== customer.customer_id);
      return [customer, ...filtered];
    });

    setSearch("");
  };

  // ✅ Handle Add / Edit toggle
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
      status: "",
    });
    setShowForm(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setShowForm(true);
    setMenuOpen(null);
  };

  // ✅ Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCustomer) {
      // Update existing
      setCustomers(
        customers.map((c) =>
          c.customer_id === editingCustomer.customer_id
            ? { ...formData, customer_id: editingCustomer.customer_id }
            : c
        )
      );
    } else {
      // Add new
      const newCustomer = {
        ...formData,
        customer_id: Date.now().toString(),
      };
      setCustomers([...customers, newCustomer]);
    }
    setShowForm(false);
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
      status: "",
    });
  };

  // ✅ Handle delete
  const handleDelete = (id) => {
    setCustomers(customers.filter((c) => c.customer_id !== id));
    setMenuOpen(null);
  };

  // ✅ PDF Download Function
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

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    doc.save("customers.pdf");
  };

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />

      <div className="dashboard-body">
        <Rentalsidebar />

        <div className="main-content">
          {/* Search + Add + Download */}
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
                <FiDownload className="menu-icons" /> Download PDF
              </button>
            </div>
          </div>

          {/* ✅ Add/Edit Form */}
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
              <input
                type="text"
                placeholder="Status (Active/Inactive)"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              />
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
                    <th>Actions</th>
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
                      <td className="actions-cell">
                        <div className="menu-wrapper">
                          <button
                            className="menu-btn"
                            onClick={() =>
                              setMenuOpen(menuOpen === c.customer_id ? null : c.customer_id)
                            }
                          >
                            ⋮
                          </button>
                          {menuOpen === c.customer_id && (
                            <div className="menu">
                              <div onClick={() => handleEdit(c)}>
                                <FiEdit className="menu-icon" /> Edit
                              </div>
                              <div onClick={() => handleDelete(c.customer_id)}>
                                <FiTrash2 className="menu-icon" /> Delete
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ✅ Pagination */}
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
