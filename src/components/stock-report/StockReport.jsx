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
    description: "",
    item_main_type: "",
    item_sub_type: "",
    main_code: "",
    sub_code: "",
    count: 0,
    status: "AVAILABLE",
  });

  const navigate = useNavigate();

  // Fetch stock data
  useEffect(() => {
    fetch("http://localhost:8080/irrl/genericApiUnjoin/productMain")
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
    fetch("http://localhost:8080/irrl/attribute/brand")
      .then((res) => res.json())
      .then((data) => {
        setBrands(Array.isArray(data.data) ? data.data : []);
      })
      .catch((err) => console.error("Error fetching brands:", err));
  }, []);

  // Fetch Main Types
  useEffect(() => {
    fetch("http://localhost:8080/irrl/attribute/ItemMainType")
      .then((res) => res.json())
      .then((data) => {
        setMainTypes(Array.isArray(data.data) ? data.data : []);
      })
      .catch((err) => console.error("Error fetching main types:", err));
  }, []);

  // Fetch Sub Types
  useEffect(() => {
    fetch("http://localhost:8080/irrl/attribute/ItemSubType")
      .then((res) => res.json())
      .then((data) => {
        setSubTypes(Array.isArray(data.data) ? data.data : []);
      })
      .catch((err) => console.error("Error fetching sub types:", err));
  }, []);

  // Add stock
  const handleAddStock = () => {
    setStocks([...stocks, formData]);
    setFormData({
      item_name: "",
      brand: "",
      description: "",
      item_main_type: "",
      item_sub_type: "",
      main_code: "",
      sub_code: "",
      count: 0,
      status: "AVAILABLE",
    });
    setShowForm(false);
  };

  // Delete stock
  const handleDelete = (code) => {
    setStocks(stocks.filter((s) => s.main_code !== code));
  };

  // PDF Download
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Stock Report", 14, 20);

    const tableColumn = [
      "S.No",
      "Item Name",
      "Brand",
      "Description",
      "Main Code",
      "Sub Code",
      "Main Type",
      "Sub Type",
      "Available",
      "Rented",
      "Expired",
      "Repairing",
    ];
    const tableRows = [];

    stocks.forEach((s, i) => {
      tableRows.push([
        i + 1,
        s.item_name,
        s.brand,
        s.description,
        s.main_code,
        s.sub_code,
        s.item_main_type,
        s.item_sub_type,
        s.available_count || 0,
        s.rented_count || 0,
        s.expired_count || 0,
        s.repairing_count || 0,
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    doc.save("stock_report.pdf");
  };

  // Filtered stock
  const filteredStock = stocks.filter(
    (s) =>
      (s.item_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.brand?.toLowerCase().includes(search.toLowerCase()) ||
        s.main_code?.toLowerCase().includes(search.toLowerCase()))
  );

  // Filtered options for autocomplete
  const filteredBrands = brands
    .map((b) => b.name)
    .filter((name) =>
      name.toLowerCase().includes(formData.brand.toLowerCase())
    );

  const filteredMainTypes = mainTypes
    .map((m) => m.name)
    .filter((name) =>
      name.toLowerCase().includes(formData.item_main_type.toLowerCase())
    );

  const filteredSubTypes = subTypes
    .map((s) => s.name)
    .filter((name) =>
      name.toLowerCase().includes(formData.item_sub_type.toLowerCase())
    );

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />

        <div className="main-content">
          {/* Top bar */}
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
            <div className="add-stock-form">
              <input
                type="text"
                placeholder="Item Name"
                value={formData.item_name}
                onChange={(e) =>
                  setFormData({ ...formData, item_name: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Brand"
                list="brand-list"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
              />
              <datalist id="brand-list">
                {filteredBrands.map((b, idx) => (
                  <option key={idx} value={b.toUpperCase()} />
                ))}
              </datalist>

              <input
                type="text"
                placeholder="Main Type"
                list="main-type-list"
                value={formData.item_main_type}
                onChange={(e) =>
                  setFormData({ ...formData, item_main_type: e.target.value })
                }
              />
              <datalist id="main-type-list">
                {filteredMainTypes.map((m, idx) => (
                  <option key={idx} value={m.toUpperCase()} />
                ))}
              </datalist>

              <input
                type="text"
                placeholder="Sub Type"
                list="sub-type-list"
                value={formData.item_sub_type}
                onChange={(e) =>
                  setFormData({ ...formData, item_sub_type: e.target.value })
                }
              />
              <datalist id="sub-type-list">
                {filteredSubTypes.map((s, idx) => (
                  <option key={idx} value={s.toUpperCase()} />
                ))}
              </datalist>

              <input
                type="text"
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Main Code"
                value={formData.main_code}
                onChange={(e) =>
                  setFormData({ ...formData, main_code: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Sub Code"
                value={formData.sub_code}
                onChange={(e) =>
                  setFormData({ ...formData, sub_code: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Count"
                value={formData.count}
                onChange={(e) =>
                  setFormData({ ...formData, count: e.target.value })
                }
              />
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value.toUpperCase(),
                  })
                }
              >
                <option value="AVAILABLE">Available</option>
                <option value="RENTED">Rented</option>
                <option value="DAMAGED">Damaged</option>
                <option value="REPAIRING">Repairing</option>
              </select>
              <button onClick={handleAddStock}>Add</button>
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
                    <th>Description</th>
                    <th>Main Code</th>
                    <th>Sub Code</th>
                    <th>Main Type</th>
                    <th>Sub Type</th>
                    <th>Available</th>
                    <th>Rented</th>
                    <th>Expired</th>
                    <th>Repairing</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map((item, index) => (
                    <tr
                      key={item.main_code}
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/stock/${item.main_code}`)}
                    >
                      <td>{index + 1}</td>
                      <td>{item.item_name}</td>
                      <td>{item.brand}</td>
                      <td>{item.description}</td>
                      <td>{item.main_code}</td>
                      <td>{item.sub_code}</td>
                      <td>{item.item_main_type}</td>
                      <td>{item.item_sub_type}</td>
                      <td>{item.available_count || 0}</td>
                      <td>{item.rented_count || 0}</td>
                      <td>{item.expired_count || 0}</td>
                      <td>{item.repairing_count || 0}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(item.main_code)}
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
