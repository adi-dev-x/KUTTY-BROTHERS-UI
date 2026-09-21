import axios from "axios";
import html2pdf from "html2pdf.js";
import { API_BASE_URL } from "../config/api";

/** Shared proforma-invoice PDF generation, used by both the Order Details
 * "Invoice" button and the Transactions page "Invoice" button so the two
 * stay in sync. */

export const TAX_TYPE_OPTIONS = [
  { value: "CGST_SGST", label: "CGST + SGST (intra-state)" },
  { value: "IGST", label: "IGST (inter-state)" },
];

export const DEFAULT_TAX_TYPE = "CGST_SGST";

export const INVOICE_TYPE_OPTIONS = [
  { value: "PROFORMA", label: "Proforma Invoice" },
  { value: "TAX", label: "Tax Invoice" },
];

export const DEFAULT_INVOICE_TYPE = "PROFORMA";

/** Same key fallbacks used across the order/customer/stock APIs. */
export function pickInvoiceIdFromAPI(row) {
  if (!row) return "";
  return (
    row.invoice_id ??
    row.invoiceId ??
    row.Invoice_Id ??
    row.invoice_number ??
    row.invoiceNumber ??
    ""
  );
}

export function resolveOrderLevelInvoiceId(rows, fallbackFromOrdersPage) {
  const fromNav =
    fallbackFromOrdersPage != null && fallbackFromOrdersPage !== ""
      ? String(fallbackFromOrdersPage).trim()
      : "";
  if (!rows?.length) return fromNav;
  for (const row of rows) {
    const v = pickInvoiceIdFromAPI(row);
    if (v !== "" && v != null) return String(v).trim();
  }
  return fromNav;
}

export function pickInvoiceIdFromRow(item, orderFallback) {
  const rowId = pickInvoiceIdFromAPI(item);
  if (rowId !== "" && rowId != null) return String(rowId).trim();
  return (
    orderFallback?.invoice_id ??
    orderFallback?.invoiceId ??
    orderFallback?.invoice_number ??
    orderFallback?.invoiceNumber ??
    ""
  );
}

/** Invoice no. on PDF: order/API invoice id when present, else INV-style fallback from order number */
export function resolveInvoiceNumberForPrint(orderItems, orderInfo, invoiceIdFromNav, deliveryIdFallback) {
  const rawOrderNo = orderInfo?.order_number || deliveryIdFallback || "";
  const fromApi = String(
    (orderItems?.length && orderInfo
      ? pickInvoiceIdFromRow(orderItems[0], orderInfo)
      : "") ||
      resolveOrderLevelInvoiceId(orderItems || [], invoiceIdFromNav) ||
      ""
  ).trim();
  return fromApi || rawOrderNo.replace(/ORD/i, "INV");
}

/** HSN / SAC from order line (same keys as stock/product APIs) */
function pickHsnFromOrderItem(item) {
  if (!item || typeof item !== "object") return "";
  const v =
    item.hsn_code ??
    item.hsnCode ??
    item.HSN_Code ??
    item.HSNCode ??
    item.hsn ??
    item.HSN ??
    item.gst_hsn ??
    item.gst_hsn_code ??
    item.item_hsn_code ??
    item.Item_HSN_Code ??
    "";
  return v === null || v === undefined ? "" : String(v).trim();
}

function numberToWords(num) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString()).length > 9) return 'overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return;
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : '';
  return str || 'Zero Only';
}

/**
 * Calculates item totals, taxes, and final balance for the invoice.
 */
export function calculateInvoiceTotals(orderItems = [], invoiceFormData = {}, orderInfo = {}) {
  const getDaysAndTotal = (item) => {
    if (!invoiceFormData.returnDate || !item.placed_at) {
      return { days: 1, total: parseInt(item.generated_amount) || 0 };
    }
    const placedDate = new Date(item.placed_at);
    const returnDate = new Date(invoiceFormData.returnDate);
    const diffTime = returnDate - placedDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const days = diffDays > 0 ? diffDays : 1;
    return { days, total: days * (parseInt(item.rent_amount) || 0) };
  };

  const subTotal = orderItems.reduce((sum, item) => sum + getDaysAndTotal(item).total, 0);
  const isIgst = invoiceFormData.taxType === "IGST";
  const cgst = isIgst ? 0 : subTotal * 0.09;
  const sgst = isIgst ? 0 : subTotal * 0.09;
  const igst = isIgst ? subTotal * 0.18 : 0;
  const totalTax = cgst + sgst + igst;
  const totalAmount = subTotal + totalTax;
  const advanceAmount = orderInfo?.advance_amount || 0;
  const balanceAmount = totalAmount - advanceAmount;
  const amountInWords = numberToWords(Math.round(totalAmount));

  return {
    getDaysAndTotal,
    subTotal,
    isIgst,
    cgst,
    sgst,
    igst,
    totalTax,
    totalAmount,
    advanceAmount,
    balanceAmount,
    amountInWords,
  };
}

