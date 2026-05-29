import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

const QuotationDetails = ({ onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quotation, setquotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(
          `https://ems.binlaundry.com/irrl/quotation/${id}`
        );
        setquotation(res.data?.data ?? null);
      } catch (err) {
        console.error("Error fetching quotation details:", err);
        setError("Could not load quotation details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(251,191,36,0.08),transparent)]"
        aria-hidden
      />
      <Header onLogout={onLogout} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <Rentalsidebar />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">

            {/* Top bar */}
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <FaArrowLeft className="h-3 w-3" />
                Back
              </button>
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                quotation Details
              </h2>
            </div>

            {loading ? (
              <div className="flex flex-1 flex-col items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                <p className="mt-3 text-sm font-medium text-slate-600">Loading quotation details…</p>
              </div>
            ) : error ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm font-medium text-rose-600">{error}</p>
              </div>
            ) : !quotation ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-slate-500">No details found for this quotation.</p>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto space-y-4">

                {/* Contact info */}
                <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                    <span className="h-1 w-6 rounded-full bg-amber-400" />
                    quotation information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Qtn No.</p>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-amber-700">{quotation.quotation_number || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Placed</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">
                        {quotation.placed_at ? new Date(quotation.placed_at).toLocaleDateString("en-IN") : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total amount</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900">
                        {quotation.total_amount != null ? `₹${Number(quotation.total_amount).toLocaleString("en-IN")}` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Name</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">{quotation.contact_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Phone</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">{quotation.contact_number || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Shipping address</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">{quotation.shipping_address || "—"}</p>
                    </div>
                  </div>
                </section>

                {/* Items table */}
                <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                      <span className="h-1 w-6 rounded-full bg-amber-400" />
                      Items
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">
                      {(quotation.items || []).length} item{(quotation.items || []).length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {(quotation.items || []).length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-400">No items in this quotation.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-xs">
                        <thead className="border-b border-slate-100 bg-slate-50 text-slate-600">
                          <tr>
                            <th className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider">#</th>
                            <th className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider">Item name</th>
                            <th className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider">Description</th>
                            <th className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider">Start date</th>
                            <th className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider">End date</th>
                            <th className="whitespace-nowrap px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider">Rent (₹)</th>
                            <th className="whitespace-nowrap px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider">Total (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(quotation.items || []).map((it, idx) => (
                            <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}>
                              <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="px-4 py-3 font-medium text-slate-900">{it.item_name || "—"}</td>
                              <td className="px-4 py-3 text-slate-600">{it.description || "—"}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{it.start_date || "—"}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{it.end_date || "—"}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                                {Number(it.rent_amount || 0).toLocaleString("en-IN")}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-amber-800">
                                ₹{Number(quotation.total_amount || 0).toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default QuotationDetails;
