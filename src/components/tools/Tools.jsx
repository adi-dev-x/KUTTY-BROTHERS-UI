import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import "./Tools.css";
import Rentalsidebar from "../Rental-sidebar/Rentalsidebar";
import { FiEdit, FiTrash2, FiDownload } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    fetch("http://192.168.29.125:8080/irrl/genericApiUnjoin/toolslist")
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

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Tools Report", 14, 20);

    const tableColumn = ["ID", "Tool Name", "Tool Code", "Description", "Status"];
    const tableRows = [];

    tools.forEach((t) => {
      tableRows.push([t.tool_id, t.tool_name, t.tool_code, t.description, t.status]);
    });

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30 });
    doc.save("tools.pdf");
  };

  return (
    <div className="dashboard-wrapper">
      <Header onLogout={onLogout} />
      <div className="dashboard-body">
        <Rentalsidebar />

        <div className="main-content">
          <div className="top-bar">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search tools..."
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <ul className="suggestions">
                  {suggestions.map((s) => (
                    <li key={s.tool_id} onClick={() => handleSelectTool(s)}>
                      {s.tool_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="top-bar-buttons">
              <button className="add-btn" onClick={handleAddClick}>
                + Add Tool
              </button>
              <button className="download-btn" onClick={handleDownloadPDF}>
                <FiDownload className="menu-icons" /> Download PDF
              </button>
            </div>
          </div>

          {showForm && (
            <form className="add-customer-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Tool Name"
                value={formData.tool_name}
                onChange={(e) => setFormData({ ...formData, tool_name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Tool Code"
                value={formData.tool_code}
                onChange={(e) => setFormData({ ...formData, tool_code: e.target.value })}
              />
              <input
                type="text"
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <input
                type="text"
                placeholder="Status (Active/Inactive)"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              />
              <button type="submit">{editingTool ? "Update" : "Add"}</button>
            </form>
          )}

          {loading ? (
            <p>Loading tools...</p>
          ) : (
            <div className="table-card">
              <h3>Tools List</h3>
              <table>
                <thead>
                  <tr>
                    <th>Tool Name</th>
                    <th>Tool Code</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTools.map((t) => (
                    <tr
                      key={t.tool_id}
                      className={selectedTool === t.tool_id ? "highlight" : ""}
                    >
                      <td>{t.tool_name}</td>
                      <td>{t.tool_code}</td>
                      <td>{t.description}</td>
                      <td>{t.status}</td>
                      <td className="actions-cell">
                        <div className="menu-wrapper">
                          <button
                            className="menu-btn"
                            onClick={() => setMenuOpen(menuOpen === t.tool_id ? null : t.tool_id)}
                          >
                            ⋮
                          </button>
                          {menuOpen === t.tool_id && (
                            <div className="menu">
                              <div onClick={() => handleEdit(t)}>
                                <FiEdit className="menu-icon" /> Edit
                              </div>
                              <div onClick={() => handleDelete(t.tool_id)}>
                                <FiTrash2 className="menu-icon" /> Delete
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={currentPage === i + 1 ? "active" : ""}
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
    </div>
  );
};

export default ToolsDashboard;
