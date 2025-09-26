import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import {
  FaArrowLeft,
  FaEye,
  FaUpload,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import "./OrderDetails.css";

const OrderDetails = ({ onLogout }) => {
  const { delivery_id } = useParams();
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState(null);
  const [status, setStatus] = useState("");
  const [afterImageFile, setAfterImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await axios.get(
          `http://192.168.29.125:8080/irrl/genericApiUnjoin/orderDetails?order_id='${delivery_id}'`
        );
        setOrderItems(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching order details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [delivery_id]);

  const renderBeforeImage = (images, item) => {
    if (!images || images === "{}") return <span>No images</span>;

    const url = images.replace(/[{}]/g, "").trim();

    return (
      <button
        className="eye-btn"
        onClick={() => {
          setSelectedItem({ ...item, before_image_url: url });
          setStatus(item.status || "INITIATED");
        }}
      >
        <FaEye />
      </button>
    );
  };

  const handleUploadAfterImage = async () => {
    if (!afterImageFile) return alert("Select an image first!");

    const form = new FormData();
    form.append("images", afterImageFile);

    try {
      setUploading(true);
      const res = await axios.post("http://192.168.29.125:8080/irrl/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl = res.data?.urls?.[0] || "";

      setSelectedItem((prev) => ({
        ...prev,
        after_images: uploadedUrl,
      }));
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedItem) return;

    try {
      const payload = {
        delivery_item_id: selectedItem.delivery_item_id,
        status,
        after_images: selectedItem.after_images,
      };

      await axios.post("http://192.168.29.125:8080/irrl/updateOrderItem", payload, {
        headers: { "Content-Type": "application/json" },
      });

      setSelectedItem(null);
      setAfterImageFile(null);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Save failed!");
    }
  };

  if (loading) return <p>Loading order details...</p>;
  if (!orderItems.length) return <p>No details found for this order.</p>;

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />
        <div className="main-content">
          <h2>Order Details - #{delivery_id}</h2>
          <button onClick={() => navigate(-1)} className="back-btn">
            <FaArrowLeft /> Back
          </button>

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
              {orderItems.map((item, idx) => {
                const cleanAfterUrl = item.after_images
                  ? item.after_images.replace(/[{}]/g, "").trim()
                  : null;

                return (
                  <tr key={`${item.delivery_item_id}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td>{item.item_id}</td>
                    <td>{parseInt(item.rent_amount)}</td>
                    <td>{item.status}</td>
                    <td>{item.placed_at}</td>
                    <td>{item.returned_at}</td>
                    <td>{renderBeforeImage(item.before_images, item)}</td>
                    <td>
                      {cleanAfterUrl ? (
                        <>
                          <a href={cleanAfterUrl} target="_blank" rel="noreferrer">
                            View After Image
                          </a>
                          <div className="after-url">{cleanAfterUrl}</div>
                        </>
                      ) : (
                        "Not Uploaded"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (
        <div className="popup-overlay">
          <div className="popup-card">
            <button className="close-btn" onClick={() => setSelectedItem(null)}>
              <FaTimes />
            </button>

            <h3>Before Image Preview</h3>
            <img
              src={selectedItem.before_image_url}
              alt="before"
              className="popup-img"
            />

            <div className="popup-controls">
              <label>Status:</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="INITIATED">INITIATED</option>
                <option value="RESERVED">RESERVED</option>
                <option value="RETURNED">RETURNED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>

              {status === "COMPLETED" && (
                <>
                  <input
                    type="file"
                    onChange={(e) => setAfterImageFile(e.target.files[0])}
                  />
                  <button onClick={handleUploadAfterImage} disabled={uploading}>
                    <FaUpload />{" "}
                    {uploading ? "Uploading..." : "Upload After Image"}
                  </button>

                  {selectedItem.after_images && (
                    <>
                      <h4>After Image Preview</h4>
                      <img
                        src={selectedItem.after_images.replace(/[{}]/g, "").trim()}
                        alt="after"
                        className="popup-img"
                      />
                      
                    </>
                  )}
                </>
              )}

              <button className="save-btn" onClick={handleSave}>
                <FaSave /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
