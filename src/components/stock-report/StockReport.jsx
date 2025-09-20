import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import "./StockReport.css";
import { FiDownload, FiPlus, FiTrash2 } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const StockReport = ({ onLogout }) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [brands, setBrands] = useState([]);
  const [mainTypes, setMainTypes] = useState([]);
  const [subTypes, setSubTypes] = useState([]);

  const [formData, setFormData] = useState({
    item_name: "",
    brand: "",
    item_main_type: "",
    item_sub_type: "",
    description: "",
    main_code: "",
    sub_code: "",
    available_count: "",
    rented_count: "",
    damaged_count: "",
    not_initiated_count: "",
    worn_out_count: "",
    status: "AVAILABLE",
  });

  const navigate = useNavigate();

  // Fetch stock data
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/genericApiUnjoin/productMain")
      .then((res) => res.json())
      .then((data) => {
        setStocks(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching stock:", err);
        setLoading(false);
      });
  }, []);

  // Fetch brands
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/brand")
      .then((res) => res.json())
      .then((data) => setBrands(Array.isArray(data.data) ? data.data : []))
      .catch((err) => console.error("Error fetching brands:", err));
  }, []);

  // Fetch Main Types
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/ItemMainType")
      .then((res) => res.json())
      .then((data) => setMainTypes(Array.isArray(data.data) ? data.data : []))
      .catch((err) => console.error("Error fetching main types:", err));
  }, []);

  // Fetch Sub Types
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/ItemSubType")
      .then((res) => res.json())
      .then((data) => setSubTypes(Array.isArray(data.data) ? data.data : []))
      .catch((err) => console.error("Error fetching sub types:", err));
  }, []);

  // Add stock
  const handleAddStock = async () => {
    if (!formData.item_name || !formData.main_code || !formData.available_count) {
      return alert("Please fill all required fields");
    }

    try {
      // Map UI fields to backend field names
      const payload = {
        name: formData.item_name,
        brand: formData.brand,
        item_main_type: formData.item_main_type,
        new_sub_code: formData.item_sub_type,
        description: formData.description,
        main_code: formData.main_code,
        sub_code: formData.sub_code,
        units: Number(formData.available_count), // send as units
        rented_count: Number(formData.rented_count),
        damaged_count: Number(formData.damaged_count),
        not_initiated_count: Number(formData.not_initiated_count),
        worn_out_count: Number(formData.worn_out_count),
        category: formData.status, // keep old backend name
      };

      const response = await fetch("https://ems.binlaundry.com/irrl/addProduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add stock: ${errorText}`);
      }

      const newStock = await response.json();
      setStocks([...stocks, newStock]);

      setFormData({
        item_name: "",
        brand: "",
        item_main_type: "",
        item_sub_type: "",
        description: "",
        main_code: "",
        sub_code: "",
        available_count: "",
        rented_count: "",
        damaged_count: "",
        not_initiated_count: "",
        worn_out_count: "",
        status: "AVAILABLE",
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error adding stock:", error);
      alert("Failed to add stock. Check console for details.");
    }
  };

  // Delete stock
  const handleDelete = (sub_code) => {
    setStocks(stocks.filter((s) => s.sub_code !== sub_code));
  };

  // Download PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Stock Report", 14, 20);

    const tableColumn = [
      "S.No",
      "Item Name",
      "Brand",
      "Main Type",
      "Sub Type",
      "Description",
      "Main Code",
      "Sub Code",
      "Available",
      "Rented",
      "Damaged",
      "Not Initiated",
      "Worn Out",
      "Category",
    ];

    const tableRows = stocks.map((s, i) => [
      i + 1,
      s.item_name,
      s.brand,
      s.item_main_type,
      s.item_sub_type,
      s.description,
      s.main_code,
      s.sub_code,
      s.available_count,
      s.rented_count,
      s.damaged_count,
      s.not_initiated_count,
      s.worn_out_count,
      s.status || s.category,
    ]);

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30 });
    doc.save("stock_report.pdf");
  };

  // Filtered stock
  const filteredStock = stocks.filter(
    (s) =>
      s.item_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.brand?.toLowerCase().includes(search.toLowerCase()) ||
      s.sub_code?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBrands = brands.map((b) => b.name).filter((b) =>
    b.toLowerCase().includes(formData.brand.toLowerCase())
  );

  const filteredMainTypes = mainTypes.map((m) => m.name).filter((m) =>
    m.toLowerCase().includes(formData.item_main_type.toLowerCase())
  );

  const filteredSubTypes = subTypes.map((s) => s.name).filter((s) =>
    s.toLowerCase().includes(formData.item_sub_type.toLowerCase())
  );

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />

        <div className="main-content">
          <div className="stock-top-bar">
            <input
              type="text"
              placeholder="Search..."
              className="search-input small-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="add-btn" onClick={() => setShowForm(!showForm)}>
              <FiPlus /> Add Stock
            </button>
            <button className="download-btn" onClick={handleDownloadPDF}>
              <FiDownload /> Download PDF
            </button>
          </div>

          {/* Add Stock Form */}
          {showForm && (
            <div className="add-stock-form-floating">
              {["item_name", "brand", "item_main_type", "item_sub_type", "description", "main_code", "sub_code", "available_count", "rented_count", "damaged_count", "not_initiated_count", "worn_out_count"].map((key, idx) => (
                <div className="form-group" key={idx}>
                  <label>{key.replace("_", " ").toUpperCase()}</label>
                  <input
                    type={key.includes("count") ? "number" : "text"}
                    value={formData[key]}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    list={
                      key === "brand"
                        ? "brand-list"
                        : key === "item_main_type"
                        ? "main-type-list"
                        : key === "item_sub_type"
                        ? "sub-type-list"
                        : undefined
                    }
                  />
                  {key === "brand" && (
                    <datalist id="brand-list">
                      {filteredBrands.map((b, i) => (
                        <option key={i} value={b} />
                      ))}
                    </datalist>
                  )}
                  {key === "item_main_type" && (
                    <datalist id="main-type-list">
                      {filteredMainTypes.map((m, i) => (
                        <option key={i} value={m} />
                      ))}
                    </datalist>
                  )}
                  {key === "item_sub_type" && (
                    <datalist id="sub-type-list">
                      {filteredSubTypes.map((s, i) => (
                        <option key={i} value={s} />
                      ))}
                    </datalist>
                  )}
                </div>
              ))}

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value.toUpperCase() })
                  }
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="RENTED">Rented</option>
                  <option value="DAMAGED">Damaged</option>
                  <option value="REPAIRING">Repairing</option>
                </select>
              </div>

              <button className="add-btn-floating" onClick={handleAddStock}>
                Add Stock
              </button>
            </div>
          )}

          {/* Stock Table */}
          {loading ? (
            <p>Loading stocks...</p>
          ) : (
            <div className="table-card">
              <h3>Stock Report</h3>
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
                    <th>Available</th>
                    <th>Rented</th>
                    <th>Damaged</th>
                    <th>Not Initiated</th>
                    <th>Worn Out</th>
                    <th>Category</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map((item, index) => (
                    <tr
                      key={`${item.sub_code}-${index}`}
                      onClick={() => navigate(`/stock/${item.sub_code}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{index + 1}</td>
                      <td>{item.item_name}</td>
                      <td>{item.brand}</td>
                      <td>{item.item_main_type}</td>
                      <td>{item.item_sub_type}</td>
                      <td>{item.description}</td>
                      <td>{item.main_code}</td>
                      <td>{item.sub_code}</td>
                      <td>{item.available_count}</td>
                      <td>{item.rented_count}</td>
                      <td>{item.damaged_count}</td>
                      <td>{item.not_initiated_count}</td>
                      <td>{item.worn_out_count}</td>
                      <td>{item.status || item.category}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(item.sub_code)}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockReport;
