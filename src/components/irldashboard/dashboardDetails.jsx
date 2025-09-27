import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import "./irlDashboard.css"; // Updated CSS file

const DashboardDetails = ({ onLogout }) => {
  const { status } = useParams(); // e.g., AVAILABLE, RENTED, etc.
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const filteredData = data.filter((item) =>
    (item.item_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading details...</div>;

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />

        <div className="main-content">
          <h2 className="dashboard-title">{status} Products</h2>

          {/* Search Box with Button */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by item name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>
          </div>

          {/* Table */}
          <div className="table-card">
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
                {filteredData.map((item, index) => (
                  <tr key={item.sub_code || index}>
                    <td>{index + 1}</td>
                    <td>{item.item_name}</td>
                    <td>{item.brand}</td>
                    <td>{item.item_main_type}</td>
                    <td>{item.item_sub_type}</td>
                    <td>{item.description}</td>
                    <td>{item.main_code}</td>
                    <td>{item.sub_code}</td>
                    <td>{item.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardDetails;
