"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@erp/shared";
import { auth } from "@/lib/firebase/clientApp";
import { useToast } from "@/hooks/useToast";
import {
    ChevronLeft,
    Search,
    Trash2,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Database
} from "lucide-react";

interface AnalysisResult {
    hasDuplicates: boolean;
    summary: {
        totalEmployees: number;
        dniDuplicatesCount: number;
        emailDuplicatesCount: number;
        totalRecordsToDelete: number;
    };
    dniDuplicates: any[];
    emailDuplicates: any[];
}

interface CleanupResult {
    deleted: number;
    details: {
        deletedByDni: number;
        deletedByEmail: number;
        records: any[];
    };
    message: string;
}

export default function DatabaseMaintenancePage() {
    const router = useRouter();
    const { role } = useAuth();
    const { showToast } = useToast();

    const [analyzing, setAnalyzing] = useState(false);
    const [cleaning, setCleaning] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    // Verificar permisos
    if (role !== UserRole.GERENTE) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Acceso Denegado</h2>
                    <p className="text-gray-500 mt-2">Solo el GERENTE puede acceder a esta página</p>
                </div>
            </div>
        );
    }

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setCleanupResult(null);

        try {
            const user = auth.currentUser;
            if (!user) return;
            const idToken = await user.getIdToken();

            const res = await fetch(`${API_URL}/rrhh/maintenance/analyze-duplicates`, {
                headers: { Authorization: `Bearer ${idToken}` },
            });

            if (res.ok) {
                const data = await res.json();
                setAnalysis(data);

                if (data.hasDuplicates) {
                    showToast("Análisis completado. Se encontraron duplicados.", "warning");
                } else {
                    showToast("La base de datos está limpia. No hay duplicados.", "success");
                }
            } else {
                showToast("Error al analizar la base de datos", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Error de conexión", "error");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleCleanup = async () => {
        if (!window.confirm("⚠️ ADVERTENCIA: Esta acción eliminará permanentemente los registros duplicados. ¿Estás seguro?")) {
            return;
        }

        setCleaning(true);

        try {
            const user = auth.currentUser;
            if (!user) return;
            const idToken = await user.getIdToken();

            const res = await fetch(`${API_URL}/rrhh/maintenance/cleanup-duplicates`, {
                method: "POST",
                headers: { Authorization: `Bearer ${idToken}` },
            });

            if (res.ok) {
                const data = await res.json();
                setCleanupResult(data);
                setAnalysis(null); // Clear analysis after cleanup
                showToast(data.message, "success");
            } else {
                showToast("Error al limpiar duplicados", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Error de conexión", "error");
        } finally {
            setCleaning(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center gap-4 border-b border-border/60 pb-8">
                <button
                    onClick={() => router.back()}
                    className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-900"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-gray-900 uppercase flex items-center gap-3">
                        <Database className="w-10 h-10 text-primary" />
                        Mantenimiento de <span className="text-primary">Base de Datos</span>
                    </h1>
                    <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px] mt-1">
                        Análisis y limpieza de registros duplicados
                    </p>
                </div>
            </header>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="btn-secondary flex items-center gap-2 px-6 py-4 disabled:opacity-50"
                >
                    <Search className="w-5 h-5" />
                    {analyzing ? "Analizando..." : "Analizar Duplicados"}
                </button>

                {analysis?.hasDuplicates && (
                    <button
                        onClick={handleCleanup}
                        disabled={cleaning}
                        className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all disabled:opacity-50"
                    >
                        <Trash2 className="w-5 h-5" />
                        {cleaning ? "Limpiando..." : "Limpiar Duplicados"}
                    </button>
                )}
            </div>

            {/* Analysis Results */}
            {analysis && (
                <div className="glass-card p-10 rounded-[2.5rem] border border-gray-100 shadow-xl bg-white space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold uppercase tracking-tighter">Resultado del Análisis</h2>
                        {analysis.hasDuplicates ? (
                            <AlertTriangle className="w-8 h-8 text-amber-500" />
                        ) : (
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        )}
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                            <div className="text-3xl font-black text-gray-900">{analysis.summary.totalEmployees}</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">Total Empleados</div>
                        </div>
                        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                            <div className="text-3xl font-black text-amber-600">{analysis.summary.dniDuplicatesCount}</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mt-1">DNIs Duplicados</div>
                        </div>
                        <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                            <div className="text-3xl font-black text-red-600">{analysis.summary.emailDuplicatesCount}</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-red-400 mt-1">Emails Duplicados</div>
                        </div>
                        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                            <div className="text-3xl font-black text-purple-600">{analysis.summary.totalRecordsToDelete}</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-purple-400 mt-1">A Eliminar</div>
                        </div>
                    </div>

                    {/* DNI Duplicates */}
                    {analysis.dniDuplicates.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold uppercase tracking-tighter text-red-600">DNIs Duplicados</h3>
                            {analysis.dniDuplicates.map((dup, i) => (
                                <div key={i} className="bg-red-50 rounded-2xl p-6 border border-red-100">
                                    <div className="font-bold text-red-900 mb-4">
                                        DNI: {dup.dni} ({dup.count} registros, eliminar {dup.toDelete})
                                    </div>
                                    <div className="space-y-2">
                                        {dup.records.map((rec: any, j: number) => (
                                            <div
                                                key={j}
                                                className={`flex items-center justify-between p-3 rounded-xl ${rec.willKeep ? 'bg-emerald-100 border border-emerald-200' : 'bg-white border border-red-200'
                                                    }`}
                                            >
                                                <div>
                                                    <div className="font-bold text-sm">{rec.name}</div>
                                                    <div className="text-xs text-gray-500">{rec.email} • {rec.createdAt || 'Sin fecha'}</div>
                                                </div>
                                                {rec.willKeep ? (
                                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-600" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Email Duplicates */}
                    {analysis.emailDuplicates.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold uppercase tracking-tighter text-blue-600">Emails Duplicados</h3>
                            {analysis.emailDuplicates.map((dup, i) => (
                                <div key={i} className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                                    <div className="font-bold text-blue-900 mb-4">
                                        Email: {dup.email} ({dup.count} registros, eliminar {dup.toDelete})
                                    </div>
                                    <div className="space-y-2">
                                        {dup.records.map((rec: any, j: number) => (
                                            <div
                                                key={j}
                                                className={`flex items-center justify-between p-3 rounded-xl ${rec.willKeep ? 'bg-emerald-100 border border-emerald-200' : 'bg-white border border-blue-200'
                                                    }`}
                                            >
                                                <div>
                                                    <div className="font-bold text-sm">{rec.name}</div>
                                                    <div className="text-xs text-gray-500">{rec.dni} • {rec.createdAt || 'Sin fecha'}</div>
                                                </div>
                                                {rec.willKeep ? (
                                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-blue-600" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Cleanup Results */}
            {cleanupResult && (
                <div className="glass-card p-10 rounded-[2.5rem] border border-emerald-200 shadow-xl bg-emerald-50 space-y-6">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                        <div>
                            <h2 className="text-2xl font-bold uppercase tracking-tighter text-emerald-900">Limpieza Completada</h2>
                            <p className="text-emerald-600 font-medium">{cleanupResult.message}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl p-6 border border-emerald-100">
                            <div className="text-3xl font-black text-emerald-600">{cleanupResult.deleted}</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">Total Eliminados</div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border border-emerald-100">
                            <div className="text-3xl font-black text-emerald-600">{cleanupResult.details.deletedByDni}</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">Por DNI</div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border border-emerald-100">
                            <div className="text-3xl font-black text-emerald-600">{cleanupResult.details.deletedByEmail}</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">Por Email</div>
                        </div>
                    </div>

                    {cleanupResult.details.records.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 border border-emerald-100">
                            <h3 className="font-bold text-emerald-900 mb-4 uppercase tracking-tighter">Registros Eliminados</h3>
                            <div className="space-y-2 max-h-96 overflow-auto">
                                {cleanupResult.details.records.map((rec, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex-1">
                                            <div className="font-bold text-sm text-gray-900">{rec.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {rec.reason} • DNI: {rec.dni || 'N/A'} • Email: {rec.email || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-400">ID: {rec.id}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
