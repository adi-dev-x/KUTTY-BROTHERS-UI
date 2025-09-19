import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import "./OrderDetails.css";

const OrderDetails = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order } = location.state || {};

  if (!order) return <p>Order not found!</p>;

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />
        <div className="main-content">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h2>Order Details</h2>
          <div className="order-info">
            <p><strong>Customer ID:</strong> {order.customer_id}</p>
            <p><strong>Inventory ID:</strong> {order.inventory_id}</p>
            <p><strong>Advance Amount:</strong> {order.advance_amount}</p>
            <p><strong>Generated Amount:</strong> {order.generated_amount}</p>
            <p><strong>Placed At:</strong> {order.placed_at || "-"}</p>
            <p><strong>Expiry At:</strong> {order.expiry_at || "-"}</p>
            <p><strong>Status:</strong> {order.status}</p>
            <p><strong>Notes:</strong> {order.notes || "-"}</p>
          </div>

          <h3>Delivery Items</h3>
          <table>
            <thead>
              <tr>
                <th>DeliveryItemID</th>
                <th>Rent Amount</th>
                <th>Generated Amount</th>
                <th>Condition Out</th>
                <th>Condition In</th>
                <th>Placed At</th>
                <th>Expiry At</th>
                <th>Declined At</th>
                <th>Status</th>
                <th>Before Images</th>
                <th>After Images</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <tr key={item.delivery_item_id}>
                    <td>{item.delivery_item_id}</td>
                    <td>{item.rent_amount}</td>
                    <td>{item.generaed_amount}</td>
                    <td>{item.condition_out || "-"}</td>
                    <td>{item.condition_in || "-"}</td>
                    <td>{item.placed_at}</td>
                    <td>{item.expiry_at || "-"}</td>
                    <td>{item.declined_at || "-"}</td>
                    <td>{item.status}</td>
                    <td>
                      {item.before_images &&
                        item.before_images.map((img, idx) => (
                          <img key={idx} src={img} alt="before" className="order-img" />
                        ))}
                    </td>
                    <td>
                      {item.after_images &&
                        item.after_images.map((img, idx) => (
                          <img key={idx} src={img} alt="after" className="order-img" />
                        ))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11">No delivery items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
