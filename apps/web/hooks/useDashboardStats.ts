import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase/clientApp';

export interface DashboardStats {
    activeProjects: number;
    totalBudget: number;
    actualCost: number;
    collaborators: number;
    efficiency: number;
}

export function useDashboardStats() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);

                const idToken = await auth.currentUser?.getIdToken();
                if (!idToken) {
                    setError("Sesión no iniciada");
                    setLoading(false);
                    return;
                }

                const res = await fetch(`${API_URL}/stats/dashboard`, {
                    headers: { Authorization: `Bearer ${idToken}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                } else {
                    const errorBody = await res.json().catch(() => ({}));
                    setError(errorBody.message || "Error al cargar estadísticas");
                }
            } catch (err) {
                console.error("API Connection Error:", err);
                setError("No se pudo conectar con el servidor central");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [API_URL]);

    return { stats, loading, error };
}
