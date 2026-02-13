"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Material, CreateMaterialDto, MaterialSchema } from "@erp/shared";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

interface MaterialFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    material?: Material | null;
}

export default function MaterialFormModal({ isOpen, onClose, material }: MaterialFormModalProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [formData, setFormData] = useState<CreateMaterialDto>({
        name: "",
        unit: "UND",
        category: "OTROS",
        description: "",
        unitPrice: undefined
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";
    const categories = ["PRELIMINARES", "ESTRUCTURA", "ALBAÑILERIA", "ACABADOS", "INSTALACIONES", "EXTERIORES", "OTROS"];
    const units = ["UND", "M", "M2", "M3", "KG", "TON", "LT", "GL", "BLS", "PZA", "CJA", "JGO"];

    useEffect(() => {
        if (material) {
            setFormData({
                name: material.name,
                unit: material.unit,
                category: material.category as any,
                description: material.description || "",
                unitPrice: material.unitPrice
            });
        } else {
            setFormData({
                name: "",
                unit: "",
                category: "OTROS",
                description: "",
                unitPrice: undefined
            });
        }
        setErrors({});
    }, [material, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Validate with Zod
        const validation = MaterialSchema.safeParse(formData);
        if (!validation.success) {
            const newErrors: Record<string, string> = {};
            validation.error.errors.forEach(err => {
                if (err.path[0]) {
                    newErrors[err.path[0].toString()] = err.message;
                }
            });
            setErrors(newErrors);
            return;
        }

        setSubmitting(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`${API_URL}/materials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showToast(material ? 'Material actualizado exitosamente' : 'Material creado exitosamente', 'success');
                onClose();
            } else {
                const error = await res.json();
                showToast(`Error: ${error.message || 'No se pudo guardar'}`, 'error');
            }
        } catch (error) {
            console.error('Error saving material:', error);
            showToast('Error al guardar el material', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">
                            {material ? 'Editar Material' : 'Nuevo Material'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Complete los datos del material</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Nombre del Material *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="Ej: Cemento Portland Tipo I"
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Unidad de Medida *
                            </label>
                            <select
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent ${errors.unit ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                {units.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                ))}
                            </select>
                            {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Categoría *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Precio Unitario (opcional)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.unitPrice || ""}
                                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Ej: 25.50"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Descripción (opcional)
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Información adicional sobre el material"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Guardando...' : (material ? 'Actualizar' : 'Crear Material')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
