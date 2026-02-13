"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole, EmployeeSchema } from "@erp/shared";
import { auth } from "@/lib/firebase/clientApp";
import { useToast } from "@/hooks/useToast";
import {
    ChevronLeft,
    User,
    Briefcase,
    CreditCard,
    Calendar,
    Mail,
    Shield,
    Save,
    ArrowRight
} from "lucide-react";

export default function NewEmployeePage() {
    const router = useRouter();
    const { role } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        lastName: "",
        dni: "",
        email: "",
        birthDate: "",
        contractStart: "",
        contractEnd: "",
        salary: "",
        pensionSystem: "AFP" as "AFP" | "SNP",
        role: UserRole.SUPERVISOR
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const validation = EmployeeSchema.safeParse({
            ...formData,
            salary: Number(formData.salary)
        });

        if (!validation.success) {
            showToast(validation.error?.errors[0]?.message || "Error de validación", "warning");
            setLoading(false);
            return;
        }

        try {
            const idToken = await auth.currentUser?.getIdToken();

            // 1. Invite to ERP (Auth + Users Profile)
            const inviteRes = await fetch(`${API_URL}/users/invite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    email: formData.email,
                    name: `${formData.name} ${formData.lastName}`,
                    role: formData.role
                }),
            });

            if (!inviteRes.ok) {
                const err = await inviteRes.json();
                throw new Error(err.message || "Error al crear cuenta de acceso");
            }

            const { uid, resetLink } = await inviteRes.json();

            // 2. Register complete Employee data
            const employeeRes = await fetch(`${API_URL}/rrhh/employees`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    ...formData,
                    id: uid, // Linked to Auth
                    salary: Number(formData.salary)
                }),
            });

            if (employeeRes.ok) {
                showToast("Colaborador registrado exitosamente", "success");
                console.log("Link de bienvenida:", resetLink);
                router.push("/dashboard/rrhh");
            }
        } catch (error: any) {
            showToast(error.message || "Error en el registro", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-900"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-gray-900 uppercase">
                        Nuevo <span className="text-primary">Colaborador</span>
                    </h1>
                    <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px] mt-1">Registro maestro de personal y accesos</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                {/* Left Column: Personal Data */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="glass-card p-10 rounded-[2.5rem] border border-gray-100 shadow-xl bg-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <User className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tighter">Información Personal</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Nombres</label>
                                <input
                                    required
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej. Juan"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Apellidos</label>
                                <input
                                    required
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900"
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    placeholder="Ej. Pérez García"
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Documento (DNI/CE)</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input
                                        required
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-14 pr-6 py-4 outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900"
                                        value={formData.dni}
                                        onChange={e => setFormData({ ...formData, dni: e.target.value })}
                                        placeholder="00000000"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Fecha de Nacimiento</label>
                                <div className="relative">
                                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                                    <input
                                        type="date"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-14 pr-6 py-4 outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-gray-900"
                                        value={formData.birthDate}
                                        onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="glass-card p-10 rounded-[2.5rem] border border-gray-100 shadow-xl bg-white">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tighter">Condiciones Laborales</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Inicio de Contrato</label>
                                <input
                                    required
                                    type="date"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-gray-900"
                                    value={formData.contractStart}
                                    onChange={e => setFormData({ ...formData, contractStart: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Fin de Contrato (Opcional)</label>
                                <input
                                    type="date"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-gray-900"
                                    value={formData.contractEnd}
                                    onChange={e => setFormData({ ...formData, contractEnd: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Sueldo Mensual</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-gray-400">S/</span>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-14 pr-6 py-4 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-gray-900"
                                        value={formData.salary}
                                        onChange={e => setFormData({ ...formData, salary: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Sistema de Pensiones</label>
                                <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                                    {(['AFP', 'SNP'] as const).map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, pensionSystem: type })}
                                            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${formData.pensionSystem === type ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' : 'text-gray-400'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: ERP Access */}
                <div className="space-y-8">
                    <section className="glass-card p-10 rounded-[2.5rem] border border-gray-100 shadow-xl bg-gradient-to-br from-gray-900 to-black text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-primary">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold uppercase tracking-tighter">Acceso al ERP</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Correo Institucional</label>
                                <div className="relative">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                    <input
                                        required
                                        type="email"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-white placeholder:text-gray-600"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="usuario@goldentower.pe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Rol Jerárquico</label>
                                <select
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-white appearance-none cursor-pointer"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                >
                                    {Object.values(UserRole).map(r => (
                                        <option key={r} value={r} className="bg-gray-900 text-white">{r}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[10px] text-gray-400 leading-relaxed">
                                    Al completar este registro, se enviará automáticamente un correo de bienvenida al colaborador con sus credenciales provisionales.
                                </p>
                            </div>
                        </div>
                    </section>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-6 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 group transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="animate-pulse">Procesando Alta...</span>
                        ) : (
                            <>
                                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Finalizar Registro
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
