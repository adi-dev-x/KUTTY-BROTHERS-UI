import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { uploadIrrlOrderImages } from "../../utils/irrlUploadImages";
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
  FaExclamationTriangle,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config/api";
import {
  pickInvoiceIdFromAPI,
  resolveOrderLevelInvoiceId,
  pickInvoiceIdFromRow,
  resolveInvoiceNumberForPrint,
  openProformaInvoicePdf,
  uploadInvoicePdfAndAddSubTransaction,
  TAX_TYPE_OPTIONS,
  DEFAULT_TAX_TYPE,
  INVOICE_TYPE_OPTIONS,
  DEFAULT_INVOICE_TYPE,
} from "../../utils/proformaInvoice";

/** POST body: item_id, delivery_item_id, damage_images, clear */
const ORDER_ITEM_DAMAGE_URL = `${API_BASE_URL}/irrl/markDamage`;

/** POST body: order_id, guarantee_images */
const INITIATE_ORDER_URL = `${API_BASE_URL}/irrl/initiateOrder`;

/** POST body: OrderPassRequest */
const UPDATE_ORDER_PASS_URL = `${API_BASE_URL}/irrl/updateOrderPass`;

const DAMAGE_RESTRICTED_STATUSES = ["INITIATED", "RESERVED"];

/** Same as Orders list: line-item Status dropdown only allows these values */
const LINE_ITEM_STATUS_EDIT_OPTIONS = ["COMPLETED", "BLOCKED"];

/** If every line shares the same `status`, treat it as order-level (detail payload quirks). */
function uniformLineItemStatus(items) {
  if (!items?.length) return "";
  const statuses = items.map((r) => String(r.status ?? "").trim()).filter(Boolean);
  if (!statuses.length) return "";
  const upper = statuses.map((s) => s.toUpperCase());
  if (new Set(upper).size !== 1) return "";
  return statuses[0];
}

/** Same intent as listOrders row `o.status`: scan joined rows for delivery/order-level columns first. */
function pickOrderLevelDeliveryStatus(items) {
  if (!items?.length) return "";
  const keys = [
    "order_status",
    "order_delivery_status",
    "delivery_order_status",
    "Order_Status",
    "orderStatus",
  ];
  for (const row of items) {
    for (const key of keys) {
      const v = row[key];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
  }
  return "";
}

/**
 * Prefer API order/delivery fields, then status passed from Orders list (navigation),
 * then uniform line `status`, then first line `status`.
 */
function resolveOrderLevelStatus(items, statusFromOrdersList = "") {
  const fromDelivery = pickOrderLevelDeliveryStatus(items);
  const fromNav = String(statusFromOrdersList ?? "").trim();
  const uniform = uniformLineItemStatus(items);
  const firstLine = items?.[0] ? String(items[0].status ?? "").trim() : "";
  const raw = fromDelivery || fromNav || uniform || firstLine || "";
  const u = raw.toUpperCase().trim();
  return u || "INITIATED";
}

function parseGuaranteeImagesFromRow(row) {
  if (!row || typeof row !== "object") return [];
  const raw =
    row.guarantee_images ??
    row.guaranteeImages ??
    row.initiate_guarantee_images ??
    row.GuaranteeImages;
  if (raw == null || raw === "") return [];
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((u) => String(u).trim()).filter(Boolean))];
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s || s === "{}") return [];
    if (s.startsWith("{") && s.endsWith("}")) {
      const inner = s.slice(1, -1).trim();
      if (!inner) return [];
      return [
        ...new Set(
          inner
            .split(",")
            .map((u) => u.trim().replace(/^["']|["']$/g, ""))
            .filter(Boolean)
        ),
      ];
    }
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return [...new Set(parsed.map((u) => String(u).trim()).filter(Boolean))];
      }
    } catch (_) {
      /* single URL */
    }
    return [s];
  }
  return [];
}

function collectGuaranteeImagesFromItems(items) {
  const out = [];
  const seen = new Set();
  for (const row of items || []) {
    for (const u of parseGuaranteeImagesFromRow(row)) {
      if (!seen.has(u)) {
        seen.add(u);
        out.push(u);
      }
    }
  }
  return out;
}

/** Legacy API used RETURNED; UI/API now use BLOCKED */
function normalizeLineItemStatusForSelect(status) {
  const u = (status || "").toUpperCase();
  if (u === "RETURNED") return "BLOCKED";
  return status ?? "";
}

/** Before-image modal only allows COMPLETED / BLOCKED */
function normalizeBeforeImageModalStatus(status) {
  const u = (normalizeLineItemStatusForSelect(status) || "").toUpperCase();
  if (u === "BLOCKED") return "BLOCKED";
  if (u === "COMPLETED") return "COMPLETED";
  return "COMPLETED";
}

/** Order line may expose `damage: true` before or alongside status DAMAGED */
function isItemDamageFlagTrue(item) {
  if (!item || typeof item !== "object") return false;
  const v = item.damage ?? item.Damage ?? item.is_damage ?? item.isDamaged;
  if (v === true) return true;
  if (v === 1) return true;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return false;
}

/** Treats null, empty, and string "null" / "undefined" as no vehicle (API quirk) */
function normalizeVehicleValue(v) {
  if (v === false || v == null) return "";
  const s = String(v).trim();
  if (!s) return "";
  if (/^null$/i.test(s) || /^undefined$/i.test(s)) return "";
  return s;
}

function pickVehicleNumberFromOrderRow(row) {
  if (!row || typeof row !== "object") return "";
  const v = row.vehicle_number ?? row.vehicleNumber ?? row.Vehicle_Number ?? row.vehicle_no;
  return normalizeVehicleValue(v);
}

/** First line item row that has a real vehicle number, else first row (for pass fields) */
function findRowForOrderLevelPassAndVehicle(data) {
  if (!data?.length) return null;
  for (const row of data) {
    if (pickVehicleNumberFromOrderRow(row)) return row;
  }
  return data[0];
}

