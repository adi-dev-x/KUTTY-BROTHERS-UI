import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import { database } from "../../firebase";
import { ref, push, set, onValue, update, remove } from "firebase/database";
import { Building, Plus, Edit2, Check, X, Trash2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const Sites = ({ onLogout }) => {
    const [sites, setSites] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newSiteName, setNewSiteName] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editSiteName, setEditSiteName] = useState("");
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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

    const handleAddSite = async (e) => {
        e.preventDefault();
        if (!newSiteName.trim()) return;

        try {
            const sitesRef = ref(database, "sites");
            const newSiteRef = push(sitesRef);
            await set(newSiteRef, {
                name: newSiteName,
                createdAt: new Date().toISOString(),
            });
            setNewSiteName("");
            setShowModal(false);
        } catch (error) {
            console.error("Error adding site:", error);
            alert("Failed to add site");
        }
    };

    const handleEditClick = (site) => {
        setEditingId(site.id);
        setEditSiteName(site.name);
    };

    const handleSaveEdit = async (id) => {
        if (!editSiteName.trim()) return;

        try {
            const siteRef = ref(database, `sites/${id}`);
            await update(siteRef, {
                name: editSiteName,
                updatedAt: new Date().toISOString()
            });
            setEditingId(null);
            setEditSiteName("");
        } catch (error) {
            console.error("Error updating site:", error);
            alert("Failed to update site");
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditSiteName("");
    };

    const handleDeleteClick = (id) => {
        setDeleteConfirmId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmId) return;

        try {
            const siteRef = ref(database, `sites/${deleteConfirmId}`);
            await remove(siteRef);
            setDeleteConfirmId(null);
        } catch (error) {
            console.error("Error deleting site:", error);
            alert("Failed to delete site");
        }
    };

    const handleCancelDelete = () => {
        setDeleteConfirmId(null);
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
            <Header onLogout={onLogout} />

            <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Building className="h-8 w-8 text-yellow-600" />
                                Sites Management
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Manage your construction sites and locations.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 active:scale-95"
                        >
                            <Plus className="h-5 w-5" />
                            Add Site
                        </button>
                    </div>

                    {/* Sites Grid */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {sites.map((site) => (
                            <Link
                                key={site.id}
                                to={`/sites/${site.id}`}
                                className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-gray-100 block"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="rounded-lg bg-yellow-50 p-2 text-yellow-600">
                                                <Building className="h-5 w-5" />
                                            </div>
                                            {editingId === site.id ? (
                                                <div className="flex-1 flex items-center gap-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                                    <input
                                                        type="text"
                                                        value={editSiteName}
                                                        onChange={(e) => setEditSiteName(e.target.value)}
                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2 border"
                                                        autoFocus
                                                    />
                                                </div>
                                            ) : (
                                                <h3 className="truncate text-lg font-bold text-gray-900" title={site.name}>
                                                    {site.name}
                                                </h3>
                                            )}
                                        </div>
                                        {!editingId || editingId !== site.id ? (
                                            <p className="text-xs text-gray-500">
                                                Added on {new Date(site.createdAt).toLocaleDateString()}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 rounded-full bg-yellow-50 opacity-50 blur-2xl group-hover:bg-yellow-100 transition-colors duration-500"></div>

                                <div className="absolute bottom-4 right-4 flex items-center gap-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                    {editingId === site.id ? (
                                        <>
                                            <button
                                                onClick={() => handleSaveEdit(site.id)}
                                                className="rounded p-1.5 text-green-600 hover:bg-green-50 z-10 relative transition-colors"
                                                title="Save"
                                            >
                                                <Check className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="rounded p-1.5 text-red-600 hover:bg-red-50 z-10 relative transition-colors"
                                                title="Cancel"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleEditClick(site)}
                                                className="rounded p-1.5 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-gray-100 z-10 relative hover:text-gray-900"
                                                title="Edit site"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(site.id)}
                                                className="rounded p-1.5 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 z-10 relative hover:text-red-600"
                                                title="Delete site"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </Link>
                        ))}

                        {sites.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-12 text-center h-48">
                                <Building className="h-12 w-12 text-gray-300 mb-4" />
                                <h3 className="text-sm font-medium text-gray-900">No sites found</h3>
                                <p className="mt-1 text-sm text-gray-500">Get started by creating a new site.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />

            {/* Add Site Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Add New Site</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddSite}>
                            <div className="mb-6">
                                <label
                                    htmlFor="siteName"
                                    className="mb-2 block text-sm font-medium text-gray-900"
                                >
                                    Site Name
                                </label>
                                <input
                                    type="text"
                                    id="siteName"
                                    value={newSiteName}
                                    onChange={(e) => setNewSiteName(e.target.value)}
                                    placeholder="Enter site name"
                                    className="block w-full rounded-xl border border-gray-300 p-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 sm:text-sm transition-all"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newSiteName.trim()}
                                    className="inline-flex items-center justify-center rounded-xl bg-yellow-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save Site
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
                        <h3 className="text-center text-lg font-bold text-gray-900 mb-2">Delete Site</h3>
                        <p className="text-center text-sm text-gray-500 mb-6">
                            Are you sure you want to delete this site? This action cannot be undone.
                        </p>

                        <div className="flex justify-center gap-3">
                            <button
                                onClick={handleCancelDelete}
                                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sites;
