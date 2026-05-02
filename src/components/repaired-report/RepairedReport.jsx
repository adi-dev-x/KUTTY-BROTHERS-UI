import React from "react";
import { Wrench } from "lucide-react";
import Header from "../header/Header";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";

const RepairedReport = ({ onLogout }) => (
  <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50">
    <div
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(251,191,36,0.06),transparent)]"
      aria-hidden
    />
    <Header onLogout={onLogout} />
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <Rentalsidebar />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 shadow-sm">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <Wrench className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">Repaired report</h1>
          <p className="mt-2 max-w-md text-center text-sm text-slate-600">
            Report content and filters will go here when the API is connected.
          </p>
        </div>
      </main>
    </div>
  </div>
);

export default RepairedReport;
