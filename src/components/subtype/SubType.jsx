import React, { useState, useEffect, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Boxes, Filter } from "lucide-react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

const tableClass =
  "min-w-full border-collapse divide-y divide-slate-100 text-xs [&_td]:border-r [&_td]:border-slate-100 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-100 [&_th:last-child]:border-r-0";

const thClass =
  "whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600";

const SubTypeDashboard = ({ onLogout }) => {
  const [subTypes, setSubTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/ItemSubType")
      .then((res) => res.json())
      .then((data) => {
        setSubTypes(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching sub types:", err);
        setLoading(false);
      });
  }, []);

  const filteredSubTypes = useMemo(
    () => subTypes.filter((s) => (s.name || "").toLowerCase().includes(search.toLowerCase())),
    [subTypes, search]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredSubTypes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubTypes = filteredSubTypes.slice(indexOfFirstItem, indexOfLastItem);
  const matchingLines = filteredSubTypes.length;

  return (
    <div className="relative flex h-[100dvh] max-h-screen flex-col overflow-hidden bg-[#f4f6fb]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_50%_-25%,rgba(251,191,36,0.14),transparent_55%)]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(59,130,246,0.06),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,transparent_35%,rgba(248,250,252,0.9)_100%)]"
        aria-hidden
      />
      <Header onLogout={onLogout} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <Rentalsidebar />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-5">
            <div className="shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-xl shadow-slate-900/[0.07] ring-1 ring-slate-200/70 backdrop-blur-md">
              <div className="relative px-4 py-4 sm:px-5">
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" aria-hidden />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 ring-2 ring-white/50">
                      <Boxes className="h-5 w-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700/85">Catalog</p>
                      <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Sub type</h1>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 px-3.5 py-2 text-[11px] shadow-sm ring-1 ring-slate-100">
                      <Boxes className="h-3.5 w-3.5 text-amber-600" strokeWidth={2.5} />
                      <span className="text-slate-500">Total</span>
                      <span className="font-bold tabular-nums text-slate-900">{loading ? "—" : subTypes.length}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-slate-50/95 px-3.5 py-2 text-[11px] shadow-sm ring-1 ring-slate-100">
                      <Filter className="h-3.5 w-3.5 text-slate-500" strokeWidth={2.5} />
                      <span className="text-slate-500">Matching</span>
                      <span className="font-bold tabular-nums text-slate-900">{loading ? "—" : matchingLines}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-100/90 pt-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search sub types…"
                      className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-inner shadow-slate-900/5 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 shadow-inner ring-1 ring-slate-100">
                <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-amber-400 border-t-transparent" />
                <p className="mt-4 text-sm font-medium text-slate-500">Loading…</p>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-xl shadow-slate-900/[0.06] ring-1 ring-slate-200/60 backdrop-blur-sm">
                <div className="min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
                  <table className={tableClass}>
                    <thead className="sticky top-0 z-10 border-b border-slate-200/90 bg-gradient-to-b from-slate-100 to-slate-50/95 shadow-sm">
                      <tr>
                        <th className={thClass}>#</th>
                        <th className={thClass}>Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {currentSubTypes.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-16 text-center text-sm text-slate-500">
                            No results
                          </td>
                        </tr>
                      ) : (
                        currentSubTypes.map((s, index) => (
                          <tr
                            key={s.attributes_id ?? index}
                            className={`transition-colors hover:bg-amber-50/60 ${(indexOfFirstItem + index) % 2 === 1 ? "bg-slate-50/60" : ""}`}
                          >
                            <td className="whitespace-nowrap px-2 py-2 font-mono text-slate-500">{indexOfFirstItem + index + 1}</td>
                            <td className="px-2 py-2 font-medium text-slate-900">{s.name}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {matchingLines > 0 && (
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100/90 bg-gradient-to-r from-slate-50/95 via-white to-amber-50/30 px-3 py-2.5 sm:px-4">
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">{matchingLines === 0 ? 0 : indexOfFirstItem + 1}</span>
                      –
                      <span className="font-semibold text-slate-900">{Math.min(indexOfLastItem, matchingLines)}</span>
                      {" "}
                      of <span className="font-semibold text-slate-900">{matchingLines}</span>
                      <span className="hidden sm:inline"> · Page </span>
                      <span className="font-semibold text-slate-900 sm:inline">{currentPage}</span>
                      <span className="hidden sm:inline"> / {totalPages || 1}</span>
                    </p>
                    {totalPages > 1 ? (
                      <nav className="flex items-center gap-0.5 rounded-lg border border-slate-200/80 bg-white/90 p-0.5 shadow-sm" aria-label="Pagination">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          disabled={currentPage === 1}
                          className="inline-flex items-center rounded-md p-1.5 text-slate-600 transition hover:bg-amber-50 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            type="button"
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`min-w-[2rem] rounded-md px-2 py-1 text-xs font-semibold transition ${currentPage === i + 1
                              ? "bg-amber-600 text-white shadow-sm"
                              : "text-slate-700 hover:bg-slate-50"
                              }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="inline-flex items-center rounded-md p-1.5 text-slate-600 transition hover:bg-amber-50 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </nav>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400">Single page</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SubTypeDashboard;
