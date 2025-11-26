import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import { FiDownload, FiPlus } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ===================== AutocompleteInput =====================
const AutocompleteInput = ({ list = [], value = "", setValue, keyName }) => {
  const [showList, setShowList] = useState(false);

  // figure out the usable key
  const getDisplay = (item) => {
    if (!item) return "";
    if (item[keyName]) return item[keyName];
    if (item.name) return item.name;
    if (item.value) return item.value;
    return "";
  };

  const filtered = Array.isArray(list)
    ? list.filter((item) =>
      getDisplay(item).toLowerCase().includes((value || "").toLowerCase())
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
          {filtered.map((item, idx) => (
            <li
              key={idx}
              onClick={() => {
                setValue(getDisplay(item));
                setShowList(false);
              }}
            >
              {getDisplay(item)}
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      .then((data) => {
        console.log("Brand API:", data);
        setBrands(Array.isArray(data?.data) ? data.data : []);
      })
      .catch((err) => console.error("Error fetching brands:", err));
  }, []);

  // Fetch main types
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/ItemMainType")
      .then((res) => res.json())
      .then((data) => {
        console.log("Main Type API:", data);
        setMainTypes(Array.isArray(data?.data) ? data.data : []);
      })
      .catch((err) => console.error("Error fetching main types:", err));
  }, []);

  // Fetch sub types
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/ItemSubType")
      .then((res) => res.json())
      .then((data) => {
        console.log("Sub Type API:", data);
        setSubTypes(Array.isArray(data?.data) ? data.data : []);
      })
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

      // reload page on success
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

  // Pagination
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredStock.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredStock.length / itemsPerPage);

  const handleRowClick = (item) => {
    const sc = item.sub_code;
    if (!sc) {
      alert("Cannot open details: sub_code missing");
      return;
    }
    navigate(`/stock/${encodeURIComponent(sc)}`);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header onLogout={onLogout} />
      <div className="flex flex-1 overflow-hidden bg-gray-100">
        <Rentalsidebar />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex items-center gap-3">
            <input
              type="text"
              placeholder="Search..."
              className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-yellow-600/20 transition focus:border-yellow-600 focus:ring-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-700" onClick={() => setShowForm(true)}>
              <FiPlus /> Add Stock
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={handleDownloadPDF}>
              <FiDownload /> Download PDF
            </button>
          </div>

          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="relative w-full max-w-xl rounded-lg bg-white p-5 shadow-lg">
                <button className="absolute right-3 top-3 rounded-md p-1 text-gray-600 hover:bg-gray-100" onClick={() => setShowForm(false)}>
                  ×
                </button>

                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block font-semibold text-gray-700">Item Name</label>
                    <input
                      type="text"
                      value={formData.item_name}
                      onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                      className="w-full rounded-md border-2 border-gray-200 px-3 py-2 focus:border-yellow-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">Brand</label>
                    <AutocompleteInput
                      list={brands}
                      value={formData.brand}
                      setValue={(val) => setFormData({ ...formData, brand: val })}
                      keyName="brand"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">Main Type</label>
                    <AutocompleteInput
                      list={mainTypes}
                      value={formData.item_main_type}
                      setValue={(val) => setFormData({ ...formData, item_main_type: val })}
                      keyName="item_main_type"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">Sub Type</label>
                    <AutocompleteInput
                      list={subTypes}
                      value={formData.item_sub_type}
                      setValue={(val) => setFormData({ ...formData, item_sub_type: val })}
                      keyName="new_sub_code"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">Main Code</label>
                    <input
                      type="text"
                      value={formData.main_code}
                      onChange={(e) => setFormData({ ...formData, main_code: e.target.value })}
                      className="w-full rounded-md border-2 border-gray-200 px-3 py-2 focus:border-yellow-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">Sub Code</label>
                    <input
                      type="text"
                      value={formData.sub_code}
                      onChange={(e) => setFormData({ ...formData, sub_code: e.target.value })}
                      className="w-full rounded-md border-2 border-gray-200 px-3 py-2 focus:border-yellow-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block font-semibold text-gray-700">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-md border-2 border-gray-200 px-3 py-2 focus:border-yellow-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">Add Count</label>
                    <input
                      type="number"
                      value={formData.add_count}
                      onChange={(e) => setFormData({ ...formData, add_count: e.target.value })}
                      className="w-full rounded-md border-2 border-gray-200 px-3 py-2 focus:border-yellow-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value.toUpperCase() })}
                      className="w-full rounded-md border-2 border-gray-200 bg-white px-3 py-2 focus:border-yellow-600 focus:outline-none"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="RENTED">Rented</option>
                      <option value="DAMAGED">Damaged</option>
                      <option value="REPAIRING">Repairing</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700" onClick={handleAddStock}>
                    Add Stock
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-gray-600">Loading stocks...</p>
          ) : (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Stock Report</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-left">S.No</th>
                      <th className="px-4 py-2 text-left">Item Name</th>
                      <th className="px-4 py-2 text-left">Brand</th>
                      <th className="px-4 py-2 text-left">Main Type</th>
                      <th className="px-4 py-2 text-left">Sub Type</th>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-left">Main Code</th>
                      <th className="px-4 py-2 text-left">Sub Code</th>
                      <th className="px-4 py-2 text-left">Available</th>
                      <th className="px-4 py-2 text-left">Rented</th>
                      <th className="px-4 py-2 text-left">Damaged</th>
                      <th className="px-4 py-2 text-left">Repairing</th>
                      <th className="px-4 py-2 text-left">Expired</th>
                      <th className="px-4 py-2 text-left">Blocked</th>
                      <th className="px-4 py-2 text-left">Reserved</th>
                      <th className="px-4 py-2 text-left">Pending</th>
                      <th className="px-4 py-2 text-left">Total Sum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentItems.map((item, index) => (
                      <tr
                        key={`${item.sub_code || "no-sub"}-${index}`}
                        onClick={() => handleRowClick(item)}
                        className="cursor-pointer hover:bg-yellow-50/40"
                      >
                        <td className="px-4 py-2">{indexOfFirst + index + 1}</td>
                        <td className="px-4 py-2">{item.item_name}</td>
                        <td className="px-4 py-2">{item.brand}</td>
                        <td className="px-4 py-2">{item.item_main_type}</td>
                        <td className="px-4 py-2">{item.item_sub_type}</td>
                        <td className="px-4 py-2">{item.description}</td>
                        <td className="px-4 py-2">{item.main_code}</td>
                        <td className="px-4 py-2">{item.sub_code}</td>
                        <td className="px-4 py-2">{item.available_count}</td>
                        <td className="px-4 py-2">{item.rented_count}</td>
                        <td className="px-4 py-2">{item.damaged_count}</td>
                        <td className="px-4 py-2">{item.not_initiated_count}</td>
                        <td className="px-4 py-2">{item.worn_out_count}</td>
                        <td className="px-4 py-2">{item.blocked_count}</td>
                        <td className="px-4 py-2">{item.reserved_count}</td>
                        <td className="px-4 py-2">{item.pending_count}</td>
                        <td className="px-4 py-2 font-semibold">{calculateTotalSum(item)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 border-t border-gray-200 px-6 py-4">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={
                        currentPage === i + 1
                          ? "rounded-md bg-yellow-600 px-3 py-1.5 font-semibold text-white"
                          : "rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                      }
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockReport;
