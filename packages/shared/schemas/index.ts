import { z } from 'zod';
import { UserRole } from '../types';

export const ProjectSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
    description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
    status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED']).default('ACTIVE'),
    coordinatorId: z.string().min(1, 'El coordinador es requerido'),
    supervisorId: z.string().min(1, 'El supervisor es requerido'),
});

export type CreateProjectDto = z.infer<typeof ProjectSchema>;

export const EmployeeSchema = z.object({
    name: z.string().min(2, 'El nombre es obligatorio'),
    lastName: z.string().min(2, 'Los apellidos son obligatorios'),
    dni: z.string().min(8, 'DNI o CE inválido').max(12),
    email: z.string().email('Email institucional inválido'),
    birthDate: z.string().optional(),
    contractStart: z.string().min(1, 'Fecha de inicio requerida'),
    contractEnd: z.string().optional(),
    salary: z.coerce.number().optional(),
    pensionSystem: z.enum(['SNP', 'AFP']).optional(),
    role: z.nativeEnum(UserRole),
});

export type CreateEmployeeDto = z.infer<typeof EmployeeSchema>;

export const UserRegistrationSchema = z.object({
    uid: z.string().min(1),
    email: z.string().email(),
    name: z.string().min(1),
});

export const UserRoleSchema = z.object({
    uid: z.string().min(1),
    role: z.nativeEnum(UserRole),
});

export const CategoryEnum = z.enum(["PRELIMINARES", "ESTRUCTURA", "ALBAÑILERIA", "ACABADOS", "INSTALACIONES", "EXTERIORES", "OTROS"]);

export const ActivityMasterSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    description: z.string().optional(),
    defaultDuration: z.coerce.number().min(1, "La duración mínima es 1 día").default(1),
    category: CategoryEnum.default("OTROS"),
});

export type ActivityMaster = z.infer<typeof ActivityMasterSchema> & { id: string, createdAt: string };
export type CreateActivityMasterDto = z.infer<typeof ActivityMasterSchema>;

export const ProgressLogSchema = z.object({
    taskId: z.string().min(1, 'El ID de la tarea es requerido'),
    projectId: z.string().min(1, 'El ID del proyecto es requerido'),
    date: z.string().min(1, 'La fecha es requerida'), // YYYY-MM-DD
    progressPercentage: z.coerce.number().min(0).max(100, 'El progreso no puede exceder el 100%'),
    notes: z.string().optional(),
    recordedBy: z.string().optional(),
    photoUrls: z.array(z.string()).max(3, "Máximo 3 fotos por reporte").optional(),
});

export type ProgressLog = z.infer<typeof ProgressLogSchema> & { id: string, createdAt: string };
export type CreateProgressLogDto = z.infer<typeof ProgressLogSchema>;

// --- RRHH Advanced Schemas ---

export const AttendanceSchema = z.object({
    employeeId: z.string().min(1, 'ID de empleado requerido'),
    date: z.string().min(1), // YYYY-MM-DD
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    status: z.enum(['PRESENTE', 'TARDE', 'FALTA', 'PERMISO']).default('PRESENTE'),
    notes: z.string().optional(),
});

export type Attendance = z.infer<typeof AttendanceSchema> & { id: string };
export type CreateAttendanceDto = z.infer<typeof AttendanceSchema>;

export const IncidentSchema = z.object({
    employeeId: z.string().min(1, 'ID de empleado requerido'),
    type: z.enum(['VACACIONES', 'PERMISO_MEDICO', 'FALTA_JUSTIFICADA', 'OTRO']),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    description: z.string().min(5, 'Descripción demasiado corta'),
    status: z.enum(['PENDIENTE', 'APROBADO', 'RECHAZADO']).default('PENDIENTE'),
});

export type Incident = z.infer<typeof IncidentSchema> & { id: string, createdAt: string };
export type CreateIncidentDto = z.infer<typeof IncidentSchema>;
// --- Finance & Cost Control Schemas ---

export const PurchaseSchema = z.object({
    projectId: z.string().min(1, 'ID de proyecto requerido'),
    taskId: z.string().optional(), // Opcional: vinculado a una actividad específica
    description: z.string().min(5, 'Descripción demasiado corta'),
    provider: z.string().min(2, 'Proveedor requerido'),
    amount: z.coerce.number().positive('El monto debe ser positivo'),
    currency: z.enum(['USD', 'PEN']).default('PEN'),
    status: z.enum(['PENDIENTE', 'APROBADO', 'PAGADO', 'RECIBIDO']).default('PENDIENTE'),
    invoiceNumber: z.string().optional(),
    date: z.string().min(1), // YYYY-MM-DD
});

export type Purchase = z.infer<typeof PurchaseSchema> & { id: string; createdAt: string; updatedAt?: string };
export type CreatePurchaseDto = z.infer<typeof PurchaseSchema>;

export const MaterialSchema = z.object({
    name: z.string().min(2, 'Nombre del material requerido'),
    unit: z.string().min(1, 'Unidad de medida requerida'), // e.g., 'UND', 'M3', 'KG'
    category: CategoryEnum.default('OTROS'),
    description: z.string().optional(),
    unitPrice: z.coerce.number().optional(),
});

export type Material = z.infer<typeof MaterialSchema> & { id: string };
export type CreateMaterialDto = z.infer<typeof MaterialSchema>;

export const MaterialRequestItemSchema = z.object({
    materialId: z.string().min(1, 'Material requerido'),
    materialName: z.string().optional(), // Denormalized for display
    quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
    notes: z.string().optional(),
});

export const MaterialRequestSchema = z.object({
    projectId: z.string().min(1, 'Proyecto requerido'),
    supervisorId: z.string().min(1, 'Supervisor requerido'),
    date: z.string().default(() => new Date().toISOString()),
    status: z.enum(['PENDIENTE', 'APROBADO', 'RECHAZADO', 'ENTREGADO']).default('PENDIENTE'),
    items: z.array(MaterialRequestItemSchema).min(1, 'Debe solicitar al menos un ítem'),
    rejectionReason: z.string().optional(),
});

export type MaterialRequest = z.infer<typeof MaterialRequestSchema> & { id: string, createdAt: string };
export type MaterialRequestItem = z.infer<typeof MaterialRequestItemSchema>;
export type CreateMaterialRequestDto = z.infer<typeof MaterialRequestSchema>;
