"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center p-6">
                    <div className="max-w-md w-full glass-card p-10 rounded-[2.5rem] border-red-500/20 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl -mr-16 -mt-16"></div>

                        <div className="mb-6 inline-flex p-4 bg-red-500/10 rounded-3xl border border-red-500/20 text-red-500">
                            <AlertTriangle className="w-10 h-10" />
                        </div>

                        <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter text-white">
                            Algo salió mal
                        </h2>

                        <p className="text-gray-400 font-medium mb-10 leading-relaxed">
                            La aplicación ha detectado un error crítico. Pero no te preocupes, tus datos están seguros.
                        </p>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-primary w-full py-4 flex items-center justify-center gap-2 group"
                                style={{ background: 'linear-gradient(to right, #ef4444, #b91c1c)', border: 'none' }}
                            >
                                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                Reintentar Cargar
                            </button>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full py-4 text-gray-400 hover:text-white font-bold transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                Volver al Inicio
                            </button>
                        </div>

                        {process.env.NODE_ENV === "development" && (
                            <div className="mt-8 pt-8 border-t border-white/5 text-left">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Error Debug:</p>
                                <code className="text-[10px] text-gray-500 block p-4 bg-black/40 rounded-xl overflow-auto max-h-32">
                                    {this.state.error?.message}
                                </code>
                            </div>
                        )}
                    </div>

                    <div className="fixed bottom-8 text-center w-full left-0">
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">Protocolo de Resiliencia Nivel 5 Activado</p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
