import React, { useState, useEffect, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

const tableClass =
  "min-w-full border-collapse divide-y divide-slate-100 text-xs [&_td]:border-r [&_td]:border-slate-200 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-200 [&_th:last-child]:border-r-0";

const thClass =
  "whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600";

const MainTypeDashboard = ({ onLogout }) => {
  const [mainTypes, setMainTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const mainTypesPerPage = 10;
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/attribute/ItemMainType")
      .then((res) => res.json())
      .then((data) => {
        setMainTypes(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching main types:", err);
        setLoading(false);
      });
  }, []);

  const filteredMainTypes = useMemo(
    () => mainTypes.filter((m) => (m.name || "").toLowerCase().includes(search.toLowerCase())),
    [mainTypes, search]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const indexOfLast = currentPage * mainTypesPerPage;
  const indexOfFirst = indexOfLast - mainTypesPerPage;
  const currentMainTypes = filteredMainTypes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredMainTypes.length / mainTypesPerPage);

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
          <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3">
            <div className="shrink-0 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="px-3 py-1.5">
                <h1 className="text-sm font-semibold text-slate-900">Main Type</h1>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-1.5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                  <span className="tabular-nums">
                    <span className="text-slate-400">Total</span>{" "}
                    <span className="font-semibold text-slate-900">{mainTypes.length}</span>
                  </span>
                  <span className="tabular-nums">
                    <span className="text-slate-400">Matching search</span>{" "}
                    <span className="font-semibold text-slate-900">{filteredMainTypes.length}</span>
                  </span>
                </div>
                <div className="relative min-w-[min(100%,10rem)] flex-1 basis-[8rem]">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search…"
                    className="w-full rounded-md border border-slate-200 bg-slate-50 py-1 pl-7 pr-2 text-[11px] text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500/25"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                <p className="mt-3 text-xs font-medium text-slate-500">Loading…</p>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="min-h-0 flex-1 overflow-auto">
                  <table className={tableClass}>
                    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100">
                      <tr>
                        <th className={thClass}>#</th>
                        <th className={thClass}>Main type name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {currentMainTypes.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-12 text-center text-xs text-slate-500">
                            No main types match your search.
                          </td>
                        </tr>
                      ) : (
                        currentMainTypes.map((m, index) => (
                          <tr
                            key={m.attributes_id ?? index}
                            className={`transition-colors hover:bg-amber-50/40 ${(indexOfFirst + index) % 2 === 1 ? "bg-slate-50/40" : ""}`}
                          >
                            <td className="whitespace-nowrap px-2 py-2 font-mono text-slate-500">{indexOfFirst + index + 1}</td>
                            <td className="px-2 py-2 font-medium text-slate-900">{m.name}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/90 px-3 py-2">
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">{filteredMainTypes.length === 0 ? 0 : indexOfFirst + 1}</span>
                      –
                      <span className="font-semibold text-slate-900">{Math.min(indexOfLast, filteredMainTypes.length)}</span>
                      {" "}
                      of <span className="font-semibold text-slate-900">{filteredMainTypes.length}</span>
                    </p>
                    <nav className="flex items-center gap-0.5" aria-label="Pagination">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          type="button"
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`min-w-[2rem] rounded-md px-2 py-1 text-xs font-semibold ${currentPage === i + 1 ? "bg-amber-600 text-white" : "text-slate-700 hover:bg-white"}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </nav>
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

export default MainTypeDashboard;
