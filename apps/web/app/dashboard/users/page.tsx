"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { UserRole } from "@erp/shared";
import { auth } from "@/lib/firebase/clientApp";
import { UserPlus } from "lucide-react";
import UserInviteModal from "@/components/users/UserInviteModal";

export default function UsersPage() {
    const { user, role } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [updating, setUpdating] = useState<string | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    useEffect(() => {
        if (user && (role === UserRole.GERENTE || role === UserRole.RRHH || role === UserRole.PMO)) {
            fetchUsers();
        } else if (user && role !== null) {
            router.push("/dashboard");
        }
    }, [user, role, router]);

    const fetchUsers = async () => {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.ok) setUsers(await res.json());
    };

    const handleRoleChange = async (uid: string, newRole: string) => {
        setUpdating(uid);
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${API_URL}/users/set-role`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ uid, role: newRole }),
        });

        if (res.ok) {
            await fetchUsers();
        }
        setUpdating(null);
    };

    const canEdit = role === UserRole.GERENTE || role === UserRole.RRHH;

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center border-b border-border/60 pb-8">
                <div>
                    <h1 className="text-4xl font-extrabold mb-2 tracking-tight text-gray-900">Control de <span className="text-primary">Accesos</span></h1>
                    <p className="text-gray-500 font-medium">Administración de identidades y privilegios del sistema.</p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 scale-105"
                    >
                        <UserPlus className="w-5 h-5" />
                        Invitar Usuario
                    </button>
                )}
            </header>

            <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-xl">
                <table className="premium-table w-full">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                            <th className="p-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Identidad</th>
                            <th className="p-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Correo Institucional</th>
                            <th className="p-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Rango Jerárquico</th>
                            <th className="p-6 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Asignar Privilegios</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center font-black text-white shadow-lg shadow-yellow-500/20 border border-white">
                                            {u.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg tracking-tight text-gray-900">{u.name || "Usuario GP"}</p>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full ${u.status === 'INVITADO' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                                                <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                                                    {u.status === 'INVITADO' ? 'Invitación Pendiente' : 'Verificado'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 text-gray-500 font-medium">{u.email}</td>
                                <td className="p-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.1em] uppercase border ${u.role?.toUpperCase() === UserRole.GERENTE ? 'bg-red-50 text-red-600 border-red-100' :
                                        u.role?.toUpperCase() === UserRole.PMO ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                            u.role?.toUpperCase() === UserRole.COORDINADOR ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                u.role?.toUpperCase() === UserRole.RRHH ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                    u.role?.toUpperCase() === UserRole.SIG ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        u.role?.toUpperCase() === UserRole.CALIDAD ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                            u.role?.toUpperCase() === UserRole.ASISTENTE ? 'bg-cyan-50 text-cyan-600 border-cyan-100' :
                                                                'bg-gray-100 text-gray-500 border-gray-200'
                                        }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-6 text-right">
                                    <select
                                        disabled={!canEdit || updating === u.id || u.id === user?.uid}
                                        value={u.role}
                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                        className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer hover:bg-gray-50 text-gray-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {Object.values(UserRole).map(r => (
                                            <option key={r} value={r} className="bg-white text-gray-900">{r}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {users.length === 0 && (
                <div className="text-center py-40 bg-white rounded-[2rem] border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Escaneando base de datos de usuarios...</p>
                </div>
            )}

            <UserInviteModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onSuccess={fetchUsers}
            />

            <div className="mt-12 text-center">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest p-4 bg-white inline-block rounded-full border border-gray-100 shadow-sm">
                    Protocolo de Seguridad Nivel 4 Activo
                </p>
            </div>
        </div>
    );
}
