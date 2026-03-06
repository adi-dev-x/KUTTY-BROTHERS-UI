import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import { database } from "../../firebase";
import { ref, push, set, onValue, update, remove, get } from "firebase/database";
import { Users, Plus, Edit2, Trash2, Search, ArrowLeft, AlertTriangle, Building, X } from "lucide-react";

const SiteDetails = ({ onLogout }) => {
    const { id: siteId } = useParams();
    const navigate = useNavigate();

    const [siteName, setSiteName] = useState("");
    const [employees, setEmployees] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingEmpId, setEditingEmpId] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        age: "",
        address: "",
        aadharNo: "",
        phoneNo: "",
        designation: "",
        salaryAmount: "",
        salaryDate: ""
    });

    useEffect(() => {
        // Fetch Site Name
        const siteRef = ref(database, `sites/${siteId}`);
        get(siteRef).then((snapshot) => {
            if (snapshot.exists()) {
                setSiteName(snapshot.val().name);
            }
        });

        // Fetch Employees
        const employeesRef = ref(database, `sites/${siteId}/employees`);
        const unsubscribe = onValue(employeesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const empList = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key],
                }));
                setEmployees(empList);
            } else {
                setEmployees([]);
            }
        });

        return () => unsubscribe();
    }, [siteId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            name: "", age: "", address: "", aadharNo: "",
            phoneNo: "", designation: "", salaryAmount: "", salaryDate: ""
        });
        setIsEditing(false);
        setEditingEmpId(null);
    };

    const handleOpenAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const handleOpenEditModal = (emp) => {
        setFormData({
            name: emp.name || "",
            age: emp.age || "",
            address: emp.address || "",
            aadharNo: emp.aadharNo || "",
            phoneNo: emp.phoneNo || "",
            designation: emp.designation || "",
            salaryAmount: emp.salaryAmount || "",
            salaryDate: emp.salaryDate || ""
        });
        setIsEditing(true);
        setEditingEmpId(emp.id);
        setShowModal(true);
    };

    const handleSaveEmployee = async (e) => {
        e.preventDefault();

        try {
            if (isEditing && editingEmpId) {
                const empRef = ref(database, `sites/${siteId}/employees/${editingEmpId}`);
                await update(empRef, {
                    ...formData,
                    updatedAt: new Date().toISOString()
                });
            } else {
                const employeesRef = ref(database, `sites/${siteId}/employees`);
                const newEmpRef = push(employeesRef);
                await set(newEmpRef, {
                    ...formData,
                    createdAt: new Date().toISOString()
                });
            }
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error("Error saving employee:", error);
            alert("Failed to save employee");
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteConfirmId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            const empRef = ref(database, `sites/${siteId}/employees/${deleteConfirmId}`);
            await remove(empRef);
            setDeleteConfirmId(null);
        } catch (error) {
            console.error("Error deleting employee:", error);
            alert("Failed to delete employee");
        }
    };

    // Filter employees based on search query
    const filteredEmployees = employees.filter(emp => {
        const query = searchQuery.toLowerCase();
        const safeName = emp.name ? String(emp.name).toLowerCase() : "";
        const safeDesignation = emp.designation ? String(emp.designation).toLowerCase() : "";
        const safePhone = emp.phoneNo ? String(emp.phoneNo) : "";
        return safeName.includes(query) || safeDesignation.includes(query) || safePhone.includes(searchQuery);
    });

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
            <Header onLogout={onLogout} />

            <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">

                    {/* Header Section */}
                    <div className="mb-8">
                        <button
                            onClick={() => navigate('/sites')}
                            className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Sites
                        </button>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                    <Building className="h-8 w-8 text-yellow-600" />
                                    {siteName ? `${siteName} Employees` : 'Site Employees'}
                                </h1>
                                <p className="mt-2 text-sm text-gray-600">
                                    Manage all staff assigned to this location.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                {/* Search Bar */}
                                <div className="relative w-full sm:w-64">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Search className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search employees..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="block w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 transition-all shadow-sm"
                                    />
                                </div>

                                <button
                                    onClick={handleOpenAddModal}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 active:scale-95"
                                >
                                    <Plus className="h-5 w-5" />
                                    Add Employee
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Table View (Hidden on very small screens, visible on md+) */}
                    <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aadhar No</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Salary Details</th>
                                        <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {filteredEmployees.length > 0 ? (
                                        filteredEmployees.map((emp) => (
                                            <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900">{emp.name}</span>
                                                        <span className="text-xs text-gray-500">{emp.designation} • Age: {emp.age}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-900">{emp.phoneNo}</span>
                                                        <span className="text-xs text-gray-500 truncate max-w-xs" title={emp.address}>{emp.address}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {emp.aadharNo}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900">₹{emp.salaryAmount}</span>
                                                        <span className="text-xs text-gray-500">Date: {emp.salaryDate}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleOpenEditModal(emp)}
                                                            className="rounded-lg p-2 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(emp.id)}
                                                            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center">
                                                <Users className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                                                <h3 className="text-sm font-medium text-gray-900">No employees found</h3>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {searchQuery ? "Try adjusting your search query." : "Get started by adding a new employee."}
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card View (Visible only on small screens) */}
                    <div className="md:hidden space-y-4">
                        {filteredEmployees.length > 0 ? (
                            filteredEmployees.map((emp) => (
                                <div key={emp.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{emp.name}</h3>
                                            <p className="text-sm text-yellow-600 font-medium">{emp.designation}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleOpenEditModal(emp)} className="p-2 text-gray-400 hover:text-yellow-600"><Edit2 className="h-4 w-4" /></button>
                                            <button onClick={() => handleDeleteClick(emp.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                                        <div><span className="text-gray-500 text-xs block">Phone</span><span className="font-medium">{emp.phoneNo}</span></div>
                                        <div><span className="text-gray-500 text-xs block">Aadhar</span><span className="font-medium">{emp.aadharNo}</span></div>
                                        <div><span className="text-gray-500 text-xs block">Salary</span><span className="font-medium">₹{emp.salaryAmount}</span></div>
                                        <div><span className="text-gray-500 text-xs block">Salary Date</span><span className="font-medium">{emp.salaryDate}</span></div>
                                        <div className="col-span-2"><span className="text-gray-500 text-xs block">Address</span><span className="font-medium">{emp.address}</span></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-2xl py-12 text-center border-2 border-dashed border-gray-200">
                                <Users className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                                <h3 className="text-sm font-medium text-gray-900">No employees found</h3>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />

            {/* Employee Form Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all my-8">
                        <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                                {isEditing ? "Edit Employee" : "Add New Employee"}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEmployee} className="space-y-5">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Age</label>
                                    <input type="number" name="age" value={formData.age} onChange={handleInputChange}
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone Number *</label>
                                    <input type="tel" name="phoneNo" value={formData.phoneNo} onChange={handleInputChange} required
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Aadhar Number *</label>
                                    <input type="text" name="aadharNo" value={formData.aadharNo} onChange={handleInputChange} required
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Designation</label>
                                    <input type="text" name="designation" value={formData.designation} onChange={handleInputChange}
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Salary Amount</label>
                                    <input type="number" name="salaryAmount" value={formData.salaryAmount} onChange={handleInputChange}
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Salary Date</label>
                                    <input type="date" name="salaryDate" value={formData.salaryDate} onChange={handleInputChange}
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Address</label>
                                    <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2"
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"></textarea>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit"
                                    className="inline-flex items-center justify-center rounded-xl bg-yellow-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-yellow-500 active:scale-95">
                                    {isEditing ? "Update Employee" : "Save Employee"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                        <div className="mb-4 flex items-center justify-center mx-auto h-12 w-12 rounded-full bg-red-100">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-center text-lg font-bold text-gray-900 mb-2">Delete Employee</h3>
                        <p className="text-center text-sm text-gray-500 mb-6">
                            Are you sure you want to remove this employee? This action cannot be undone.
                        </p>

                        <div className="flex justify-center gap-3">
                            <button onClick={() => setDeleteConfirmId(null)}
                                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleConfirmDelete}
                                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-500 active:scale-95">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiteDetails;
