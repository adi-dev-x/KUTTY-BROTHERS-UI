import React, { useState, useEffect, useRef } from "react";
import { FiDownload, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import axios from "axios";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import "./ListOrders.css";

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
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />
        <div className="main-content">
          <div className="stock-top-bar">
            <button className="download-btn" onClick={() => setShowExcelPopup(true)}>
              <FiDownload /> Download Excel
            </button>

            <div className="styled-filter">
              <input
                type="text"
                placeholder="Filter by Contact Person"
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
              />
              <button className="apply-btn" onClick={handleFilter}>Apply</button>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="RENTED">Rented</option>
                <option value="BLOCKED">Blocked</option>
                <option value="INITIATED">Initiated</option>
                <option value="RESERVED">Reserved</option>
              </select>
              <button className="apply-btn" onClick={handleFilter}>Apply</button>
            </div>
          </div>

          {/* Excel Popup */}
          {showExcelPopup && (
            <div className="popup-overlay">
              <div className="popup-content">
                <h3>Download Delivery Report</h3>

                <label>
                  Select Days:
                  <select
                    value={excelDays}
                    onChange={(e) => setExcelDays(e.target.value)}
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

                <label>
                  Select Status:
                  <select
                    value={excelStatus}
                    onChange={(e) => setExcelStatus(e.target.value)}
                  >
                    <option value="">-- Select Status --</option>
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="INITIATED">Initiated</option>
                    <option value="RESERVED">Reserved</option>
                  </select>
                </label>

                <div className="popup-buttons">
                  <button className="apply-btn" onClick={handleDownloadExcel}>Download</button>
                  <button className="cancel-btn" onClick={() => setShowExcelPopup(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <p>Loading orders...</p>
          ) : (
            <div className="table-card">
              <h3>List of All Orders</h3>

              <div className="table-scroll-wrapper">
                <button className="scroll-btn left" onClick={() => scrollTable("left")}>
                  <FiChevronLeft />
                </button>
                <div className="table-scroll" ref={tableRef}>
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
                        <th>Item ID</th>
                        <th>Order ID</th>
                        <th>Generated Amount</th>
                        <th>Current Amount</th>
                        <th>Rent Amount</th>
                        <th>Placed At</th>
                        <th>Returned At</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRows.map((o, i) => (
                        <tr key={o.order_id}>
                          <td>{indexOfFirstRow + i + 1}</td>
                          <td>{o.customer_name || "-"}</td>
                          <td>{o.customer_id || "-"}</td>
                          <td>{o.contact_name || "-"}</td>
                          <td>{o.contact_number || "-"}</td>
                          <td>{o.shipping_address || "-"}</td>
                          <td>{o.inventory_id || "-"}</td>
                          <td>{o.item_id || "-"}</td>
                          <td>{o.order_id || "-"}</td>
                          <td>{o.generated_amount || "-"}</td>
                          <td>{o.current_amount || "-"}</td>
                          <td>{o.rent_amount || "-"}</td>
                          <td>{o.placed_at ? new Date(o.placed_at).toLocaleDateString() : "-"}</td>
                          <td>{o.returned_at ? new Date(o.returned_at).toLocaleDateString() : "-"}</td>
                          <td>{o.status || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="scroll-btn right" onClick={() => scrollTable("right")}>
                  <FiChevronRight />
                </button>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                    Prev
                  </button>
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={page === currentPage ? "active-page" : ""}
                    >
                      {page}
                    </button>
                  ))}
                  <button
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
