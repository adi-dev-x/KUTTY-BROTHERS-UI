import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import "./irlDashboardDetails.css";

const DashboardDetails = ({ onLogout }) => {
  const { status } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `https://ems.binlaundry.com/irrl/genericApiUnjoin/productSingle?category='${status}'`
        );
        setData(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching dashboard details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [status]);

  // Distinct item names for dropdown
  const distinctItems = [...new Set(data.map((item) => item.item_name).filter(Boolean))];

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setSelectedItem(""); // Clear dropdown when typing in search
    
    if (value.trim()) {
      const filtered = distinctItems.filter((item) =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle dropdown change
  const handleDropdownChange = (e) => {
    const value = e.target.value;
    setSelectedItem(value);
    setSearchInput(""); // Clear search when selecting from dropdown
    setShowSuggestions(false);
  };

  // Handle suggestion click
  const handleSuggestionClick = (item) => {
    setSearchInput(item);
    setSelectedItem("");
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedItem("");
    setSearchInput("");
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Filter data based on dropdown selection OR search input
  const filteredData = data.filter((item) => {
    if (!item.item_name) return false;
    
    // If dropdown is selected, use dropdown filter
    if (selectedItem) {
      return item.item_name === selectedItem;
    }
    
    // If search input exists, use search filter
    if (searchInput.trim()) {
      return item.item_name.toLowerCase().includes(searchInput.toLowerCase());
    }
    
    // If no filters, show all
    return true;
  });

  if (loading) return <div className="loading">Loading details...</div>;

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />

        <div className="main-content">
          <h2 className="dashboard-title">{status} Products</h2>

          {/* Filters */}
          <div className="filters">
            {/* Dropdown Filter */}
            <div className="dropdown-filter">
              <label htmlFor="itemSelect">Filter by Item Name:</label>
              <select
                id="itemSelect"
                value={selectedItem}
                onChange={handleDropdownChange}
              >
                <option value="">All Items</option>
                {distinctItems.map((itemName, idx) => (
                  <option key={idx} value={itemName}>
                    {itemName}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Bar */}
            <div className="search-bar">
              <label>Search by Item Name:</label>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Type to search items..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchInput.trim() && suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow click on suggestions
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                />
                {/* Autocomplete suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="autocomplete-list">
                    {suggestions.map((item, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleSuggestionClick(item)}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Clear Filters Button */}
            {(selectedItem || searchInput) && (
              <div className="clear-filters">
                <button onClick={clearFilters} className="clear-btn">
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="results-info">
            <p>Showing {filteredData.length} of {data.length} items</p>
          </div>

          {/* Table */}
          <div className="table-card">
            <h3>{status} Products List</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Item Name</th>
                    <th>Brand</th>
                    <th>Main Type</th>
                    <th>Sub Type</th>
                    <th>Description</th>
                    <th>Main Code</th>
                    <th>Sub Code</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((item, index) => (
                      <tr key={item.sub_code || index}>
                        <td>{index + 1}</td>
                        <td><strong>{item.item_name}</strong></td>
                        <td>{item.brand}</td>
                        <td>{item.item_main_type}</td>
                        <td>{item.item_sub_type}</td>
                        <td>{item.description}</td>
                        <td>{item.main_code}</td>
                        <td>{item.sub_code}</td>
                        <td>
                          <span className={`status-badge ${item.category?.toLowerCase()}`}>
                            {item.category}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="no-data">
                        {searchInput || selectedItem ? 
                          "No items match your search criteria." : 
                          "No items found for this category."
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardDetails;