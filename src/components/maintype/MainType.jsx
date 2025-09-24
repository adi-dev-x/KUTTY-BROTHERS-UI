import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import "./MainType.css"; // Reusing same CSS
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

const MainTypeDashboard = ({ onLogout }) => {
  const [mainTypes, setMainTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const mainTypesPerPage = 10;
  const [search, setSearch] = useState("");

  // ✅ Fetch main types from new API
  useEffect(() => {
    fetch("http://192.168.0.202:8080/irrl/attribute/ItemMainType")
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        setMainTypes(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching main types:", err);
        setLoading(false);
      });
  }, []);

  // ✅ Filter by search
  const filteredMainTypes = mainTypes.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Pagination
  const indexOfLast = currentPage * mainTypesPerPage;
  const indexOfFirst = indexOfLast - mainTypesPerPage;
  const currentMainTypes = filteredMainTypes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredMainTypes.length / mainTypesPerPage);

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
                placeholder="Search main types..."
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Main Type Table */}
          {loading ? (
            <p>Loading main types...</p>
          ) : (
            <div className="table-card">
              <h3>Main Type List</h3>
              <div className="table-wrapper">
                <table className="brand-table">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Main Type Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMainTypes.map((m, index) => (
                      <tr key={m.attributes_id || index}>
                        <td>{indexOfFirst + index + 1}</td>
                        <td>{m.name}</td>
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

export default MainTypeDashboard;
