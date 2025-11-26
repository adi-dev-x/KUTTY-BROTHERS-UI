import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

const MainTypeDashboard = ({ onLogout }) => {
  const [mainTypes, setMainTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const mainTypesPerPage = 10;
  const [search, setSearch] = useState("");

  // ✅ Fetch main types from new API
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/ItemMainType")
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        setMainTypes(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching main types:", err);
        setLoading(false);
      });
  }, []);

  // ✅ Filter by search
  const filteredMainTypes = mainTypes.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Pagination
  const indexOfLast = currentPage * mainTypesPerPage;
  const indexOfFirst = indexOfLast - mainTypesPerPage;
  const currentMainTypes = filteredMainTypes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredMainTypes.length / mainTypesPerPage);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onLogout={onLogout} />

      <div className="flex flex-1 bg-gray-100">
        <Rentalsidebar />

        <div className="mx-auto w-full max-w-7xl flex-1 p-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search main types..."
              className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-yellow-600/20 transition focus:border-yellow-600 focus:ring-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="text-gray-600">Loading main types...</p>
          ) : (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Main Type List</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-left">S.No</th>
                      <th className="px-4 py-2 text-left">Main Type Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentMainTypes.map((m, index) => (
                      <tr key={m.attributes_id || index} className="hover:bg-yellow-50/40">
                        <td className="px-4 py-2">{indexOfFirst + index + 1}</td>
                        <td className="px-4 py-2">{m.name}</td>
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

export default MainTypeDashboard;
