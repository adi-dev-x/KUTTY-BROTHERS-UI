import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CheckCircle,
  ShoppingCart,
  AlertTriangle,
  Wrench,
  XCircle,
  Ban,
  Calendar,
  Clock,
  ArrowLeft,
  Search,
  Filter
} from "lucide-react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import "./irlDashboardDetails.css";

const statusConfig = {
  AVAILABLE: {
    color: "#10b981", // emerald-500
    bg: "#ecfdf5", // emerald-50
    icon: CheckCircle,
  },
  RENTED: {
    color: "#3b82f6", // blue-500
    bg: "#eff6ff", // blue-50
    icon: ShoppingCart,
  },
  DAMAGED: {
    color: "#ef4444", // red-500
    bg: "#fef2f2", // red-50
    icon: AlertTriangle,
  },
  REPAIRING: {
    color: "#f97316", // orange-500
    bg: "#fff7ed", // orange-50
    icon: Wrench,
  },
  EXPIRED: {
    color: "#6b7280", // gray-500
    bg: "#f9fafb", // gray-50
    icon: XCircle,
  },
  BLOCKED: {
    color: "#e11d48", // rose-500
    bg: "#fff1f2", // rose-50
    icon: Ban,
  },
  RESERVED: {
    color: "#8b5cf6", // violet-500
    bg: "#f5f3ff", // violet-50
    icon: Calendar,
  },
  PENDING: {
    color: "#eab308", // yellow-500
    bg: "#fefce8", // yellow-50
    icon: Clock,
  },
};

const DashboardDetails = ({ onLogout }) => {
  const { status } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const config = statusConfig[status] || statusConfig.AVAILABLE;
  const StatusIcon = config.icon;

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

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent"></div>
        <p className="text-sm font-medium text-gray-500">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />

        <div className="main-content">
          {/* Header with Back Button */}
          <div className="header-section">
            <button
              onClick={() => navigate(-1)}
              className="back-button"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white border border-gray-100 shadow-sm text-gray-700">
                <StatusIcon size={20} style={{ color: config.color }} />
              </div>
              <div>
                <h2 className="page-title text-gray-900">{status} Products</h2>
                <p className="text-xs text-gray-500 font-medium">Manage your inventory items</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="filters">
            {/* Dropdown Filter */}
            <div className="dropdown-filter">
              <label htmlFor="itemSelect" className="flex items-center gap-2">
                <Filter size={14} /> Filter by Item
              </label>
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
              <label className="flex items-center gap-2">
                <Search size={14} /> Search
              </label>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchInput.trim() && suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                />
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
                <button
                  onClick={clearFilters}
                  className="clear-btn"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="results-info">
            <p>Showing <strong className="text-gray-900">{filteredData.length}</strong> items</p>
          </div>

          {/* Table */}
          <div className="table-card">
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
                        <td className="font-medium text-gray-400">{index + 1}</td>
                        <td><strong className="text-gray-900">{item.item_name}</strong></td>
                        <td>{item.brand}</td>
                        <td>{item.item_main_type}</td>
                        <td>{item.item_sub_type}</td>
                        <td><span className="text-gray-500 truncate max-w-xs block" title={item.description}>{item.description}</span></td>
                        <td className="font-mono text-xs">{item.main_code}</td>
                        <td className="font-mono text-xs">{item.sub_code}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: config.bg,
                              color: config.color,
                              border: `1px solid ${config.color}20`
                            }}
                          >
                            {item.category}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="no-data">
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                          <Search size={48} className="mb-4 opacity-20" />
                          <p>No items found matching your criteria.</p>
                        </div>
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