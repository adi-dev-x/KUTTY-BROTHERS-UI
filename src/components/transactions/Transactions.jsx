import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFileInvoice, FaTimes } from "react-icons/fa";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import { API_BASE_URL } from "../../config/api";
import {
  resolveOrderLevelInvoiceId,
  resolveInvoiceNumberForPrint,
  openProformaInvoicePdf,
  uploadInvoicePdfAndAddSubTransaction,
  TAX_TYPE_OPTIONS,
  DEFAULT_TAX_TYPE,
  INVOICE_TYPE_OPTIONS,
  DEFAULT_INVOICE_TYPE,
} from "../../utils/proformaInvoice";

/** Trimmed version of Order Details' order-info builder — only the fields the invoice/summary need. */
function buildInvoiceOrderInfo(data, deliveryId, invoiceIdFallback) {
  if (!data?.length) return null;
  return {
    customer_name: data[0].customer_name || "N/A",
    customer_gst: data[0].customer_gst || "",
    delivery_chelan_number: data[0].delivery_chelan_number || "",
    order_number: data[0].order_number || deliveryId,
    order_date: data[0].placed_at
      ? new Date(data[0].placed_at).toLocaleDateString()
      : new Date().toLocaleDateString(),
    advance_amount: parseInt(data[0].advance_amount || 0, 10) || 0,
    total_value: data.reduce((sum, item) => sum + (parseInt(item.generated_amount, 10) || 0), 0),
    invoice_id: resolveOrderLevelInvoiceId(data, invoiceIdFallback),
    invoice_number: data[0].invoice_number ?? data[0].invoiceNumber ?? data[0].Invoice_Number ?? "",
  };
}

const statusOptions = ["PENDING", "COMPLETED"];

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

function transactionAmountForDisplay(t) {
  const g = t?.generated_amount;
  if (g !== undefined && g !== null && g !== "") return g;
  return t?.amount;
}

