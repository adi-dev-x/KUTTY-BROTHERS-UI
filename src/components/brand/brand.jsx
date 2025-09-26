import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import "./brand.css";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

const BrandDashboard = ({ onLogout }) => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const brandsPerPage = 10;
  const [search, setSearch] = useState("");

  // ✅ Fetch brands from API
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/brand")
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        setBrands(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching brands:", err);
        setLoading(false);
      });
  }, []);

  // ✅ Filter brands by search
  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Pagination
  const indexOfLast = currentPage * brandsPerPage;
  const indexOfFirst = indexOfLast - brandsPerPage;
  const currentBrands = filteredBrands.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredBrands.length / brandsPerPage);

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
                placeholder="Search brands..."
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Brands Table */}
          {loading ? (
            <p>Loading brands...</p>
          ) : (
            <div className="table-card">
              <h3>Brand List</h3>
              <div className="table-wrapper">
                <table className="brand-table">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Brand Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentBrands.map((b, index) => (
                      <tr key={b.attributes_id}>
                        <td>{indexOfFirst + index + 1}</td>
                        <td>{b.name}</td>
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

export default BrandDashboard;
