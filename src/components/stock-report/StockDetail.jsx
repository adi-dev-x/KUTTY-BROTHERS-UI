import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import Footer from "../footer/Footer";

const StockDetail = ({ onLogout }) => {
  // ✅ now using sub_code instead of item_code
  const { sub_code } = useParams();
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ updated API call to use sub_code
    console.log(`https://ems.binlaundry.com/irrl/genericApiUnjoin/productSingle?sub_code='${sub_code}'`)
    fetch(
      `https://ems.binlaundry.com/irrl/genericApiUnjoin/productSingle?sub_code='${sub_code}'`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setStocks(data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching stock:", err);
        setLoading(false);
      });
  }, [sub_code]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentStocks = stocks.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(stocks.length / itemsPerPage);

  // Pagination UI component
  const Pagination = () => (
    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 mt-4">
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{indexOfFirst + 1}</span> to <span className="font-medium">{Math.min(indexOfLast, stocks.length)}</span> of <span className="font-medium">{stocks.length}</span> results
      </div>
      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
        <button
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="sr-only">Previous</span>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === i + 1 ? 'z-10 bg-yellow-600 text-white' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'}`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="sr-only">Next</span>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </nav>
    </div>
  );

  if (loading) return <p className="p-6 text-gray-600">Loading...</p>;
  if (!stocks.length) return <p className="p-6 text-gray-600">Stock not found.</p>;

  const headers = [
    "Item Name",
    "Brand",
    "Main Type",
    "Sub Type",
    "Description",
    "Item Code",
    "Sub Code",
    "Category",
    "Created At",
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header onLogout={onLogout} />
      <div className="flex flex-1 bg-gray-100">
        <Rentalsidebar />

        <div className="mx-auto w-full max-w-7xl flex-1 p-6">
          <button className="mb-3 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => navigate(-1)}>
            Back
          </button>
          <h2 className="mb-3 text-xl font-bold text-gray-900">Stock Details: {stocks[0].item_name}</h2>

          <div className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="px-4 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentStocks.map((s) => (
                  <tr key={s.item_id} className="hover:bg-yellow-50/40">
                    <td className="px-4 py-2">{s.item_name}</td>
                    <td className="px-4 py-2">{s.brand}</td>
                    <td className="px-4 py-2">{s.item_main_type}</td>
                    <td className="px-4 py-2">{s.item_sub_type}</td>
                    <td className="px-4 py-2">{s.description}</td>
                    <td className="px-4 py-2">{s.item_code}</td>
                    <td className="px-4 py-2">{s.sub_code}</td>
                    <td className="px-4 py-2">{s.category}</td>
                    <td className="px-4 py-2">{new Date(s.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && <Pagination />}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StockDetail;