function pickPassFieldsFromOrderRow(row) {
  if (!row || typeof row !== "object") return {};
  const g = (snake, camel) => row[snake] ?? row[camel];
  return {
    pass_entry_date: String(g("pass_entry_date", "passEntryDate") ?? "").trim(),
    pass_entry_time: String(g("pass_entry_time", "passEntryTime") ?? "").trim(),
    pass_exit_date: String(g("pass_exit_date", "passExitDate") ?? "").trim(),
    pass_exit_time: String(g("pass_exit_time", "passExitTime") ?? "").trim(),
  };
}

function orderHasVehicleNumber(vehicleVal) {
  return normalizeVehicleValue(vehicleVal).length > 0;
}

function buildOrderDetailsFromItems(data, deliveryId, invoiceIdFallback) {
  if (!data?.length) return null;
  const calculateGeneratedTotal = (items) =>
    items.reduce((sum, item) => sum + parseInt(item.generated_amount || 0), 0);
  const invoiceIdResolved = resolveOrderLevelInvoiceId(data, invoiceIdFallback);
  const headerRow = findRowForOrderLevelPassAndVehicle(data);
  const passFields = pickPassFieldsFromOrderRow(headerRow || data[0]);
  return {
    customer_name: data[0].customer_name || "N/A",
    customer_gst: data[0].customer_gst || "",
    delivery_chelan_number: data[0].delivery_chelan_number || "",
    invoice_id: invoiceIdResolved,
    invoice_number:
      data[0].invoice_number ?? data[0].invoiceNumber ?? data[0].Invoice_Number ?? "",
    order_number: data[0].order_number || deliveryId,
    order_date: data[0].placed_at
      ? new Date(data[0].placed_at).toLocaleDateString()
      : new Date().toLocaleDateString(),
    advance_amount: parseInt(data[0].advance_amount || 0),
    total_value: calculateGeneratedTotal(data),
    vehicle_number: pickVehicleNumberFromOrderRow(headerRow || data[0]),
    ...passFields,
  };
}

