export enum UserRole {
    GERENTE = "GERENTE",
    PMO = "PMO",
    COORDINADOR = "COORDINADOR",
    SUPERVISOR = "SUPERVISOR",
    RRHH = "RRHH",
    LOGISTICO = "LOGISTICO",
    ASISTENTE = "ASISTENTE",
    SIG = "SIG",
    CALIDAD = "CALIDAD",
    OPERARIO = "OPERARIO",
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
}

export enum TaskType {
    ITEM = "ITEM",
    SUB_ITEM = "SUB_ITEM",
    AREA = "AREA",
    ACTIVITY = "ACTIVITY",
}

export interface ProjectTask {
    id: string;
    projectId: string;
    parentId: string | null;
    title: string;
    description?: string;
    type: TaskType;
    startDate: string; // ISO String
    endDate: string;   // ISO String
    progress: number;  // 0-100
    order: number;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    status: "ACTIVE" | "PAUSED" | "COMPLETED";
    coordinatorId: string;
    supervisorId: string | null;
    createdAt: string;
}

export interface Material {
    id: string;
    name: string;
    unit: string;
    category: string;
    description?: string;
    unitPrice?: number;
}

export interface MaterialRequestItem {
    materialId: string;
    materialName?: string;
    quantity: number;
    notes?: string;
}

export interface MaterialRequest {
    id: string;
    projectId: string;
    supervisorId: string;
    date: string;
    status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'ENTREGADO';
    items: MaterialRequestItem[];
    rejectionReason?: string;
    createdAt: string;
}
