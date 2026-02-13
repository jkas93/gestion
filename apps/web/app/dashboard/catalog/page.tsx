"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserRole, ActivityMasterSchema, CreateActivityMasterDto } from "@erp/shared";
import { auth } from "@/lib/firebase/clientApp";
import { useToast } from "@/hooks/useToast";
import { Plus, Trash2, Search, Book, Clock } from "lucide-react";

export default function CatalogPage() {
    const { user, role } = useAuth();
    const { showToast } = useToast();
    const [activities, setActivities] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newActivity, setNewActivity] = useState<Partial<CreateActivityMasterDto>>({
        name: "",
        description: "",
        defaultDuration: 1,
        category: "OTROS"
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";
    const categories = ["PRELIMINARES", "ESTRUCTURA", "ALBAÑILERIA", "ACABADOS", "INSTALACIONES", "EXTERIORES", "OTROS"];

    useEffect(() => {
        if (user) fetchActivities();
    }, [user]);

    const fetchActivities = async () => {
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await fetch(`${API_URL}/activities`, {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (res.ok) {
                setActivities(await res.json());
            } else {
                showToast("Error al cargar el catálogo", "error");
            }
        } catch (error) {
            showToast("Error de conexión", "error");
        }
    };

    const handleCreateActivity = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = ActivityMasterSchema.safeParse(newActivity);
        if (!result.success) {
            showToast(result.error?.errors[0]?.message || "Error de validación", "warning");
            return;
        }

        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await fetch(`${API_URL}/activities`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(newActivity),
            });

            if (res.ok) {
                showToast("Actividad agregada al catálogo", "success");
                setIsModalOpen(false);
                setNewActivity({ name: "", description: "", defaultDuration: 1, category: "OTROS" });
                fetchActivities();
            } else {
                const data = await res.json();
                showToast(data.message || "Error al crear actividad", "error");
            }
        } catch (error) {
            showToast("Fallo en el servidor", "error");
        }
    };

    const handleDeleteActivity = async (id: string) => {
        if (!confirm("¿Eliminar esta actividad del catálogo?")) return;
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await fetch(`${API_URL}/activities/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (res.ok) {
                showToast("Actividad eliminada", "info");
                fetchActivities();
            }
        } catch (error) {
            showToast("Error al eliminar", "error");
        }
    };

    const filteredActivities = activities.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-border/60 pb-8">
                <div>
                    <h1 className="text-4xl font-extrabold mb-2 tracking-tight text-gray-900">Catálogo <span className="text-primary">Maestro</span></h1>
                    <p className="text-gray-500 font-medium">Define actividades estándar para tus cronogramas.</p>
                </div>
                {(role === UserRole.GERENTE || role === UserRole.PMO) && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Actividad
                    </button>
                )}
            </header>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar actividad o categoría..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-5 py-3 outline-none focus:ring-2 focus:ring-primary transition-all font-medium text-gray-900 placeholder:text-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActivities.map((activity) => (
                    <div key={activity.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 relative group overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(role === UserRole.GERENTE || role === UserRole.PMO) && (
                                <button onClick={() => handleDeleteActivity(activity.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                <Book className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activity.category}</span>
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors uppercase tracking-tight">{activity.name}</h3>
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed">{activity.description || "Sin descripción adicional."}</p>

                        <div className="flex items-center gap-2 pt-4 border-t border-gray-100 text-xs font-bold text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            Duración Estimada: <span className="text-blue-600">{activity.defaultDuration} días</span>
                        </div>
                    </div>
                ))}
            </div>

            {filteredActivities.length === 0 && (
                <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No se encontraron actividades</p>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-xl text-primary"><Book className="w-6 h-6" /></div>
                            <h2 className="text-3xl font-extrabold uppercase tracking-tight text-gray-900">Nueva Actividad</h2>
                        </div>
                        <p className="text-gray-500 text-sm mb-10 font-medium ml-1">Estandariza los parámetros de esta actividad.</p>

                        <form onSubmit={handleCreateActivity} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Nombre de Actividad</label>
                                    <input
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                        placeholder="Ej. Excavación Masiva"
                                        value={newActivity.name}
                                        onChange={e => setNewActivity({ ...newActivity, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Categoría</label>
                                    <select
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary transition-all font-medium appearance-none text-gray-900 cursor-pointer"
                                        value={newActivity.category}
                                        onChange={e => setNewActivity({ ...newActivity, category: e.target.value as any })}
                                    >
                                        {categories.map(cat => <option key={cat} value={cat} className="bg-white text-gray-900">{cat}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Duración Sugerida (Días)</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary transition-all font-medium font-mono text-gray-900 placeholder:text-gray-400"
                                            value={newActivity.defaultDuration}
                                            onChange={e => setNewActivity({ ...newActivity, defaultDuration: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Descripción / Alcance</label>
                                    <textarea
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary transition-all font-medium resize-none text-gray-900 placeholder:text-gray-400"
                                        rows={3}
                                        placeholder="Define qué incluye esta actividad..."
                                        value={newActivity.description}
                                        onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-gray-500 hover:text-gray-900 font-bold transition-all text-xs uppercase tracking-widest">Cerrar</button>
                                <button type="submit" className="flex-[2] btn-primary py-4 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20">Guardar en Catálogo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
