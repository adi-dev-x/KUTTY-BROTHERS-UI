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
  FaFileInvoice,
} from "react-icons/fa";


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
            delivery_chelan_number: data[0].delivery_chelan_number || "",
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
      return "DC" + dcNumber.padStart(10, '0').slice(0, 10);
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

  const printInvoice = () => {
    const invoiceWindow = window.open('', '_blank');
    const invoiceDate = new Date().toLocaleDateString('en-GB');

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${delivery_id}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: white;
            color: black;
          }
          .invoice-container { 
            border: 1px solid #ccc; 
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
          .header { 
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          .company-details {
            text-align: right;
          }
          .company-name { 
            font-size: 24px; 
            font-weight: bold; 
            color: #333;
            margin-bottom: 5px;
          }
          .invoice-title {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
          }
          .bill-to {
            margin-bottom: 30px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th {
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #ddd;
          }
          .items-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
          }
          .total-section {
            text-align: right;
            margin-top: 20px;
          }
          .total-row {
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
          }
          @media print {
            .no-print { display: none; }
            body { margin: 0; }
            .invoice-container { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div>
              <img src="/irr.png" alt="IRR Logo" style="width: 80px; height: 80px;" />
            </div>
            <div class="company-details">
              <div class="company-name">IRR TECHNO FAB</div>
              <div>Door No. 276-D, Vanagaram Road</div>
              <div>Athipet, Ambattur, Chennai - 600 058</div>
              <div>GSTIN: 33AAAPII35L2ZA</div>
            </div>
          </div>

          <div class="invoice-title">INVOICE</div>

          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div class="bill-to">
              <strong>Bill To:</strong><br>
              ${orderInfo?.customer_name || 'N/A'}<br>
              ${orderInfo?.customer_gst ? `GSTIN: ${orderInfo.customer_gst}` : ''}
            </div>
            <div style="text-align: right;">
              <strong>Invoice Date:</strong> ${invoiceDate}<br>
              <strong>Order ID:</strong> ${delivery_id}
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Description</th>
                <th style="text-align: right;">Rent Amount</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.item_name || 'Item'}</td>
                  <td style="text-align: right;">₹${item.rent_amount}</td>
                  <td style="text-align: right;">₹${Math.round(item.generated_amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              Total Amount: ₹${orderInfo?.total_value || 0}
            </div>
          </div>

          <div style="margin-top: 50px; text-align: center; font-size: 14px; color: #666;">
            Thank you for your business!
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; margin: 5px; cursor: pointer;">
            Print Invoice
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; margin: 5px; cursor: pointer;">
            Close
          </button>
        </div>
      </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
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

  if (loading) return <p className="p-6 text-gray-600">Loading order details...</p>;
  if (!orderItems.length) return <p className="p-6 text-gray-600">No details found for this order.</p>;

  return (
    <div className="flex min-h-screen flex-col">
      <Header onLogout={onLogout} />
      <div className="flex flex-1 bg-gray-100">
        <Rentalsidebar />
        <div className="mx-auto w-full max-w-7xl flex-1 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDCPreview(true)}
                disabled={downloadingDC}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaDownload /> {downloadingDC ? 'Processing...' : 'Generate DC'}
              </button>
              <button
                onClick={printInvoice}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                <FaFileInvoice /> Download Invoice
              </button>
            </div>
          </div>

          <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 text-sm text-gray-700 hover:underline">
            <FaArrowLeft /> Back
          </button>

          {orderInfo && (
            <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h4 className="mb-3 text-base font-semibold text-gray-900">Order Information</h4>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <div className="text-gray-600">Customer</div>
                  <div className="font-medium text-gray-900">{orderInfo.customer_name}</div>
                </div>
                <div>
                  <div className="text-gray-600">Order Date</div>
                  <div className="font-medium text-gray-900">{orderInfo.order_date}</div>
                </div>
                {orderInfo.customer_gst && (
                  <div>
                    <div className="text-gray-600">Customer GST</div>
                    <div className="font-medium text-gray-900">{orderInfo.customer_gst}</div>
                  </div>
                )}
                {orderInfo.delivery_challan_number && (
                  <div>
                    <div className="text-gray-600">DC Number</div>
                    <div className="font-medium text-gray-900">{orderInfo.delivery_challan_number}</div>
                  </div>
                )}
                <div>
                  <div className="text-gray-600">Total Value</div>
                  <div className="font-semibold text-blue-600">₹{orderInfo.total_value}</div>
                </div>
              </div>
            </div>
          )}

          <h3 className="mb-2 text-lg font-semibold text-gray-900">Items in Order</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left">S.No</th>
                  <th className="px-4 py-2 text-left">Item ID</th>
                  <th className="px-4 py-2 text-left">Item Name</th>
                  <th className="px-4 py-2 text-left">Rent Amount</th>
                  <th className="px-4 py-2 text-left">Current Amount</th>
                  <th className="px-4 py-2 text-left">Generated Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Placed At</th>
                  <th className="px-4 py-2 text-left">Returned At</th>
                  <th className="px-4 py-2 text-left">Before Images</th>
                  <th className="px-4 py-2 text-left">After Images</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orderItems.map((item, idx) => {
                  const cleanAfterUrl = item.after_images
                    ? item.after_images.replace(/[{}]/g, "").trim()
                    : null;

                  const currentAmount = parseInt(item.current_amount) || 0;
                  const generatedAmount = Math.round(item.generated_amount);

                  return (
                    <tr key={`${item.delivery_item_id}-${idx}`} className="hover:bg-yellow-50/40">
                      <td className="px-4 py-2">{idx + 1}</td>
                      <td className="px-4 py-2">{item.item_id}</td>
                      <td className="px-4 py-2">{item.item_name || 'N/A'}</td>
                      <td className="px-4 py-2">₹{item.rent_amount}</td>
                      <td className="px-4 py-2">₹{currentAmount}</td>
                      <td className="px-4 py-2 font-semibold text-blue-600">₹{generatedAmount}</td>
                      <td className="px-4 py-2">{item.status}</td>
                      <td className="px-4 py-2">{item.placed_at}</td>
                      <td className="px-4 py-2">{item.returned_at}</td>
                      <td className="px-4 py-2">{renderBeforeImage(item.before_images, item)}</td>
                      <td className="px-4 py-2">
                        {cleanAfterUrl ? (
                          <a className="text-blue-600 hover:underline" href={cleanAfterUrl} target="_blank" rel="noreferrer">
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
      </div>

      {showDCPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-lg">
            <button
              className="absolute right-3 top-3 rounded-md p-1 text-gray-600 hover:bg-gray-100"
              onClick={() => setShowDCPreview(false)}
            >
              <FaTimes />
            </button>

            <h3 className="mb-4 text-center text-lg font-semibold text-gray-900">
              Delivery Challan Preview
            </h3>

            <form
              onSubmit={(e) => { e.preventDefault(); handleDCFormSubmit(); }}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={dcFormData.customerName}
                  onChange={(e) => setDCFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Vehicle Number *</label>
                  <input
                    type="text"
                    value={dcFormData.vehicleNumber}
                    onChange={(e) => setDCFormData(prev => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() }))}
                    placeholder="e.g., TN01AB1234"
                    className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Party's GSTIN</label>
                  <input
                    type="text"
                    value={dcFormData.partyGSTIN}
                    onChange={(e) => setDCFormData(prev => ({ ...prev, partyGSTIN: e.target.value.toUpperCase() }))}
                    placeholder="e.g., 29ABCDE1234F1Z5"
                    className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                  />
                </div>
              </div>

              {dcFormData.deliveryChallanNumber && (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Delivery Challan Number</label>
                  <input
                    type="text"
                    value={dcFormData.deliveryChallanNumber}
                    onChange={(e) => setDCFormData(prev => ({ ...prev, deliveryChallanNumber: e.target.value }))}
                    className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Remarks (Optional)</label>
                <textarea
                  value={dcFormData.remarks}
                  onChange={(e) => setDCFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  rows="2"
                  placeholder="Any special instructions or remarks"
                  className="w-full resize-y rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                />
              </div>

              <div className="rounded-md bg-gray-50 p-4">
                <h4 className="mb-2 text-base font-semibold text-gray-900">Order Summary</h4>
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div><strong>Order ID:</strong> {delivery_id}</div>
                  <div><strong>DC Number:</strong> {generateDCNumber()}</div>
                  <div><strong>Total Items:</strong> {orderItems.length}</div>
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDCPreview(false)}
                  className="rounded-md border-2 border-gray-400 px-4 py-2 text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={downloadingDC}
                  className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  🖨️ {downloadingDC ? 'Generating...' : 'Generate & Print DC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-2xl rounded-lg bg-white p-5 shadow-lg">
            <button className="absolute right-3 top-3 rounded-md p-1 text-gray-600 hover:bg-gray-100" onClick={() => setSelectedItem(null)}>
              <FaTimes />
            </button>

            <h3 className="mb-3 text-lg font-semibold text-gray-900">Before Image Preview</h3>
            <img
              src={selectedItem.before_image_url}
              alt="before"
              className="max-h-[60vh] w-full rounded-md object-contain"
            />

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
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
                  <button className="inline-flex items-center gap-2 rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700" onClick={handleUploadAfterImage} disabled={uploading}>
                    <FaUpload /> {uploading ? "Uploading..." : "Upload After Image"}
                  </button>

                  {selectedItem.after_images && (
                    <>
                      <h4 className="text-base font-semibold text-gray-900">After Image Preview</h4>
                      <img
                        src={selectedItem.after_images.replace(/[{}]/g, "").trim()}
                        alt="after"
                        className="max-h-[60vh] w-full rounded-md object-contain"
                      />
                    </>
                  )}
                </>
              )}

              <button className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700" onClick={handleSave}>
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