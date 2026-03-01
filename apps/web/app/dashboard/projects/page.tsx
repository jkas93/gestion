"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Project, UserRole, User } from "@erp/shared";
import { auth } from "@/lib/firebase/clientApp";
import { useToast } from "@/hooks/useToast";
import { ProjectSchema } from "@erp/shared";
import { useRouter } from "next/navigation";

export default function ProjectsPage() {
    const { user, role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (role === UserRole.RRHH) {
            router.push("/dashboard/rrhh");
        }
    }, [role, router]);

    const { showToast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [coordinators, setCoordinators] = useState<User[]>([]);
    const [supervisors, setSupervisors] = useState<User[]>([]);
    const [newProject, setNewProject] = useState({
        name: "",
        description: "",
        coordinatorId: "",
        supervisorId: ""
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    useEffect(() => {
        if (user) {
            fetchProjects();
            if (role === UserRole.GERENTE || role === UserRole.PMO || role === UserRole.COORDINADOR) {
                fetchStaff();
            }
        }
    }, [user, role]);

    const fetchProjects = async () => {
        try {
            const idToken = await auth.currentUser?.getIdToken();
            // Default 50 to maximize initial load without heavy query strings
            const data = await (await fetch(`${API_URL}/projects?limit=50`, {
                headers: { Authorization: `Bearer ${idToken}` },
            })).json();

            // Handle API response { projects: [], nextCursor: ... } vs legacy [].
            if (data.projects && Array.isArray(data.projects)) {
                setProjects(data.projects);
                // TODO: Store data.nextCursor for pagination feature
            } else if (Array.isArray(data)) {
                // Fallback for older API version or unexpected array response
                setProjects(data);
            } else {
                setProjects([]); // Default empty array if format is unknown
                if (!Array.isArray(data)) console.warn('Expected array or {projects: []} but got', data);
            }

        } catch (error) {
            console.error(error);
            showToast("Error de conexión con el servidor", "error");
        }
    };

    const fetchStaff = async () => {
        const idToken = await auth.currentUser?.getIdToken();

        // Fetch Coordinators
        const resCoords = await fetch(`${API_URL}/users/by-role/${UserRole.COORDINADOR}`, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        if (resCoords.ok) setCoordinators(await resCoords.json());

        // Fetch Supervisors
        const resSups = await fetch(`${API_URL}/users/by-role/${UserRole.SUPERVISOR}`, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        if (resSups.ok) setSupervisors(await resSups.json());
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation with Zod
        const result = ProjectSchema.safeParse(newProject);
        if (!result.success) {
            showToast(result.error?.errors[0]?.message || "Error de validación", "warning");
            return;
        }

        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await fetch(`${API_URL}/projects`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(newProject),
            });

            if (res.ok) {
                showToast("Proyecto inicializado correctamente", "success");
                setIsModalOpen(false);
                setNewProject({ name: "", description: "", coordinatorId: "", supervisorId: "" });
                fetchProjects();
            } else {
                const data = await res.json();
                showToast(data.message || "Error al crear proyecto", "error");
            }
        } catch (error) {
            showToast("Error inesperado en el servidor", "error");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center border-b border-border/60 pb-8">
                <div>
                    <h1 className="text-4xl font-extrabold mb-2 tracking-tight text-gray-900">Gestión de <span className="text-primary">Proyectos</span></h1>
                    <p className="text-gray-500 font-medium">Cronogramas operativos y seguimiento de obras en tiempo real.</p>
                </div>
                {(role === UserRole.GERENTE || role === UserRole.COORDINADOR) && (
                    <button
                        onClick={() => {
                            setNewProject(prev => ({
                                ...prev,
                                coordinatorId: role === UserRole.COORDINADOR ? (user?.uid || "") : ""
                            }));
                            setIsModalOpen(true);
                        }}
                        className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-primary/20"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo Proyecto
                    </button>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project) => (
                    <div key={project.id} className="bg-white p-8 rounded-3xl relative overflow-hidden group border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${project.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                                {project.status === 'ACTIVE' ? 'ACTIVO' : 'PAUSADO'}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-primary transition-colors uppercase tracking-tight">{project.name}</h3>
                        <p className="text-gray-500 text-sm mb-8 line-clamp-2 leading-relaxed font-medium">
                            {project.description || "Sin descripción proporcionada para este proyecto."}
                        </p>

                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                            <button className="py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold transition-all border border-gray-200 text-gray-600">Expediente</button>
                            <button
                                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                                className="py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold transition-all border border-blue-100 flex items-center justify-center gap-2"
                            >
                                Cronograma
                            </button>
                        </div>
                    </div>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full py-32 text-center bg-white rounded-3xl border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No hay proyectos registrados aún</p>
                    </div>
                )}
            </div>

            {/* Modal de Creación */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-2 bg-primary/10 rounded-xl text-primary"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></div>
                            <h2 className="text-3xl font-extrabold text-gray-900">Crear Proyecto</h2>
                        </div>
                        <p className="text-gray-500 text-sm mb-10 font-medium ml-1">Define los parámetros iniciales de la nueva obra.</p>

                        <form onSubmit={handleCreateProject} className="space-y-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Nombre Comercial</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 font-medium placeholder:text-gray-400"
                                        placeholder="Ej. Torre Alpha Residencial"
                                        value={newProject.name}
                                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Alcance del Proyecto</label>
                                    <textarea
                                        required
                                        rows={3}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 font-medium resize-none placeholder:text-gray-400"
                                        placeholder="Describe el objetivo y metas..."
                                        value={newProject.description}
                                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    />
                                </div>

                                {role === UserRole.GERENTE && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Líder de Proyecto (Coordinador)</label>
                                        <select
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 font-medium appearance-none"
                                            value={newProject.coordinatorId}
                                            onChange={(e) => setNewProject({ ...newProject, coordinatorId: e.target.value })}
                                        >
                                            <option value="" className="bg-white text-gray-500">Seleccionar responsable...</option>
                                            {coordinators.map(c => (
                                                <option key={c.id} value={c.id} className="bg-white text-gray-900">{c.name || c.email} ({c.email})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Supervisor a Cargo</label>
                                    <select
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 font-medium appearance-none"
                                        value={newProject.supervisorId}
                                        onChange={(e) => setNewProject({ ...newProject, supervisorId: e.target.value })}
                                    >
                                        <option value="" className="bg-white text-gray-500">Asignar supervisor de campo...</option>
                                        {supervisors.map(s => (
                                            <option key={s.id} value={s.id} className="bg-white text-gray-900">{s.name || s.email} ({s.email})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-gray-500 hover:text-gray-900 font-bold transition-all underline-offset-8 hover:underline text-sm uppercase tracking-widest text-center">Cerrar</button>
                                <button type="submit" className="flex-[2] btn-primary py-4 text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20">Inicializar Proyecto</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
