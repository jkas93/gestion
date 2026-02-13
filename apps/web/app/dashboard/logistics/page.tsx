"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@erp/shared";
import { Package, ClipboardList, History } from "lucide-react";
import MaterialCatalog from "@/components/logistics/MaterialCatalog";
import RequestsManager from "@/components/logistics/RequestsManager";

export default function LogisticsPage() {
    const { role } = useAuth();
    const [activeTab, setActiveTab] = useState<"catalog" | "requests" | "history">("catalog");

    const canManageCatalog = role === UserRole.GERENTE || role === UserRole.LOGISTICO;
    const canApproveRequests = role === UserRole.GERENTE || role === UserRole.PMO || role === UserRole.COORDINADOR;

    const tabs = [
        { id: "catalog" as const, label: "Catálogo de Materiales", icon: Package },
        { id: "requests" as const, label: "Solicitudes Pendientes", icon: ClipboardList },
        { id: "history" as const, label: "Historial", icon: History },
    ];

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900">Logística</h1>
                <p className="text-gray-500 mt-1">Gestión de materiales y solicitudes</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-bold text-sm transition-colors
                                    ${isActive
                                        ? "border-primary text-primary"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }
                                `}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-500"}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === "catalog" && <MaterialCatalog canManage={canManageCatalog} />}
                {activeTab === "requests" && <RequestsManager canApprove={canApproveRequests} />}
                {activeTab === "history" && (
                    <div className="text-center py-12 text-gray-500">
                        <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Historial de solicitudes próximamente</p>
                    </div>
                )}
            </div>
        </div>
    );
}
