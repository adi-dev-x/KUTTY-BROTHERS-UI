import React, { useState, useEffect, useRef } from "react";
import { FiDownload, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import axios from "axios";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";


const ListOrders = ({ onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchContact, setSearchContact] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;
  const tableRef = useRef(null);

  // Popup state
  const [showExcelPopup, setShowExcelPopup] = useState(false);
  const [excelStatus, setExcelStatus] = useState(""); // default empty
  const [excelDays, setExcelDays] = useState(""); // default empty

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          "https://ems.binlaundry.com/irrl/genericApiJoin/listAllOrders"
        );
        setOrders(res.data?.data || []);
        setFilteredOrders(res.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Excel download
  const handleDownloadExcel = async () => {
    try {
      const response = await axios.get(
        "https://ems.binlaundry.com/irrl/reports/delivery",
        {
          params: {
            date_range: excelDays || "", // Days dropdown value
            remark: excelStatus || ""    // Status dropdown value
          },
          responseType: "blob", // Important for file download
        }
      );

      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "delivery_report.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowExcelPopup(false);
    } catch (err) {
      console.error("Error downloading Excel:", err);
    }
  };


  const handleFilter = () => {
    const filtered = orders.filter(
      (o) =>
        (o.contact_name || "").toLowerCase().includes(searchContact.toLowerCase()) &&
        (statusFilter === "" || (o.status || "").toLowerCase() === statusFilter.toLowerCase())
    );
    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const scrollTable = (direction) => {
    if (tableRef.current) {
      const scrollAmount = 300;
      tableRef.current.scrollLeft += direction === "left" ? -scrollAmount : scrollAmount;
    }
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredOrders.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

  const getPageNumbers = () => {
    const maxVisible = 9;
    let start = Math.max(currentPage - Math.floor(maxVisible / 2), 1);
    let end = start + maxVisible - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(end - maxVisible + 1, 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header onLogout={onLogout} />
      <div className="flex flex-1 overflow-hidden bg-gray-100">
        <Rentalsidebar />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowExcelPopup(true)}>
              <FiDownload /> Download Excel
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Filter by Contact Person"
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className="w-56 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
              />
              <button className="rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-700" onClick={handleFilter}>Apply</button>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="RENTED">Rented</option>
                <option value="BLOCKED">Blocked</option>
                <option value="INITIATED">Initiated</option>
                <option value="RESERVED">Reserved</option>
              </select>
              <button className="rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-700" onClick={handleFilter}>Apply</button>
            </div>
          </div>

          {showExcelPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Download Delivery Report</h3>

                <label className="mb-3 block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Select Days</span>
                  <select
                    value={excelDays}
                    onChange={(e) => setExcelDays(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">-- Select Days --</option>
                    <option value="7 days">7 Days</option>
                    <option value="14 days">14 Days</option>
                    <option value="21 days">21 Days</option>
                    <option value="30 days">1 Month</option>
                    <option value="180 days">6 Month</option>
                    <option value="365 days">1 Year</option>
                  </select>
                </label>

                <label className="mb-4 block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Select Status</span>
                  <select
                    value={excelStatus}
                    onChange={(e) => setExcelStatus(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">-- Select Status --</option>
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="INITIATED">Initiated</option>
                    <option value="RESERVED">Reserved</option>
                  </select>
                </label>

                <div className="flex justify-end gap-2">
                  <button className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700" onClick={() => setShowExcelPopup(false)}>Cancel</button>
                  <button className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700" onClick={handleDownloadExcel}>Download</button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-gray-600">Loading orders...</p>
          ) : (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">List of All Orders</h3>

              <div className="relative">
                <button className="absolute left-0 top-1/2 -translate-y-1/2 rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50" onClick={() => scrollTable("left")}>
                  <FiChevronLeft />
                </button>
                <div className="mx-10 overflow-x-auto" ref={tableRef}>
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
                        <th className="px-4 py-2 text-left">Item ID</th>
                        <th className="px-4 py-2 text-left">Order ID</th>
                        <th className="px-4 py-2 text-left">Generated Amount</th>
                        <th className="px-4 py-2 text-left">Current Amount</th>
                        <th className="px-4 py-2 text-left">Rent Amount</th>
                        <th className="px-4 py-2 text-left">Placed At</th>
                        <th className="px-4 py-2 text-left">Returned At</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentRows.map((o, i) => (
                        <tr key={o.order_id} className="hover:bg-yellow-50/40">
                          <td className="px-4 py-2">{indexOfFirstRow + i + 1}</td>
                          <td className="px-4 py-2">{o.customer_name || "-"}</td>
                          <td className="px-4 py-2">{o.customer_id || "-"}</td>
                          <td className="px-4 py-2">{o.contact_name || "-"}</td>
                          <td className="px-4 py-2">{o.contact_number || "-"}</td>
                          <td className="px-4 py-2">{o.shipping_address || "-"}</td>
                          <td className="px-4 py-2">{o.inventory_id || "-"}</td>
                          <td className="px-4 py-2">{o.item_id || "-"}</td>
                          <td className="px-4 py-2">{o.order_id || "-"}</td>
                          <td className="px-4 py-2">{o.generated_amount || "-"}</td>
                          <td className="px-4 py-2">{o.current_amount || "-"}</td>
                          <td className="px-4 py-2">{o.rent_amount || "-"}</td>
                          <td className="px-4 py-2">{o.placed_at ? new Date(o.placed_at).toLocaleDateString() : "-"}</td>
                          <td className="px-4 py-2">{o.returned_at ? new Date(o.returned_at).toLocaleDateString() : "-"}</td>
                          <td className="px-4 py-2">{o.status || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="absolute right-0 top-1/2 -translate-y-1/2 rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50" onClick={() => scrollTable("right")}>
                  <FiChevronRight />
                </button>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
                  <button className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 disabled:opacity-50" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                    Prev
                  </button>
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={page === currentPage ? "rounded-md bg-yellow-600 px-3 py-1.5 font-semibold text-white" : "rounded-md border border-gray-300 px-3 py-1.5 text-gray-700"}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 disabled:opacity-50"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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

export default ListOrders;
