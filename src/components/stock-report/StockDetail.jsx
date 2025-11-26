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
   console.log( `https://ems.binlaundry.com/irrl/genericApiUnjoin/productSingle?sub_code='${sub_code}'`)
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

          <div className="overflow-x-auto rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="px-4 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stocks.map((s) => (
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
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StockDetail;
