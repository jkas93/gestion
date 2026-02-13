"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { AlertCircle, CheckCircle, Info, XCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-4 duration-300 ${toast.type === "success"
                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                : toast.type === "error"
                                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                                    : toast.type === "warning"
                                        ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                                        : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                            }`}
                    >
                        {toast.type === "success" && <CheckCircle className="w-5 h-5" />}
                        {toast.type === "error" && <XCircle className="w-5 h-5" />}
                        {toast.type === "warning" && <AlertCircle className="w-5 h-5" />}
                        {toast.type === "info" && <Info className="w-5 h-5" />}

                        <p className="text-sm font-bold tracking-tight">{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
