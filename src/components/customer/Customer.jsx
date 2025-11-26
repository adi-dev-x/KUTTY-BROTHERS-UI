import React, { useState, useEffect } from "react";
import { FiDownload, FiPlus, FiSearch, FiX, FiChevronLeft, FiChevronRight, FiEdit2, FiTrash2 } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import Footer from "../footer/Footer";

const Customer = ({ onLogout }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
    status: "Active",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Search filter
  const filteredCustomers = customers.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.customer_id || "").toString().includes(search) ||
      (c.phone || "").includes(search)
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
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
      window.location.reload();
      setShowForm(false);
    } catch (err) {
      console.error("Error saving customer:", err);
      alert("Failed to save customer. Check console.");
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Customer Report", 14, 20);

    const tableColumn = [
      "ID",
      "Name",
      "Phone",
      "Type",
      "GST",
      "Address",
      "Status",
    ];

    const tableRows = customers.map((c) => [
      c.customer_id,
      c.name,
      c.phone,
      c.type,
      c.gst,
      c.address,
      c.status,
    ]);

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30 });
    doc.save("customers.pdf");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <Header onLogout={onLogout} />

      <div className="flex flex-1 overflow-hidden">
        <Rentalsidebar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                <p className="text-sm text-gray-500">Manage your customer database</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddClick}
                  className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                  <FiPlus className="h-4 w-4" /> Add Customer
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                  <FiDownload className="h-4 w-4" /> Export PDF
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, ID, or phone..."
                className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-gray-500 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
            </div>

            {/* Content Area */}
            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-600 border-t-transparent"></div>
                  <p className="text-sm font-medium text-gray-500">Loading customers...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">GST</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {currentItems.length > 0 ? (
                        currentItems.map((customer) => (
                          <tr key={customer.customer_id} className="transition-colors hover:bg-gray-50">
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                              #{customer.customer_id}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                                <span className="text-xs text-gray-500">{customer.short_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-900">{customer.phone}</span>
                                <span className="text-xs text-gray-500">{customer.email}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {customer.type}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {customer.gst || "-"}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${customer.status === "Active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                  }`}
                              >
                                {customer.status}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(customer)}
                                  className="rounded p-1 text-blue-600 hover:bg-blue-50"
                                  title="Edit"
                                >
                                  <FiEdit2 className="h-4 w-4" />
                                </button>
                                <button
                                  className="rounded p-1 text-red-600 hover:bg-red-50"
                                  title="Delete"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                            No customers found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                        <span className="font-medium">{Math.min(indexOfLastItem, filteredCustomers.length)}</span> of{" "}
                        <span className="font-medium">{filteredCustomers.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => handlePageChange(i + 1)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === i + 1
                                ? "z-10 bg-yellow-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
                                : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                              }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <FiChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Short Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm"
                    value={formData.short_name}
                    onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <input
                    type="text"
                    placeholder="Individual / Company"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">GST Number</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm"
                    value={formData.gst}
                    onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                  {editingCustomer ? "Update Customer" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;
