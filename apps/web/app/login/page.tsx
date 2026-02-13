"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/clientApp";
import { UserRole } from "@erp/shared";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.SUPERVISOR);
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            if (isRegister) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Initialize profile in backend
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/users/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        uid: user.uid,
                        email: user.email,
                        name: email.split('@')[0], // Default name from email
                        role: selectedRole
                    }),
                });

                if (!response.ok) {
                    throw new Error('Error al inicializar el perfil del usuario');
                }
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            window.location.href = "/dashboard"; // Redirect to dashboard
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-background animate-mesh flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 -right-20 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="relative w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary to-yellow-600 rounded-2xl p-0.5 shadow-lg shadow-yellow-500/20">
                        <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-600 tracking-tighter">GT</span>
                        </div>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
                        {isRegister ? "Inicializar Sistema" : "Acceso Corporativo"}
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">
                        {isRegister ? "Configuración de perfil administrativo" : "Suite de Gestión Golden Tower v2.0"}
                    </p>
                </div>

                <form className="space-y-6" onSubmit={(e) => {
                    e.preventDefault();
                    // Original logic wrapper
                    handleSubmit(e);
                }}>
                    <div className="space-y-4">
                        <div className="group">
                            <input
                                type="email"
                                required
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 font-medium placeholder:text-gray-400"
                                placeholder="identidad@goldentower.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="group">
                            <input
                                type="password"
                                required
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 font-medium placeholder:text-gray-400"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {isRegister && (
                            <div className="group animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Cargo / Rol en la Empresa</label>
                                <select
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 font-medium appearance-none cursor-pointer"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                                >
                                    <option value={UserRole.GERENTE} className="bg-white">GERENTE (Acceso Total)</option>
                                    <option value={UserRole.PMO} className="bg-white">PMO (Oficina de Proyectos)</option>
                                    <option value={UserRole.COORDINADOR} className="bg-white">COORDINADOR (Líder de Obra)</option>
                                    <option value={UserRole.SUPERVISOR} className="bg-white">SUPERVISOR (Campo)</option>
                                    <option value={UserRole.RRHH} className="bg-white">RRHH (Recursos Humanos)</option>
                                    <option value={UserRole.ASISTENTE} className="bg-white">ASISTENTE (Administrativo)</option>
                                    <option value={UserRole.SIG} className="bg-white">SIG (Sist. Integrado Gestión)</option>
                                    <option value={UserRole.CALIDAD} className="bg-white">CALIDAD (Control Calidad)</option>
                                    <option value={UserRole.OPERARIO} className="bg-white">OPERARIO (Técnico/Campo)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-50 text-center border border-red-100">
                            <p className="text-xs font-bold text-red-600 uppercase tracking-wide">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary w-full py-4 text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                        {isRegister ? "Registrar Credenciales" : "Autenticar"}
                    </button>

                    <div className="pt-4 text-center">
                        <button
                            type="button"
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-xs font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-widest hover:underline underline-offset-4"
                        >
                            {isRegister ? "Volver al Login" : "¿Primera vez? Crear cuenta"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="absolute bottom-6 text-center w-full pointer-events-none">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">Secure Auth Override • System Ready</p>
            </div>
        </div>
    );
}
