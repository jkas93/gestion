"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Circle, Clock, Target } from 'lucide-react';

/**
 * ============================================================================
 * COMPONENTES REUTILIZABLES PARA EL MÓDULO DE PROYECTOS (PREMIUM UI)
 * ============================================================================
 */


// --- 1. HEALTH DONUT CHART ---
interface HealthDonutChartProps {
    percentage: number;
    colorClass?: string;
    size?: number;
    showLabel?: boolean;
}

export function HealthDonutChart({
    percentage,
    colorClass = "text-emerald-500",
    size = 120,
    showLabel = true
}: HealthDonutChartProps) {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Fondo del anillo */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-gray-100"
                />
                {/* Progreso */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={cn("transition-all duration-1000 ease-out", colorClass)}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-3xl font-black tracking-tighter", colorClass.replace('text-', 'text-'))}>
                    {percentage}%
                </span>
                {showLabel && (
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        AVANCE
                    </span>
                )}
            </div>
        </div>
    );
}

// --- 2. STATUS BADGE ---
interface StatusBadgeProps {
    status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'DELAYED' | string;
    showIcon?: boolean;
}

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
    const getStyles = () => {
        switch (status) {
            case 'COMPLETED':
            case 'COMPLETADO':
                return {
                    bg: 'bg-emerald-500/10',
                    text: 'text-emerald-600',
                    border: 'border-emerald-500/20',
                    icon: CheckCircle2
                };
            case 'IN_PROGRESS':
            case 'EN_PROGRESO':
                return {
                    bg: 'bg-blue-500/10',
                    text: 'text-blue-600',
                    border: 'border-blue-500/20',
                    icon: Clock
                };
            case 'DELAYED':
            case 'AT_RISK':
            case 'RETRASADO':
                return {
                    bg: 'bg-amber-500/10',
                    text: 'text-amber-600',
                    border: 'border-amber-500/20',
                    icon: AlertCircle
                };
            case 'CANCELADO':
                return {
                    bg: 'bg-red-500/10',
                    text: 'text-red-600',
                    border: 'border-red-500/20',
                    icon: AlertCircle
                };
            default: // PENDING
                return {
                    bg: 'bg-gray-500/10',
                    text: 'text-gray-600',
                    border: 'border-gray-500/20',
                    icon: Circle
                };
        }
    };

    const styles = getStyles();
    const Icon = styles.icon;

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors",
            styles.bg,
            styles.text,
            styles.border
        )}>
            {showIcon && <Icon className="w-3 h-3" />}
            {status.replace('_', ' ')}
        </span>
    );
}

// --- 3. MILESTONE MARKER ---
interface MilestoneMarkerProps {
    date: string; // ISO String
    label: string;
    isCompleted?: boolean;
    positionLeft?: number; // % de posición en timeline si es absoluto, o null si es relativo
}

export function MilestoneMarker({ date, label, isCompleted = false, positionLeft }: MilestoneMarkerProps) {
    return (
        <div
            className="flex flex-col items-center group cursor-pointer"
            style={positionLeft !== undefined ? { position: 'absolute', left: `${positionLeft}%`, top: 0, bottom: 0 } : {}}
            title={`${label} - ${new Date(date).toLocaleDateString()}`}
        >
            {/* Línea vertical (si es absoluto en Gantt) */}
            {positionLeft !== undefined && (
                <div className="w-px h-full bg-primary/20 border-r border-dashed border-primary/40 group-hover:bg-primary/60 transition-colors" />
            )}

            {/* Diamante */}
            <div className={cn(
                "w-4 h-4 rotate-45 border-2 z-10 transition-all duration-300 shadow-sm",
                isCompleted
                    ? "bg-primary border-primary shadow-primary/30 scale-110"
                    : "bg-white border-primary/60 group-hover:border-primary group-hover:scale-110",
                positionLeft !== undefined ? "absolute top-8" : ""
            )}>
                {isCompleted && (
                    <div className="w-full h-full -rotate-45 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                )}
            </div>

            {/* Etiqueta (visible solo en hover o si hay espacio) */}
            <div className={cn(
                "mt-2 px-2 py-1 bg-white/90 backdrop-blur-sm border border-primary/20 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap",
                positionLeft !== undefined ? "absolute top-14" : ""
            )}>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{label}</p>
                <p className="text-[10px] font-medium text-gray-500">{new Date(date).toLocaleDateString()}</p>
            </div>
        </div>
    );
}

// --- 4. PROJECT HEALTH INDICATOR ---

interface ProjectHealthIndicatorProps {
    type: 'BUDGET' | 'SCHEDULE';
    status: 'GOOD' | 'WARNING' | 'CRITICAL' | 'ON_TIME' | 'AT_RISK' | 'DELAYED';
    value: string; // Texto a mostrar (ej. "$50k / $100k" o "2 días de retraso")
}

export function ProjectHealthIndicator({ type, status, value }: ProjectHealthIndicatorProps) {
    const getColor = () => {
        if (['GOOD', 'ON_TIME'].includes(status)) return 'bg-emerald-500';
        if (['WARNING', 'AT_RISK'].includes(status)) return 'bg-amber-500';
        return 'bg-destructive'; // CRITICAL / DELAYED
    };

    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-3">
                <div className={cn("w-2 h-8 rounded-full", getColor())} />
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {type === 'BUDGET' ? 'Presupuesto' : 'Cronograma'}
                    </p>
                    <p className="font-bold text-gray-900 text-sm whitespace-nowrap">{value}</p>
                </div>
            </div>
            <div className={cn(
                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ml-2",
                getColor().replace('bg-', 'text-').replace('500', '600'),
                getColor().replace('bg-', 'bg-').replace('500', '500/10')
            )}>
                {status.replace('_', ' ')}
            </div>
        </div>
    );
}
