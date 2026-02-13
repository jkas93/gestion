"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, PackageCheck } from "lucide-react";
import { Material, MaterialRequestItem } from "@erp/shared";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

interface MaterialRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    supervisorId: string;
    onSubmit: (items: MaterialRequestItem[]) => Promise<void>;
}

type FormItem = {
    materialId: string;
    materialName?: string;
    quantity: number;
    notes?: string;
};

export default function MaterialRequestModal({
    isOpen,
    onClose,
    projectId,
    supervisorId,
    onSubmit
}: MaterialRequestModalProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [items, setItems] = useState<FormItem[]>([
        { materialId: "", quantity: 1, notes: "" }
    ]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    useEffect(() => {
        if (isOpen) {
            fetchMaterials();
        }
    }, [isOpen]);

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
            showToast("No se pudo cargar el catálogo de materiales", "error");
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setItems([...items, { materialId: "", quantity: 1, notes: "" }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof FormItem, value: any) => {
        const updated = [...items];
        const currentItem: FormItem = { ...updated[index] } as FormItem;

        // Update the field
        (currentItem as any)[field] = value;

        // If material changed, update materialName
        if (field === "materialId" && value) {
            const material = materials.find(m => m.id === value);
            if (material) {
                currentItem.materialName = material.name;
            }
        }

        updated[index] = currentItem;
        setItems(updated);
    };

    const handleSubmit = async () => {
        const validItems = items
            .filter(item => item.materialId && item.quantity > 0)
            .map(item => ({
                materialId: item.materialId,
                materialName: item.materialName,
                quantity: item.quantity,
                notes: item.notes
            } as MaterialRequestItem));

        if (validItems.length === 0) {
            showToast("Debe agregar al menos un material", "warning");
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit(validItems);
            // setItems logic moved to SupervisorDashboard handle success
            onClose();
        } catch (error) {
            console.error("Error submitting request:", error);
            // Error handling in SupervisorDashboard
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Solicitar Materiales</h2>
                        <p className="text-sm text-gray-500 mt-1">Complete los ítems necesarios para su proyecto</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Cargando catálogo...</div>
                    ) : (
                        items.map((item, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Ítem {index + 1}</span>
                                    {items.length > 1 && (
                                        <button
                                            onClick={() => removeItem(index)}
                                            className="p-1 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Material</label>
                                        <select
                                            value={item.materialId}
                                            onChange={(e) => updateItem(index, "materialId", e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {materials.map(material => (
                                                <option key={material.id} value={material.id}>
                                                    {material.name} ({material.unit})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Cantidad</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Notas (opcional)</label>
                                    <input
                                        type="text"
                                        value={item.notes || ""}
                                        onChange={(e) => updateItem(index, "notes", e.target.value)}
                                        placeholder="Ej: Urgente para mañana"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                            </div>
                        ))
                    )}

                    <button
                        onClick={addItem}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Agregar otro ítem
                    </button>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || loading}
                        className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? "Enviando..." : "Enviar Solicitud"}
                    </button>
                </div>
            </div>
        </div>
    );
}
