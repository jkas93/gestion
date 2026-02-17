import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Project, UserRole } from '@erp/shared';

@Injectable()
export class ProjectsService {
    // Caché de permisos en memoria
    private permissionCache = new Map<string, { timestamp: number, hasAccess: boolean }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

    constructor(private firebaseService: FirebaseService) { }

    private getCacheKey(projectId: string, userId: string): string {
        return `${projectId}:${userId}`;
    }

    private checkPermissionCache(projectId: string, userId: string): boolean | null {
        const key = this.getCacheKey(projectId, userId);
        const cached = this.permissionCache.get(key);

        if (!cached) return null;

        // Verificar expiración
        if (Date.now() - cached.timestamp > this.CACHE_TTL) {
            this.permissionCache.delete(key);
            return null;
        }

        return cached.hasAccess;
    }

    private setPermissionCache(projectId: string, userId: string, hasAccess: boolean): void {
        const key = this.getCacheKey(projectId, userId);
        this.permissionCache.set(key, {
            timestamp: Date.now(),
            hasAccess
        });
    }

    async create(projectData: Partial<Project>): Promise<string> {
        const docRef = this.firebaseService.getFirestore().collection('projects').doc();
        const id = docRef.id;

        const newProject = {
            ...projectData,
            id,
            createdAt: new Date().toISOString(),
            status: 'ACTIVE',
        };

        await docRef.set(newProject);
        return id;
    }

    /**
     * Obtiene lista paginada de proyectos
     * @param userId - ID del usuario
     * @param role - Rol del usuario
     * @param limit - Número máximo de proyectos a retornar (default: 20)
     * @param startAfter - ID del documento para iniciar después (cursor)
     * @returns Lista de proyectos con cursor para siguiente página
     */
    async findAll(
        userId: string,
        role: string,
        limit: number = 20,
        startAfter?: string
    ): Promise<{ projects: Project[], nextCursor?: string }> {
        const db = this.firebaseService.getFirestore();
        let query: any = db.collection('projects').orderBy('createdAt', 'desc');

        // RBAC Logic for Listing
        if (role === UserRole.COORDINADOR) {
            query = query.where('coordinatorId', '==', userId);
        } else if (role === UserRole.SUPERVISOR) {
            query = query.where('supervisorId', '==', userId);
        }
        // PMO/GERENTE see everything

        // Paginación
        query = query.limit(limit + 1);
        if (startAfter) {
            const startDoc = await db.collection('projects').doc(startAfter).get();
            if (startDoc.exists) {
                query = query.startAfter(startDoc);
            }
        }

        const snapshot = await query.get();
        const docs = snapshot.docs;

        const hasMore = docs.length > limit;
        const projects = docs.slice(0, limit).map(doc => doc.data() as Project);

        return {
            projects,
            nextCursor: hasMore ? docs[limit - 1].id : undefined
        };
    }

    async findOne(id: string, userId: string, role: string): Promise<Project | null> {
        // Verificar caché primero
        const cachedAccess = this.checkPermissionCache(id, userId);
        if (cachedAccess !== null) {
            if (!cachedAccess) {
                throw new ForbiddenException('No tienes permiso para acceder a este proyecto');
            }
            // Si tiene acceso, buscar proyecto
            return this.findOneRaw(id);
        }

        // Lógica original
        const project = await this.findOneRaw(id);
        if (!project) return null;

        // Verify Assignment
        let hasAccess = false;
        if (role === UserRole.GERENTE || role === UserRole.PMO) {
            hasAccess = true;
        } else if (role === UserRole.COORDINADOR && project.coordinatorId === userId) {
            hasAccess = true;
        } else if (role === UserRole.SUPERVISOR && project.supervisorId === userId) {
            hasAccess = true;
        }

        // Guardar en caché
        this.setPermissionCache(id, userId, hasAccess);

        if (!hasAccess) {
            throw new ForbiddenException('No tienes permiso para acceder a este proyecto');
        }

        return project;
    }

    private async findOneRaw(id: string): Promise<Project | null> {
        const doc = await this.firebaseService.getFirestore().collection('projects').doc(id).get();
        return doc.exists ? (doc.data() as Project) : null;
    }

    async update(id: string, updateData: Partial<Project>, userId: string, role: string): Promise<void> {
        await this.findOne(id, userId, role); // Validate permission
        await this.firebaseService.getFirestore().collection('projects').doc(id).update(updateData);
    }

    // Task Management
    async addTask(projectId: string, taskData: any, userId: string, role: string): Promise<string> {
        await this.findOne(projectId, userId, role); // Validate permission

        const docRef = this.firebaseService.getFirestore()
            .collection('projects')
            .doc(projectId)
            .collection('tasks')
            .doc();

        const newTask = {
            ...taskData,
            id: docRef.id,
            projectId,
            createdAt: new Date().toISOString()
        };

        await docRef.set(newTask);
        return docRef.id;
    }

