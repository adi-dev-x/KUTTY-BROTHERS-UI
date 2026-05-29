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
  Package,
  Filter,
  BarChart3,
} from "lucide-react";
import * as XLSX from "xlsx";

const autocompleteInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

const NumCell = ({ value }) => {
  const n = Number(value);
  const isZero = value === null || value === undefined
    ? true
    : Number.isFinite(n)
      ? n === 0
      : true;
  return (
    <td
      className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${
        isZero ? "text-slate-300" : "text-slate-800"
      }`}
    >
      {value ?? 0}
    </td>
  );
};

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
    hsn_code: "",
    add_count: "",
    status: "AVAILABLE",
  });

  const navigate = useNavigate();

  // Normalize stock (API field names vary — collect HSN from common keys)
  const normalizeStock = (s) => {
    if (!s || typeof s !== "object") return s;
    const maybeSub =
      s.sub_code ??
      s.subCode ??
      s.subcode ??
      s.new_sub_code ??
      s.inventory_id ??
      s.main_code ??
      "";
    const hsn =
      s.hsn_code ??
      s.hsnCode ??
      s.HSN_Code ??
      s.HSNCode ??
      s.hsn ??
      s.HSN ??
      s.gst_hsn ??
      s.gst_hsn_code ??
      s.item_hsn_code ??
      s.Item_HSN_Code ??
      "";
    const hsnStr = hsn === null || hsn === undefined ? "" : String(hsn).trim();
    return { ...s, sub_code: maybeSub, hsn_code: hsnStr };
  };

  // Total sum for an item
  const calculateTotalSum = (item) => {
    const counts = [
      item.available_count || 0,
      item.site_count || 0,
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
        hsn_code: formData.hsn_code?.trim() || undefined,
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
      "HSN Code": s.hsn_code ?? "",
      "Available": s.available_count || 0,
      "Site": s.site_count || 0,
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
      const hsn = (s.hsn_code || "").toLowerCase();
      return name.includes(q) || brand.includes(q) || code.includes(q) || hsn.includes(q);
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
    "whitespace-nowrap px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500";
  const thNumClass =
    "whitespace-nowrap px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500";

  return (
    <div className="relative flex h-[100dvh] max-h-screen flex-col overflow-hidden bg-[#f4f6fb]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_50%_-25%,rgba(251,191,36,0.14),transparent_55%)]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(59,130,246,0.06),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,transparent_35%,rgba(248,250,252,0.9)_100%)]"
        aria-hidden
      />
      <Header onLogout={onLogout} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <Rentalsidebar />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-5">
            <div className="shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-xl shadow-slate-900/[0.07] ring-1 ring-slate-200/70 backdrop-blur-md">
              <div className="relative px-4 py-4 sm:px-5">
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" aria-hidden />
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 ring-2 ring-white/50">
                      <Package className="h-5 w-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700/85">Inventory</p>
                      <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Stock report</h1>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 px-3.5 py-2 text-[11px] shadow-sm ring-1 ring-slate-100">
                      <Package className="h-3.5 w-3.5 text-amber-600" strokeWidth={2.5} />
                      <span className="text-slate-500">SKUs</span>
                      <span className="font-bold tabular-nums text-slate-900">{loading ? "—" : totalSkus}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-slate-50/95 px-3.5 py-2 text-[11px] shadow-sm ring-1 ring-slate-100">
                      <Filter className="h-3.5 w-3.5 text-slate-500" strokeWidth={2.5} />
                      <span className="text-slate-500">Matching</span>
                      <span className="font-bold tabular-nums text-slate-900">{loading ? "—" : matchingLines}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/90 px-3.5 py-2 text-[11px] shadow-sm ring-1 ring-amber-100/80">
                      <BarChart3 className="h-3.5 w-3.5 text-amber-700" strokeWidth={2.5} />
                      <span className="text-amber-900/80">Units</span>
                      <span className="font-bold tabular-nums text-amber-950">{loading ? "—" : unitsInFilter}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100/90 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                  <div className="relative min-w-0 flex-1 sm:min-w-[min(100%,14rem)] sm:basis-[14rem]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search item, brand, sub code, HSN…"
                      className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-inner shadow-slate-900/5 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-auto">
                    <button
                      type="button"
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/25 transition hover:from-amber-600 hover:to-amber-700"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                      Add stock
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadExcel}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <Download className="h-4 w-4" />
                      Export Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
                <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/20 ring-1 ring-slate-100">
                  <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-amber-100/90 bg-gradient-to-r from-amber-50/95 via-white to-amber-50/40 px-5 py-4 sm:px-6 sm:py-5">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-slate-900">Add stock</h2>
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
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">HSN code</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={formData.hsn_code}
                          onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                          className={formFieldClass}
                          placeholder="e.g. 9967"
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
                          <option value="SITE">Site</option>
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
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 shadow-inner ring-1 ring-slate-100">
                <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-amber-400 border-t-transparent" />
                <p className="mt-4 text-sm font-medium text-slate-500">Loading stock…</p>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-900/[0.04] ring-1 ring-slate-100">
                <div className="min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
                  <table className="min-w-full border-separate border-spacing-0 text-[12px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-50/95 backdrop-blur-sm">
                        <th className={`${thNumClass} border-b border-slate-200/70`}>#</th>
                        <th className={`${thClass} border-b border-slate-200/70`}>Item</th>
                        <th className={`${thClass} border-b border-slate-200/70`}>Brand</th>
                        <th className={`${thClass} border-b border-slate-200/70`}>Description</th>
                        <th className={`${thClass} border-b border-slate-200/70`}>Main code</th>
                        <th className={`${thClass} border-b border-slate-200/70`}>Sub code</th>
                        <th className={`${thClass} border-b border-slate-200/70`}>HSN code</th>
                        <th className={`${thNumClass} border-b border-slate-200/70`}>Avail.</th>
                        <th className={`${thNumClass} border-b border-slate-200/70`}>Site</th>
                        <th className={`${thNumClass} border-b border-slate-200/70`}>Rented</th>
                        <th className={`${thNumClass} border-b border-slate-200/70`}>Damaged</th>
                        <th className={`${thNumClass} border-b border-slate-200/70`}>Repair</th>
                        <th className={`${thNumClass} border-b border-slate-200/70`}>Expired</th>
                        <th className={`${thNumClass} border-b border-slate-200/70`}>Blocked</th>
                        <th className={`${thNumClass} border-b border-slate-200/70`}>Reserved</th>
                        <th className={`${thNumClass} border-b border-slate-200/70`}>Pending</th>
                        <th className={`${thNumClass} border-b border-slate-200/70`}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length === 0 ? (
                        <tr>
                          <td colSpan={17} className="px-6 py-20 text-center text-sm text-slate-400">
                            No results
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((item, index) => {
                          const total = calculateTotalSum(item);
                          return (
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
                              className="group cursor-pointer transition-colors hover:bg-amber-50/40 focus:bg-amber-50/50 focus:outline-none [&>td]:border-b [&>td]:border-slate-100/80"
                            >
                              <td className="whitespace-nowrap px-3 py-2.5 text-right text-[11px] font-medium tabular-nums text-slate-400">
                                {indexOfFirst + index + 1}
                              </td>
                              <td className="max-w-[180px] truncate px-3 py-2.5 font-semibold text-slate-900" title={item.item_name}>
                                {item.item_name}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">{item.brand || "—"}</td>
                              <td className="max-w-[140px] truncate px-3 py-2.5 text-slate-500" title={item.description}>
                                {item.description || "—"}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-slate-500">
                                {item.main_code || "—"}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5">
                                {item.sub_code ? (
                                  <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200/70">
                                    {item.sub_code}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-slate-500">
                                {item.hsn_code || "—"}
                              </td>
                              <NumCell value={item.available_count} />
                              <NumCell value={item.site_count} />
                              <NumCell value={item.rented_count} />
                              <NumCell value={item.damaged_count} />
                              <NumCell value={item.not_initiated_count} />
                              <NumCell value={item.worn_out_count} />
                              <NumCell value={item.blocked_count} />
                              <NumCell value={item.reserved_count} />
                              <NumCell value={item.pending_count} />
                              <td className="whitespace-nowrap px-3 py-2.5 text-right">
                                <span
                                  className={`inline-flex min-w-[2rem] justify-end rounded-md px-1.5 py-0.5 font-semibold tabular-nums ${
                                    total > 0
                                      ? "bg-slate-900/[0.04] text-slate-900 ring-1 ring-inset ring-slate-200/80"
                                      : "text-slate-300"
                                  }`}
                                >
                                  {total}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {matchingLines > 0 && (
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100/90 bg-gradient-to-r from-slate-50/95 via-white to-amber-50/30 px-3 py-2.5 sm:px-4">
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">{matchingLines === 0 ? 0 : indexOfFirst + 1}</span>
                      –
                      <span className="font-semibold text-slate-900">{Math.min(indexOfLast, matchingLines)}</span>
                      {" "}
                      of <span className="font-semibold text-slate-900">{matchingLines}</span>
                      <span className="hidden sm:inline"> · Page </span>
                      <span className="font-semibold text-slate-900 sm:inline">{currentPage}</span>
                      <span className="hidden sm:inline"> / {totalPages || 1}</span>
                    </p>
                    {totalPages > 1 ? (
                      <nav className="flex items-center gap-0.5 rounded-lg border border-slate-200/80 bg-white/90 p-0.5 shadow-sm" aria-label="Pagination">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          disabled={currentPage === 1}
                          className="inline-flex items-center rounded-md p-1.5 text-slate-600 transition hover:bg-amber-50 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            type="button"
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`min-w-[2rem] rounded-md px-2 py-1 text-xs font-semibold transition ${currentPage === i + 1
                              ? "bg-amber-600 text-white shadow-sm"
                              : "text-slate-700 hover:bg-slate-50"
                              }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="inline-flex items-center rounded-md p-1.5 text-slate-600 transition hover:bg-amber-50 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </nav>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400">Single page</span>
                    )}
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
