import React from "react";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import { FaMapMarkerAlt, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AttendancePage = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col">
      <Header onLogout={onLogout} />

      <main className="flex-1 bg-gray-100 px-6 py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Site 1", desc: "Track performance and activities of Site 1" },
            { title: "Site 2", desc: "Track performance and activities of Site 2" },
            { title: "Site 3", desc: "Track performance and activities of Site 3" },
          ].map((s, i) => (
            <div key={i} className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(202,138,4,0.25)]">
              <FaMapMarkerAlt className="mx-auto mb-3 text-3xl text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{s.desc}</p>
            </div>
          ))}

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-xl bg-white p-6 text-left shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(202,138,4,0.25)]"
          >
            <FaUsers className="mb-3 text-3xl text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">All Employees</h3>
            <p className="mt-1 text-sm text-gray-600">Track performance and activities of all employees</p>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AttendancePage;
