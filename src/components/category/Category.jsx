import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import "./Category.css";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

const CategoryDashboard = ({ onLogout }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const categoriesPerPage = 10;
  const [search, setSearch] = useState("");

  // Fetch categories API
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/category")
      .then((res) => res.json())
      .then((data) => {
        setCategories(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setLoading(false);
      });
  }, []);

  // Filter categories by search
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const indexOfLast = currentPage * categoriesPerPage;
  const indexOfFirst = indexOfLast - categoriesPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);

  return (
    <div className="dashboard-wrapper yellow-theme">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />

        <div className="main-content">
          {/* Search */}
          <div className="top-bar">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search categories..."
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Categories Table */}
          {loading ? (
            <p>Loading categories...</p>
          ) : (
            <div className="table-card">
              <h3>Category List</h3>
              <div className="table-wrapper">
                <table className="category-table">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Category Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCategories.map((c, index) => (
                      <tr key={c.attributes_id}>
                        <td>{indexOfFirst + index + 1}</td>
                        <td>{c.name}</td>
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

export default CategoryDashboard;
