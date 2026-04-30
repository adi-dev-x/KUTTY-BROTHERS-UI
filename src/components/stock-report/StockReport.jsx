import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import {
  Download,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import * as XLSX from "xlsx";

const autocompleteInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

// ===================== AutocompleteInput =====================
const AutocompleteInput = ({ list = [], value = "", setValue, keyName }) => {
  const [showList, setShowList] = useState(false);

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
    <div className="relative">
      <input
        type="text"
        value={value || ""}
        onChange={(e) => {
          setValue(e.target.value);
          setShowList(true);
        }}
        onBlur={() => setTimeout(() => setShowList(false), 150)}
        onFocus={() => setShowList(true)}
        placeholder="Type to filter…"
        className={autocompleteInputClass}
      />

      {showList && filtered.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
          {filtered.map((item, idx) => (
            <li
              key={idx}
              className="cursor-pointer px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-amber-50 hover:text-amber-900"
              onMouseDown={(e) => e.preventDefault()}
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
  const itemsPerPage = 15;

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
        setBrands(Array.isArray(data?.data) ? data.data : []);
      })
      .catch((err) => console.error("Error fetching brands:", err));
  }, []);

  // Fetch main types
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/ItemMainType")
      .then((res) => res.json())
      .then((data) => {
        setMainTypes(Array.isArray(data?.data) ? data.data : []);
      })
      .catch((err) => console.error("Error fetching main types:", err));
  }, []);

  // Fetch sub types
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/ItemSubType")
      .then((res) => res.json())
      .then((data) => {
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

  // Download Excel
  const handleDownloadExcel = () => {
    const tableData = stocks.map((s, i) => ({
      "S.No": i + 1,
      "Item Name": s.item_name,
      "Brand": s.brand,
      "Main Type": s.item_main_type,
      "Sub Type": s.item_sub_type,
      "Description": s.description,
      "Main Code": s.main_code,
      "Sub Code": s.sub_code,
      "Available": s.available_count || 0,
      "Rented": s.rented_count || 0,
      "Damaged": s.damaged_count || 0,
      "Repairing": s.not_initiated_count || 0,
      "Expired": s.worn_out_count || 0,
      "Blocked": s.blocked_count || 0,
      "Reserved": s.reserved_count || 0,
      "Pending": s.pending_count || 0,
      "Total Sum": calculateTotalSum(s),
    }));

    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Report");
    XLSX.writeFile(workbook, "stock_report.xlsx");
  };

  const filteredStock = useMemo(() => {
    const q = (search || "").toLowerCase();
    return stocks.filter((s) => {
      const name = (s.item_name || "").toLowerCase();
      const brand = (s.brand || "").toLowerCase();
      const code = (s.sub_code || "").toLowerCase();
      return name.includes(q) || brand.includes(q) || code.includes(q);
    });
  }, [stocks, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const { totalSkus, matchingLines, unitsInFilter } = useMemo(() => {
    const unitsInFilter = filteredStock.reduce((acc, s) => acc + calculateTotalSum(s), 0);
    return {
      totalSkus: stocks.length,
      matchingLines: filteredStock.length,
      unitsInFilter,
    };
  }, [stocks.length, filteredStock]);

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

  const formFieldClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

  const thClass =
    "whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600";

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(251,191,36,0.08),transparent)]"
        aria-hidden
      />
      <Header onLogout={onLogout} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <Rentalsidebar />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3">
            <div className="shrink-0 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="px-3 py-1.5">
                <h1 className="text-sm font-semibold text-slate-900">Stock report</h1>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-1.5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                  <span className="tabular-nums">
                    <span className="text-slate-400">Product lines</span>{" "}
                    <span className="font-semibold text-slate-900">{totalSkus}</span>
                  </span>
                  <span className="tabular-nums">
                    <span className="text-slate-400">Matching search</span>{" "}
                    <span className="font-semibold text-slate-900">{matchingLines}</span>
                  </span>
                  <span className="tabular-nums">
                    <span className="text-slate-400">Units in view</span>{" "}
                    <span className="font-semibold text-slate-900">{unitsInFilter}</span>
                  </span>
                </div>
                <div className="relative min-w-[min(100%,10rem)] flex-1 basis-[8rem]">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search…"
                    className="w-full rounded-md border border-slate-200 bg-slate-50 py-1 pl-7 pr-2 text-[11px] text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500/25"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-amber-700"
                  >
                    <Plus className="h-3 w-3" strokeWidth={2.5} />
                    Add stock
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadExcel}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-3 w-3" />
                    Export Excel
                  </button>
                </div>
              </div>
            </div>

            {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
                  <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 px-6 py-5">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Add stock</h2>
                      <p className="mt-0.5 text-sm text-slate-600">Create a product line and initial quantity.</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-xl bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
                      onClick={() => setShowForm(false)}
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className="space-y-6 p-6">
                    <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Item name</label>
                        <input
                          type="text"
                          value={formData.item_name}
                          onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                          className={formFieldClass}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Brand</label>
                        <AutocompleteInput
                          list={brands}
                          value={formData.brand}
                          setValue={(val) => setFormData({ ...formData, brand: val })}
                          keyName="name"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Main type</label>
                        <AutocompleteInput
                          list={mainTypes}
                          value={formData.item_main_type}
                          setValue={(val) => setFormData({ ...formData, item_main_type: val })}
                          keyName="name"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sub type</label>
                        <AutocompleteInput
                          list={subTypes}
                          value={formData.item_sub_type}
                          setValue={(val) => setFormData({ ...formData, item_sub_type: val })}
                          keyName="new_sub_code"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Main code</label>
                        <input
                          type="text"
                          value={formData.main_code}
                          onChange={(e) => setFormData({ ...formData, main_code: e.target.value })}
                          className={formFieldClass}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sub code</label>
                        <input
                          type="text"
                          value={formData.sub_code}
                          onChange={(e) => setFormData({ ...formData, sub_code: e.target.value })}
                          className={formFieldClass}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className={formFieldClass}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add count</label>
                        <input
                          type="number"
                          value={formData.add_count}
                          onChange={(e) => setFormData({ ...formData, add_count: e.target.value })}
                          className={formFieldClass}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value.toUpperCase() })}
                          className={formFieldClass}
                        >
                          <option value="AVAILABLE">Available</option>
                          <option value="RENTED">Rented</option>
                          <option value="DAMAGED">Damaged</option>
                          <option value="REPAIRING">Repairing</option>
                          <option value="EXPIRED">Expired</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        onClick={() => setShowForm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700"
                        onClick={handleAddStock}
                      >
                        Add stock
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                <p className="mt-3 text-xs font-medium text-slate-500">Loading…</p>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="min-h-0 flex-1 overflow-auto">
                  <table className="min-w-full border-collapse text-xs [&_td]:border-r [&_td]:border-slate-200 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-200 [&_th:last-child]:border-r-0">
                    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100">
                      <tr>
                        <th className={thClass}>#</th>
                        <th className={thClass}>Item</th>
                        <th className={thClass}>Brand</th>
                        <th className={thClass}>Main type</th>
                        <th className={thClass}>Sub type</th>
                        <th className={thClass}>Description</th>
                        <th className={thClass}>Main code</th>
                        <th className={thClass}>Sub code</th>
                        <th className={thClass}>Avail.</th>
                        <th className={thClass}>Rented</th>
                        <th className={thClass}>Damaged</th>
                        <th className={thClass}>Repair</th>
                        <th className={thClass}>Expired</th>
                        <th className={thClass}>Blocked</th>
                        <th className={thClass}>Reserved</th>
                        <th className={thClass}>Pending</th>
                        <th className={thClass}>Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentItems.length === 0 ? (
                        <tr>
                          <td colSpan={17} className="px-6 py-16 text-center">
                            <div className="mx-auto max-w-sm">
                              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <Search className="h-7 w-7" />
                              </div>
                              <p className="text-sm font-medium text-slate-900">No rows match</p>
                              <p className="mt-1 text-sm text-slate-500">Try another search or add stock.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((item, index) => (
                          <tr
                            key={`${item.sub_code || "no-sub"}-${index}`}
                            onClick={() => handleRowClick(item)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleRowClick(item);
                              }
                            }}
                            className={`cursor-pointer transition-colors hover:bg-amber-50/50 focus:bg-amber-50/50 focus:outline-none ${(indexOfFirst + index) % 2 === 1 ? "bg-slate-50/50" : "bg-white"}`}
                          >
                            <td className="whitespace-nowrap px-2 py-2 font-mono text-slate-500">{indexOfFirst + index + 1}</td>
                            <td className="max-w-[140px] truncate px-2 py-2 font-medium text-slate-900" title={item.item_name}>
                              {item.item_name}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-slate-700">{item.brand || "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-slate-600">{item.item_main_type || "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-slate-600">{item.item_sub_type || "—"}</td>
                            <td className="max-w-[120px] truncate px-2 py-2 text-slate-600" title={item.description}>
                              {item.description || "—"}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-600">{item.main_code || "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] font-medium text-amber-800">{item.sub_code || "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 tabular-nums text-slate-800">{item.available_count ?? "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 tabular-nums text-slate-800">{item.rented_count ?? "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 tabular-nums text-slate-800">{item.damaged_count ?? "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 tabular-nums text-slate-800">{item.not_initiated_count ?? "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 tabular-nums text-slate-800">{item.worn_out_count ?? "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 tabular-nums text-slate-800">{item.blocked_count ?? "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 tabular-nums text-slate-800">{item.reserved_count ?? "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 tabular-nums text-slate-800">{item.pending_count ?? "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 font-semibold tabular-nums text-slate-900">{calculateTotalSum(item)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/90 px-3 py-2">
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">{matchingLines === 0 ? 0 : indexOfFirst + 1}</span>
                      –
                      <span className="font-semibold text-slate-900">{Math.min(indexOfLast, matchingLines)}</span>
                      {" "}of{" "}
                      <span className="font-semibold text-slate-900">{matchingLines}</span>
                    </p>
                    <nav className="flex items-center gap-0.5" aria-label="Pagination">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          type="button"
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`min-w-[2rem] rounded-md px-2 py-1 text-xs font-semibold ${currentPage === i + 1
                            ? "bg-amber-600 text-white"
                            : "text-slate-700 hover:bg-white"
                            }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StockReport;
