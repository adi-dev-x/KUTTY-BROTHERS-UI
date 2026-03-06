import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import { FaMapMarkerAlt, FaUsers } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import { database } from "../../firebase";
import { ref, onValue } from "firebase/database";
import AttendanceSidebar from "./AttendanceSidebar";
import { Search } from "lucide-react";

const AttendancePage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredSites = sites.filter(site =>
    site.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <Header onLogout={onLogout} />

      <div className="flex flex-1 overflow-hidden">
        <AttendanceSidebar />

        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Attendance Tracker</h1>

            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Search sites..."
              />
            </div>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">

            <Link
              to="/attendance/all-employees"
              className="rounded-xl bg-gradient-to-br from-yellow-600 to-yellow-500 p-6 text-left shadow-sm ring-1 ring-yellow-700 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-600/30 text-white"
            >
              <FaUsers className="mb-3 text-3xl text-yellow-100" />
              <h3 className="text-lg font-bold text-white">All Employees</h3>
              <p className="mt-1 text-sm text-yellow-100/90">View attendance and calculate payroll for employees across all sites</p>
            </Link>

            {filteredSites.map((site) => (
              <Link
                key={site.id}
                to={`/attendance/site/${site.id}`}
                className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(202,138,4,0.25)] block"
              >
                <FaMapMarkerAlt className="mx-auto mb-3 text-3xl text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
                <p className="mt-1 text-sm text-gray-500">Manage site attendance & payroll</p>
              </Link>
            ))}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AttendancePage;
