import React, { useMemo, useState } from "react";
import Header from "../header/Header";
import Footer from "../footer/Footer";

const mockEmployees = [
  { id: 1, name: "Anil Kumar", role: "Accountant", phone: "+91 98765 43210", status: "Active" },
  { id: 2, name: "Priya Singh", role: "HR Manager", phone: "+91 99887 66554", status: "Active" },
  { id: 3, name: "Rahul Verma", role: "Cashier", phone: "+91 91234 56789", status: "Inactive" },
  { id: 4, name: "Meera Iyer", role: "Operations", phone: "+91 90000 11122", status: "Active" },
];

const StatusPill = ({ value }) => {
  const isActive = value === "Active";
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold " +
        (isActive
          ? "bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20"
          : "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-400/20")
      }
    >
      {value}
    </span>
  );
};

const Employees = ({ onLogout }) => {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 10;

  const filteredEmployees = useMemo(() => {
    if (!query.trim()) return mockEmployees;
    const q = query.toLowerCase();
    return mockEmployees.filter(
      (e) => e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q) || e.phone.includes(q)
    );
  }, [query]);

  // Pagination
  const indexOfLast = currentPage * employeesPerPage;
  const indexOfFirst = indexOfLast - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onLogout={onLogout} />

      <main className="flex-1 bg-gray-100 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
              <p className="text-sm text-gray-600">Manage employee records and contact details.</p>
            </div>

            <div className="flex w-full items-center gap-3 sm:w-auto">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, role, phone"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-yellow-600/20 transition focus:border-yellow-600 focus:ring-2 sm:w-72"
              />
              <button className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-yellow-700">
                Add Employee
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {currentEmployees.map((e) => (
                    <tr key={e.id} className="hover:bg-yellow-50/40">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{e.name}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{e.role}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{e.phone}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm"><StatusPill value={e.status} /></td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <button className="mr-2 rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 transition hover:bg-gray-50">
                          Edit
                        </button>
                        <button className="rounded-md bg-red-600 px-3 py-1.5 text-white transition hover:bg-red-700">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 border-t border-gray-200 px-6 py-4">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={
                      currentPage === i + 1
                        ? "rounded-md bg-yellow-600 px-3 py-1.5 font-semibold text-white"
                        : "rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                    }
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Employees;

