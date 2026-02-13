"use client";

import { useState } from "react";
import { UserRole } from "@erp/shared";
import { X, Mail, User, Shield, Send } from "lucide-react";
import { auth } from "@/lib/firebase/clientApp";
import { useToast } from "@/hooks/useToast";

interface UserInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UserInviteModal({ isOpen, onClose, onSuccess }: UserInviteModalProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        role: UserRole.SUPERVISOR
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await fetch(`${API_URL}/users/invite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const data = await res.json();
                showToast("Invitación enviada exitosamente", "success");

                // En un entorno real, enviaríamos el link por email. 
                // Para propósitos didácticos y desarrollo, lo mostramos o registramos.
                console.log("Link de acceso:", data.resetLink);

                onSuccess();
                onClose();
            } else {
                const error = await res.json();
                showToast(error.message || "Error al invitar al usuario", "error");
            }
        } catch (error) {
            showToast("Error de conexión", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl relative overflow-hidden">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                <div className="flex justify-between items-start mb-8 relative">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tighter text-gray-900 uppercase">
                            Invitar <span className="text-primary">Colaborador</span>
                        </h2>
                        <p className="text-gray-500 text-sm font-medium mt-1">Se enviará un correo de bienvenida.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative">
                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                required
                                placeholder="Nombre Completo"
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                required
                                type="email"
                                placeholder="Correo Institucional"
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="relative">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-10 py-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 font-medium appearance-none cursor-pointer"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                title="Cargo / Rol"
                            >
                                {Object.values(UserRole).map(role => (
                                    <option key={role} value={role} className="bg-white">
                                        {role}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 text-gray-500 hover:text-gray-900 font-bold transition-all text-xs uppercase tracking-widest"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] btn-primary py-4 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Enviar Invitación
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
