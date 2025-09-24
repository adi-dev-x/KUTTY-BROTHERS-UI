import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import "./OrderDetails.css";

const OrderDetails = ({ onLogout }) => {
  const { delivery_id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await axios.get(
          `http://192.168.0.202:8080/irrl/genericApiUnjoin/orderDetails/${delivery_id}`
        );
        setOrder(res.data?.data || null);
      } catch (err) {
        console.error("Error fetching order details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [delivery_id]);

  if (loading) return <p>Loading order details...</p>;
  if (!order) return <p>No details found for this order.</p>;

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />
        <div className="main-content">
          <h2>Order Details - #{delivery_id}</h2>
          <button onClick={() => navigate(-1)} className="back-btn">⬅ Back</button>

          <div className="order-details-card">
            <p><strong>Customer Name:</strong> {order.customer_name}</p>
            <p><strong>Customer ID:</strong> {order.customer_id}</p>
            <p><strong>Contact Person:</strong> {order.contact_name}</p>
            <p><strong>Contact Number:</strong> {order.contact_number}</p>
            <p><strong>Shipping Address:</strong> {order.shipping_address}</p>
            <p><strong>Inventory ID:</strong> {order.inventory_id}</p>
            <p><strong>Generated Amount:</strong> {order.generated_amount}</p>
            <p><strong>Current Amount:</strong> {order.current_amount}</p>
            <p><strong>Advance Amount:</strong> {order.advance_amount}</p>
            <p><strong>Placed At:</strong> {order.placed_at}</p>
            <p><strong>Returned At:</strong> {order.declined_at}</p>
            <p><strong>Transaction ID:</strong> {order.transaction_id}</p>
            <p><strong>Status:</strong> {order.status}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
