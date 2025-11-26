import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

const BrandDashboard = ({ onLogout }) => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const brandsPerPage = 10;
  const [search, setSearch] = useState("");

  // ✅ Fetch brands from API
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/brand")
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        setBrands(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching brands:", err);
        setLoading(false);
      });
  }, []);

  // ✅ Filter brands by search
  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Pagination
  const indexOfLast = currentPage * brandsPerPage;
  const indexOfFirst = indexOfLast - brandsPerPage;
  const currentBrands = filteredBrands.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredBrands.length / brandsPerPage);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onLogout={onLogout} />

      <div className="flex flex-1 bg-gray-100">
        <Rentalsidebar />

        <div className="mx-auto w-full max-w-7xl flex-1 p-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search brands..."
              className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-yellow-600/20 transition focus:border-yellow-600 focus:ring-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="text-gray-600">Loading brands...</p>
          ) : (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Brand List</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-left">S.No</th>
                      <th className="px-4 py-2 text-left">Brand Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentBrands.map((b, index) => (
                      <tr key={b.attributes_id} className="hover:bg-yellow-50/40">
                        <td className="px-4 py-2">{indexOfFirst + index + 1}</td>
                        <td className="px-4 py-2">{b.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={
                      currentPage === i + 1
                        ? "rounded-md bg-yellow-600 px-3 py-1.5 font-semibold text-white"
                        : "rounded-md border border-gray-300 px-3 py-1.5 text-gray-700"
                    }
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandDashboard;
