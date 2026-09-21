import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, X } from "lucide-react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import { API_BASE_URL } from "../../config/api";
import {
  resolveOrderLevelInvoiceId,
  resolveInvoiceNumberForPrint,
  openProformaInvoicePdf,
  TAX_TYPE_OPTIONS,
  DEFAULT_TAX_TYPE,
} from "../../utils/proformaInvoice";

/** Trimmed version of Order Details' order-info builder — only the fields the invoice needs. */
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

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [orderItemsForInvoice, setOrderItemsForInvoice] = useState([]);
  const [orderInfoForInvoice, setOrderInfoForInvoice] = useState(null);
  const [invoiceFormData, setInvoiceFormData] = useState({
    customerName: "",
    customerAddress: "",
    customerGSTIN: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    returnDate: "",
    modeOfPayment: "Immediate",
    taxType: DEFAULT_TAX_TYPE,
  });

  const openInvoiceModal = async () => {
    if (!orderIdFromNav) return;
    setInvoiceLoading(true);
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
      setShowInvoiceModal(true);
    } catch (err) {
      console.error("Error fetching order details for invoice:", err);
      alert("Could not load order details for the invoice.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    setShowInvoiceModal(false);
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
  };

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

  useEffect(() => {
    fetchTransactions();
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

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(251,191,36,0.06),transparent)]"
        aria-hidden
      />
      <Header onLogout={onLogout} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <Rentalsidebar />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
            <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800"
                >
                  <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
                  Back
                </button>
                <h1 className="text-base font-semibold tracking-tight text-slate-900">Transactions</h1>
                {orderIdFromNav != null && orderIdFromNav !== "" && (
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500">Order {orderIdFromNav}</p>
                )}
              </div>
              <button
                type="button"
                disabled={!orderIdFromNav || invoiceLoading}
                onClick={openInvoiceModal}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileText className="h-3.5 w-3.5" strokeWidth={2.5} />
                {invoiceLoading ? "Loading…" : "Invoice"}
              </button>
            </div>

            {!orderIdFromNav ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/80 px-4 py-12 text-center">
                <p className="max-w-sm text-sm text-slate-600">
                  Open this page from <span className="font-medium text-slate-800">Orders</span> using{" "}
                  <span className="font-medium text-slate-800">View</span> so an order is selected.
                </p>
              </div>
            ) : loading ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                <p className="mt-3 text-xs font-medium text-slate-500">Loading transactions…</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-12">
                <p className="text-sm text-slate-600">No transactions for this order.</p>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Transaction ID
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Generated amount
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((t) => {
                      const displayAmt = transactionAmountForDisplay(t);
                      const statusUpper = (t.status || "").toUpperCase();
                      const selectValue = statusOptions.includes(statusUpper)
                        ? statusUpper
                        : statusOptions[0];

                      return (
                        <tr
                          key={t.transaction_id}
                          className="cursor-pointer transition-colors hover:bg-slate-50/80"
                          onClick={() =>
                            navigate("/transaction-details", {
                              state: { transaction_id: t.transaction_id },
                            })
                          }
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-slate-700">
                            {t.transaction_id}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 tabular-nums font-medium text-slate-900">
                            {displayAmt !== undefined && displayAmt !== null && displayAmt !== ""
                              ? formatRupee(displayAmt)
                              : "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
        </main>
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
              <X className="h-4 w-4" />
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
                  className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <FileText className="h-4 w-4" /> Generate & Print Invoice
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
