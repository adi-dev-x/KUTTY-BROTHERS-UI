import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import "./OrderDetails.css";

const OrderDetails = ({ onLogout }) => {
  const { delivery_id } = useParams();
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await axios.get(
          `http://192.168.0.202:8080/irrl/genericApiUnjoin/orderDetails?order_id='${delivery_id}'`
        );
        // Extract data array
        setOrderItems(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching order details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [delivery_id]);

  if (loading) return <p>Loading order details...</p>;
  if (!orderItems.length) return <p>No details found for this order.</p>;

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />
        <div className="main-content">
          <h2>Order Details - #{delivery_id}</h2>
          <button onClick={() => navigate(-1)} className="back-btn">⬅ Back</button>

          {/* Items Table */}
          <h3>Items in Order</h3>
          <table className="order-items-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Item ID</th>
                <th>Rent Amount</th>
                <th>Status</th>
                <th>Placed At</th>
                <th>Returned At</th>
                <th>Before Images</th>
                <th>After Images</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, idx) => (
                <tr key={`${item.delivery_item_id}-${idx}`}>
                  <td>{idx + 1}</td>
                  <td>{item.item_id}</td>
                  <td>{parseInt(item.rent_amount)}</td>
                  <td>{item.status}</td>
                  <td>{item.placed_at}</td>
                  <td>{item.returned_at}</td>
                  <td>{item.before_images && item.before_images !== "{}" ? item.before_images : "No images"}</td>
                  <td>{item.after_images ? item.after_images : "No images"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