/**
 * Builds the complete HTML string for an invoice.
 */
export function generateInvoiceHTML({
  orderInfo,
  orderItems = [],
  invoiceFormData = {},
  invoiceNo,
  includePrintActions = true,
}) {
  const isTaxInvoice = (invoiceFormData?.invoiceType || "").toUpperCase() === "TAX";
  const invoiceTitle = isTaxInvoice ? "TAX INVOICE" : "PROFORMA INVOICE";
  const formattedInvoiceDate = invoiceFormData.invoiceDate
    ? new Date(invoiceFormData.invoiceDate).toLocaleDateString("en-GB")
    : "-";
  const formattedReturnDate = invoiceFormData.returnDate
    ? new Date(invoiceFormData.returnDate).toLocaleDateString("en-GB")
    : "-";

  const totals = calculateInvoiceTotals(orderItems, invoiceFormData, orderInfo);
  const { getDaysAndTotal, subTotal, isIgst, cgst, sgst, igst, totalAmount, advanceAmount, balanceAmount, amountInWords } = totals;

  const taxRowsHTML = isIgst
    ? `
                <tr>
                  <td>IGST</td>
                  <td class="text-center">18%</td>
                  <td class="text-right">${igst.toFixed(2)}</td>
                </tr>`
    : `
                <tr>
                  <td>CGST</td>
                  <td class="text-center">9%</td>
                  <td class="text-right">${cgst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>SGST</td>
                  <td class="text-center">9%</td>
                  <td class="text-right">${sgst.toFixed(2)}</td>
                </tr>`;

  const taxSummaryHTML = isIgst
    ? `
              <div class="flex-row" style="margin-bottom: 5px;">
                <span>IGST (18%):</span>
                <span>₹${igst.toFixed(2)}</span>
              </div>`
    : `
              <div class="flex-row" style="margin-bottom: 5px;">
                <span>CGST (9%):</span>
                <span>₹${cgst.toFixed(2)}</span>
              </div>
              <div class="flex-row" style="margin-bottom: 5px;">
                <span>SGST (9%):</span>
                <span>₹${sgst.toFixed(2)}</span>
              </div>`;

  const logoSrc = typeof window !== "undefined" && window.location?.origin
    ? `${window.location.origin}/irr.png`
    : "/irr.png";

  return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${invoiceTitle} - ${invoiceNo}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            background: white;
            color: black;
            font-size: 12px;
          }
          .invoice-container {
            border: 2px solid black;
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid black;
            padding: 10px;
            position: relative;
          }
          .logo {
            position: absolute;
            left: 20px;
            top: 10px;
            width: 80px;
            height: 80px;
          }
          .company-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .invoice-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            padding: 5px;
            border-bottom: 1px solid black;
            background: #f0f0f0;
          }
          .section {
            border-bottom: 1px solid black;
            padding: 10px;
          }
          .flex-row {
            display: flex;
            justify-content: space-between;
          }
          .half-width {
            width: 48%;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .customer-section {
            display: flex;
            border-bottom: 1px solid black;
          }
          .customer-box {
            flex: 1;
            padding: 10px;
          }
          .border-right {
            border-right: 1px solid black;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid black;
            padding: 5px;
            text-align: left;
          }
          th {
            background: #f0f0f0;
            text-align: center;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .no-border-bottom {
            border-bottom: none;
          }
          .no-border-top {
            border-top: none;
          }
          @media print {
            .no-print { display: none; }
            body { margin: 20mm; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <img src="${logoSrc}" alt="IRR Logo" class="logo" />
            <div class="company-name">IRR TECHNO FAB FY-2024-2025</div>
            <div>NO.276-D, VANAGARAM ROAD, ATHIPET, AMBATTUR, CHENNAI – 600 058</div>
            <div><strong>GSTIN/UIN:</strong> 33AAAPI1135L2Z4 | <strong>State:</strong> Tamil Nadu (Code: 33)</div>
          </div>

          <div class="invoice-title">${invoiceTitle}</div>

          <div class="section">
            <div class="flex-row">
              <div class="half-width">
                <div><strong>Invoice No:</strong> ${invoiceNo}</div>
                <div><strong>Invoice Date:</strong> ${formattedInvoiceDate}</div>
                <div><strong>Delivery Note:</strong> ${orderInfo?.delivery_chelan_number || '-'}</div>
                <div><strong>Delivery Note Date:</strong> ${orderInfo?.order_date || '-'}</div>
              </div>
              <div class="half-width text-right">
                <div><strong>Mode/Terms of Payment:</strong> ${invoiceFormData.modeOfPayment || 'Immediate'}</div>
                <div><strong>Return Date:</strong> ${formattedReturnDate}</div>
              </div>
            </div>
          </div>

          <div class="customer-section">
            <div class="customer-box border-right">
              <strong>Buyer (Bill To)</strong><br>
              <strong>Name:</strong> ${invoiceFormData.customerName || 'N/A'}<br>
              <strong>Address:</strong> ${invoiceFormData.customerAddress || '-'}<br>
              <strong>GSTIN/UIN:</strong> ${invoiceFormData.customerGSTIN || '-'}<br>
              <strong>State & Code:</strong> Tamil Nadu (33)
            </div>
            <div class="customer-box">
              <strong>Consignee (Ship To)</strong><br>
              <strong>Name:</strong> ${invoiceFormData.customerName || 'N/A'}<br>
              <strong>Address:</strong> ${invoiceFormData.customerAddress || '-'}<br>
              <strong>GSTIN/UIN:</strong> ${invoiceFormData.customerGSTIN || '-'}<br>
              <strong>State & Code:</strong> Tamil Nadu (33)
            </div>
          </div>

          <div class="items-section">
            <table>
              <thead>
                <tr>
                  <th style="width: 5%">SI No</th>
                  <th style="width: 40%">Description of Services</th>
                  <th style="width: 10%">HSN/SAC</th>
                  <th style="width: 10%">No of Days</th>
                  <th style="width: 15%">Rate (₹)</th>
                  <th style="width: 20%">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${orderItems.map((item, index) => {
                  const { days, total } = getDaysAndTotal(item);
                  const hsn = pickHsnFromOrderItem(item) || "—";
                  return `
                    <tr>
                      <td class="text-center">${index + 1}</td>
                      <td>${item.item_name || 'Item'}</td>
                      <td class="text-center">${hsn}</td>
                      <td class="text-center">${days}</td>
                      <td class="text-right">${item.rent_amount}</td>
                      <td class="text-right">${Math.round(total)}</td>
                    </tr>
                  `;
                }).join('')}
                ${Array.from({ length: Math.max(0, 5 - orderItems.length) }, () => `
                  <tr>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="flex-row" style="border-bottom: 1px solid black;">
            <div style="width: 60%; border-right: 1px solid black; padding: 10px;">
              <strong>Tax Details</strong>
              <table style="margin-top: 5px; font-size: 11px;">
                <tr>
                  <th>Description</th>
                  <th>Rate</th>
                  <th>Amount (₹)</th>
                </tr>
                ${taxRowsHTML}
              </table>
              <div style="margin-top: 10px;">
                <strong>Amount in Words:</strong><br>
                ${amountInWords}
              </div>
            </div>
            <div style="width: 40%; padding: 10px;">
              <div class="flex-row" style="margin-bottom: 5px;">
                <span>Sub Total:</span>
                <span>₹${subTotal.toFixed(2)}</span>
              </div>
              ${taxSummaryHTML}
              <div class="flex-row" style="border-top: 1px solid black; padding-top: 5px; font-weight: bold;">
                <span>Total Invoice Amount:</span>
                <span>₹${totalAmount.toFixed(2)}</span>
              </div>
              <div class="flex-row" style="margin-bottom: 5px;">
                <span>Advance Amount:</span>
                <span>₹${advanceAmount.toFixed(2)}</span>
              </div>
              <div class="flex-row" style="border-top: 1px solid black; padding-top: 5px; font-weight: bold;">
                <span>Balance Amount:</span>
                <span>₹${balanceAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="flex-row" style="border-bottom: 1px solid black;">
            <div style="width: 50%; padding: 10px; border-right: 1px solid black;">
              <strong>Declaration:</strong><br>
              We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.
            </div>
            <div style="width: 50%; padding: 10px;">
              <strong>Company's Bank Details</strong><br>
              <strong>Account Holder:</strong> IRR TECHNO FAB<br>
              <strong>Bank Name:</strong> HDFC Bank Limited<br>
              <strong>Account No:</strong> 99999444014737<br>
              <strong>Branch & IFSC Code:</strong> HDFC0007637
            </div>
          </div>

          <div class="flex-row" style="min-height: 100px;">
            <div style="width: 50%; padding: 10px; border-right: 1px solid black; display: flex; align-items: flex-end;">
              <strong>Customer's Seal & Signature</strong>
            </div>
            <div style="width: 50%; padding: 10px; text-align: right; display: flex; flex-direction: column; justify-content: space-between;">
              <strong>For IRR TECHNO FAB FY-2024-2025</strong>
              <br><br><br>
              <strong>Authorised Signatory</strong>
            </div>
          </div>

        </div>

        ${includePrintActions ? `
        <div class="no-print" style="text-align: center; margin: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; margin: 5px; cursor: pointer;">
            Print Invoice
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; margin: 5px; cursor: pointer;">
            Close
          </button>
        </div>` : ""}
      </body>
      </html>
    `;
}

/**
 * Generates an actual PDF Blob in memory from the invoice HTML.
 */
export async function generateInvoicePdfBlob({ orderInfo, orderItems, invoiceFormData, invoiceNo }) {
  const invoiceHTML = generateInvoiceHTML({
    orderInfo,
    orderItems,
    invoiceFormData,
    invoiceNo,
    includePrintActions: false,
  });

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "800px";
  container.style.background = "#ffffff";
  container.style.color = "#000000";
  container.innerHTML = invoiceHTML;

  const noPrintEls = container.querySelectorAll(".no-print");
  noPrintEls.forEach((el) => el.remove());

  document.body.appendChild(container);

  try {
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `invoice_${invoiceNo || "INV"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    const pdfBlob = await html2pdf().from(container).set(opt).output("blob");
    return pdfBlob;
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * Opens a new window with the proforma invoice HTML and triggers the print UI.
 */
export function openProformaInvoicePdf({ orderInfo, orderItems, invoiceFormData, invoiceNo }) {
  const invoiceWindow = window.open("", "_blank");
  if (!invoiceWindow) {
    console.warn("Could not open invoice window (popup blocked?)");
    return null;
  }

  const invoiceHTML = generateInvoiceHTML({
    orderInfo,
    orderItems,
    invoiceFormData,
    invoiceNo,
    includePrintActions: true,
  });

  invoiceWindow.document.write(invoiceHTML);
  invoiceWindow.document.close();
  return invoiceWindow;
}

/**
 * Automatically generates the PDF, uploads it to /irrl/upload,
 * and calls /irrl/addSubTransaction with the result.
 */
export async function uploadInvoicePdfAndAddSubTransaction({
  orderInfo,
  orderItems = [],
  invoiceFormData = {},
  invoiceNo,
  orderId,
}) {
  const totals = calculateInvoiceTotals(orderItems, invoiceFormData, orderInfo);

  // 1. Generate PDF Blob
  const pdfBlob = await generateInvoicePdfBlob({
    orderInfo,
    orderItems,
    invoiceFormData,
    invoiceNo,
  });

  // 2. Upload to ${API_BASE_URL}/irrl/upload
  const file = new File([pdfBlob], `${invoiceNo || "invoice"}.pdf`, {
    type: "application/pdf",
  });

  const form = new FormData();
  form.append("images", file);

  const uploadRes = await axios.post(`${API_BASE_URL}/irrl/upload`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  let uploadedUrl = "";
  const d = uploadRes.data;
  if (d) {
    if (Array.isArray(d.urls) && d.urls.length > 0 && d.urls[0]) {
      uploadedUrl = d.urls[0];
    } else if (typeof d.url === "string" && d.url.trim()) {
      uploadedUrl = d.url.trim();
    } else if (typeof d.filePath === "string" && d.filePath.trim()) {
      uploadedUrl = d.filePath.trim();
    } else if (Array.isArray(d.data) && d.data.length > 0) {
      const first = d.data[0];
      uploadedUrl = typeof first === "string" ? first : (first?.url || first?.filePath || first?.file_url || "");
    }
  }

  if (uploadedUrl && !/^https?:\/\//i.test(uploadedUrl)) {
    const path = uploadedUrl.startsWith("/") ? uploadedUrl : `/${uploadedUrl}`;
    uploadedUrl = `${API_BASE_URL}${path}`;
  }

  // 3. Post to ${API_BASE_URL}/irrl/addSubTransaction
  const effectiveOrderId = String(
    orderId ||
    orderInfo?.order_number ||
    orderInfo?.delivery_id ||
    ""
  );

  const isTaxInvoice = (invoiceFormData?.invoiceType || "").toUpperCase() === "TAX";
  const taxTypeSelected = isTaxInvoice ? "TAX" : (invoiceFormData?.taxType || "CGST_SGST");

  const subTxPayload = {
    id: 0,
    order_id: effectiveOrderId,
    invoice_id: String(invoiceNo || ""),
    amount: Math.round(totals.totalAmount || 0),
    image: uploadedUrl,
    "upladed pdf url": uploadedUrl,
    uploaded_pdf_url: uploadedUrl,
    status: "PENDING",
    type: invoiceFormData?.modeOfPayment || "Immediate",
    from_date: invoiceFormData?.invoiceDate || "",
    to_date: invoiceFormData?.returnDate || "",
    tax_type: taxTypeSelected,
    invoice_type: invoiceFormData?.invoiceType || "PROFORMA",
  };

  const addTxRes = await axios.post(`${API_BASE_URL}/irrl/addSubTransaction`, subTxPayload);

  return {
    uploadedUrl,
    subTxPayload,
    addTxRes,
    totals,
  };
}
