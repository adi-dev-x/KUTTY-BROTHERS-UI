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
  FaDownload,
} from "react-icons/fa";
import "./OrderDetails.css";

const OrderDetails = ({ onLogout }) => {
  const { delivery_id } = useParams();
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState([]);
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState(null);
  const [status, setStatus] = useState("");
  const [afterImageFile, setAfterImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingDC, setDownloadingDC] = useState(false);
  const [showDCPreview, setShowDCPreview] = useState(false);
  const [dcFormData, setDCFormData] = useState({
    vehicleNumber: '',
    partyGSTIN: '',
    customerName: '',
    remarks: '',
    deliveryChallanNumber: ''
  });

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await axios.get(
          `https://ems.binlaundry.com/irrl/genericApiUnjoin/orderDetails?order_id='${delivery_id}'`
        );
        const data = res.data?.data || [];
        setOrderItems(data);
        
        // Calculate total using generated amounts (with markup)
        const calculateGeneratedTotal = (items) => {
          return items.reduce((sum, item) => {
            const generatedAmount = parseInt(item.generated_amount || 0);
            return sum + generatedAmount;
          }, 0);
        };
        
        // Extract order info from first item (assuming all items share same order details)
        if (data.length > 0) {
          const orderDetails = {
            customer_name: data[0].customer_name || "N/A",
            customer_gst: data[0].customer_gst || "",
            delivery_chelan_number: data[0].delivery_chelan_number|| "",
            order_date: data[0].placed_at ? new Date(data[0].placed_at).toLocaleDateString() : new Date().toLocaleDateString(),
            total_value: calculateGeneratedTotal(data)
          };
          setOrderInfo(orderDetails);
          
          // Pre-populate DC form with API data
          setDCFormData({
            vehicleNumber: '',
            partyGSTIN: orderDetails.customer_gst,
            customerName: orderDetails.customer_name,
            remarks: '',
            deliveryChallanNumber: orderDetails.delivery_chelan_number
          });
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [delivery_id]);
const generateDCNumber = () => {
  // Use the delivery challan number from API if available
  if (dcFormData.deliveryChallanNumber) {
    // Ensure it's 7 digits - pad with leading zeros if shorter, truncate if longer
    const dcNumber = dcFormData.deliveryChallanNumber.toString().replace(/\D/g, ''); // Remove non-digits
    return "DC"+dcNumber.padStart(10, '0').slice(0, 10);
  }
  
  // Generate a 7-digit DC number
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2); // 2 digits
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 2 digits
  const day = date.getDate().toString().padStart(2, '0'); // 2 digits
  const random = Math.floor(Math.random() * 10); // 1 digit random
  
  return `${year}${month}${day}${random}`; // Total: 7 digits
};

  const generateQRData = () => {
    const qrData = {
      company: "IRR TECHNO FAB",
      gstin: "33AAAPII35L2ZA",
      dcNumber: generateDCNumber(),
      orderId: delivery_id,
      date: new Date().toISOString().split('T')[0],
      customer: {
        name: dcFormData.customerName || 'N/A',
        gstin: dcFormData.partyGSTIN || 'N/A'
      },
      items: orderItems.map((item, index) => ({
        sl: index + 1,
        itemName: item.item_name || 'N/A'
      })),
      vehicleNo: dcFormData.vehicleNumber || 'N/A',
      verification: `IRR${delivery_id}${Date.now().toString().slice(-4)}`
    };
    return JSON.stringify(qrData);
  };

  const handleDCFormSubmit = () => {
    setShowDCPreview(false);
    printDeliveryChallan();
  };

  const printDeliveryChallan = () => {
    setDownloadingDC(true);
    
    try {
      const dcWindow = window.open('', '_blank');
      
      const qrCodeData = encodeURIComponent(generateQRData());
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${qrCodeData}&format=png&ecc=M&margin=1`;
      
      const dcHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Delivery Challan - ${delivery_id}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              background: white;
              color: black;
            }
            .challan-container { 
              border: 2px solid black; 
              padding: 0;
              max-width: 750px;
              margin: 0 auto;
              background: white;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid black;
              padding: 10px;
            }
            .company-logo {
              width: 80px;
              height: 80px;
              margin: 0 auto 10px;
              display: block;
            }
            .company-name { 
              font-size: 28px; 
              font-weight: bold; 
              margin: 10px 0 5px 0;
            }
            .company-tagline {
              font-size: 14px;
              margin: 5px 0;
            }
            .company-address {
              font-size: 12px;
              margin: 5px 0;
            }
            .challan-title {
              font-size: 20px;
              font-weight: bold;
              margin: 10px 0;
            }
            .contact-info {
              position: absolute;
              top: 30px;
              right: 30px;
              font-size: 12px;
            }
            .gstin-info {
              position: absolute;
              top: 20px;
              left: 30px;
              font-size: 12px;
            }
            .signature-section {
              text-align: right;
              padding: 20px;
            }
            .customer-info {
              padding: 15px;
              border-bottom: 1px solid black;
              position: relative;
              padding-right: 150px;
            }
            .dc-info {
              position: absolute;
              right: 15px;
              top: 15px;
            }
            .instruction {
              text-align: center;
              padding: 10px;
              font-size: 14px;
              border-bottom: 1px solid black;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
            }
            .items-table th,
            .items-table td {
              border: 1px solid black;
              padding: 8px;
              text-align: left;
            }
            .items-table th {
              background: #f0f0f0;
              font-weight: bold;
            }
            .footer-info {
              display: flex;
              justify-content: space-between;
              padding: 15px;
              border-top: 1px solid black;
            }
            .qr-section {
              position: absolute;
              top: 90px;
              right: 25px;
              text-align: center;
              border: 1px solid #ddd;
              padding: 10px;
              background: white;
            }
            .qr-code {
              width: 100px;
              height: 100px;
              margin: 5px auto;
              display: block;
            }
            .qr-text {
              font-size: 10px;
              margin-top: 5px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="challan-container">
            <div class="header">
              <div class="contact-info">
                ☎ : 2652 1027<br>
                ☎ : 7966 5310
              </div>
              
              <div class="gstin-info">
                <strong>GSTIN: 33AAAPII35L2ZA</strong>
              </div>

              <div class="qr-section">
                <img src="${qrCodeUrl}" alt="QR Code" class="qr-code" />
                <div class="qr-text">SCAN HERE</div>
                <div class="qr-subtext">Order Details</div>
              </div>

              <img src="/irr.png" alt="IRR Logo" class="company-logo" />
              <div class="company-name">IRR TECHNO FAB</div>
              <div class="company-tagline">
                Hirer of: Erection Tools & Machineries<br>
                Commercial Vehicles & Cranes,<br>
                Also Heavy Fabrication & Erection Contractor
              </div>
              <div class="company-address">
                Door No. 276-D, Vanagaram Road, Athipet, Ambattur, Chennai - 600 058.
              </div>
              <div class="challan-title">DELIVERY CHALLAN</div>
            </div>

            <div class="customer-info">
              <div class="dc-info">
                <strong>D.C. NO.</strong>
                ${generateDCNumber()}<br>
                <strong>Date:</strong>
                ${new Date().toLocaleDateString('en-GB')}  <strong>  Time: </strong>
                ${new Date().toLocaleTimeString()}
              </div>
              
              <div class="customer-details">
                <strong>M/S.</strong>
                <div class="customer-line">${dcFormData.customerName || 'N/A'}</div>
                ${dcFormData.partyGSTIN ? `<div class="customer-line"><strong>GSTIN:</strong> ${dcFormData.partyGSTIN}</div>` : ''}
                ${dcFormData.remarks ? `<div class="customer-line"><em>Remarks: ${dcFormData.remarks}</em></div>` : ''}
              </div>
            </div>

            <div class="instruction">
              Please receive the undermentioned goods and return the duplicate duly signed.
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 15%">SL NO</th>
                  <th style="width: 70%">DESCRIPTION</th>
                  <th style="width: 15%">QTY.</th>
                </tr>
              </thead>
              <tbody>
                ${orderItems.map((item, index) => `
                  <tr>
                    <td style="text-align: center; font-weight: bold;">${index + 1}</td>
                    <td>${item.item_name || 'Equipment Rental'}</td>
                    <td style="text-align: center;">1 Unit</td>
                  </tr>
                `).join('')}
                ${Array.from({ length: Math.max(0, 12 - orderItems.length) }, () => `
                  <tr>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer-info">
              <div class="footer-left">
                ${dcFormData.partyGSTIN ? `<strong>Party's GSTIN No.:</strong><br><span style="font-size: 14px; color: #007bff;">${dcFormData.partyGSTIN}</span><br><br>` : ''}
                <strong>Vehicle No.:</strong><br>
                <span style="font-size: 14px; color: #007bff;">${dcFormData.vehicleNumber || '.....................................................'}</span><br><br>
                <strong>NOT FOR SALE</strong><br><br>
                <strong>For IRR TECHNO FAB .</strong>
              </div>
              
              <div class="footer-right">
                <div style="margin: 15px 0;">
                  <strong>Received in good condition.</strong>
                </div>
                
                <div class="signature-area">
                  <strong>Customer's Signature</strong><br>
                  <div style="margin-top: 60px; border-bottom: 1px solid #666; width: 200px;"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="no-print" style="text-align: center; margin: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; margin: 5px;">
              Print DC
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; margin: 5px;">
              Close
            </button>
          </div>
        </body>
        </html>
      `;

      dcWindow.document.write(dcHTML);
      dcWindow.document.close();
      
      setTimeout(() => {
        dcWindow.print();
      }, 1000);

    } catch (error) {
      console.error('Error generating DC:', error);
      alert('Error generating Delivery Challan');
    } finally {
      setDownloadingDC(false);
    }
  };

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
      const res = await axios.post("https://ems.binlaundry.com/irrl/upload", form, {
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

      await axios.post("https://ems.binlaundry.com/irrl/updateOrderItem", payload, {
        headers: { "Content-Type": "application/json" },
      });

      setSelectedItem(null);
      setAfterImageFile(null);
      
      const res = await axios.get(
        `https://ems.binlaundry.com/irrl/genericApiJoin/orderDetails?order_id='${delivery_id}'`
      );
      setOrderItems(res.data?.data || []);
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Order Details - #{delivery_id}</h2>
            <button 
              onClick={() => setShowDCPreview(true)} 
              className="download-dc-btn"
              disabled={downloadingDC}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '5px',
                cursor: downloadingDC ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <FaDownload /> {downloadingDC ? 'Processing...' : 'Generate DC'}
            </button>
          </div>
          
          <button onClick={() => navigate(-1)} className="back-btn">
            <FaArrowLeft /> Back
          </button>

          {orderInfo && (
            <div style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              border: '1px solid #ddd', 
              borderRadius: '5px',
              background: '#f9f9f9'
            }}>
              <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>Order Information</h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '15px', 
                fontSize: '14px' 
              }}>
                <div>
                  <strong style={{ color: '#555' }}>Customer:</strong><br />
                  <span>{orderInfo.customer_name}</span>
                </div>
                <div>
                  <strong style={{ color: '#555' }}>Order Date:</strong><br />
                  <span>{orderInfo.order_date}</span>
                </div>
                {orderInfo.customer_gst && (
                  <div>
                    <strong style={{ color: '#555' }}>Customer GST:</strong><br />
                    <span>{orderInfo.customer_gst}</span>
                  </div>
                )}
                {orderInfo.delivery_challan_number && (
                  <div>
                    <strong style={{ color: '#555' }}>DC Number:</strong><br />
                    <span>{orderInfo.delivery_challan_number}</span>
                  </div>
                )}
                <div>
                  <strong style={{ color: '#555' }}>Total Value:</strong><br />
                  <span style={{ color: '#007bff', fontWeight: 'bold' }}>₹{orderInfo.total_value}</span>
                </div>
              </div>
            </div>
          )}

          <h3>Items in Order</h3>
          <table className="order-items-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Item ID</th>
                <th>Item Name</th>
                <th>Rent Amount</th>
                <th>Current Amount</th>
                <th>Generated Amount</th>
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
                
                const currentAmount = parseInt(item.current_amount) || 0;
                const generatedAmount = Math.round(item.generated_amount);

                return (
                  <tr key={`${item.delivery_item_id}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td>{item.item_id}</td>
                    <td>{item.item_name || 'N/A'}</td>
                    <td>₹{item.rent_amount}</td>
                    <td>₹{currentAmount}</td>
                    <td style={{ fontWeight: 'bold', color: '#007bff' }}>₹{generatedAmount}</td>
                    <td>{item.status}</td>
                    <td>{item.placed_at}</td>
                    <td>{item.returned_at}</td>
                    <td>{renderBeforeImage(item.before_images, item)}</td>
                    <td>
                      {cleanAfterUrl ? (
                        <a href={cleanAfterUrl} target="_blank" rel="noreferrer">
                          View After Image
                        </a>
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

      {showDCPreview && (
        <div className="popup-overlay" style={{ zIndex: 1000 }}>
          <div className="popup-card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              className="close-btn" 
              onClick={() => setShowDCPreview(false)}
              style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1001 }}
            >
              <FaTimes />
            </button>

            <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>
              📄 Delivery Challan Preview
            </h3>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleDCFormSubmit(); }}
              style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={dcFormData.customerName}
                  onChange={(e) => setDCFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={dcFormData.vehicleNumber}
                    onChange={(e) => setDCFormData(prev => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() }))}
                    placeholder="e.g., TN01AB1234"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                    Party's GSTIN
                  </label>
                  <input
                    type="text"
                    value={dcFormData.partyGSTIN}
                    onChange={(e) => setDCFormData(prev => ({ ...prev, partyGSTIN: e.target.value.toUpperCase() }))}
                    placeholder="e.g., 29ABCDE1234F1Z5"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {dcFormData.deliveryChallanNumber && (
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                    Delivery Challan Number
                  </label>
                  <input
                    type="text"
                    value={dcFormData.deliveryChallanNumber}
                    onChange={(e) => setDCFormData(prev => ({ ...prev, deliveryChallanNumber: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                  Remarks (Optional)
                </label>
                <textarea
                  value={dcFormData.remarks}
                  onChange={(e) => setDCFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  rows="2"
                  placeholder="Any special instructions or remarks"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ 
                borderTop: '2px solid #eee', 
                paddingTop: '15px', 
                marginTop: '10px',
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Order Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                  <div><strong>Order ID:</strong> {delivery_id}</div>
                  <div><strong>DC Number:</strong> {generateDCNumber()}</div>
                  <div><strong>Total Items:</strong> {orderItems.length}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowDCPreview(false)}
                  style={{
                    padding: '10px 20px',
                    border: '2px solid #6c757d',
                    backgroundColor: 'transparent',
                    color: '#6c757d',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={downloadingDC}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    backgroundColor: '#28a745',
                    color: 'white',
                    borderRadius: '5px',
                    cursor: downloadingDC ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  🖨️ {downloadingDC ? 'Generating...' : 'Generate & Print DC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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