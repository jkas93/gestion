"use client";

import { useState, useEffect } from "react";
import { MaterialRequest } from "@erp/shared";
import { CheckCircle, XCircle, Clock, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RequestsManagerProps {
    canApprove: boolean;
}

export default function RequestsManager({ canApprove }: RequestsManagerProps) {
    const { user } = useAuth();
    const [requests, setRequests] = useState<MaterialRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"ALL" | "PENDIENTE" | "APROBADO" | "RECHAZADO">("PENDIENTE");

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            // TODO: Implement endpoint to get all requests (not just by project)
            // For now, this is a placeholder
            setRequests([]);
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId: string) => {
        if (!confirm("¿Aprobar esta solicitud?")) return;

        try {
            const token = await user?.getIdToken();
            const res = await fetch(`${API_URL}/material-requests/${requestId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'APROBADO' })
            });

            if (res.ok) {
                alert('✅ Solicitud aprobada');
                fetchRequests();
            } else {
                alert('Error al aprobar la solicitud');
            }
        } catch (error) {
            console.error('Error approving request:', error);
            alert('Error al aprobar la solicitud');
        }
    };

    const handleReject = async (requestId: string) => {
        const reason = prompt("Motivo del rechazo:");
        if (!reason) return;

        try {
            const token = await user?.getIdToken();
            const res = await fetch(`${API_URL}/material-requests/${requestId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'RECHAZADO', rejectionReason: reason })
            });

            if (res.ok) {
                alert('✅ Solicitud rechazada');
                fetchRequests();
            } else {
                alert('Error al rechazar la solicitud');
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('Error al rechazar la solicitud');
        }
    };

    const filteredRequests = filter === "ALL" ? requests : requests.filter(r => r.status === filter);

    const getStatusIcon = (status: MaterialRequest['status']) => {
        switch (status) {
            case 'PENDIENTE': return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'APROBADO': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'RECHAZADO': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'ENTREGADO': return <Package className="w-5 h-5 text-blue-500" />;
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-gray-500">Cargando solicitudes...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-2">
                {(['ALL', 'PENDIENTE', 'APROBADO', 'RECHAZADO'] as const).map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${filter === status
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {status === 'ALL' ? 'Todas' : status}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No hay solicitudes {filter !== 'ALL' && filter.toLowerCase()}</p>
                    </div>
                ) : (
                    filteredRequests.map((request) => (
                        <div key={request.id} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(request.status)}
                                        <span className="font-bold text-gray-900">Solicitud #{request.id.slice(0, 8)}</span>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${request.status === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                                                request.status === 'APROBADO' ? 'bg-green-100 text-green-800' :
                                                    request.status === 'RECHAZADO' ? 'bg-red-100 text-red-800' :
                                                        'bg-blue-100 text-blue-800'
                                            }`}>
                                            {request.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Proyecto: {request.projectId} • {new Date(request.date).toLocaleDateString()}
                                    </p>
                                </div>

                                {canApprove && request.status === 'PENDIENTE' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(request.id)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors text-sm"
                                        >
                                            Aprobar
                                        </button>
                                        <button
                                            onClick={() => handleReject(request.id)}
                                            className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors text-sm"
                                        >
                                            Rechazar
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Items */}
                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Materiales Solicitados</p>
                                <div className="space-y-2">
                                    {request.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                                            <div>
                                                <p className="font-bold text-sm text-gray-900">{item.materialName || item.materialId}</p>
                                                {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
                                            </div>
                                            <span className="font-bold text-primary">{item.quantity} und</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Rejection Reason */}
                            {request.status === 'RECHAZADO' && request.rejectionReason && (
                                <div className="border-t border-gray-200 pt-4">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Motivo del Rechazo</p>
                                    <p className="text-sm text-red-600">{request.rejectionReason}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
