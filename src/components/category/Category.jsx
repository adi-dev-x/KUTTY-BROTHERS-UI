import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

const CategoryDashboard = ({ onLogout }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const categoriesPerPage = 10;
  const [search, setSearch] = useState("");

  // Fetch categories API
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/category")
      .then((res) => res.json())
      .then((data) => {
        setCategories(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setLoading(false);
      });
  }, []);

  // Filter categories by search
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const indexOfLast = currentPage * categoriesPerPage;
  const indexOfFirst = indexOfLast - categoriesPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onLogout={onLogout} />
      <div className="flex flex-1 bg-gray-100">
        <Rentalsidebar />

        <div className="mx-auto w-full max-w-7xl flex-1 p-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search categories..."
              className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-yellow-600/20 transition focus:border-yellow-600 focus:ring-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="text-gray-600">Loading categories...</p>
          ) : (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Category List</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-left">S.No</th>
                      <th className="px-4 py-2 text-left">Category Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentCategories.map((c, index) => (
                      <tr key={c.attributes_id} className="hover:bg-yellow-50/40">
                        <td className="px-4 py-2">{indexOfFirst + index + 1}</td>
                        <td className="px-4 py-2">{c.name}</td>
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

export default CategoryDashboard;
