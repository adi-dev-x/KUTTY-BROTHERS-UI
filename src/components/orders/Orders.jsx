import React, { useState, useEffect } from "react";
import { FiDownload, FiPlus, FiTrash2 } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import OrderForm from "./OrderForm";

const Orders = ({ onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [statuses, setStatuses] = useState(["COMPLETED", "BLOCKED", "INITIATED", "RESERVED"]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;
  const navigate = useNavigate();

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          "https://ems.binlaundry.com/irrl/genericApiUnjoin/listOrders"
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
          "https://ems.binlaundry.com/irrl/genericApiUnjoin/statusOptions"
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
        `https://ems.binlaundry.com/irrl/updateOrder/${delivery_id}?status=${newStatus}`
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
        `https://ems.binlaundry.com/irrl/updateOrder/${delivery_id}?status=DELETED`
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
    <div className="flex h-screen flex-col overflow-hidden">
      <Header onLogout={onLogout} />
      <div className="flex flex-1 overflow-hidden bg-gray-100">
        <Rentalsidebar />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex items-center gap-3">
            <input
              type="text"
              placeholder="Search orders..."
              className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-yellow-600/20 transition focus:border-yellow-600 focus:ring-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-700" onClick={() => setShowForm(!showForm)}>
              <FiPlus /> Add Order
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={handleDownloadPDF}>
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
            <p className="text-gray-600">Loading orders...</p>
          ) : (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Orders Report</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-left">S.No</th>
                      <th className="px-4 py-2 text-left">Customer Name</th>
                      <th className="px-4 py-2 text-left">Customer ID</th>
                      <th className="px-4 py-2 text-left">Contact Person</th>
                      <th className="px-4 py-2 text-left">Contact Number</th>
                      <th className="px-4 py-2 text-left">Shipping Address</th>
                      <th className="px-4 py-2 text-left">Inventory ID</th>
                      <th className="px-4 py-2 text-left">Generated Amount</th>
                      <th className="px-4 py-2 text-left">Current Amount</th>
                      <th className="px-4 py-2 text-left">Advance Amount</th>
                      <th className="px-4 py-2 text-left">Placed At</th>
                      <th className="px-4 py-2 text-left">Returned At</th>
                      <th className="px-4 py-2 text-left">Transactions</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentRows.map((o, i) => (
                      <tr
                        key={o.delivery_id}
                        onClick={() => navigate(`/order-details/${o.delivery_id}`)}
                        className="cursor-pointer hover:bg-yellow-50/40"
                      >
                        <td className="px-4 py-2">{indexOfFirstRow + i + 1}</td>
                        <td className="px-4 py-2">{o.customer_name || "-"}</td>
                        <td className="px-4 py-2">{o.customer_id || "-"}</td>
                        <td className="px-4 py-2">{o.contact_name || "-"}</td>
                        <td className="px-4 py-2">{o.contact_number || "-"}</td>
                        <td className="px-4 py-2">{o.shipping_address || "-"}</td>
                        <td className="px-4 py-2">{o.inventory_id || "-"}</td>
                        <td className="px-4 py-2">{o.generated_amount || "-"}</td>
                        <td className="px-4 py-2">{o.current_amount || "-"}</td>
                        <td className="px-4 py-2">{o.advance_amount || "-"}</td>
                        <td className="px-4 py-2">{o.placed_at || "-"}</td>
                        <td className="px-4 py-2">{o.declined_at || "-"}</td>
                        <td className="px-4 py-2">
                          <button
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 transition hover:bg-gray-50"
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
                        <td className="px-4 py-2">
                          <select
                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                            value={o.status}
                            onClick={(e) => e.stopPropagation()}
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
                        <td className="px-4 py-2">
                          <button
                            className="rounded-md bg-red-600 px-3 py-1.5 text-white transition hover:bg-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
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
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{indexOfFirstRow + 1}</span> to{" "}
                        <span className="font-medium">{Math.min(indexOfLastRow, filteredOrders.length)}</span> of{" "}
                        <span className="font-medium">{filteredOrders.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === i + 1
                                ? "z-10 bg-yellow-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
                                : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                              }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
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