const OrderDetails = ({ onLogout }) => {
  const { delivery_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const invoiceIdFromOrdersPage =
    location.state?.invoiceIdFromList ?? location.state?.invoice_id ?? "";
  const orderStatusFromOrdersList =
    location.state?.orderStatusFromList != null
      ? String(location.state.orderStatusFromList).trim()
      : "";
  const [orderItems, setOrderItems] = useState([]);
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const guaranteeImageUrls = useMemo(
    () => collectGuaranteeImagesFromItems(orderItems),
    [orderItems]
  );

  const previewInvoiceIdDisplay = useMemo(
    () =>
      String(
        (orderItems.length && orderInfo
          ? pickInvoiceIdFromRow(orderItems[0], orderInfo)
          : "") ||
        resolveOrderLevelInvoiceId(orderItems, invoiceIdFromOrdersPage) ||
        ""
      ).trim(),
    [orderItems, orderInfo, invoiceIdFromOrdersPage]
  );

  const [showExtendOrderModal, setShowExtendOrderModal] = useState(false);
  const [extendedOrderDate, setExtendedOrderDate] = useState("");
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [selectedExtendDate, setSelectedExtendDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

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
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [invoiceFormData, setInvoiceFormData] = useState({
    customerName: '',
    customerAddress: '',
    customerGSTIN: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    returnDate: '',
    modeOfPayment: 'Immediate',
    taxType: DEFAULT_TAX_TYPE,
    invoiceType: DEFAULT_INVOICE_TYPE,
  });

  const [damageModalItem, setDamageModalItem] = useState(null);
  const [damageDescription, setDamageDescription] = useState("");
  const [damageTempFiles, setDamageTempFiles] = useState([]);
  const [damageUploadedUrls, setDamageUploadedUrls] = useState([]);
  const [damageUploading, setDamageUploading] = useState(false);
  const [damageSaving, setDamageSaving] = useState(false);
  const [damageRestrictedAlertOpen, setDamageRestrictedAlertOpen] = useState(false);

  const [orderLevelStatus, setOrderLevelStatus] = useState("INITIATED");

  const [initiatedModalOpen, setInitiatedModalOpen] = useState(false);
  const [guaranteeGalleryOpen, setGuaranteeGalleryOpen] = useState(false);
  const [initiatedTempFiles, setInitiatedTempFiles] = useState([]);
  const [initiatedUploadedUrls, setInitiatedUploadedUrls] = useState([]);
  const [initiatedUploading, setInitiatedUploading] = useState(false);
  const [initiatedSaving, setInitiatedSaving] = useState(false);

  const [passModalOpen, setPassModalOpen] = useState(false);
  const [viewPassModalOpen, setViewPassModalOpen] = useState(false);
  const [passSaving, setPassSaving] = useState(false);
  const [passForm, setPassForm] = useState({
    vehicle_number: "",
    pass_entry_date: "",
    pass_entry_time: "",
    pass_exit_date: "",
    pass_exit_time: "",
  });

  const openDamageModal = (item) => {
    const s = (item?.status || "").toUpperCase();
    if (DAMAGE_RESTRICTED_STATUSES.includes(s)) {
      setDamageRestrictedAlertOpen(true);
      return;
    }
    setDamageModalItem(item);
    setDamageDescription("");
    setDamageTempFiles([]);
    setDamageUploadedUrls([]);
  };

  const closeDamageModal = () => {
    setDamageModalItem(null);
    setDamageDescription("");
    setDamageTempFiles([]);
    setDamageUploadedUrls([]);
    setDamageUploading(false);
    setDamageSaving(false);
  };

  const openInitiatedModal = () => {
    setInitiatedModalOpen(true);
    setInitiatedTempFiles([]);
    setInitiatedUploadedUrls([]);
  };

  const closeInitiatedModal = () => {
    setInitiatedModalOpen(false);
    setInitiatedTempFiles([]);
    setInitiatedUploadedUrls([]);
    setInitiatedUploading(false);
    setInitiatedSaving(false);
  };

  const openPassModal = () => {
    setPassForm({
      vehicle_number: "",
      pass_entry_date: "",
      pass_entry_time: "",
      pass_exit_date: "",
      pass_exit_time: "",
    });
    setPassModalOpen(true);
  };

  const closePassModal = () => {
    setPassModalOpen(false);
    setPassSaving(false);
  };

  const handleSubmitOrderPass = async () => {
    const orderId = String(delivery_id ?? "").trim();
    if (!orderId) {
      alert("Missing order id.");
      return;
    }
    const vn = String(passForm.vehicle_number ?? "").trim();
    if (!vn) {
      alert("Enter vehicle number.");
      return;
    }

    const payload = {
      order_id: orderId,
      vehicle_number: vn,
      pass_entry_date: String(passForm.pass_entry_date ?? "").trim(),
      pass_entry_time: String(passForm.pass_entry_time ?? "").trim(),
      pass_exit_date: String(passForm.pass_exit_date ?? "").trim(),
      pass_exit_time: String(passForm.pass_exit_time ?? "").trim(),
    };

    try {
      setPassSaving(true);
      await axios.post(UPDATE_ORDER_PASS_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const res = await axios.get(
        `${API_BASE_URL}/irrl/genericApiUnjoin/orderDetails?order_id='${delivery_id}'`
      );
      const data = res.data?.data || [];
      setOrderItems(data);
      if (data.length > 0) {
        setOrderLevelStatus(resolveOrderLevelStatus(data, orderStatusFromOrdersList));
        const od = buildOrderDetailsFromItems(data, delivery_id, invoiceIdFromOrdersPage);
        setOrderInfo(od);
        setDCFormData((prev) => ({
          ...prev,
          vehicleNumber: normalizeVehicleValue(od.vehicle_number).toUpperCase(),
        }));
      }
      closePassModal();
    } catch (err) {
      console.error("Update order pass failed:", err);
      alert(
        err.response?.data?.msg ||
        err.response?.data?.message ||
        err.message ||
        "Could not save pass."
      );
    } finally {
      setPassSaving(false);
    }
  };

  const handleInitiatedUploadImages = async () => {
    try {
      setInitiatedUploading(true);
      const uploadedFiles = await uploadIrrlOrderImages(initiatedTempFiles);
      setInitiatedUploadedUrls((prev) => [...prev, ...uploadedFiles.map((f) => f.url)]);
      setInitiatedTempFiles([]);
    } catch (err) {
      if (err.message === "Select images first") {
        alert("Select images first");
      } else {
        console.error("Upload failed", err.response?.data || err.message);
        alert("Upload failed! Check console.");
      }
    } finally {
      setInitiatedUploading(false);
    }
  };

  const handleSubmitMoveToInitiated = async () => {
    const orderId = String(delivery_id ?? "").trim();
    if (!orderId) {
      alert("Missing order id.");
      return;
    }

    try {
      setInitiatedSaving(true);
      let urlList = [...initiatedUploadedUrls];
      if (initiatedTempFiles.length > 0) {
        const uploadedFiles = await uploadIrrlOrderImages(initiatedTempFiles);
        urlList.push(...uploadedFiles.map((f) => f.url));
      }

      const payload = {
        order_id: orderId,
        guarantee_images: urlList.filter(Boolean),
      };

      await axios.post(INITIATE_ORDER_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const res = await axios.get(
        `${API_BASE_URL}/irrl/genericApiUnjoin/orderDetails?order_id='${delivery_id}'`
      );
      const refreshed = res.data?.data || [];
      setOrderItems(refreshed);
      if (refreshed.length > 0) {
        setOrderLevelStatus(resolveOrderLevelStatus(refreshed, ""));
      }
      closeInitiatedModal();
    } catch (err) {
      console.error("Initiate order failed:", err);
      alert("Could not initiate order. Check console or try again.");
    } finally {
      setInitiatedSaving(false);
    }
  };

  const handleDamageUploadImages = async () => {
    try {
      setDamageUploading(true);
      const uploadedFiles = await uploadIrrlOrderImages(damageTempFiles);
      setDamageUploadedUrls((prev) => [...prev, ...uploadedFiles.map((f) => f.url)]);
      setDamageTempFiles([]);
    } catch (err) {
      if (err.message === "Select images first") {
        alert("Select images first");
      } else {
        console.error("Upload failed", err.response?.data || err.message);
        alert("Upload failed! Check console.");
      }
    } finally {
      setDamageUploading(false);
    }
  };

  const handleSubmitDamage = async () => {
    if (!damageModalItem) return;
    if (!damageDescription.trim() && damageUploadedUrls.length === 0 && damageTempFiles.length === 0) {
      alert("Add a description or upload at least one image.");
      return;
    }

    try {
      setDamageSaving(true);
      const damageImages = [...damageUploadedUrls];
      if (damageTempFiles.length > 0) {
        const uploadedFiles = await uploadIrrlOrderImages(damageTempFiles);
        damageImages.push(...uploadedFiles.map((f) => f.url));
      }

      const deliveryItemId = String(
        damageModalItem.delivery_item_id ?? damageModalItem.delivery_itemId ?? ""
      ).trim();

      /** Inventory / SKU id for markDamage — not the delivery line id */
      const catalogItemId = String(
        damageModalItem.item_newid ??
        damageModalItem.item_id ??
        damageModalItem.inventory_id ??
        damageModalItem.Item_Id ??
        ""
      ).trim();

      if (!deliveryItemId) {
        alert("Missing delivery item id for this line.");
        return;
      }
      if (!catalogItemId) {
        alert("Missing inventory item id for this line.");
        return;
      }

      const payload = {
        item_id: catalogItemId,
        delivery_item_id: deliveryItemId,
        damage_images: damageImages.filter(Boolean),
        clear: false,
      };

      await axios.post(ORDER_ITEM_DAMAGE_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const res = await axios.get(
        `${API_BASE_URL}/irrl/genericApiUnjoin/orderDetails?order_id='${delivery_id}'`
      );
      setOrderItems(res.data?.data || []);
      closeDamageModal();
    } catch (err) {
      console.error("Move to damage failed:", err);
      alert("Could not update item. Check console or try again.");
    } finally {
      setDamageSaving(false);
    }
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/irrl/genericApiUnjoin/orderDetails?order_id='${delivery_id}'`
        );
        const data = res.data?.data || [];
        setOrderItems(data);

        if (data.length > 0) {
          setOrderLevelStatus(
            resolveOrderLevelStatus(data, orderStatusFromOrdersList)
          );
        } else if (orderStatusFromOrdersList) {
          setOrderLevelStatus(orderStatusFromOrdersList.toUpperCase());
        }

        if (data.length > 0) {
          const orderDetails = buildOrderDetailsFromItems(data, delivery_id, invoiceIdFromOrdersPage);
          setOrderInfo(orderDetails);

          // Pre-populate DC form with API data (vehicle from order lines / pass)
          setDCFormData({
            vehicleNumber: normalizeVehicleValue(orderDetails.vehicle_number).toUpperCase(),
            partyGSTIN: orderDetails.customer_gst,
            customerName: orderDetails.customer_name,
            remarks: "",
            deliveryChallanNumber: orderDetails.delivery_chelan_number,
          });

          setInvoiceFormData({
            customerName: orderDetails.customer_name,
            customerAddress: "",
            customerGSTIN: orderDetails.customer_gst,
            invoiceDate: new Date().toISOString().split("T")[0],
            returnDate: "",
            modeOfPayment: "Immediate",
            taxType: DEFAULT_TAX_TYPE,
          });
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [delivery_id, invoiceIdFromOrdersPage, orderStatusFromOrdersList]);

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

  const printInvoice = async () => {
    const invoiceNo = resolveInvoiceNumberForPrint(
      orderItems,
      orderInfo,
      invoiceIdFromOrdersPage,
      delivery_id
    );

    openProformaInvoicePdf({ orderInfo, orderItems, invoiceFormData, invoiceNo });

    setSubmittingInvoice(true);
    try {
      await uploadInvoicePdfAndAddSubTransaction({
        orderInfo,
        orderItems,
        invoiceFormData,
        invoiceNo,
        orderId: delivery_id,
      });
      setShowInvoicePreview(false);
    } catch (err) {
      console.error("Failed to upload invoice or add sub-transaction:", err);
      alert(
        "Invoice opened for print, but automated upload/sub-transaction failed: " +
        (err?.response?.data?.message || err.message)
      );
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleInlineStatusChange = async (item, newStatus) => {
    try {
      const payload = {
        delivery_item_id: item.delivery_item_id,
        status: newStatus,
        after_images: item.after_images,
      };

      await axios.post(`${API_BASE_URL}/irrl/updateOrderItem`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      // Refresh data
      const res = await axios.get(
        `${API_BASE_URL}/irrl/genericApiUnjoin/orderDetails?order_id='${delivery_id}'`
      );
      setOrderItems(res.data?.data || []);
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Status update failed!");
    }
  };

  const renderBeforeImage = (images, item) => {
    if (!images || images === "{}") return <span>No images</span>;

    const url = images.replace(/[{}]/g, "").trim();

    return (
      <button
        type="button"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-amber-300 hover:bg-amber-50/80 hover:text-amber-900"
        onClick={() => {
          setSelectedItem({ ...item, before_image_url: url });
          setStatus(normalizeBeforeImageModalStatus(item.status));
        }}
        aria-label="View before image"
      >
        <FaEye className="text-sm" />
      </button>
    );
  };

  const handleUploadAfterImage = async () => {
    if (!afterImageFile) return alert("Select an image first!");

    const form = new FormData();
    form.append("images", afterImageFile);

    try {
      setUploading(true);
      const res = await axios.post(`${API_BASE_URL}/irrl/upload`, form, {
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

      await axios.post(`${API_BASE_URL}/irrl/updateOrderItem`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      setSelectedItem(null);
      setAfterImageFile(null);

      const res = await axios.get(
        `${API_BASE_URL}/irrl/genericApiJoin/orderDetails?order_id='${delivery_id}'`
      );
      setOrderItems(res.data?.data || []);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Save failed!");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
        <Header onLogout={onLogout} />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Rentalsidebar />
          <div className="flex min-h-0 flex-1 items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50">
            <div className="text-center">
              <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <p className="text-sm font-medium text-slate-600">Loading order details…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderItems.length) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
        <Header onLogout={onLogout} />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Rentalsidebar />
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-gradient-to-b from-slate-100 to-slate-50 px-4">
            <p className="text-center text-sm text-slate-600">No details found for this order.</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              <FaArrowLeft /> Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <Header onLogout={onLogout} />
      <div className="flex min-h-0 flex-1 overflow-hidden bg-gradient-to-b from-slate-100 to-slate-50">
        <Rentalsidebar />
        <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-3 overflow-hidden px-3 py-3 sm:px-4 sm:py-3 lg:px-5">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200/90 bg-white/95 pb-2.5 pt-0.5 shadow-sm ring-1 ring-slate-100/80 backdrop-blur-sm">
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50/80 sm:px-3 sm:text-sm"
              >
                <FaArrowLeft className="text-slate-500" /> Back
              </button>
              <h2 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">Order details</h2>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setDCFormData((prev) => ({
                    ...prev,
                    vehicleNumber:
                      String(prev.vehicleNumber ?? "").trim() ||
                      (orderInfo?.vehicle_number
                        ? normalizeVehicleValue(orderInfo.vehicle_number).toUpperCase()
                        : ""),
                  }));
                  setShowDCPreview(true);
                }}
                disabled={downloadingDC}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 sm:text-sm"
              >
                <FaDownload className="shrink-0" /> {downloadingDC ? "Processing…" : "Generate DC"}
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate("/transaction", {
                    state: { order_id: orderInfo?.delivery_id || delivery_id },
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 sm:px-3 sm:text-sm"
                title="View transactions & invoice"
              >
                <FaFileInvoice className="shrink-0" /> Invoice
              </button>
            </div>
          </div>

          {orderInfo && (
            <div className="shrink-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-100 sm:p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Order information</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm lg:grid-cols-4">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500">Customer</div>
                  <div className="truncate font-medium text-slate-900">{orderInfo.customer_name}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500">Placed date</div>
                  <div className="font-medium text-slate-900">{orderInfo.order_date}</div>
                </div>
                {(orderInfo.customer_gst || orderInfo.delivery_challan_number || orderInfo.delivery_chelan_number) ? (
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-500">
                      {orderInfo.customer_gst ? "Customer GST" : "DC number"}
                    </div>
                    <div className="truncate font-mono text-xs font-medium text-slate-900">
                      {orderInfo.customer_gst || orderInfo.delivery_challan_number || orderInfo.delivery_chelan_number}
                    </div>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-500">Customer GST</div>
                    <div className="text-xs font-medium text-slate-400">—</div>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500">Invoice ID</div>
                  <div className="truncate font-mono text-xs font-medium text-slate-900">
                    {orderInfo.invoice_id ||
                      pickInvoiceIdFromAPI(orderItems[0]) ||
                      orderInfo.invoice_number ||
                      "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">Advance</div>
                  <div className="font-medium text-slate-900">₹{orderInfo.advance_amount || 0}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">Total value</div>
                  <div className="font-semibold text-blue-600">₹{orderInfo.total_value}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">Order status</div>
                  <div className="font-semibold uppercase tracking-wide text-slate-900">
                    {orderLevelStatus || "—"}
                  </div>
                </div>
                <div className="min-w-0 pt-2 sm:pt-2.5">
                  <button
                    type="button"
                    onClick={() => setShowExtendOrderModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-sm transition hover:border-amber-400 hover:bg-amber-100"
                  >
                    <FaCalendarAlt className="text-amber-700" /> Extend Order
                  </button>
                  {extendedOrderDate && (
                    <div className="mt-1 text-[11px] font-semibold text-emerald-700">
                      Extended: {new Date(extendedOrderDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="col-span-2 flex flex-col gap-2 border-t border-slate-200 pt-2 sm:flex-row sm:items-end sm:justify-between lg:col-span-4">
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-500">Vehicle number</div>
                    <div className="font-medium text-slate-900">
                      {orderHasVehicleNumber(orderInfo.vehicle_number)
                        ? orderInfo.vehicle_number
                        : "—"}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!orderHasVehicleNumber(orderInfo.vehicle_number) ? (
                      <button
                        type="button"
                        onClick={openPassModal}
                        className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100 sm:text-sm"
                      >
                        Add pass
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setViewPassModalOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:text-sm"
                      >
                        <FaEye className="text-slate-600" />
                        View pass
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 border-t border-slate-200 pt-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Order actions
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {(orderLevelStatus || "").toUpperCase() === "RESERVED" && (
                    <button
                      type="button"
                      onClick={openInitiatedModal}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-100 sm:text-sm"
                    >
                      Move to initiated
                    </button>
                  )}
                  {guaranteeImageUrls.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setGuaranteeGalleryOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:text-sm"
                    >
                      <FaEye className="text-slate-600" />
                      Guarantee ({guaranteeImageUrls.length})
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500">No guarantee images on file.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            <h3 className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Items in order
            </h3>
            <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100">
              <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-slate-600 shadow-sm">
                  <tr>
                    <th className="w-10 whitespace-nowrap px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-3">S.No</th>
                    <th className="whitespace-nowrap px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-3">Item code</th>
                    <th className="whitespace-nowrap px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-3">Invoice ID</th>
                    <th className="min-w-[8rem] px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-3">Item name</th>
                    <th className="whitespace-nowrap px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-3">Rent</th>
                    <th className="whitespace-nowrap px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-3">Current</th>
                    <th className="whitespace-nowrap px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-3">Generated</th>
                    <th className="whitespace-nowrap px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-3">Status</th>
                    <th className="whitespace-nowrap px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-3">Damage</th>
                    <th className="whitespace-nowrap px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-3">Placed</th>
                    <th className="whitespace-nowrap px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-3">Returned</th>
                    <th className="whitespace-nowrap px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-3">Before</th>
                    <th className="whitespace-nowrap px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-3">After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {orderItems.map((item, idx) => {
                    const cleanAfterUrl = item.after_images
                      ? item.after_images.replace(/[{}]/g, "").trim()
                      : null;

                    const currentAmount = parseInt(item.current_amount) || 0;
                    const generatedAmount = Math.round(item.generated_amount);

                    const normalizedLineStatus = normalizeLineItemStatusForSelect(item.status);
                    const lineStatusUpper = String(normalizedLineStatus || "").toUpperCase();
                    const lineStatusEditable = LINE_ITEM_STATUS_EDIT_OPTIONS.includes(lineStatusUpper);

                    return (
                      <tr key={`${item.delivery_item_id}-${idx}`} className="transition-colors hover:bg-amber-50/50">
                        <td className="whitespace-nowrap px-2 py-1.5 tabular-nums text-slate-600 sm:px-3">{idx + 1}</td>
                        <td className="max-w-[7rem] truncate px-2 py-1.5 font-medium text-slate-900 sm:px-3">{item.item_code || "N/A"}</td>
                        <td className="max-w-[6rem] truncate px-2 py-1.5 font-mono text-[11px] text-slate-800 sm:px-3">
                          {pickInvoiceIdFromRow(item, orderInfo) || "—"}
                        </td>
                        <td className="max-w-[12rem] truncate px-2 py-1.5 text-slate-900 sm:max-w-none sm:px-3">{item.item_name || "N/A"}</td>
                        <td className="whitespace-nowrap px-2 py-1.5 tabular-nums sm:px-3">₹{item.rent_amount}</td>
                        <td className="whitespace-nowrap px-2 py-1.5 tabular-nums sm:px-3">₹{currentAmount}</td>
                        <td className="whitespace-nowrap px-2 py-1.5 font-semibold tabular-nums text-blue-600 sm:px-3">₹{generatedAmount}</td>
                        <td className="px-2 py-1.5 sm:px-3">
                          {(item.status || "").toUpperCase() === "DAMAGED" ? (
                            <span className="inline-flex rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-rose-800 ring-1 ring-rose-200 sm:text-xs">
                              DAMAGED
                            </span>
                          ) : (
                            <select
                              value={lineStatusEditable ? lineStatusUpper : ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v) handleInlineStatusChange(item, v);
                              }}
                              className="min-w-[6.5rem] max-w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 sm:min-w-[7.5rem] sm:text-xs"
                            >
                              {!lineStatusEditable ? (
                                <option value="" disabled>
                                  {normalizedLineStatus || item.status || "—"}
                                </option>
                              ) : null}
                              {LINE_ITEM_STATUS_EDIT_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-2 py-1.5 sm:px-3">
                          <button
                            type="button"
                            disabled={
                              (item.status || "").toUpperCase() === "DAMAGED" ||
                              isItemDamageFlagTrue(item)
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              openDamageModal(item);
                            }}
                            className="inline-flex max-w-full items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold leading-tight text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
                          >
                            <FaExclamationTriangle className="shrink-0 text-rose-600" />
                            <span className="hidden sm:inline">Move to damage</span>
                            <span className="sm:hidden">Damage</span>
                          </button>
                        </td>
                        <td className="max-w-[5rem] truncate px-2 py-1.5 text-[11px] text-slate-700 sm:max-w-none sm:px-3 sm:text-sm">{item.placed_at}</td>
                        <td className="max-w-[5rem] truncate px-2 py-1.5 text-[11px] text-slate-700 sm:max-w-none sm:px-3 sm:text-sm">{item.returned_at}</td>
                        <td className="px-2 py-1.5 sm:px-3">{renderBeforeImage(item.before_images, item)}</td>
                        <td className="px-2 py-1.5 sm:px-3">
                          {cleanAfterUrl ? (
                            <a
                              className="font-medium text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline"
                              href={cleanAfterUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
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

      {showInvoicePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-lg">
            <button
              className="absolute right-3 top-3 rounded-md p-1 text-gray-600 hover:bg-gray-100"
              onClick={() => setShowInvoicePreview(false)}
            >
              <FaTimes />
            </button>

            <h3 className="mb-4 text-center text-lg font-semibold text-gray-900">
              Invoice Details
            </h3>

            {orderItems.length > 0 && orderInfo ? (
              <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm">
                <span className="text-slate-600">Invoice no. (from order / API)</span>
                <div className="mt-0.5 font-mono text-base font-semibold text-slate-900">
                  {previewInvoiceIdDisplay || "—"}
                </div>
                {!previewInvoiceIdDisplay ? (
                  <p className="mt-1 text-[11px] text-amber-800">
                    No invoice id on the order yet — printed invoice will use the order reference as invoice no.
                  </p>
                ) : null}
              </div>
            ) : null}

            <form
              onSubmit={(e) => { e.preventDefault(); printInvoice(); }}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={invoiceFormData.customerName}
                  onChange={(e) => setInvoiceFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Customer Address
                </label>
                <textarea
                  value={invoiceFormData.customerAddress}
                  onChange={(e) => setInvoiceFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                  rows="2"
                  className="w-full resize-y rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">GSTIN</label>
                  <input
                    type="text"
                    value={invoiceFormData.customerGSTIN}
                    onChange={(e) => setInvoiceFormData(prev => ({ ...prev, customerGSTIN: e.target.value.toUpperCase() }))}
                    className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Mode of Payment</label>
                  <input
                    type="text"
                    value={invoiceFormData.modeOfPayment}
                    onChange={(e) => setInvoiceFormData(prev => ({ ...prev, modeOfPayment: e.target.value }))}
                    className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceFormData.invoiceDate}
                    onChange={(e) => setInvoiceFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                    className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Return Date</label>
                  <input
                    type="date"
                    value={invoiceFormData.returnDate}
                    onChange={(e) => setInvoiceFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                    className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Invoice Type</label>
                  <select
                    value={invoiceFormData.invoiceType || DEFAULT_INVOICE_TYPE}
                    onChange={(e) => setInvoiceFormData(prev => ({ ...prev, invoiceType: e.target.value }))}
                    className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                  >
                    {INVOICE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Tax Type</label>
                  <select
                    value={invoiceFormData.taxType}
                    onChange={(e) => setInvoiceFormData(prev => ({ ...prev, taxType: e.target.value }))}
                    className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                  >
                    {TAX_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInvoicePreview(false)}
                  className="rounded-md border-2 border-gray-400 px-4 py-2 text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvoice}
                  className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaFileInvoice /> {submittingInvoice ? "Generating & Uploading…" : "Generate & Print Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>

      )}

      {showExtendOrderModal && (() => {
        const calYear = calendarViewDate.getFullYear();
        const calMonth = calendarViewDate.getMonth();
        const calMonthName = calendarViewDate.toLocaleString("default", { month: "long" });

        const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

        const prevMonthDays = [];
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
          prevMonthDays.push(daysInPrevMonth - i);
        }

        const currentMonthDays = [];
        for (let d = 1; d <= daysInMonth; d++) {
          currentMonthDays.push(d);
        }

        const totalCells = prevMonthDays.length + currentMonthDays.length;
        const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        const nextMonthDays = [];
        for (let d = 1; d <= remainingCells; d++) {
          nextMonthDays.push(d);
        }

        const todayStr = new Date().toISOString().split("T")[0];

        const handleSetQuickDays = (days) => {
          const target = new Date();
          target.setDate(target.getDate() + days);
          const s = target.toISOString().split("T")[0];
          setSelectedExtendDate(s);
          setCalendarViewDate(target);
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10">
              <button
                type="button"
                className="absolute right-3.5 top-3.5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setShowExtendOrderModal(false)}
                aria-label="Close"
              >
                <FaTimes className="h-4 w-4" />
              </button>

              <div className="border-b border-slate-100 bg-slate-50/70 p-5 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shadow-sm">
                    <FaCalendarAlt className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Extend Order</h3>
                    <p className="text-xs text-slate-500">Pick a new end date to extend order duration</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-slate-200/80 bg-white p-2.5 text-xs text-slate-600">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Placed Date:</span>
                    <span className="font-semibold text-slate-800">{orderInfo?.order_date || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Extend Until:</span>
                    <span className="font-bold text-amber-800">
                      {selectedExtendDate
                        ? new Date(selectedExtendDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                        : "Select a date"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCalendarViewDate(new Date(calYear, calMonth - 1, 1))}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                    title="Previous month"
                  >
                    <FaChevronLeft className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-bold text-slate-800">
                    {calMonthName} {calYear}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCalendarViewDate(new Date(calYear, calMonth + 1, 1))}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                    title="Next month"
                  >
                    <FaChevronRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400">
                  <span>Su</span>
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {prevMonthDays.map((d) => (
                    <button
                      key={`prev-${d}`}
                      type="button"
                      onClick={() => {
                        const prevM = new Date(calYear, calMonth - 1, d);
                        const s = prevM.toISOString().split("T")[0];
                        setSelectedExtendDate(s);
                        setCalendarViewDate(new Date(calYear, calMonth - 1, 1));
                      }}
                      className="h-8 rounded-lg text-slate-300 hover:bg-slate-50"
                    >
                      {d}
                    </button>
                  ))}

                  {currentMonthDays.map((d) => {
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    const isSelected = selectedExtendDate === dateStr;
                    const isToday = todayStr === dateStr;

                    return (
                      <button
                        key={`cur-${d}`}
                        type="button"
                        onClick={() => setSelectedExtendDate(dateStr)}
                        className={`h-8 rounded-lg font-medium transition ${isSelected
                            ? "bg-amber-600 font-bold text-white shadow-sm"
                            : isToday
                              ? "border border-amber-400 bg-amber-50 font-bold text-amber-900 hover:bg-amber-100"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        {d}
                      </button>
                    );
                  })}

                  {nextMonthDays.map((d) => (
                    <button
                      key={`next-${d}`}
                      type="button"
                      onClick={() => {
                        const nextM = new Date(calYear, calMonth + 1, d);
                        const s = nextM.toISOString().split("T")[0];
                        setSelectedExtendDate(s);
                        setCalendarViewDate(new Date(calYear, calMonth + 1, 1));
                      }}
                      className="h-8 rounded-lg text-slate-300 hover:bg-slate-50"
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="text-[11px] font-medium">Quick add:</span>
                    <button
                      type="button"
                      onClick={() => handleSetQuickDays(7)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900"
                    >
                      +7d
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickDays(15)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900"
                    >
                      +15d
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickDays(30)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900"
                    >
                      +30d
                    </button>
                  </div>
                  <input
                    type="date"
                    value={selectedExtendDate}
                    onChange={(e) => {
                      setSelectedExtendDate(e.target.value);
                      if (e.target.value) {
                        const [y, m] = e.target.value.split("-").map(Number);
                        if (y && m) setCalendarViewDate(new Date(y, m - 1, 1));
                      }
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 p-4">
                <button
                  type="button"
                  onClick={() => setShowExtendOrderModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedExtendDate) return;
                    setExtendedOrderDate(selectedExtendDate);
                    setShowExtendOrderModal(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
                >
                  <FaCheck className="h-3 w-3" /> Confirm Extension
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {initiatedModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-1 text-gray-600 hover:bg-gray-100"
              onClick={closeInitiatedModal}
              aria-label="Close"
            >
              <FaTimes />
            </button>
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <FaUpload className="text-lg" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Move to initiated</h3>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium text-gray-800">{orderInfo?.customer_name || "Customer"}</span>
                  {" · "}
                  <span className="font-mono text-xs text-gray-700">{delivery_id}</span>
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Submits <strong>initiateOrder</strong> for this delivery with optional guarantee image URLs.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Guarantee images (multiple)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setInitiatedTempFiles(Array.from(e.target.files || []))}
                  className="w-full text-sm text-gray-600 file:mr-2 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-emerald-900"
                />
                {initiatedTempFiles.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">{initiatedTempFiles.length} file(s) selected</p>
                )}
                <button
                  type="button"
                  onClick={handleInitiatedUploadImages}
                  disabled={initiatedUploading || initiatedTempFiles.length === 0}
                  className="mt-2 inline-flex items-center gap-2 rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaUpload /> {initiatedUploading ? "Uploading…" : "Upload images"}
                </button>
              </div>

              {initiatedUploadedUrls.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Uploaded</p>
                  <div className="flex flex-wrap gap-2">
                    {initiatedUploadedUrls.map((url, i) => (
                      <a
                        key={`${url}-${i}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block h-16 w-16 overflow-hidden rounded-lg ring-1 ring-gray-200"
                      >
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeInitiatedModal}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitMoveToInitiated}
                  disabled={initiatedSaving || initiatedUploading}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {initiatedSaving ? "Saving…" : "Confirm move to initiated"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {passModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-1 text-gray-600 hover:bg-gray-100"
              onClick={closePassModal}
              aria-label="Close"
            >
              <FaTimes />
            </button>
            <h3 className="mb-1 text-lg font-semibold text-gray-900">Add pass</h3>
            <p className="mb-4 font-mono text-xs text-gray-600">order_id · {delivery_id}</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Vehicle number</label>
                <input
                  type="text"
                  value={passForm.vehicle_number}
                  onChange={(e) =>
                    setPassForm((p) => ({ ...p, vehicle_number: e.target.value.toUpperCase() }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="e.g. TN01AB1234"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Pass entry date</label>
                  <input
                    type="date"
                    value={passForm.pass_entry_date}
                    onChange={(e) => setPassForm((p) => ({ ...p, pass_entry_date: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Pass entry time</label>
                  <input
                    type="time"
                    value={passForm.pass_entry_time}
                    onChange={(e) => setPassForm((p) => ({ ...p, pass_entry_time: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Pass exit date</label>
                  <input
                    type="date"
                    value={passForm.pass_exit_date}
                    onChange={(e) => setPassForm((p) => ({ ...p, pass_exit_date: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Pass exit time</label>
                  <input
                    type="time"
                    value={passForm.pass_exit_time}
                    onChange={(e) => setPassForm((p) => ({ ...p, pass_exit_time: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closePassModal}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitOrderPass}
                  disabled={passSaving}
                  className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaSave /> {passSaving ? "Saving…" : "Save pass"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewPassModalOpen && orderInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-1 text-gray-600 hover:bg-gray-100"
              onClick={() => setViewPassModalOpen(false)}
              aria-label="Close"
            >
              <FaTimes />
            </button>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Pass details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
                <dt className="text-gray-600">Vehicle number</dt>
                <dd className="font-medium text-gray-900">
                  {orderHasVehicleNumber(orderInfo.vehicle_number)
                    ? orderInfo.vehicle_number
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
                <dt className="text-gray-600">Pass entry date</dt>
                <dd className="text-gray-900">{orderInfo.pass_entry_date || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
                <dt className="text-gray-600">Pass entry time</dt>
                <dd className="text-gray-900">{orderInfo.pass_entry_time || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
                <dt className="text-gray-600">Pass exit date</dt>
                <dd className="text-gray-900">{orderInfo.pass_exit_date || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-gray-600">Pass exit time</dt>
                <dd className="text-gray-900">{orderInfo.pass_exit_time || "—"}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => setViewPassModalOpen(false)}
              className="mt-6 w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {guaranteeGalleryOpen && guaranteeImageUrls.length > 0 && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={() => setGuaranteeGalleryOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-1 text-gray-600 hover:bg-gray-100"
              onClick={() => setGuaranteeGalleryOpen(false)}
              aria-label="Close"
            >
              <FaTimes />
            </button>
            <h3 className="mb-1 text-lg font-semibold text-gray-900">Guarantee images (move to initiated)</h3>
            <p className="mb-4 text-sm text-gray-600">
              {guaranteeImageUrls.length} image{guaranteeImageUrls.length === 1 ? "" : "s"} stored for this order.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {guaranteeImageUrls.map((url, i) => (
                <a
                  key={`${url}-${i}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-lg ring-1 ring-gray-200 transition hover:ring-emerald-400"
                >
                  <img
                    src={url}
                    alt={`Guarantee ${i + 1}`}
                    className="aspect-square w-full object-cover transition group-hover:opacity-95"
                  />
                  <span className="block truncate px-1 py-1 text-center text-[10px] text-emerald-700 underline">
                    Open full size
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {damageRestrictedAlertOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setDamageRestrictedAlertOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="damage-restricted-title"
            aria-describedby="damage-restricted-desc"
            className="relative w-full max-w-md rounded-2xl border border-amber-200/90 bg-gradient-to-b from-amber-50 via-white to-white p-6 shadow-2xl shadow-amber-950/10 ring-2 ring-amber-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-500 transition hover:bg-amber-100 hover:text-slate-800"
              onClick={() => setDamageRestrictedAlertOpen(false)}
              aria-label="Close"
            >
              <FaTimes />
            </button>
            <div className="flex gap-4 pr-6">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-inner ring-2 ring-amber-200/80">
                <FaExclamationTriangle className="text-2xl" />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <h3 id="damage-restricted-title" className="text-lg font-bold tracking-tight text-slate-900">
                  Move to damage restricted
                </h3>
                <p id="damage-restricted-desc" className="mt-2 text-sm leading-relaxed text-slate-600">
                  Move to damage restricted for initiated and reserved orders.
                </p>
                <button
                  type="button"
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-amber-600/30 transition hover:from-amber-700 hover:to-amber-800"
                  onClick={() => setDamageRestrictedAlertOpen(false)}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {damageModalItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-1 text-gray-600 hover:bg-gray-100"
              onClick={closeDamageModal}
              aria-label="Close"
            >
              <FaTimes />
            </button>
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <FaExclamationTriangle className="text-lg" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mark item as damaged</h3>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium text-gray-800">{damageModalItem.item_name || "Item"}</span>
                  {" · "}
                  <span className="font-mono text-xs">{damageModalItem.item_code || "—"}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Description</label>
                <textarea
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the damage, cause, and any notes for the record…"
                  className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Photos (multiple)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setDamageTempFiles(Array.from(e.target.files || []))}
                  className="w-full text-sm text-gray-600 file:mr-2 file:rounded-md file:border-0 file:bg-rose-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-rose-900"
                />
                {damageTempFiles.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">{damageTempFiles.length} file(s) selected</p>
                )}
                <button
                  type="button"
                  onClick={handleDamageUploadImages}
                  disabled={damageUploading || damageTempFiles.length === 0}
                  className="mt-2 inline-flex items-center gap-2 rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaUpload /> {damageUploading ? "Uploading…" : "Upload images"}
                </button>
              </div>

              {damageUploadedUrls.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Uploaded</p>
                  <div className="flex flex-wrap gap-2">
                    {damageUploadedUrls.map((url, i) => (
                      <a
                        key={`${url}-${i}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block h-16 w-16 overflow-hidden rounded-lg ring-1 ring-gray-200"
                      >
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeDamageModal}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitDamage}
                  disabled={damageSaving || damageUploading}
                  className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {damageSaving ? "Saving…" : "Confirm move to damage"}
                </button>
              </div>
            </div>
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
              {(selectedItem.status || "").toUpperCase() === "DAMAGED" ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
                  DAMAGED
                </p>
              ) : (
                <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="COMPLETED">Completed</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              )}

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