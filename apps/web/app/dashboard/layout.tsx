"use client";

import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Bell, Search, User, Menu } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

    // Cargar estado inicial desde localStorage
    useEffect(() => {
        const savedState = localStorage.getItem("sidebar_collapsed");
        if (savedState !== null) {
            setIsSidebarCollapsed(savedState === "true");
        }
    }, []);

    // Guardar estado en localStorage cuando cambie
    const toggleSidebar = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        localStorage.setItem("sidebar_collapsed", String(newState));
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Auto-activate user on login (silent background check)
    useEffect(() => {
        const activateUser = async () => {
            if (user) {
                try {
                    const token = await user.getIdToken();
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
                    await fetch(`${apiUrl}/users/acknowledge-login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ uid: user.uid })
                    });
                } catch (error) {
                    console.error("Auto-activation check failed:", error);
                }
            }
        };

        if (user && !loading) {
            activateUser();
        }
    }, [user, loading]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground text-sm font-medium">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex h-screen overflow-hidden bg-background w-full">
            <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
            <div className="flex-1 flex flex-col min-w-0">
                {/* Navbar / Topbar - Fixed at top of content area */}
                <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-background px-6 shrink-0 z-50">
                    <button className="lg:hidden p-2 -ml-2 text-muted-foreground hover:bg-muted rounded-md" onClick={toggleSidebar}>
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="w-full flex-1 text-xs font-bold text-gray-500 uppercase tracking-widest hidden md:block">
                        Panel de Control ERP <span className="mx-2 text-gray-300">|</span> <span className="text-primary">Golden Tower</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="rounded-xl bg-secondary border border-border p-2 hover:bg-muted text-gray-500 transition-all">
                            <Bell className="h-5 w-5" />
                        </button>
                        <div className="h-8 w-px bg-border"></div>
                        <div className="flex items-center gap-3 bg-secondary border border-border px-3 py-1.5 rounded-xl">
                            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                {user?.email?.[0]}
                            </div>
                            <span className="text-xs font-bold text-gray-700 hidden sm:inline">{user?.email?.split('@')[0]}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-6 lg:p-10 relative custom-scrollbar">
                    {/* Background Decorative Blob - Adjusted for Light Mode */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] pointer-events-none -z-10"></div>

                    <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-700 pb-20">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
