import React, { useState, useEffect } from "react";
import { FiSearch, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import Footer from "../footer/Footer";

const SubTypeDashboard = ({ onLogout }) => {
  const [subTypes, setSubTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [search, setSearch] = useState("");

  // Fetch sub types from API
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/ItemSubType")
      .then((res) => res.json())
      .then((data) => {
        setSubTypes(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching sub types:", err);
        setLoading(false);
      });
  }, []);

  // Filter by search
  const filteredSubTypes = subTypes.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredSubTypes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubTypes = filteredSubTypes.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <Header onLogout={onLogout} />

      <div className="flex flex-1 overflow-hidden">
        <Rentalsidebar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sub Types</h1>
                <p className="text-sm text-gray-500">Manage item sub-types</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search sub types..."
                className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-gray-500 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Content Area */}
            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-600 border-t-transparent"></div>
                  <p className="text-sm font-medium text-gray-500">Loading sub types...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">S.No</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Sub Type Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {currentSubTypes.length > 0 ? (
                        currentSubTypes.map((s, index) => (
                          <tr key={s.attributes_id || index} className="transition-colors hover:bg-gray-50">
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {indexOfFirstItem + index + 1}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                              {s.name}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" className="px-6 py-8 text-center text-sm text-gray-500">
                            No sub types found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                        <span className="font-medium">{Math.min(indexOfLastItem, filteredSubTypes.length)}</span> of{" "}
                        <span className="font-medium">{filteredSubTypes.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => handlePageChange(i + 1)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === i + 1
                                ? "z-10 bg-yellow-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
                                : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                              }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <FiChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default SubTypeDashboard;
