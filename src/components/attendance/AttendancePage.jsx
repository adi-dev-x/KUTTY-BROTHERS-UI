import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import { FaMapMarkerAlt, FaUsers } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import { database } from "../../firebase";
import { ref, onValue } from "firebase/database";

const AttendancePage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);

  useEffect(() => {
    const sitesRef = ref(database, "sites");
    const unsubscribe = onValue(sitesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const siteList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setSites(siteList);
      } else {
        setSites([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onLogout={onLogout} />

      <main className="flex-1 bg-gray-100 px-6 py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">

          <Link
            to="/attendance/all-employees"
            className="rounded-xl bg-gradient-to-br from-yellow-600 to-yellow-500 p-6 text-left shadow-sm ring-1 ring-yellow-700 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-600/30 text-white"
          >
            <FaUsers className="mb-3 text-3xl text-yellow-100" />
            <h3 className="text-lg font-bold text-white">All Employees</h3>
            <p className="mt-1 text-sm text-yellow-100/90">View and mark attendance for employees across all sites</p>
          </Link>

          {sites.map((site) => (
            <Link
              key={site.id}
              to={`/attendance/site/${site.id}`}
              className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(202,138,4,0.25)] block"
            >
              <FaMapMarkerAlt className="mx-auto mb-3 text-3xl text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
              <p className="mt-1 text-sm text-gray-500">Manage site attendance</p>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AttendancePage;
