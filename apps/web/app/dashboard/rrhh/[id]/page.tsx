"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import { auth } from "@/lib/firebase/clientApp";
import { useToast } from "@/hooks/useToast";
import {
    ArrowLeft, User, Mail, Phone, Calendar,
    DollarSign, FileText, Briefcase, MapPin,
    ShieldCheck, CreditCard, Clock, ChevronRight,
    Edit, Download, Send
} from "lucide-react";

type TabType = 'resumen' | 'personal' | 'laboral' | 'documentos';

export default function EmployeeDetailPage() {
    const { user, role } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { showToast } = useToast();
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('resumen');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    useEffect(() => {
        if (user && params.id) {
            fetchEmployee();
        } else if (!user) {
            router.push("/login");
        }
    }, [user, params.id, router]);

    const fetchEmployee = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            const idToken = await currentUser.getIdToken();
            const res = await fetch(`${API_URL}/rrhh/employees/${params.id}`, {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (res.ok) {
                setEmployee(await res.json());
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <div className="mt-4 text-xs font-bold uppercase tracking-widest text-primary animate-pulse text-center">Cargando</div>
                </div>
            </div>
        );
    }

    if (!employee) return null;

    const initials = employee.name ? employee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : '??';

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Navigation & Actions */}
            <div className="flex justify-between items-center">
                <button
                    onClick={() => router.push("/dashboard/rrhh")}
                    className="group flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest"
                >
                    <div className="p-2 bg-white rounded-xl border border-border shadow-sm group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    Volver al listado
                </button>
                <div className="flex gap-3">
                    <button className="p-2.5 bg-white border border-border rounded-xl text-gray-500 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
                        <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2.5 bg-white border border-border rounded-xl text-gray-500 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
                        <Send className="w-4 h-4" />
                    </button>
                    {(role === 'GERENTE' || role === 'RRHH') && (
                        <button
                            onClick={() => router.push(`/dashboard/rrhh/${params.id}/edit`)}
                            className="btn-primary flex items-center gap-2 text-xs"
                        >
                            <Edit className="w-4 h-4" /> Editar Perfil
                        </button>
                    )}
                </div>
            </div>

            {/* Profile Header Card */}
            <div className="relative overflow-hidden group">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-white to-primary/5 z-0 pointer-events-none"></div>

                <div className="glass-card rounded-[2.5rem] p-10 relative z-10 border-white/50 shadow-2xl overflow-hidden bg-white/40">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                        {/* Avatar Layer */}
                        <div className="relative">
                            <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-4xl font-black text-white shadow-2xl ring-8 ring-white">
                                {initials}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-lg" title="Empleado Activo">
                                <ShieldCheck className="w-4 h-4 text-white" />
                            </div>
                        </div>

                        {/* Text Group */}
                        <div className="flex-1 space-y-3">
                            <div>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-1">
                                    {employee.name}
                                </h1>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                        {employee.role || 'Colaborador'}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${employee.status === 'ACTIVO'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : 'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                        {employee.status || 'Estado Desconocido'}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 text-sm text-gray-500 font-medium">
                                <div className="flex items-center gap-2 justify-center md:justify-start">
                                    <Mail className="w-4 h-4 text-primary" /> {employee.email}
                                </div>
                                <div className="flex items-center gap-2 justify-center md:justify-start">
                                    <Clock className="w-4 h-4 text-primary" /> Ingresó el {employee.contractStart || 'N/A'}
                                </div>
                                <div className="flex items-center gap-2 justify-center md:justify-start sm:col-span-2">
                                    <MapPin className="w-4 h-4 text-primary" /> {employee.address || 'Sin dirección registrada'}
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Block */}
                        <div className="hidden lg:flex flex-col justify-center items-end border-l border-border/50 pl-8 gap-4">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Remuneración Mensual</p>
                                <p className="text-3xl font-black text-primary tracking-tighter">S/ {employee.salary?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Navigation Tabs */}
            <div className="flex border-b border-border/60 gap-8 overflow-x-auto no-scrollbar">
                {(['resumen', 'personal', 'laboral', 'documentos'] as TabType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Content Switcher */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <main className="lg:col-span-8 space-y-8">
                    {activeTab === 'resumen' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in slide-in-from-right-2 duration-500">
                            <div className="glass-card p-6 rounded-3xl space-y-4 hover:shadow-xl hover:translate-y-[-4px] transition-all">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Briefcase className="w-5 h-5 text-blue-600" /></div>
                                <div>
                                    <h3 className="font-bold text-gray-900 leading-tight">Perfil de Puesto</h3>
                                    <p className="text-sm text-gray-500">{employee.role} - Departamento Administrativo</p>
                                </div>
                                <div className="pt-4 border-t border-border/40 flex justify-between items-center text-xs text-gray-400 font-bold uppercase">
                                    <span>Evolución</span>
                                    <span className="text-emerald-500">+12% vs año anterior</span>
                                </div>
                            </div>
                            <div className="glass-card p-6 rounded-3xl space-y-4 hover:shadow-xl hover:translate-y-[-4px] transition-all">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><CreditCard className="w-5 h-5 text-amber-600" /></div>
                                <div>
                                    <h3 className="font-bold text-gray-900 leading-tight">Sistema de Pensiones</h3>
                                    <p className="text-sm text-gray-500">{employee.pensionSystem || 'AFP Prima'}</p>
                                </div>
                                <div className="pt-4 border-t border-border/40 flex justify-between items-center text-xs text-gray-400 font-bold uppercase">
                                    <span>Aportes</span>
                                    <span className="text-blue-500">Al día</span>
                                </div>
                            </div>
                            <div className="col-span-1 sm:col-span-2 glass-card p-8 rounded-3xl space-y-6 bg-white shadow-sm border-gray-100">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-black text-gray-900 uppercase tracking-tighter">Últimos Documentos</h3>
                                    <ChevronRight className="w-5 h-5 text-gray-300" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors border border-transparent hover:border-border cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm"><FileText className="w-5 h-5 text-blue-500" /></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900">Contrato_Laboral_{employee.name.replace(' ', '_')}.pdf</p>
                                            <p className="text-xs text-gray-400">Firmado digitalmente • 12 Feb 2026</p>
                                        </div>
                                        <Download className="w-4 h-4 text-gray-300" />
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors border border-transparent hover:border-border cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm"><FileText className="w-5 h-5 text-emerald-500" /></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900">Boleta_Pago_Enero_2026.pdf</p>
                                            <p className="text-xs text-gray-400">Sueldo neto • 30 Ene 2026</p>
                                        </div>
                                        <Download className="w-4 h-4 text-gray-300" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'personal' && (
                        <div className="glass-card p-10 rounded-[2.5rem] bg-white animate-in slide-in-from-right-2 duration-500">
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                Datos de Identidad
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                {[
                                    { label: 'Documento de Identidad (DNI)', value: employee.dni, icon: FileText, color: 'blue' },
                                    { label: 'Correo Electrónico', value: employee.email, icon: Mail, color: 'purple' },
                                    { label: 'Número Telefónico', value: employee.phone, icon: Phone, color: 'emerald' },
                                    { label: 'Fecha de Nacimiento', value: employee.birthDate, icon: Calendar, color: 'pink' },
                                    { label: 'Domicilio Actual', value: employee.address, icon: MapPin, color: 'cyan', span: true },
                                ].map((item, i) => (
                                    <div key={i} className={`space-y-2 ${item.span ? 'md:col-span-2' : ''}`}>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                                        <div className="flex items-center gap-3">
                                            <item.icon className={`w-4 h-4 text-${item.color}-500`} />
                                            <p className="text-lg font-bold text-gray-900">{item.value || 'No registrado'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'laboral' && (
                        <div className="glass-card p-10 rounded-[2.5rem] bg-white animate-in slide-in-from-right-2 duration-500">
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                Histórico y Contratación
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Condición Laboral</p>
                                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                            <DollarSign className="w-6 h-6 text-emerald-600" />
                                            <div>
                                                <p className="text-2xl font-black text-emerald-700 leading-tight">S/ {employee.salary?.toLocaleString()}</p>
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase">Sueldo Base Mensual</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pensión y Seguridad</p>
                                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                                            <ShieldCheck className="w-6 h-6 text-blue-600" />
                                            <div>
                                                <p className="text-lg font-bold text-blue-800">{employee.pensionSystem || 'Seguro Social'}</p>
                                                <p className="text-[10px] font-bold text-blue-600 uppercase">Aseguradora Vigente</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inicio de Labores</p>
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-5 h-5 text-gray-400" />
                                            <p className="text-lg font-bold text-gray-900">{employee.contractStart || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cese / Término de Contrato</p>
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-5 h-5 text-gray-400" />
                                            <p className="text-lg font-bold text-gray-900">{employee.contractEnd || 'Indefinido / Permanente'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiempo en Compañía</p>
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-gray-400" />
                                            <p className="text-lg font-bold text-gray-900">1 año, 2 meses</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'documentos' && (
                        <div className="glass-card p-10 rounded-[2.5rem] bg-white text-center py-20 animate-in slide-in-from-right-2 duration-500">
                            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                <FileText className="w-10 h-10 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">Archivo Digital</h3>
                            <p className="text-sm text-gray-400 max-w-xs mx-auto mb-8 font-medium">Todos los documentos legales y administrativos centralizados en un solo lugar.</p>
                            <button className="btn-secondary text-xs">Cargar nuevo documento</button>
                        </div>
                    )}
                </main>

                <aside className="lg:col-span-4 space-y-8">
                    {/* Notes / Action Card */}
                    <div className="glass-card p-8 rounded-[2.5rem] bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-6 opacity-60">Acciones Directas</h4>
                        <div className="space-y-4">
                            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 group">
                                <span className="text-xs font-bold">Generar Certificado</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 group">
                                <span className="text-xs font-bold">Reportar Incidencia</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 group text-red-400">
                                <span className="text-xs font-bold">Rescindir Contrato</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Progress Completeness */}
                    <div className="glass-card p-8 rounded-[2.5rem] bg-white border-gray-100 shadow-sm border space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ficha de Empleado</h4>
                            <span className="text-xs font-bold text-primary">85% Completa</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '85%' }}></div>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium">Falta cargar: DNI reverso, Antecedentes Policiales.</p>
                    </div>
                </aside>
            </div>
        </div>
    );
}

