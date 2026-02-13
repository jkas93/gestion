"use client";

import { useState, useEffect } from "react";
import { Material } from "@erp/shared";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import MaterialFormModal from "./MaterialFormModal";
import { useAuth } from "@/hooks/useAuth";

interface MaterialCatalogProps {
    canManage: boolean;
}

export default function MaterialCatalog({ canManage }: MaterialCatalogProps) {
    const { user } = useAuth();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
    const [showModal, setShowModal] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    const categories = ["PRELIMINARES", "ESTRUCTURA", "ALBAÑILERIA", "ACABADOS", "INSTALACIONES", "EXTERIORES", "OTROS"];

    useEffect(() => {
        fetchMaterials();
    }, []);

    useEffect(() => {
        let filtered = materials;

        if (searchTerm) {
            filtered = filtered.filter(m =>
                m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (categoryFilter !== "ALL") {
            filtered = filtered.filter(m => m.category === categoryFilter);
        }

        setFilteredMaterials(filtered);
    }, [materials, searchTerm, categoryFilter]);

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`${API_URL}/materials`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setMaterials(data);
            }
        } catch (error) {
            console.error("Error fetching materials:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingMaterial(null);
        setShowModal(true);
    };

    const handleEdit = (material: Material) => {
        setEditingMaterial(material);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingMaterial(null);
        fetchMaterials();
    };

    if (loading) {
        return <div className="text-center py-12 text-gray-500">Cargando catálogo...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar materiales..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                    <option value="ALL">Todas las categorías</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                {canManage && (
                    <button
                        onClick={handleCreate}
                        className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Material
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Unidad</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                                {canManage && (
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredMaterials.length === 0 ? (
                                <tr>
                                    <td colSpan={canManage ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                                        No se encontraron materiales
                                    </td>
                                </tr>
                            ) : (
                                filteredMaterials.map((material) => (
                                    <tr key={material.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{material.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold">
                                                {material.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{material.unit}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {material.unitPrice ? `S/ ${material.unitPrice.toFixed(2)}` : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{material.description || "-"}</td>
                                        {canManage && (
                                            <td className="px-6 py-4 text-right text-sm">
                                                <button
                                                    onClick={() => handleEdit(material)}
                                                    className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors inline-flex items-center gap-1"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <MaterialFormModal
                    isOpen={showModal}
                    onClose={handleModalClose}
                    material={editingMaterial}
                />
            )}
        </div>
    );
}
