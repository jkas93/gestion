"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserRole, Purchase } from "@erp/shared";
import { auth } from "@/lib/firebase/clientApp";
import { useToast } from "@/hooks/useToast";
import {
    CircleDollarSign,
    Plus,
    Search,
    Filter,
    TrendingUp,
    Package,
    Clock,
    CheckCircle2,
    AlertCircle
} from "lucide-react";

export default function FinancePage() {
    const { user, role } = useAuth();
    const { showToast } = useToast();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProject, setSelectedProject] = useState("all");

    // Form
    const [newPurchase, setNewPurchase] = useState({
        projectId: "",
        taskId: "",
        description: "",
        provider: "",
        amount: "",
        currency: "PEN",
        status: "PENDIENTE",
        date: new Date().toISOString().split('T')[0]
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    useEffect(() => {
        if (user) {
            fetchPurchases();
            fetchProjects();
        }
    }, [user]);

    const fetchPurchases = async () => {
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await fetch(`${API_URL}/finance/purchases`, {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (res.ok) setPurchases(await res.json());
        } catch (error) {
            showToast("Error al cargar historial de compras", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await fetch(`${API_URL}/projects`, {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (res.ok) setProjects(await res.json());
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreatePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await fetch(`${API_URL}/finance/purchases`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    ...newPurchase,
                    amount: Number(newPurchase.amount)
                }),
            });

            if (res.ok) {
                showToast("Orden de compra registrada", "success");
                setIsModalOpen(false);
                setNewPurchase({
                    projectId: "",
                    taskId: "",
                    description: "",
                    provider: "",
                    amount: "",
                    currency: "PEN",
                    status: "PENDIENTE",
                    date: new Date().toISOString().split('T')[0]
                });
                fetchPurchases();
            }
        } catch (error) {
            showToast("Error al registrar compra", "error");
        }
    };

    const filteredPurchases = purchases.filter(p => {
        const matchesSearch = p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.provider.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesProject = selectedProject === "all" || p.projectId === selectedProject;
        return matchesSearch && matchesProject;
    });

    const totalSpent = filteredPurchases.reduce((sum, p) => sum + Number(p.amount), 0);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'RECIBIDO': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'APROBADO': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'PAGADO': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default: return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-border/60 pb-8">
                <div>
                    <h1 className="text-4xl font-extrabold mb-2 tracking-tight text-gray-900">Control <span className="text-primary">Financiero</span></h1>
                    <p className="text-gray-500 font-medium italic">Gestión de compras, órdenes y flujo de caja por proyecto.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-6 py-3 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-sm">
                        <div className="p-2 bg-emerald-50 rounded-xl">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ejecución Total</p>
                            <p className="text-xl font-mono font-bold text-gray-900">${totalSpent.toLocaleString()}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center gap-2 h-fit self-center shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-5 h-5" /> Nueva Compra
                    </button>
                </div>
            </header>

            {/* Filters bar */}
            <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar descripción o proveedor..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-medium text-gray-900 placeholder:text-gray-400"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none text-sm font-bold uppercase tracking-tighter text-gray-600 focus:ring-2 focus:ring-primary"
                        value={selectedProject}
                        onChange={e => setSelectedProject(e.target.value)}
                    >
                        <option value="all" className="bg-white">Todos los Proyectos</option>
                        {projects.map(p => <option key={p.id} value={p.id} className="bg-white">{p.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Main Table Container */}
            <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl">
                <table className="premium-table w-full">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha / Proyecto</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Descripción</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Proveedor</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                            <th className="text-right py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredPurchases.map((p, i) => (
                            <tr key={i} className="group hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">{p.date}</span>
                                        <span className="font-bold text-gray-700 text-xs uppercase tracking-tighter">
                                            {projects.find(proj => proj.id === p.projectId)?.name || 'Cargando...'}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors text-purple-600">
                                            <Package className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold tracking-tight text-gray-900">{p.description}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-gray-500 text-sm font-medium italic">{p.provider}</td>
                                <td className="py-4 px-6">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-widest ${p.status === 'RECIBIDO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            p.status === 'APROBADO' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                p.status === 'PAGADO' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-right font-mono text-gray-900 font-bold text-lg">
                                    <span className="text-xs text-gray-400 mr-2">{p.currency}</span>
                                    ${p.amount.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredPurchases.length === 0 && !isLoading && (
                    <div className="py-32 text-center text-gray-400 font-bold uppercase tracking-widest text-xs flex flex-col items-center gap-4">
                        <AlertCircle className="w-12 h-12 text-gray-300" />
                        No se detectan movimientos financieros con estos criterios
                    </div>
                )}

                {isLoading && (
                    <div className="py-32 text-center text-primary animate-pulse font-bold uppercase tracking-widest text-xs">
                        Auditando registros financieros...
                    </div>
                )}
            </div>

            {/* Create Purchase Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 border border-blue-50 shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <Plus className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Nueva Orden</h2>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Contabilización de Gasto en Proyecto</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreatePurchase} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Asignar Proyecto</label>
                                    <select
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 font-medium appearance-none"
                                        value={newPurchase.projectId}
                                        onChange={e => setNewPurchase({ ...newPurchase, projectId: e.target.value })}
                                        required
                                    >
                                        <option value="" className="bg-white text-gray-500">Seleccionar Obra...</option>
                                        {projects.map(p => <option key={p.id} value={p.id} className="bg-white text-gray-900">{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Fecha de Gasto</label>
                                    <input type="date" required className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-primary font-medium" value={newPurchase.date} onChange={e => setNewPurchase({ ...newPurchase, date: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Descripción del Item</label>
                                <input placeholder="Ej. 100 bolsas de cemento Portland" required className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary transition-all font-medium text-gray-900 placeholder:text-gray-400" value={newPurchase.description} onChange={e => setNewPurchase({ ...newPurchase, description: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Proveedor</label>
                                    <input placeholder="Razón Social" required className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary transition-all font-medium text-gray-900 placeholder:text-gray-400" value={newPurchase.provider} onChange={e => setNewPurchase({ ...newPurchase, provider: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Monto Total</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gray-400">S/</span>
                                        <input type="number" placeholder="0.00" step="0.01" required className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-2 focus:ring-primary transition-all font-mono font-bold text-gray-900 text-lg placeholder:text-gray-400" value={newPurchase.amount} onChange={e => setNewPurchase({ ...newPurchase, amount: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-10">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-gray-500 hover:text-gray-900 font-bold transition-all text-xs uppercase tracking-widest">Abandonar</button>
                                <button type="submit" className="flex-[2] btn-primary py-5 text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20">Registrar Contablemente</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
