import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import Footer from "../footer/Footer";
import "./StockDetail.css"; // Use your dashboard theme

const StockDetail = ({ onLogout }) => {
  // ✅ now using sub_code instead of item_code
  const { sub_code } = useParams();
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ updated API call to use sub_code
   console.log( `http://192.168.29.125:8080/irrl/genericApiUnjoin/productSingle?sub_code='${sub_code}'`)
    fetch(
      `http://192.168.29.125:8080/irrl/genericApiUnjoin/productSingle?sub_code='${sub_code}'`
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

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;
  if (!stocks.length) return <p style={{ padding: "20px" }}>Stock not found.</p>;

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
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />

        <div className="main-content full-page-detail">
          <button className="close-btn" onClick={() => navigate(-1)}>
            Back
          </button>
          <h2>Stock Details: {stocks[0].item_name}</h2>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stocks.map((s) => (
                  <tr key={s.item_id}>
                    <td>{s.item_name}</td>
                    <td>{s.brand}</td>
                    <td>{s.item_main_type}</td>
                    <td>{s.item_sub_type}</td>
                    <td>{s.description}</td>
                    <td>{s.item_code}</td>
                    <td>{s.sub_code}</td>
                    <td>{s.category}</td>
                    <td>{new Date(s.created_at).toLocaleString()}</td>
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
