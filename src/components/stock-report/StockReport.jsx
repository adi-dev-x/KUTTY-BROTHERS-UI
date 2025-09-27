import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import "./StockReport.css";
import { FiDownload, FiPlus } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ===================== AutocompleteInput =====================
const AutocompleteInput = ({ list = [], value = "", setValue, keyName }) => {
  const [showList, setShowList] = useState(false);

  const filtered = Array.isArray(list)
    ? list.filter((item) =>
        (item[keyName] || "").toLowerCase().includes((value || "").toLowerCase())
      )
    : [];

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => {
          setValue(e.target.value);
          setShowList(true);
        }}
        onBlur={() => setTimeout(() => setShowList(false), 150)}
        onFocus={() => setShowList(true)}
        placeholder={`Search ${keyName}`}
      />

      {showList && filtered.length > 0 && (
        <ul className="autocomplete-list">
          {filtered.map((item, index) => (
            <li
              key={index}
              onClick={() => {
                setValue(item[keyName]);
                setShowList(false);
              }}
            >
              {item[keyName]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ===================== StockReport Component =====================
const StockReport = ({ onLogout }) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [brands, setBrands] = useState([]);
  const [mainTypes, setMainTypes] = useState([]);
  const [subTypes, setSubTypes] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
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

  // Normalize stock
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

  // Total sum for an item
  const calculateTotalSum = (item) => {
    const counts = [
      item.available_count || 0,
      item.rented_count || 0,
      item.damaged_count || 0,
      item.not_initiated_count || 0,
      item.worn_out_count || 0,
      item.blocked_count || 0,
      item.reserved_count || 0,
      item.pending_count || 0,
    ];
    return counts.reduce((sum, count) => sum + (Number(count) || 0), 0);
  };

  // Fetch stocks
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
        brand: formData.brand, // send actual brand string
        item_main_type: formData.item_main_type, // send main type string
        new_sub_code: formData.item_sub_type, // send sub type string
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

      setShowForm(false);
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
      "Available",
      "Rented",
      "Damaged",
      "Repairing",
      "Expired",
      "Blocked",
      "Reserved",
      "Pending",
      "Total Sum",
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
      s.available_count || 0,
      s.rented_count || 0,
      s.damaged_count || 0,
      s.not_initiated_count || 0,
      s.worn_out_count || 0,
      s.blocked_count || 0,
      s.reserved_count || 0,
      s.pending_count || 0,
      calculateTotalSum(s),
    ]);

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30 });
    doc.save("stock_report.pdf");
  };

  // Filter stocks
  const filteredStock = stocks.filter((s) => {
    const name = (s.item_name || "").toLowerCase();
    const brand = (s.brand || "").toLowerCase();
    const code = (s.sub_code || "").toLowerCase();
    const q = (search || "").toLowerCase();
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

                {/* Brand */}
                <div className="form-group">
                  <label>Brand</label>
                  <AutocompleteInput
                    list={brands}
                    value={formData.brand}
                    setValue={(val) => setFormData({ ...formData, brand: val })}
                    keyName="brand"
                  />
                </div>

                {/* Main Type */}
                <div className="form-group">
                  <label>Main Type</label>
                  <AutocompleteInput
                    list={mainTypes}
                    value={formData.item_main_type}
                    setValue={(val) =>
                      setFormData({ ...formData, item_main_type: val })
                    }
                    keyName="item_main_type"
                  />
                </div>

                {/* Sub Type */}
                <div className="form-group">
                  <label>Sub Type</label>
                  <AutocompleteInput
                    list={subTypes}
                    value={formData.item_sub_type}
                    setValue={(val) =>
                      setFormData({ ...formData, item_sub_type: val })
                    }
                    keyName="new_sub_code"
                  />
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
                    <th>Total Sum</th>
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
                      <td>
                        <strong>{calculateTotalSum(item)}</strong>
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
