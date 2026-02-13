"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { UserRole, Attendance, Incident, EmployeeSchema } from "@erp/shared";
import { auth } from "@/lib/firebase/clientApp";
import { useToast } from "@/hooks/useToast";
import { Users, Clock, AlertCircle, FileText, CheckCircle, XCircle } from "lucide-react";

export default function RRHHPage() {
    const { user, role } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [employees, setEmployees] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'incidents'>('employees');

    // Modals
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

    // Forms
    const [newIncident, setNewIncident] = useState({ employeeId: "", type: "VACACIONES" as any, startDate: "", endDate: "", description: "" });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    useEffect(() => {
        if (user) {
            fetchEmployees();
            fetchIncidents();
        } else {
            router.push("/login");
        }
    }, [user, router]);

    const fetchEmployees = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            const idToken = await currentUser.getIdToken();
            const res = await fetch(`${API_URL}/rrhh/employees`, {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (res.ok) setEmployees(await res.json());
        } catch (error) {
            showToast("Error al cargar empleados", "error");
        }
    };

    const fetchIncidents = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            const idToken = await currentUser.getIdToken();
            const res = await fetch(`${API_URL}/rrhh/incidents`, {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (res.ok) setIncidents(await res.json());
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateEmployee = () => {
        router.push("/dashboard/rrhh/new");
    };

    const handleRecordAttendance = async (employeeId: string, status: string) => {
        try {
            const user = auth.currentUser;
            if (!user) return;
            const idToken = await user.getIdToken();
            const date = new Date().toISOString().split('T')[0];
            const checkIn = new Date().toLocaleTimeString();

            const res = await fetch(`${API_URL}/rrhh/attendance`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ employeeId, date, status, checkIn }),
            });

            if (res.ok) {
                showToast("Asistencia registrada", "success");
            }
        } catch (error) {
            showToast("Error al registrar asistencia", "error");
        }
    };

    const handleCreateIncident = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const user = auth.currentUser;
            if (!user) return;
            const idToken = await user.getIdToken();
            const res = await fetch(`${API_URL}/rrhh/incidents`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(newIncident),
            });

            if (res.ok) {
                showToast("Incidencia registrada", "success");
                setIsIncidentModalOpen(false);
                fetchIncidents();
            }
        } catch (error) {
            showToast("Error al registrar incidencia", "error");
        }
    };

    const handleUpdateIncidentStatus = async (id: string, status: string) => {
        try {
            const user = auth.currentUser;
            if (!user) return;
            const idToken = await user.getIdToken();
            const res = await fetch(`${API_URL}/rrhh/incidents/${id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ status }),
            });

            if (res.ok) {
                showToast(`Incidencia ${status.toLowerCase()}`, "success");
                fetchIncidents();
            }
        } catch (error) {
            showToast("Error al actualizar estado", "error");
        }
    };

    const canEdit = role === UserRole.GERENTE || role === UserRole.RRHH;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center border-b border-border/60 pb-8">
                <div>
                    <h1 className="text-4xl font-extrabold mb-2 tracking-tighter text-gray-900">
                        Gestión de <span className="text-primary">Talento</span>
                    </h1>
                    <p className="text-gray-500 font-medium">Panel de Control de Recursos Humanos e Incidencias.</p>
                </div>
                <div className="flex gap-4">
                    {activeTab === 'employees' && (role === UserRole.GERENTE || role === UserRole.RRHH) && (
                        <button onClick={handleCreateEmployee} className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-primary/20 px-6">
                            <Users className="w-5 h-5" /> Añadir Personal
                        </button>
                    )}
                </div>
            </header>

            {/* Tabs Navigation */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit border border-gray-200">
                <button
                    onClick={() => setActiveTab('employees')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'employees' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Users className="w-4 h-4" /> Colaboradores
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'attendance' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Clock className="w-4 h-4" /> Pase de Lista
                </button>
                <button
                    onClick={() => setActiveTab('incidents')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'incidents' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <AlertCircle className="w-4 h-4" /> Incidencias
                </button>
            </div>

            {/* Content Area */}
            <div className="glass-card rounded-[2.5rem] overflow-hidden border border-border/50 shadow-xl min-h-[500px] bg-white">
                {activeTab === 'employees' && (
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Colaborador</th>
                                <th>Posición</th>
                                <th>Contacto</th>
                                <th className="text-right">Remuneración</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {employees.map((emp, i) => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                                                {emp.name[0]}
                                            </div>
                                            <span className="font-bold tracking-tight text-gray-900">{emp.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold border border-gray-200 uppercase tracking-tighter">
                                            {emp.role}
                                        </span>
                                    </td>
                                    <td className="text-gray-500 text-sm font-medium italic">{emp.email}</td>
                                    <td className="text-right font-mono text-emerald-600 font-bold">${emp.salary}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'attendance' && (
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tighter">Control de Asistencia Diaria</h3>
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-widest mt-1">Fecha: {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {employees.map((emp, i) => (
                                <div key={i} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl font-black text-gray-400">{emp.name[0]}</div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 uppercase tracking-tighter">{emp.name}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{emp.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRecordAttendance(emp.id, 'PRESENTE')}
                                            className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-emerald-100 hover:border-emerald-600"
                                        >
                                            Presente
                                        </button>
                                        <button
                                            onClick={() => handleRecordAttendance(emp.id, 'FALTA')}
                                            className="flex-1 py-3 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-red-100 hover:border-red-600"
                                        >
                                            Falta
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'incidents' && (
                    <div className="p-0">
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Colaborador</th>
                                    <th>Periodo</th>
                                    <th>Estado / Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {incidents.map((inc, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td>
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-tighter ${inc.type === 'VACACIONES' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                inc.type === 'PERMISO_MEDICO' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                    'bg-gray-100 text-gray-500 border-gray-200'
                                                }`}>
                                                {inc.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="font-bold text-gray-900 uppercase tracking-tighter">{employees.find(e => e.id === inc.employeeId)?.name || 'Cargando...'}</td>
                                        <td className="text-gray-500 text-xs font-mono font-bold">{inc.startDate} ➔ {inc.endDate}</td>
                                        <td>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${inc.status === 'APROBADO' ? 'text-emerald-600' :
                                                    inc.status === 'RECHAZADO' ? 'text-red-500' : 'text-amber-500 animate-pulse'
                                                    }`}>
                                                    {inc.status}
                                                </span>
                                                {inc.status === 'PENDIENTE' && (role === UserRole.GERENTE || role === UserRole.RRHH) && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleUpdateIncidentStatus(inc.id, 'APROBADO')} className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all" title="Aprobar"><CheckCircle className="w-4 h-4" /></button>
                                                        <button onClick={() => handleUpdateIncidentStatus(inc.id, 'RECHAZADO')} className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-all" title="Rechazar"><XCircle className="w-4 h-4" /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {incidents.length === 0 && (
                            <div className="py-32 text-center text-gray-400 uppercase tracking-widest text-xs font-bold">Sin incidencias reportadas</div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals placeholders - simplified for brevity in this step */}
            {
                isIncidentModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl">
                            <h2 className="text-3xl font-extrabold mb-8 uppercase tracking-tighter text-gray-900">Reportar Incidencia</h2>
                            <form onSubmit={handleCreateIncident} className="space-y-6">
                                <select
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 font-medium appearance-none"
                                    value={newIncident.employeeId}
                                    onChange={e => setNewIncident({ ...newIncident, employeeId: e.target.value })}
                                    required
                                >
                                    <option value="" className="bg-white text-gray-500">Seleccionar Colaborador...</option>
                                    {employees.map(e => <option key={e.id} value={e.id} className="bg-white text-gray-900">{e.name}</option>)}
                                </select>
                                <select
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 font-medium appearance-none"
                                    value={newIncident.type}
                                    onChange={e => setNewIncident({ ...newIncident, type: e.target.value })}
                                    title="Tipo de Incidencia"
                                >
                                    <option value="VACACIONES" className="bg-white text-gray-900">Vacaciones</option>
                                    <option value="PERMISO_MEDICO" className="bg-white text-gray-900">Permiso Médico</option>
                                    <option value="FALTA_JUSTIFICADA" className="bg-white text-gray-900">Falta Justificada</option>
                                    <option value="OTRO" className="bg-white text-gray-900">Otro</option>
                                </select>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="date" required className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-primary" value={newIncident.startDate} onChange={e => setNewIncident({ ...newIncident, startDate: e.target.value })} title="Fecha Inicio" />
                                    <input type="date" required className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-primary" value={newIncident.endDate} onChange={e => setNewIncident({ ...newIncident, endDate: e.target.value })} title="Fecha Fin" />
                                </div>
                                <textarea placeholder="Descripción del motivo..." required className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 outline-none resize-none h-32 focus:ring-2 focus:ring-primary placeholder:text-gray-400" value={newIncident.description} onChange={e => setNewIncident({ ...newIncident, description: e.target.value })} />
                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setIsIncidentModalOpen(false)} className="flex-1 py-4 text-gray-500 hover:text-gray-900 font-bold transition-all text-xs uppercase tracking-widest">Cerrar</button>
                                    <button type="submit" className="flex-[2] btn-primary py-4 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20">Solicitar Registro</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
