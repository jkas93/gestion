"use client";

import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@erp/shared";
import { useRouter } from "next/navigation";
import {
    Users,
    Briefcase,
    Settings,
    Clock,
    CalendarDays,
    DollarSign,
    TrendingUp
} from "lucide-react";

import { useDashboardStats } from "@/hooks/useDashboardStats";

// ... (previous imports)
import SupervisorDashboard from "@/components/dashboard/SupervisorDashboard";

export default function DashboardPage() {
    const { user, role, loading: authLoading } = useAuth();
    const router = useRouter();
    const { stats, loading: statsLoading } = useDashboardStats();

    if (authLoading || !user) return null;

    if (role === UserRole.SUPERVISOR) {
        return <SupervisorDashboard />;
    }

    const MetricCard = ({ title, value, label, icon: Icon, color, percent }: any) => (
        // ... (rest of the component)
        <div className={`p-6 rounded-[2rem] border border-border/50 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:shadow-[0_8px_30px_rgb(212,175,55,0.15)] hover:border-primary/30 transition-all duration-300 relative overflow-hidden`}>
            {/* Background Gradient Decorative */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:opacity-20 transition-opacity`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 bg-secondary rounded-2xl text-primary group-hover:scale-110 transition-transform shadow-sm`}>
                    <Icon className="w-6 h-6" />
                </div>
                {percent && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${percent.includes('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {percent}
                    </span>
                )}
            </div>
            {statsLoading ? (
                <div className="space-y-2 animate-pulse">
                    <div className="h-8 bg-gray-200 rounded-lg w-16"></div>
                    <div className="h-4 bg-gray-100 rounded-md w-24"></div>
                </div>
            ) : (
                <div className="relative z-10">
                    <h3 className="text-3xl font-extrabold mb-1 text-gray-900 tracking-tight">{value}</h3>
                    <p className="text-sm text-gray-500 font-medium">{label}</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end border-b border-border/60 pb-8">
                <div>
                    <h1 className="text-5xl font-extrabold tracking-tight mb-2 text-gray-900">
                        Bienvenido, <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-yellow-800">{user?.email?.split('@')[0]}</span>
                    </h1>
                    <p className="text-gray-500 font-medium italic">
                        Sistema de Gestión Integral • <span className="text-primary font-bold uppercase tracking-tighter">{role || 'Sin Rol'}</span>
                        {process.env.NODE_ENV === 'development' && (
                            <span className="ml-4 text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase">Debug: {JSON.stringify(role)}</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-4 text-right">
                    <div className="bg-white border border-border shadow-sm px-4 py-2 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Proyectos"
                    value={stats?.activeProjects || 0}
                    label="Proyectos Activos"
                    icon={Briefcase}
                    color="from-primary/20 to-transparent hover:text-primary"
                    percent="+12%"
                />

                <MetricCard
                    title="Equipo"
                    value={stats?.collaborators || 0}
                    label="Colaboradores"
                    icon={Users}
                    color="from-white/10 to-transparent hover:text-white"
                    percent="+4%"
                />

                <MetricCard
                    title="Finanzas"
                    value={`S/ ${((stats?.actualCost || 0) / 1000).toFixed(1)}k`}
                    label={`Ejecutado de S/ ${((stats?.totalBudget || 0) / 1000).toFixed(1)}k`}
                    icon={DollarSign}
                    color="from-primary/30 to-transparent hover:text-primary"
                    percent={`${Math.round(((stats?.actualCost || 0) / (stats?.totalBudget || 1)) * 100)}%`}
                />

                <MetricCard
                    title="Eficiencia"
                    value={`${stats?.efficiency || 0}%`}
                    label="Eficiencia Operativa"
                    icon={Clock}
                    color="from-amber-900/40 to-transparent hover:text-amber-500"
                    percent="-5%"
                />
            </div>

            <section>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                        Accesos Rápidos
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(role?.toUpperCase() === "GERENTE" || role?.toUpperCase() === "PMO" || role?.toUpperCase() === "COORDINADOR" || role?.toUpperCase() === "SUPERVISOR") && (
                        <button
                            onClick={() => router.push("/dashboard/projects")}
                            className="p-6 rounded-3xl text-left bg-white border border-border/60 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all"></div>
                            <h4 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-primary transition-colors">Gestión de Proyectos</h4>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">Accede al listado maestro de obras, cronogramas y asignaciones.</p>
                            <div className="mt-6 flex items-center text-xs font-bold text-primary uppercase tracking-widest font-mono">
                                Ver Módulo <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </button>
                    )}

                    {(role?.toUpperCase() === "GERENTE" || role?.toUpperCase() === "RRHH") && (
                        <button
                            onClick={() => router.push("/dashboard/rrhh")}
                            className="p-6 rounded-3xl text-left bg-white border border-border/60 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/15 transition-all"></div>
                            <h4 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-primary transition-colors">Recursos Humanos</h4>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">Control de asistencia, incidencias y gestión de talento humano.</p>
                            <div className="mt-6 flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest font-mono group-hover:text-primary transition-colors">
                                Ver Módulo <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </button>
                    )}

                    {role?.toUpperCase() === "GERENTE" && (
                        <button
                            onClick={() => router.push("/dashboard/users")}
                            className="p-6 rounded-3xl text-left bg-white border border-border/60 hover:border-red-500/30 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 blur-3xl -mr-16 -mt-16 group-hover:bg-red-100 transition-all"></div>
                            <h4 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-red-600 transition-colors">Control de Accesos</h4>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">Administración crítica de roles y permisos del sistema.</p>
                            <div className="mt-6 flex items-center text-xs font-bold text-red-500 uppercase tracking-widest font-mono">
                                Configurar <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </button>
                    )}

                    {(role?.toUpperCase() === "GERENTE" || role?.toUpperCase() === "PMO") && (
                        <button
                            onClick={() => router.push("/dashboard/catalog")}
                            className="p-6 rounded-3xl text-left bg-white border border-border/60 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all"></div>
                            <h4 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-primary transition-colors">Catálogo Maestro</h4>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">Estandariza actividades, duraciones y costos para tus obras.</p>
                            <div className="mt-6 flex items-center text-xs font-bold text-primary/80 uppercase tracking-widest font-mono">
                                Gestionar <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </button>
                    )}

                    {(role?.toUpperCase() === "GERENTE" || role?.toUpperCase() === "PMO") && (
                        <button
                            onClick={() => router.push("/dashboard/finance")}
                            className="p-6 rounded-3xl text-left bg-white border border-border/60 hover:border-amber-500/50 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 blur-3xl -mr-16 -mt-16 group-hover:bg-amber-100 transition-all"></div>
                            <h4 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-amber-600 transition-colors">Gestión Financiera</h4>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">Control de órdenes de compra, pagos a proveedores y flujo de caja.</p>
                            <div className="mt-6 flex items-center text-xs font-bold text-primary uppercase tracking-widest font-mono">
                                Ver Finanzas <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
}
