"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@erp/shared";
import {
    LayoutDashboard,
    Briefcase,
    Users,
    Settings,
    ShieldCheck,
    LogOut,
    User as UserIcon,
    ChevronLeft,
    CircleDollarSign,
    Package
} from "lucide-react";
import { auth } from "@/lib/firebase/clientApp";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { role, user } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    const isAdmin = role === UserRole.GERENTE || role === UserRole.PMO || role === UserRole.RRHH;

    const navLinkClass = (href: string) =>
        `flex items-center gap-3 rounded-xl py-2.5 transition-all duration-300 hover:bg-primary/10 hover:text-primary ${isCollapsed ? "justify-center px-0 mx-1" : "px-4 mx-2"
        } ${pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
            ? "bg-primary/10 text-primary font-bold shadow-sm"
            : "text-muted-foreground hover:translate-x-1"
        }`;

    const iconClass = isCollapsed ? "h-6 w-6" : "h-5 w-5";

    return (
        <aside className={`sidebar-container ${isCollapsed ? "w-20" : "w-64"} border-r border-border shadow-sm`}>
            <div className={`flex h-16 items-center ${isCollapsed ? "justify-center px-0" : "px-6 justify-between"}`}>
                <Link href="/dashboard" className="flex items-center gap-3 font-bold text-xl overflow-hidden shrink-0 group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shrink-0 shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
                        <Briefcase className="h-6 w-6" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
                            <span className="tracking-tighter uppercase font-black text-foreground max-w-[150px] truncate leading-tight">
                                Golden Tower
                            </span>
                            <span className="text-[10px] text-primary font-bold tracking-[0.2em] -mt-1">SOLUTIONS ERP</span>
                        </div>
                    )}
                </Link>

                {!isCollapsed && (
                    <button
                        onClick={onToggle}
                        className="p-2 hover:bg-secondary rounded-xl text-muted-foreground transition-all hover:scale-110 active:scale-95"
                        title="Contraer menú"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                )}
            </div>

            {isCollapsed && (
                <div className="px-3 mb-2 flex justify-center">
                    <button
                        onClick={onToggle}
                        className="p-2 w-full flex justify-center hover:bg-secondary rounded-xl text-primary transition-all hover:scale-105 active:scale-95 shadow-sm bg-background border border-border"
                        title="Expandir menú"
                    >
                        <ChevronLeft className="h-5 w-5 rotate-180" />
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto py-6 space-y-2 no-scrollbar">
                <nav className={`grid items-start text-sm font-medium gap-1.5 ${isCollapsed ? "px-1" : "px-2"}`}>
                    {!isCollapsed && (
                        <div className="mb-3 px-4 text-[10px] font-bold uppercase text-muted-foreground/60 tracking-[0.15em] animate-in fade-in duration-500">
                            General
                        </div>
                    )}

                    <Link href="/dashboard" className={navLinkClass("/dashboard")} title="Dashboard">
                        <LayoutDashboard className={iconClass} />
                        {!isCollapsed && <span className="animate-in fade-in duration-500">Dashboard</span>}
                    </Link>

                    {role !== UserRole.RRHH && (
                        <Link href="/dashboard/projects" className={navLinkClass("/dashboard/projects")} title="Proyectos">
                            <Briefcase className={iconClass} />
                            {!isCollapsed && <span className="animate-in fade-in duration-500">Proyectos</span>}
                        </Link>
                    )}

                    {(role === UserRole.GERENTE || role === UserRole.PMO) && (
                        <Link href="/dashboard/finance" className={navLinkClass("/dashboard/finance")} title="Finanzas">
                            <CircleDollarSign className={iconClass} />
                            {!isCollapsed && <span className="animate-in fade-in duration-500">Finanzas</span>}
                        </Link>
                    )}

                    {(role === UserRole.GERENTE || role === UserRole.LOGISTICO || role === UserRole.PMO || role === UserRole.SIG) && (
                        <Link href="/dashboard/logistics" className={navLinkClass("/dashboard/logistics")} title="Logística">
                            <Package className={iconClass} />
                            {!isCollapsed && <span className="animate-in fade-in duration-500">Logística</span>}
                        </Link>
                    )}

                    <Link href="/dashboard/rrhh" className={navLinkClass("/dashboard/rrhh")} title="Personal">
                        <Users className={iconClass} />
                        {!isCollapsed && <span className="animate-in fade-in duration-500">Personal</span>}
                    </Link>

                    {isAdmin && (
                        <>
                            <div className={`h-px bg-border/50 my-4 ${isCollapsed ? "mx-2" : "mx-4"}`} />
                            {!isCollapsed && (
                                <div className="mb-3 px-4 text-[10px] font-bold uppercase text-muted-foreground/60 tracking-[0.15em] animate-in fade-in duration-500">
                                    Admin
                                </div>
                            )}
                            {(role === UserRole.GERENTE || role === UserRole.RRHH || role === UserRole.PMO) && (
                                <Link href="/dashboard/users" className={navLinkClass("/dashboard/users")} title="Gestionar Usuarios">
                                    <ShieldCheck className={iconClass} />
                                    {!isCollapsed && <span className="animate-in fade-in duration-500">Usuarios</span>}
                                </Link>
                            )}
                            <Link href="/dashboard/catalog" className={navLinkClass("/dashboard/catalog")} title="Catálogo Maestro">
                                <LayoutDashboard className={iconClass} />
                                {!isCollapsed && <span className="animate-in fade-in duration-500">Catálogo</span>}
                            </Link>
                            <Link href="/dashboard/settings" className={navLinkClass("/dashboard/settings")} title="Configuración">
                                <Settings className={iconClass} />
                                {!isCollapsed && <span className="animate-in fade-in duration-500">Ajustes</span>}
                            </Link>
                        </>
                    )}
                </nav>
            </div>

            <div className={`mt-auto border-t border-border bg-gray-50/50 p-4 ${isCollapsed ? "px-2" : "p-4"}`}>
                {!isCollapsed ? (
                    <div className="flex items-center gap-3 mb-6 p-2 rounded-2xl bg-white border border-border shadow-sm animate-in fade-in duration-500 hover:border-primary/30 transition-colors">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                            <UserIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-foreground truncate">{user?.email?.split('@')[0]}</span>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.1em]">{role}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center mb-6" title={`${user?.email} (${role})`}>
                        <div className="h-12 w-12 rounded-xl bg-white border border-border shadow-sm flex items-center justify-center shrink-0 hover:border-primary hover:text-primary transition-all">
                            <UserIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className={`flex items-center justify-center gap-2 rounded-xl transition-all hover:bg-red-500 hover:text-white border border-transparent shadow-sm ${isCollapsed ? "p-3 w-full bg-red-50 text-red-500" : "px-4 py-2.5 w-full text-xs font-bold uppercase tracking-widest bg-red-50/50 text-red-600 hover:translate-y-[-1px]"}`}
                    title="Cerrar Sesión"
                >
                    <LogOut className={isCollapsed ? "h-6 w-6" : "h-4 w-4"} />
                    {!isCollapsed && <span>Cerrar Sesión</span>}
                </button>
            </div>
        </aside>
    );
}
