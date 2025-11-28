import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import { FiEdit, FiTrash2, FiDownload } from "react-icons/fi";
import * as XLSX from "xlsx";

const ToolsDashboard = ({ onLogout }) => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const toolsPerPage = 10;

  const [search, setSearch] = useState("");
  const [selectedTool, setSelectedTool] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [formData, setFormData] = useState({
    tool_name: "",
    tool_code: "",
    description: "",
    status: "",
  });

  const [menuOpen, setMenuOpen] = useState(null);

  // Fetch tools API
  useEffect(() => {
    fetch("https://ems.binlaundry.com/irrl/genericApiUnjoin/toolslist")
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        setTools(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching tools:", err);
        setLoading(false);
      });
  }, []);

  const suggestions = tools.filter((t) =>
    t.tool_name.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLast = currentPage * toolsPerPage;
  const indexOfFirst = indexOfLast - toolsPerPage;
  const currentTools = tools.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(tools.length / toolsPerPage);

  const handleSelectTool = (tool) => {
    setSelectedTool(tool.tool_id);
    const index = tools.findIndex((t) => t.tool_id === tool.tool_id);
    const page = Math.floor(index / toolsPerPage) + 1;
    setCurrentPage(page);
    setSearch("");
  };

  const handleAddClick = () => {
    setEditingTool(null);
    setFormData({ tool_name: "", tool_code: "", description: "", status: "" });
    setShowForm(true);
  };

  const handleEdit = (tool) => {
    setEditingTool(tool);
    setFormData(tool);
    setShowForm(true);
    setMenuOpen(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTool) {
      setTools(
        tools.map((t) =>
          t.tool_id === editingTool.tool_id
            ? { ...formData, tool_id: editingTool.tool_id }
            : t
        )
      );
    } else {
      const newTool = { ...formData, tool_id: Date.now().toString() };
      setTools([...tools, newTool]);
    }
    setShowForm(false);
    setEditingTool(null);
    setFormData({ tool_name: "", tool_code: "", description: "", status: "" });
  };

  const handleDelete = (id) => {
    setTools(tools.filter((t) => t.tool_id !== id));
    setMenuOpen(null);
  };

  const handleDownloadExcel = () => {
    const tableData = tools.map((t) => ({
      "ID": t.tool_id,
      "Tool Name": t.tool_name,
      "Tool Code": t.tool_code,
      "Description": t.description,
      "Status": t.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tools");
    XLSX.writeFile(workbook, "tools_report.xlsx");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header onLogout={onLogout} />
      <div className="flex flex-1 bg-gray-100">
        <Rentalsidebar />

        <div className="mx-auto w-full max-w-7xl flex-1 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tools..."
                className="w-64 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-yellow-600/20 transition focus:border-yellow-600 focus:ring-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-200 bg-white p-1 text-sm shadow-md">
                  {suggestions.map((s) => (
                    <li key={s.tool_id} onClick={() => handleSelectTool(s)} className="cursor-pointer rounded px-2 py-1 hover:bg-gray-50">
                      {s.tool_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-lg bg-yellow-600 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-700" onClick={handleAddClick}>
                + Add Tool
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={handleDownloadExcel}>
                <FiDownload /> Download Excel
              </button>
            </div>
          </div>

          {showForm && (
            <form className="mb-4 grid grid-cols-1 gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:grid-cols-5" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Tool Name"
                value={formData.tool_name}
                onChange={(e) => setFormData({ ...formData, tool_name: e.target.value })}
                required
                className="rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Tool Code"
                value={formData.tool_code}
                onChange={(e) => setFormData({ ...formData, tool_code: e.target.value })}
                className="rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Status (Active/Inactive)"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
              />
              <button type="submit" className="rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-700">{editingTool ? "Update" : "Add"}</button>
            </form>
          )}

          {loading ? (
            <p className="text-gray-600">Loading tools...</p>
          ) : (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Tools List</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-left">Tool Name</th>
                      <th className="px-4 py-2 text-left">Tool Code</th>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentTools.map((t) => (
                      <tr
                        key={t.tool_id}
                        className={selectedTool === t.tool_id ? "bg-yellow-50" : "hover:bg-yellow-50/40"}
                      >
                        <td className="px-4 py-2">{t.tool_name}</td>
                        <td className="px-4 py-2">{t.tool_code}</td>
                        <td className="px-4 py-2">{t.description}</td>
                        <td className="px-4 py-2">{t.status}</td>
                        <td className="px-4 py-2">
                          <div className="relative">
                            <button
                              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setMenuOpen(menuOpen === t.tool_id ? null : t.tool_id)}
                            >
                              ⋮
                            </button>
                            {menuOpen === t.tool_id && (
                              <div className="absolute right-0 z-10 mt-1 w-32 rounded-md border border-gray-200 bg-white p-1 text-sm shadow-md">
                                <div className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-gray-50" onClick={() => handleEdit(t)}>
                                  <FiEdit /> Edit
                                </div>
                                <div className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-red-600 hover:bg-gray-50" onClick={() => handleDelete(t.tool_id)}>
                                  <FiTrash2 /> Delete
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={
                      currentPage === i + 1
                        ? "rounded-md bg-yellow-600 px-3 py-1.5 font-semibold text-white"
                        : "rounded-md border border-gray-300 px-3 py-1.5 text-gray-700"
                    }
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ToolsDashboard;
