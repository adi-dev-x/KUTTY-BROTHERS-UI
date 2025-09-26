import React, { useState, useEffect, useRef } from "react";
import { FiDownload, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

  const handleDownloadPDF = () => {
  const doc = new jsPDF("l", "pt", "a4"); // Landscape mode for wide table
  doc.setFontSize(12);
  doc.text("List of All Orders", 40, 40);

  const tableColumn = [
    "S.No",
    "Customer Name",
    "Customer ID",
    "Contact Person",
    "Contact Number",
    "Shipping Address",
    "Inventory ID",
    "Item ID",
    "Order ID",
    "Generated Amount",
    "Current Amount",
    "Rent Amount",
    "Placed At",
    "Returned At",
    "Status",
  ];

  const tableRows = filteredOrders.map((o, i) => [
    i + 1,
    o.customer_name || "-",
    o.customer_id || "-",
    o.contact_name || "-",
    o.contact_number || "-",
    o.shipping_address || "-",
    o.inventory_id || "-",
    o.item_id || "-",
    o.order_id || "-",
    o.generated_amount || "-",
    o.current_amount || "-",
    o.rent_amount || "-",
    o.placed_at ? new Date(o.placed_at).toLocaleDateString() : "-",
    o.returned_at ? new Date(o.returned_at).toLocaleDateString() : "-",
    o.status || "-",
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 60,
    theme: "grid",
    headStyles: { fillColor: [217, 148, 25], halign: "center" },
    bodyStyles: { halign: "center" },
    columnStyles: {
      1: { cellWidth: 100 }, // Customer Name
      3: { cellWidth: 100 }, // Contact Person
      5: { cellWidth: 150 }, // Shipping Address
    },
    styles: {
      fontSize: 10,
      overflow: "linebreak",
      cellPadding: 3,
    },
    tableWidth: "auto",
  });

  doc.save("list_orders.pdf");
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
            <button className="download-btn" onClick={handleDownloadPDF}>
              <FiDownload /> Download PDF
            </button>

            <div className="styled-filter">
              {/* Contact Person Filter */}
              <input
                type="text"
                placeholder="Filter by Contact Person"
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
              />
              <button className="apply-btn" onClick={handleFilter}>
                Apply
              </button>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="RENTED">Rented</option>
                <option value="AVAILABLE">Available</option>
                <option value="DAMAGED">Damaged</option>
                <option value="REPAIRING">Repairing</option>
                <option value="BLOCKED">Blocked</option>
                <option value="RESERVED">Reserved</option>
                <option value="EXPIRED">Expired</option>
              </select>
              <button className="apply-btn" onClick={handleFilter}>
                Apply
              </button>
            </div>
          </div>

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

              {/* Pagination */}
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
