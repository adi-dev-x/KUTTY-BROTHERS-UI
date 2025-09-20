import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import "./Subtype.css"; // Reuse same CSS
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

const SubTypeDashboard = ({ onLogout }) => {
  const [subTypes, setSubTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const subTypesPerPage = 10;
  const [search, setSearch] = useState("");

  // ✅ Fetch sub types from API
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/ItemSubType")
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        setSubTypes(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching sub types:", err);
        setLoading(false);
      });
  }, []);

  // ✅ Filter by search
  const filteredSubTypes = subTypes.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Pagination
  const indexOfLast = currentPage * subTypesPerPage;
  const indexOfFirst = indexOfLast - subTypesPerPage;
  const currentSubTypes = filteredSubTypes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredSubTypes.length / subTypesPerPage);

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />

      <div className="dashboard-body">
        <Rentalsidebar />

        <div className="main-content">
          {/* Search */}
          <div className="top-bar">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search sub types..."
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Sub Type Table */}
          {loading ? (
            <p>Loading sub types...</p>
          ) : (
            <div className="table-card">
              <h3>Sub Type List</h3>
              <div className="table-wrapper">
                <table className="brand-table">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Sub Type Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSubTypes.map((s, index) => (
                      <tr key={s.attributes_id}>
                        <td>{indexOfFirst + index + 1}</td>
                        <td>{s.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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

export default SubTypeDashboard;
