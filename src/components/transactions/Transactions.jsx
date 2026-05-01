import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

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

  const fetchTransactions = async () => {
    if (!orderIdFromNav) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `https://ems.binlaundry.com/irrl/genericApiUnjoin/mainTransaction?order_id='${orderIdFromNav}'`
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
        `https://ems.binlaundry.com/irrl/editTransaction/${row.transaction_id}?status=${encodeURIComponent(
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
            <div className="shrink-0">
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
    </div>
  );
};

export default Transactions;
