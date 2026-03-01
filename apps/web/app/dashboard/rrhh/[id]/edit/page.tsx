"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase/clientApp";
import { useToast } from "@/hooks/useToast";
import { ArrowLeft, Save } from "lucide-react";
import { UserRole } from "@erp/shared";

export default function EmployeeEditPage() {
    const { user, role } = useAuth();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const isCreating = searchParams.get('create') === 'true';

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: UserRole.ASISTENTE,
        phone: "",
        dni: "",
        salary: "",
        hireDate: "",
        address: "",
        // New fields
        birthDate: "",
        contractStart: "",
        contractEnd: "",
        pensionSystem: "AFP" as "AFP" | "SNP",
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    useEffect(() => {
        if (user && params.id) {
            if (!isCreating) {
                fetchEmployee();
            } else {
                setLoading(false);
            }
        } else if (!user) {
            router.push("/login");
        }
    }, [user, params.id, router, isCreating]);

    const fetchEmployee = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            const idToken = await currentUser.getIdToken();
            const res = await fetch(`${API_URL}/rrhh/employees/${params.id}`, {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    name: data.name || "",
                    email: data.email || "",
                    role: data.role || UserRole.ASISTENTE,
                    phone: data.phone || "",
                    dni: data.dni || "",
                    salary: data.salary || "",
                    hireDate: data.hireDate || "",
                    address: data.address || "",
                    birthDate: data.birthDate || "",
                    contractStart: data.contractStart || "",
                    contractEnd: data.contractEnd || "",
                    pensionSystem: data.pensionSystem || "AFP",
                });
            } else {
                showToast("Empleado no encontrado", "error");
                router.push("/dashboard/rrhh");
            }
        } catch (error) {
            showToast("Error al cargar empleado", "error");
        } finally {
            setLoading(false);
        }
    };

    const checkUniqueness = async (field: 'dni', value: string) => {
        if (!value) return;
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await fetch(`${API_URL}/rrhh/check-existence?${field}=${value}`, {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (res.ok) {
                const data = await res.json();
                // Si existe y no es el mismo ID que estamos editando
                if (data.exists && data.id !== params.id) {
                    showToast(`Este ${data.field} ya está registrado por ${data.name}`, "error");
                }
            }
        } catch (error) {
            console.error("Error checking uniqueness:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            const idToken = await currentUser.getIdToken();

            // Convertir salary a número
            const payload = {
                ...formData,
                salary: formData.salary ? parseFloat(formData.salary.toString()) : null,
            };

            const res = await fetch(`${API_URL}/rrhh/employees/${params.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                showToast("Empleado actualizado exitosamente", "success");
                router.push(`/dashboard/rrhh/${params.id}`);
            } else {
                const err = await res.json();
                showToast(err.message || "Error al actualizar empleado", "error");
            }
        } catch (error: any) {
            showToast(error.message || "Error al guardar cambios", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push("/dashboard/rrhh")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tighter text-gray-900">
                        {isCreating ? 'Crear Ficha Laboral' : 'Editar Empleado'}
                    </h1>
                    <p className="text-gray-500 font-medium">
                        {isCreating ? 'Complete la información laboral del empleado' : 'Actualizar información del empleado'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-8 border border-border/50 shadow-xl bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Nombre Completo
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 font-medium"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            readOnly
                            disabled
                            className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-4 outline-none text-gray-500 font-medium cursor-not-allowed opacity-70"
                            value={formData.email}
                            title="El correo no se puede modificar"
                        />
                        <p className="text-[10px] text-red-400 mt-1 font-bold ml-2">⚠️ Campo bloqueado por seguridad</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            DNI
                        </label>
                        <input
                            type="text"
                            maxLength={8}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 font-medium"
                            value={formData.dni}
                            onChange={(e) => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '') })}
                            onBlur={(e) => checkUniqueness('dni', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Fecha de Nacimiento
                        </label>
                        <input
                            type="date"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 font-medium"
                            value={formData.birthDate || ''}
                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 font-medium"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Posición
                        </label>
                        <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 font-medium"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        >
                            {Object.values(UserRole).map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Salario (S/)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 font-medium"
                            value={formData.salary}
                            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Sistema de Pensiones
                        </label>
                        <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 font-medium"
                            value={formData.pensionSystem || 'AFP'}
                            onChange={(e) => setFormData({ ...formData, pensionSystem: e.target.value as any })}
                        >
                            <option value="AFP">AFP</option>
                            <option value="SNP">SNP</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Inicio de Contrato
                        </label>
                        <input
                            type="date"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 font-medium"
                            value={formData.contractStart || ''} // Use contractStart, mapping needed in state
                            onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Fin de Contrato
                        </label>
                        <input
                            type="date"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 font-medium"
                            value={formData.contractEnd || ''}
                            onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Dirección
                        </label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 font-medium"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard/rrhh")}
                        className="px-8 py-4 text-gray-500 hover:text-gray-900 font-bold transition-all text-sm uppercase tracking-widest"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary px-8 flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
}