function transactionAmountForApi(t) {
  const raw = transactionAmountForDisplay(t);
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

function formatRupee(value) {
  if (value === undefined || value === null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `₹${n.toLocaleString("en-IN")}`;
}

const Transactions = ({ onLogout }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const orderIdFromNav = location.state?.order_id ?? null;

  const [orderInfoLoading, setOrderInfoLoading] = useState(false);
  const [orderItemsForInvoice, setOrderItemsForInvoice] = useState([]);
  const [orderInfoForInvoice, setOrderInfoForInvoice] = useState(null);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [invoiceFormData, setInvoiceFormData] = useState({
    customerName: "",
    customerAddress: "",
    customerGSTIN: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    returnDate: "",
    modeOfPayment: "Immediate",
    taxType: DEFAULT_TAX_TYPE,
    invoiceType: DEFAULT_INVOICE_TYPE,
  });

  const fetchTransactions = async () => {
    if (!orderIdFromNav) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/irrl/genericApiUnjoin/mainTransaction?order_id='${orderIdFromNav}'`
      );
      setTransactions(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderInfo = async () => {
    if (!orderIdFromNav) return;
    setOrderInfoLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/irrl/genericApiUnjoin/orderDetails?order_id='${orderIdFromNav}'`
      );
      const data = res.data?.data || [];
      const info = buildInvoiceOrderInfo(data, orderIdFromNav, "");
      setOrderItemsForInvoice(data);
      setOrderInfoForInvoice(info);
      setInvoiceFormData((prev) => ({
        ...prev,
        customerName: info?.customer_name || "",
        customerGSTIN: info?.customer_gst || "",
      }));
    } catch (err) {
      console.error("Error fetching order details:", err);
    } finally {
      setOrderInfoLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchOrderInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderIdFromNav]);

  const handleStatusChange = async (row, newStatus) => {
    try {
      const intAmount = transactionAmountForApi(row);
      await axios.get(
        `${API_BASE_URL}/irrl/editTransaction/${row.transaction_id}?status=${encodeURIComponent(
          newStatus
        )}&amount=${intAmount}`
      );
      setTransactions((prev) =>
        prev.map((t) =>
          t.transaction_id === row.transaction_id ? { ...t, status: newStatus } : t
        )
      );
    } catch (err) {
      console.error("Failed to update transaction", err);
      alert("Failed to update transaction");
    }
  };

  const totalAmountPaid = useMemo(
    () =>
      transactions
        .filter((t) => (t.status || "").toUpperCase() === "COMPLETED")
        .reduce((sum, t) => sum + transactionAmountForApi(t), 0),
    [transactions]
  );

  const orderTotalValue = orderInfoForInvoice?.total_value || 0;
  const balanceAmount = orderTotalValue - totalAmountPaid;

  const openInvoiceModal = () => {
    if (!orderIdFromNav) return;
    setShowInvoiceModal(true);
  };

  const handlePrintInvoice = async () => {
    const invoiceNo = resolveInvoiceNumberForPrint(
      orderItemsForInvoice,
      orderInfoForInvoice,
      "",
      orderIdFromNav
    );

    openProformaInvoicePdf({
      orderInfo: orderInfoForInvoice,
      orderItems: orderItemsForInvoice,
      invoiceFormData,
      invoiceNo,
    });

    setSubmittingInvoice(true);
    try {
      await uploadInvoicePdfAndAddSubTransaction({
        orderInfo: orderInfoForInvoice,
        orderItems: orderItemsForInvoice,
        invoiceFormData,
        invoiceNo,
        orderId: orderIdFromNav,
      });
      setShowInvoiceModal(false);
      await fetchTransactions();
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
              <h2 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">Invoices</h2>
              {orderIdFromNav != null && orderIdFromNav !== "" && (
                <span className="truncate font-mono text-[11px] text-slate-500">Order {orderIdFromNav}</span>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!orderIdFromNav || orderInfoLoading}
                onClick={openInvoiceModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 sm:text-sm"
              >
                <FaFileInvoice className="shrink-0" /> Invoice
              </button>
            </div>
          </div>

          {!orderIdFromNav ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/80 px-4 py-12 text-center">
              <p className="max-w-sm text-sm text-slate-600">
                Open this page from <span className="font-medium text-slate-800">Orders</span> (using{" "}
                <span className="font-medium text-slate-800">View</span>) or <span className="font-medium text-slate-800">Order Details</span> (using{" "}
                <span className="font-medium text-slate-800">Invoice</span>) so an order is selected.
              </p>
            </div>
          ) : (
            <>
              <div className="shrink-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-100 sm:p-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Order information
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm lg:grid-cols-4">
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-500">Customer</div>
                    <div className="truncate font-medium text-slate-900">
                      {orderInfoLoading ? "—" : orderInfoForInvoice?.customer_name || "—"}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-500">Invoice ID</div>
                    <div className="truncate font-mono text-xs font-medium text-slate-900">
                      {orderInfoLoading
                        ? "—"
                        : orderInfoForInvoice?.invoice_id || orderInfoForInvoice?.invoice_number || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">Advance</div>
                    <div className="font-medium text-slate-900">
                      {orderInfoLoading ? "—" : formatRupee(orderInfoForInvoice?.advance_amount || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">Total value</div>
                    <div className="font-semibold text-blue-600">
                      {orderInfoLoading ? "—" : formatRupee(orderTotalValue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">Total amount paid</div>
                    <div className="font-semibold text-emerald-600">{formatRupee(totalAmountPaid)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">Balance amount</div>
                    <div className={`font-semibold ${balanceAmount > 0 ? "text-rose-600" : "text-slate-900"}`}>
                      {orderInfoLoading ? "—" : formatRupee(balanceAmount)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                <h3 className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Transactions
                </h3>
                {loading ? (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                    <p className="mt-3 text-xs font-medium text-slate-500">Loading transactions…</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200/90 bg-white px-4 py-12 shadow-sm ring-1 ring-slate-100">
                    <p className="text-sm text-slate-600">No transactions for this order.</p>
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100">
                    <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                      <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-slate-600 shadow-sm">
                        <tr>
                          <th className="whitespace-nowrap px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-3">
                            Transaction ID
                          </th>
                          <th className="whitespace-nowrap px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-3">
                            Generated amount
                          </th>
                          <th className="whitespace-nowrap px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-3">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {transactions.map((t) => {
                          const displayAmt = transactionAmountForDisplay(t);
                          const statusUpper = (t.status || "").toUpperCase();
                          const selectValue = statusOptions.includes(statusUpper)
                            ? statusUpper
                            : statusOptions[0];

                          return (
                            <tr
                              key={t.transaction_id}
                              className="cursor-pointer transition-colors hover:bg-amber-50/50"
                              onClick={() =>
                                navigate("/transaction-details", {
                                  state: { transaction_id: t.transaction_id },
                                })
                              }
                            >
                              <td className="whitespace-nowrap px-2 py-1.5 font-mono text-[11px] text-slate-700 sm:px-3">
                                {t.transaction_id}
                              </td>
                              <td className="whitespace-nowrap px-2 py-1.5 tabular-nums font-medium text-slate-900 sm:px-3">
                                {displayAmt !== undefined && displayAmt !== null && displayAmt !== ""
                                  ? formatRupee(displayAmt)
                                  : "—"}
                              </td>
                              <td
                                className="whitespace-nowrap px-2 py-1.5 sm:px-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <select
                                  className={selectClass}
                                  value={selectValue}
                                  onChange={(e) => handleStatusChange(t, e.target.value)}
                                >
                                  {statusOptions.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-lg">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-1 text-gray-600 hover:bg-gray-100"
              onClick={() => setShowInvoiceModal(false)}
              aria-label="Close"
            >
              <FaTimes className="h-4 w-4" />
            </button>

            <h3 className="mb-4 text-center text-lg font-semibold text-gray-900">Invoice Details</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePrintInvoice();
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Customer Name</label>
                <input
                  type="text"
                  value={invoiceFormData.customerName}
                  onChange={(e) => setInvoiceFormData((prev) => ({ ...prev, customerName: e.target.value }))}
                  className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Customer Address</label>
                <textarea
                  value={invoiceFormData.customerAddress}
                  onChange={(e) => setInvoiceFormData((prev) => ({ ...prev, customerAddress: e.target.value }))}
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
                    onChange={(e) =>
                      setInvoiceFormData((prev) => ({ ...prev, customerGSTIN: e.target.value.toUpperCase() }))
                    }
                    className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Mode of Payment</label>
                  <input
                    type="text"
                    value={invoiceFormData.modeOfPayment}
                    onChange={(e) => setInvoiceFormData((prev) => ({ ...prev, modeOfPayment: e.target.value }))}
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
                    onChange={(e) => setInvoiceFormData((prev) => ({ ...prev, invoiceDate: e.target.value }))}
                    className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Return Date</label>
                  <input
                    type="date"
                    value={invoiceFormData.returnDate}
                    onChange={(e) => setInvoiceFormData((prev) => ({ ...prev, returnDate: e.target.value }))}
                    className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Invoice Type</label>
                  <select
                    value={invoiceFormData.invoiceType || DEFAULT_INVOICE_TYPE}
                    onChange={(e) => setInvoiceFormData((prev) => ({ ...prev, invoiceType: e.target.value }))}
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
                    onChange={(e) => setInvoiceFormData((prev) => ({ ...prev, taxType: e.target.value }))}
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
                  onClick={() => setShowInvoiceModal(false)}
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
    </div>
  );
};

export default Transactions;
