"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Project } from "@erp/shared";
import {
    CloudSun,
    MapPin,
    CalendarCheck,
    AlertTriangle,
    Camera,
    HardHat,
    PackageSearch
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useWeather } from "@/hooks/useWeather";
import { useToast } from "@/hooks/useToast";
import MaterialRequestModal from "@/components/MaterialRequestModal";
import type { MaterialRequestItem } from "@erp/shared";

export default function SupervisorDashboard() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { weather, loading: weatherLoading } = useWeather();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const router = useRouter();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    useEffect(() => {
        const fetchMyProject = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch(`${API_URL}/projects`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const projects: Project[] = await res.json();
                    // Assumes the backend already filters by supervisorId (which it does)
                    // We take the first active project
                    const myProject = projects.find(p => p.status === 'ACTIVE') || projects[0];
                    setProject(myProject || null);
                }
            } catch (error) {
                console.error("Error fetching project:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyProject();
    }, [user, API_URL]);

    const handleMaterialRequest = async (items: MaterialRequestItem[]) => {
        if (!user || !project) return;

        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API_URL}/material-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    projectId: project.id,
                    supervisorId: user.uid,
                    items
                })
            });

            if (res.ok) {
                showToast("Solicitud enviada correctamente", "success");
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || "Error en la respuesta");
            }
        } catch (error: any) {
            console.error("Error submitting request:", error);
            showToast(error.message || "Error al enviar la solicitud", "error");
            throw error;
        }
    };

    if (loading) return <div className="p-8 animate-pulse">Cargando tu obra...</div>;

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="bg-gray-100 p-6 rounded-full">
                    <HardHat className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Sin Asignación Activa</h2>
                <p className="text-gray-500 max-w-md">
                    No tienes ningún proyecto activo asignado como Supervisor en este momento.
                    Contacta a la Gerencia o PMO.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Contexto */}
            <header className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
                                Mi Obra
                            </span>
                            <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
                                <MapPin className="w-3 h-3" /> Ubicación Remota
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                            {project.name}
                        </h1>
                        <p className="text-gray-500 font-medium mt-1 max-w-2xl text-sm md:text-base">
                            {project.description}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-blue-500">
                            {weather?.icon ? (
                                <img
                                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                                    alt={weather.description}
                                    className="w-8 h-8"
                                />
                            ) : (
                                <CloudSun className="w-8 h-8" />
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Clima en Sitio</p>
                            <p className="text-xl font-black text-gray-900">
                                {weatherLoading ? "..." : (weather ? `${weather.temp}°C` : "--")}
                            </p>
                            <p className="text-xs text-gray-500 font-medium capitalize">
                                {weatherLoading ? "Cargando..." : (weather ? weather.description : "Sin datos")}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Accesos Rápidos (Big Buttons) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                    onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                    className="group relative overflow-hidden p-8 rounded-[2rem] bg-gradient-to-br from-primary to-yellow-600 text-white shadow-xl shadow-yellow-500/20 hover:scale-[1.02] transition-all duration-300 text-left"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Camera className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <div className="p-3 bg-white/20 w-fit rounded-xl backdrop-blur-sm mb-6">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-black mb-1">Reportar Avance</h3>
                        <p className="text-yellow-100 font-medium text-sm">Subir fotos y bitácora diaria</p>
                    </div>
                </button>

                <button
                    onClick={() => router.push(`/dashboard/rrhh?project=${project.id}`)}
                    className="group relative overflow-hidden p-8 rounded-[2rem] bg-white border border-border/60 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 text-left"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform bg-primary/10 rounded-full blur-2xl w-32 h-32 -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <div className="p-3 bg-gray-50 w-fit rounded-xl mb-6 text-gray-700 group-hover:text-primary transition-colors">
                            <CalendarCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-1">Pasar Lista</h3>
                        <p className="text-gray-500 font-medium text-sm">Registro de asistencia del personal</p>
                    </div>
                </button>

                <button
                    onClick={() => setShowMaterialModal(true)}
                    className="group relative overflow-hidden p-8 rounded-[2rem] bg-white border border-border/60 hover:border-blue-500/50 shadow-sm hover:shadow-xl transition-all duration-300 text-left"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform bg-blue-500/10 rounded-full blur-2xl w-32 h-32 -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <div className="p-3 bg-blue-50 w-fit rounded-xl mb-6 text-blue-600">
                            <PackageSearch className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-1">Solicitar Material</h3>
                        <p className="text-gray-500 font-medium text-sm">Requerimientos a almacén/compras</p>
                    </div>
                </button>
            </div>

            {/* Pendientes / Alertas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-white rounded-[2rem] p-8 border border-border/60 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Pendientes de Atención</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Mock alerts for now */}
                        <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex gap-4 items-start">
                            <div className="w-2 h-2 mt-2 rounded-full bg-red-500 shrink-0" />
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Validar Reporte Ayer</h4>
                                <p className="text-xs text-gray-600 mt-1">El coordinador rechazó la foto 3 del reporte #042.</p>
                                <button className="mt-3 text-xs font-bold text-red-600 hover:underline">Corregir ahora →</button>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100 flex gap-4 items-start">
                            <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500 shrink-0" />
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Confirmar recepción de Cemento</h4>
                                <p className="text-xs text-gray-600 mt-1">Llegada programada para hoy 14:00 PM.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-[2rem] p-8 border border-border/60 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                            <CalendarCheck className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Agenda de Hoy</h2>
                    </div>

                    <div className="space-y-0 divide-y divide-dashed divide-gray-200">
                        <div className="py-4 flex gap-4 items-center opacity-50">
                            <div className="w-12 text-xs font-bold text-gray-400 text-right">08:00</div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900 line-through">Charla de Seguridad 5min</p>
                            </div>
                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded">HECHO</span>
                        </div>
                        <div className="py-4 flex gap-4 items-center">
                            <div className="w-12 text-xs font-bold text-gray-400 text-right">10:00</div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900">Vaciado de Losa Sector B</p>
                                <p className="text-xs text-gray-500">Supervisar mezcla y vibrado</p>
                            </div>
                        </div>
                        <div className="py-4 flex gap-4 items-center">
                            <div className="w-12 text-xs font-bold text-gray-400 text-right">16:00</div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900">Reporte Diario + Fotos</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Material Request Modal */}
            {user && project && (
                <MaterialRequestModal
                    isOpen={showMaterialModal}
                    onClose={() => setShowMaterialModal(false)}
                    projectId={project.id}
                    supervisorId={user.uid}
                    onSubmit={handleMaterialRequest}
                />
            )}
        </div>
    );
}