    async getTasks(projectId: string, userId: string, role: string): Promise<any[]> {
        await this.findOne(projectId, userId, role); // Validate permission

        const snapshot = await this.firebaseService.getFirestore()
            .collection('projects')
            .doc(projectId)
            .collection('tasks')
            .orderBy('order', 'asc')
            .get();

        return snapshot.docs.map(doc => doc.data());
    }

    async updateTask(projectId: string, taskId: string, taskData: any, userId: string, role: string): Promise<void> {
        await this.findOne(projectId, userId, role); // Validate permission

        await this.firebaseService.getFirestore()
            .collection('projects')
            .doc(projectId)
            .collection('tasks')
            .doc(taskId)
            .update(taskData);
    }

    async deleteTask(projectId: string, taskId: string, userId: string, role: string): Promise<void> {
        await this.findOne(projectId, userId, role); // Validate permission

        await this.firebaseService.getFirestore()
            .collection('projects')
            .doc(projectId)
            .collection('tasks')
            .doc(taskId)
            .delete();
    }

    // ========================================
    // MILESTONES / HITOS
    // ========================================

    async createMilestone(
        projectId: string,
        milestoneData: Omit<any, 'id'>,
        userId: string,
        role: string
    ): Promise<string> {
        await this.findOne(projectId, userId, role);

        const db = this.firebaseService.getFirestore();
        const docRef = db.collection('projects')
            .doc(projectId)
            .collection('milestones')
            .doc();

        const milestone = {
            ...milestoneData,
            id: docRef.id
        };

        await docRef.set(milestone);
        return docRef.id;
    }

    async getMilestones(
        projectId: string,
        userId: string,
        role: string
    ): Promise<any[]> {
        await this.findOne(projectId, userId, role);

        const db = this.firebaseService.getFirestore();
        const snapshot = await db.collection('projects')
            .doc(projectId)
            .collection('milestones')
            .orderBy('order', 'asc')
            .get();

        return snapshot.docs.map(doc => doc.data());
    }

    async updateMilestoneStatus(
        projectId: string,
        milestoneId: string,
        status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
        userId: string,
        role: string
    ): Promise<void> {
        await this.findOne(projectId, userId, role);

        const db = this.firebaseService.getFirestore();
        await db.collection('projects')
            .doc(projectId)
            .collection('milestones')
            .doc(milestoneId)
            .update({ status });
    }

    // ========================================
    // PROJECT HEALTH DASHBOARD
    // ========================================

    async getProjectHealth(
        projectId: string,
        userId: string,
        role: string
    ): Promise<{
        progressPercentage: number;
        budgetHealth: 'GOOD' | 'WARNING' | 'CRITICAL';
        scheduleHealth: 'ON_TIME' | 'AT_RISK' | 'DELAYED';
        tasksCompleted: number;
        tasksTotal: number;
    }> {
        const project = await this.findOne(projectId, userId, role);
        if (!project) throw new NotFoundException('Proyecto no encontrado');

        const db = this.firebaseService.getFirestore();
        const tasksSnapshot = await db.collection('projects')
            .doc(projectId)
            .collection('tasks')
            .get();

        const tasks = tasksSnapshot.docs.map(doc => doc.data());
        const completedTasks = tasks.filter(t =>
            t.status === 'COMPLETED' || t.progress === 100
        ).length;
        const progressPercentage = tasks.length > 0
            ? Math.round((completedTasks / tasks.length) * 100)
            : 0;

        let budgetHealth: 'GOOD' | 'WARNING' | 'CRITICAL' = 'GOOD';
        if (project.resources) {
            const budgetUsed = (project.resources.budgetSpent / project.resources.budgetAllocated) * 100;
            if (budgetUsed > 100) budgetHealth = 'CRITICAL';
            else if (budgetUsed > 80) budgetHealth = 'WARNING';
        }

        let scheduleHealth: 'ON_TIME' | 'AT_RISK' | 'DELAYED' = 'ON_TIME';
        if (project.endDate) {
            const now = new Date();
            const endDate = new Date(project.endDate);
            const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

            if (now > endDate && progressPercentage < 100) {
                scheduleHealth = 'DELAYED';
            } else if (progressPercentage < 50 && daysRemaining < 7 && daysRemaining > 0) {
                scheduleHealth = 'AT_RISK';
            }
        }

        return {
            progressPercentage,
            budgetHealth,
            scheduleHealth,
            tasksCompleted: completedTasks,
            tasksTotal: tasks.length
        };
    }
}
