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
                const idToken = await auth.currentUser?.getIdToken();
                if (!idToken) return;

                const res = await fetch(`${API_URL}/stats/dashboard`, {
                    headers: { Authorization: `Bearer ${idToken}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                } else {
                    setError("Error al cargar estadísticas");
                }
            } catch (err) {
                setError("Fallo de conexión");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [API_URL]);

    return { stats, loading, error };
}
