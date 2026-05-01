import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, ExternalLink } from "lucide-react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

const statusOptions = ["PENDING", "COMPLETED", "FAILED"];

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";

function formatRupee(value) {
  if (value === undefined || value === null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `₹${n.toLocaleString("en-IN")}`;
}

const IRRL_ORIGIN = "https://ems.binlaundry.com";

function normalizeIrrlPublicUrl(pathOrUrl) {
  const s = String(pathOrUrl ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${IRRL_ORIGIN}${path}`;
}

/** IRRL POST /irrl/upload usually returns `{ urls: string[] }` */
function pickUrlFromUploadResponse(data) {
  if (!data) return "";
  const urls = data.urls;
  if (Array.isArray(urls) && urls.length > 0 && urls[0]) {
    return normalizeIrrlPublicUrl(urls[0]);
  }
  if (typeof data.url === "string" && data.url.trim()) {
    return normalizeIrrlPublicUrl(data.url.trim());
  }
  if (typeof data.filePath === "string" && data.filePath.trim()) {
    return normalizeIrrlPublicUrl(data.filePath.trim());
  }
  return "";
}

async function postIrrlUpload(file) {
  const formData = new FormData();
  formData.append("images", file);
  const res = await axios.post(`${IRRL_ORIGIN}/irrl/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return pickUrlFromUploadResponse(res.data);
}

const TransactionDetails = ({ onLogout }) => {
  const [subTransactions, setSubTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    status: "PENDING",
    type: "",
    imageFile: null,
    uploadedImage: "",
  });
  const location = useLocation();
  const navigate = useNavigate();
  const mainTransactionId = location.state?.transaction_id || null;

  const fetchSubTransactions = async () => {
    if (!mainTransactionId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `https://ems.binlaundry.com/irrl/genericApiUnjoin/subTransaction?main_transaction_id=${mainTransactionId}`
      );
      setSubTransactions(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching sub-transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubTransactions();
  }, [mainTransactionId]);

  const handleStatusChange = async (transactionId, newStatus) => {
    try {
      await axios.get(
        `https://ems.binlaundry.com/irrl/editTransaction/${transactionId}?status=${newStatus}&table=transac`
      );
      setSubTransactions((prev) =>
        prev.map((t) => (t.id === transactionId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    }
  };

  const handleAddTransaction = async () => {
    try {
      let imageUrl = normalizeIrrlPublicUrl(newTransaction.uploadedImage);

      if (!imageUrl && newTransaction.imageFile) {
        setUploading(true);
        try {
          imageUrl = await postIrrlUpload(newTransaction.imageFile);
          if (imageUrl) {
            setNewTransaction((prev) => ({ ...prev, uploadedImage: imageUrl }));
          }
        } finally {
          setUploading(false);
        }
      }

      const imageToSend = imageUrl || "sample_image.png";

      const payload = {
        main_transaction_id: mainTransactionId,
        amount: parseInt(newTransaction.amount, 10),
        status: newTransaction.status,
        type: newTransaction.type,
        image: imageToSend,
      };

      await axios.post(`${IRRL_ORIGIN}/irrl/addSubTransaction`, payload);

      setShowAddPopup(false);
      setNewTransaction({
        amount: "",
        status: "PENDING",
        type: "",
        imageFile: null,
        uploadedImage: "",
      });
      fetchSubTransactions();
    } catch (err) {
      console.error("Failed to add transaction", err);
      alert("Failed to add transaction");
    }
  };

  const handleImageUpload = async () => {
    if (!newTransaction.imageFile) {
      alert("Please select a file first!");
      return;
    }

    setUploading(true);
    try {
      const uploaded = await postIrrlUpload(newTransaction.imageFile);
      if (!uploaded) {
        alert("Upload did not return a URL. Try again.");
        return;
      }
      setNewTransaction((prev) => ({ ...prev, uploadedImage: uploaded }));
    } catch (err) {
      console.error("Failed to upload image", err);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
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
                <h1 className="text-base font-semibold tracking-tight text-slate-900">Sub-transactions</h1>
                {mainTransactionId != null && mainTransactionId !== "" && (
                  <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500" title={String(mainTransactionId)}>
                    Parent transaction {mainTransactionId}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={!mainTransactionId}
                onClick={() => setShowAddPopup(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                Add transaction
              </button>
            </div>

            {!mainTransactionId ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/80 px-4 py-12 text-center">
                <p className="max-w-sm text-sm text-slate-600">
                  Open this page from the transactions list by selecting a row so a parent transaction is loaded.
                </p>
              </div>
            ) : loading ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                <p className="mt-3 text-xs font-medium text-slate-500">Loading sub-transactions…</p>
              </div>
            ) : subTransactions.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-14">
                <p className="text-sm text-slate-600">No sub-transactions yet.</p>
                <button
                  type="button"
                  onClick={() => setShowAddPopup(true)}
                  className="mt-4 text-xs font-semibold text-amber-700 hover:text-amber-800"
                >
                  Add your first transaction
                </button>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        ID
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Amount
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Type
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Image
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subTransactions.map((t) => {
                      const g = t.generated_amount;
                      const displayAmt =
                        g !== undefined && g !== null && g !== "" ? g : t.amount;
                      const statusUpper = (t.status || "").toUpperCase();
                      const selectValue = statusOptions.includes(statusUpper)
                        ? statusUpper
                        : statusOptions[0];
                      const imageHref = t.image
                        ? t.image.startsWith("http")
                          ? t.image
                          : `https://ems.binlaundry.com/${t.image}`
                        : null;

                      return (
                        <tr key={t.id} className="transition-colors hover:bg-slate-50/80">
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-slate-700">
                            {t.id}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 tabular-nums font-medium text-slate-900">
                            {displayAmt !== null && displayAmt !== undefined && displayAmt !== ""
                              ? formatRupee(displayAmt)
                              : "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <select
                              className={selectClass}
                              value={selectValue}
                              onChange={(e) => handleStatusChange(t.id, e.target.value)}
                            >
                              {statusOptions.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="max-w-[140px] truncate px-4 py-3 text-slate-700" title={t.transaction_type || ""}>
                            {t.transaction_type || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {imageHref ? (
                              <a
                                href={imageHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-medium text-amber-700 hover:text-amber-900"
                              >
                                View
                                <ExternalLink className="h-3 w-3 opacity-70" />
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
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

      {showAddPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-subtransaction-title"
          onClick={() => !uploading && setShowAddPopup(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => !uploading && setShowAddPopup(false)}
              disabled={uploading}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-slate-100 px-5 pb-4 pt-5">
              <h2 id="add-subtransaction-title" className="text-base font-semibold text-slate-900">
                Add sub-transaction
              </h2>
              <p className="mt-1 text-xs text-slate-500">Attach amount, status, type, and optional proof image.</p>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div>
                <label className={labelClass} htmlFor="sub-amt">
                  Amount
                </label>
                <input
                  id="sub-amt"
                  type="number"
                  className={inputClass}
                  value={newTransaction.amount}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, amount: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="sub-status">
                  Status
                </label>
                <select
                  id="sub-status"
                  className={inputClass}
                  value={newTransaction.status}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, status: e.target.value })
                  }
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="sub-type">
                  Type
                </label>
                <input
                  id="sub-type"
                  type="text"
                  className={inputClass}
                  value={newTransaction.type}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, type: e.target.value })
                  }
                  placeholder="e.g. adjustment"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="sub-file">
                  Image
                </label>
                <input
                  id="sub-file"
                  type="file"
                  className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      imageFile: e.target.files[0],
                    })
                  }
                />
                <button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={uploading}
                  className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {uploading ? "Uploading…" : "Upload image"}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setShowAddPopup(false)}
                disabled={uploading}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddTransaction}
                disabled={uploading}
                className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDetails;
