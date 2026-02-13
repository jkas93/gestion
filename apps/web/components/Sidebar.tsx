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
        `flex items-center gap-3 rounded-lg py-2 transition-all hover:text-primary ${isCollapsed ? "justify-center px-0 ring-1 ring-white/5" : "px-3"
        } ${pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
            ? "bg-muted text-primary"
            : "text-muted-foreground"
        }`;

    const iconClass = isCollapsed ? "h-6 w-6" : "h-4 w-4";

    return (
        <aside className={`sidebar-container ${isCollapsed ? "w-20" : "w-64"}`}>
            <div className={`flex h-14 items-center border-b lg:h-[60px] ${isCollapsed ? "justify-center px-0" : "px-6 justify-between"}`}>
                <Link href="/" className="flex items-center gap-2 font-bold text-xl overflow-hidden shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                        <Briefcase className="h-5 w-5" />
                    </div>
                    {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300 tracking-tighter uppercase font-black text-white/90">Golden Tower <span className="text-primary">ERP</span></span>}
                </Link>
                {!isCollapsed && (
                    <button
                        onClick={onToggle}
                        className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                )}
                {isCollapsed && (
                    <button
                        onClick={onToggle}
                        className="absolute -right-3 top-7 h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50 ring-2 ring-background rotate-180"
                    >
                        <ChevronLeft className="h-3 w-3" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-auto py-4">
                <nav className={`grid items-start px-2 text-sm font-medium gap-1 ${isCollapsed ? "px-2" : "px-4"}`}>
                    {!isCollapsed && (
                        <div className="mb-2 px-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest animate-in fade-in duration-300">
                            Menu Principal
                        </div>
                    )}

                    <Link href="/dashboard" className={navLinkClass("/dashboard")} title="Dashboard">
                        <LayoutDashboard className={iconClass} />
                        {!isCollapsed && <span className="animate-in fade-in duration-300">Dashboard</span>}
                    </Link>

                    {role !== UserRole.RRHH && (
                        <Link href="/dashboard/projects" className={navLinkClass("/dashboard/projects")} title="Proyectos">
                            <Briefcase className={iconClass} />
                            {!isCollapsed && <span className="animate-in fade-in duration-300">Proyectos</span>}
                        </Link>
                    )}

                    {(role === UserRole.GERENTE || role === UserRole.PMO) && (
                        <Link href="/dashboard/finance" className={navLinkClass("/dashboard/finance")} title="Finanzas">
                            <CircleDollarSign className={iconClass} />
                            {!isCollapsed && <span className="animate-in fade-in duration-300">Finanzas</span>}
                        </Link>
                    )}

                    {(role === UserRole.GERENTE || role === UserRole.LOGISTICO || role === UserRole.PMO || role === UserRole.SIG) && (
                        <Link href="/dashboard/logistics" className={navLinkClass("/dashboard/logistics")} title="Logística">
                            <Package className={iconClass} />
                            {!isCollapsed && <span className="animate-in fade-in duration-300">Logística</span>}
                        </Link>
                    )}

                    <Link href="/dashboard/rrhh" className={navLinkClass("/dashboard/rrhh")} title="Recursos Humanos">
                        <Users className={iconClass} />
                        {!isCollapsed && <span className="animate-in fade-in duration-300">RRHH</span>}
                    </Link>

                    {isAdmin && (
                        <>
                            {!isCollapsed && (
                                <div className="mt-6 mb-2 px-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest animate-in fade-in duration-300">
                                    Administración
                                </div>
                            )}
                            {(role === UserRole.GERENTE || role === UserRole.RRHH || role === UserRole.PMO) && (
                                <Link href="/dashboard/users" className={navLinkClass("/dashboard/users")} title="Usuarios">
                                    <ShieldCheck className={iconClass} />
                                    {!isCollapsed && <span className="animate-in fade-in duration-300">Usuarios</span>}
                                </Link>
                            )}
                            <Link href="/dashboard/catalog" className={navLinkClass("/dashboard/catalog")} title="Catálogo Maestro">
                                <LayoutDashboard className={iconClass} /> {/* Use appropriate icon */}
                                {!isCollapsed && <span className="animate-in fade-in duration-300">Catálogo</span>}
                            </Link>
                            <Link href="/dashboard/settings" className={navLinkClass("/dashboard/settings")} title="Configuración">
                                <Settings className={iconClass} />
                                {!isCollapsed && <span className="animate-in fade-in duration-300">Configuración</span>}
                            </Link>
                        </>
                    )}
                </nav>
            </div>

            <div className={`mt-auto border-t p-4 ${isCollapsed ? "px-2" : "p-4"}`}>
                {!isCollapsed ? (
                    <div className="flex items-center gap-4 mb-4 animate-in fade-in duration-300">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">{user?.email}</span>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{role}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center mb-4" title={user?.email || ""}>
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 ring-1 ring-white/10">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className={`flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 ${isCollapsed ? "p-3 w-full" : "px-3 py-2 w-full text-xs font-bold uppercase tracking-widest"}`}
                    title="Cerrar Sesión"
                >
                    <LogOut className={isCollapsed ? "h-5 w-5" : "h-4 w-4"} />
                    {!isCollapsed && <span>Salir</span>}
                </button>
            </div>
        </aside>
    );
}
