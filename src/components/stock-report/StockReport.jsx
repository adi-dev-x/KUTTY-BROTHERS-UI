import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import "./StockReport.css";
import { FiDownload, FiPlus } from "react-icons/fi";
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
    add_count: "",
    status: "AVAILABLE",
  });

  const navigate = useNavigate();

  // Normalize stock (sub_code fallback)
  const normalizeStock = (s) => {
    const maybeSub =
      s?.sub_code ??
      s?.subCode ??
      s?.subcode ??
      s?.new_sub_code ??
      s?.inventory_id ??
      s?.main_code ??
      "";
    return { ...s, sub_code: maybeSub };
  };

  // Fetch stock list
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/genericApiUnjoin/productMain")
      .then((res) => res.json())
      .then((data) => {
        const raw = Array.isArray(data?.data) ? data.data : [];
        const normalized = raw.map(normalizeStock);
        setStocks(normalized);
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
      .then((data) => setBrands(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => console.error("Error fetching brands:", err));
  }, []);

  // Fetch main types
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/ItemMainType")
      .then((res) => res.json())
      .then((data) => setMainTypes(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => console.error("Error fetching main types:", err));
  }, []);

  // Fetch sub types
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/ItemSubType")
      .then((res) => res.json())
      .then((data) => setSubTypes(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => console.error("Error fetching sub types:", err));
  }, []);

  // Add stock
  const handleAddStock = async () => {
    if (!formData.item_name || !formData.main_code || !formData.add_count) {
      return alert("Please fill all required fields");
    }

    try {
      const payload = {
        name: formData.item_name,
        brand_id: formData.brand, // send brand ID
        item_main_type_id: formData.item_main_type, // send main type ID
        item_sub_type_id: formData.item_sub_type, // send sub type ID
        description: formData.description,
        main_code: formData.main_code,
        sub_code: formData.sub_code,
        units: Number(formData.add_count),
        category: formData.status,
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

      window.location.reload();
    } catch (error) {
      console.error("Error adding stock:", error);
      alert("Failed to add stock. Check console for details.");
    }
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
      s.status || s.category,
    ]);

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30 });
    doc.save("stock_report.pdf");
  };

  // Filter stocks
  const filteredStock = stocks.filter((s) => {
    const name = (s.item_name || "").toLowerCase();
    const brand = (s.brand || "").toLowerCase();
    const code = (s.sub_code || "").toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || brand.includes(q) || code.includes(q);
  });

  const handleRowClick = (item) => {
    const sc = item.sub_code;
    if (!sc) {
      alert("Cannot open details: sub_code missing");
      return;
    }
    navigate(`/stock/${encodeURIComponent(sc)}`);
  };

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
            <button className="add-btn" onClick={() => setShowForm(true)}>
              <FiPlus /> Add Stock
            </button>
            <button className="download-btn" onClick={handleDownloadPDF}>
              <FiDownload /> Download PDF
            </button>
          </div>

          {/* Popup Form */}
          {showForm && (
            <div className="popup-form">
              <div className="popup-content">
                <button className="close-popup" onClick={() => setShowForm(false)}>
                  ×
                </button>

                {/* Item Name */}
                <div className="form-group">
                  <label>Item Name</label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) =>
                      setFormData({ ...formData, item_name: e.target.value })
                    }
                  />
                </div>

                {/* Brand dropdown */}
                <div className="form-group">
                  <label>Brand</label>
                  <select
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b.brand_id} value={b.brand_id}>
                        {b.brand}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Main type dropdown */}
                <div className="form-group">
                  <label>Main Type</label>
                  <select
                    value={formData.item_main_type}
                    onChange={(e) =>
                      setFormData({ ...formData, item_main_type: e.target.value })
                    }
                  >
                    <option value="">Select Main Type</option>
                    {mainTypes.map((m) => (
                      <option key={m.item_main_type_id} value={m.item_main_type_id}>
                        {m.item_main_type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub type dropdown */}
                <div className="form-group">
                  <label>Sub Type</label>
                  <select
                    value={formData.item_sub_type}
                    onChange={(e) =>
                      setFormData({ ...formData, item_sub_type: e.target.value })
                    }
                  >
                    <option value="">Select Sub Type</option>
                    {subTypes.map((s) => (
                      <option key={s.item_sub_type_id} value={s.item_sub_type_id}>
                        {s.item_sub_type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Main/Sub Code */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Main Code</label>
                    <input
                      type="text"
                      value={formData.main_code}
                      onChange={(e) =>
                        setFormData({ ...formData, main_code: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Sub Code</label>
                    <input
                      type="text"
                      value={formData.sub_code}
                      onChange={(e) =>
                        setFormData({ ...formData, sub_code: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                {/* Add count */}
                <div className="form-group">
                  <label>Add Count</label>
                  <input
                    type="number"
                    value={formData.add_count}
                    onChange={(e) =>
                      setFormData({ ...formData, add_count: e.target.value })
                    }
                  />
                </div>

                {/* Status */}
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
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>

                <button className="add-btn-floating" onClick={handleAddStock}>
                  Add Stock
                </button>
              </div>
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
                    <th>Repairing</th>
                    <th>Expired</th>
                    <th>Blocked</th>
                    <th>Reserved</th>
                    <th>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map((item, index) => (
                    <tr
                      key={`${item.sub_code || "no-sub"}-${index}`}
                      onClick={() => handleRowClick(item)}
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
                      <td>{item.blocked_count}</td>
                      <td>{item.reserved_count}</td>
                      <td>{item.pending_count}</td>
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
