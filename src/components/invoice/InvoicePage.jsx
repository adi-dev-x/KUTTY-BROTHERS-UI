import React, { useState } from "react";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import { MdOutlineDelete } from "react-icons/md";
import { IoDownloadOutline } from "react-icons/io5";
import { TbFileInvoice } from "react-icons/tb";
import { IoMdAddCircleOutline } from "react-icons/io";
import * as XLSX from "xlsx";

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

  const handleDownloadExcel = (invoice) => {
    const tableData = [{
      "ID": invoice.id,
      "Customer": invoice.customer,
      "Amount": invoice.amount,
      "Date": invoice.date,
      "Status": invoice.status
    }];

    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice");
    XLSX.writeFile(workbook, `invoice_${invoice.id}.xlsx`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 bg-gray-100 px-6 py-8">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
          <TbFileInvoice className="text-yellow-600" /> Invoice Management
        </h2>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-yellow-600/20 transition focus:border-yellow-600 focus:ring-2"
          />
          <input type="file" className="text-sm" />
        </div>

        <form className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4" onSubmit={handleAddInvoice}>
          <input
            type="text"
            placeholder="Customer Name"
            value={newInvoice.customer}
            onChange={(e) => setNewInvoice({ ...newInvoice, customer: e.target.value })}
            className="rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Amount"
            value={newInvoice.amount}
            onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
            className="rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
          />
          <input
            type="date"
            value={newInvoice.date}
            onChange={(e) => setNewInvoice({ ...newInvoice, date: e.target.value })}
            className="rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
          />
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-700">
            <IoMdAddCircleOutline /> Add Invoice
          </button>
        </form>

        <div className="overflow-x-auto rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-yellow-50/40">
                  <td className="px-4 py-2">{inv.id}</td>
                  <td className="px-4 py-2">{inv.customer}</td>
                  <td className="px-4 py-2">₹{inv.amount}</td>
                  <td className="px-4 py-2">{inv.date}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => toggleStatus(inv.id)}
                      className={
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset " +
                        (inv.status === "Paid"
                          ? "bg-green-100 text-green-700 ring-green-600/20"
                          : "bg-gray-100 text-gray-600 ring-gray-400/20")
                      }
                    >
                      {inv.status}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700" onClick={() => handleDelete(inv.id)}>
                        <MdOutlineDelete /> Delete
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" onClick={() => handleDownloadExcel(inv)}>
                        <IoDownloadOutline /> Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InvoicePage;
