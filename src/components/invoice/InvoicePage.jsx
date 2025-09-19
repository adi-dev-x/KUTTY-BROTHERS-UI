import React, { useState } from "react";
import "./InvoicePage.css";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import { MdOutlineDelete } from "react-icons/md";
import { IoDownloadOutline } from "react-icons/io5";
import { TbFileInvoice } from "react-icons/tb";
import { IoMdAddCircleOutline } from "react-icons/io";





const InvoicePage = () => {
  const [invoices, setInvoices] = useState([
    { id: 1, customer: "John Doe", amount: 1200, date: "2025-08-01", status: "Paid" },
    { id: 2, customer: "Alice Smith", amount: 850, date: "2025-08-05", status: "Unpaid" },
    { id: 3, customer: "Bob Johnson", amount: 600, date: "2025-08-10", status: "Paid" },
     { id: 4, customer: "John Doe", amount: 1200, date: "2025-08-01", status: "Paid" },
    { id: 5, customer: "Alice Smith", amount: 850, date: "2025-08-05", status: "Unpaid" },
    { id: 6, customer: "Bob Johnson", amount: 600, date: "2025-08-10", status: "Paid" },
     { id: 7, customer: "John Doe", amount: 1200, date: "2025-08-01", status: "Paid" },
    { id: 8, customer: "Alice Smith", amount: 850, date: "2025-08-05", status: "Unpaid" },
    { id: 9, customer: "Bob Johnson", amount: 600, date: "2025-08-10", status: "Paid" },
     { id: 10, customer: "John Doe", amount: 1200, date: "2025-08-01", status: "Paid" },
    { id: 11, customer: "Alice Smith", amount: 850, date: "2025-08-05", status: "Unpaid" },
    { id: 12, customer: "Bob Johnson", amount: 600, date: "2025-08-10", status: "Paid" },
     { id: 13, customer: "John Doe", amount: 1200, date: "2025-08-01", status: "Paid" },
    { id: 14, customer: "Alice Smith", amount: 850, date: "2025-08-05", status: "Unpaid" },
    { id: 15, customer: "Bob Johnson", amount: 600, date: "2025-08-10", status: "Paid" },
  ]);

  const [search, setSearch] = useState("");
  const [newInvoice, setNewInvoice] = useState({
    customer: "",
    amount: "",
    date: "",
    status: "Unpaid",
  });

  // ✅ Filter invoices
  const filteredInvoices = invoices.filter((inv) =>
    inv.customer.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Add new invoice
  const handleAddInvoice = (e) => {
    e.preventDefault();
    if (!newInvoice.customer || !newInvoice.amount || !newInvoice.date) return;

    setInvoices([
      ...invoices,
      { id: invoices.length + 1, ...newInvoice, amount: Number(newInvoice.amount) },
    ]);
    setNewInvoice({ customer: "", amount: "", date: "", status: "Unpaid" });
  };

  // ✅ Delete invoice
  const handleDelete = (id) => {
    setInvoices(invoices.filter((inv) => inv.id !== id));
  };

  // ✅ Toggle status
  const toggleStatus = (id) => {
    setInvoices(
      invoices.map((inv) =>
        inv.id === id ? { ...inv, status: inv.status === "Paid" ? "Unpaid" : "Paid" } : inv
      )
    );
  };

  return (
    <div className="invoice-page">
        <Header/>
      <h2><TbFileInvoice />
 Invoice Management</h2>

      {/* ✅ Search + Import */}
      <div className="invoice-actions">
        <input
          type="text"
          placeholder="Search by customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input type="file" />
      </div>

      {/* ✅ Create Invoice Form */}
      <form className="invoice-form" onSubmit={handleAddInvoice}>
        <input
          type="text"
          placeholder="Customer Name"
          value={newInvoice.customer}
          onChange={(e) => setNewInvoice({ ...newInvoice, customer: e.target.value })}
        />
        <input
          type="number"
          placeholder="Amount"
          value={newInvoice.amount}
          onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
        />
        <input
          type="date"
          value={newInvoice.date}
          onChange={(e) => setNewInvoice({ ...newInvoice, date: e.target.value })}
        />
        <button type="submit"><IoMdAddCircleOutline />
 Add Invoice</button>
      </form>

      {/* ✅ Invoice Table */}
      <div className="invoice-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.id}</td>
                <td>{inv.customer}</td>
                <td>₹{inv.amount}</td>
                <td>{inv.date}</td>
                <td>
                  <span
                    className={`status ${inv.status.toLowerCase()}`}
                    onClick={() => toggleStatus(inv.id)}
                  >
                    {inv.status}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleDelete(inv.id)}><MdOutlineDelete /> Delete</button>
                  <button onClick={() => alert("Downloading Invoice PDF...")}><IoDownloadOutline />
 Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer/>
    </div>
  );
};

export default InvoicePage;
