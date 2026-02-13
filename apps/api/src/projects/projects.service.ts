import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Project, UserRole } from '@erp/shared';

@Injectable()
export class ProjectsService {
    constructor(private firebaseService: FirebaseService) { }

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

    async findAll(userId: string, role: string): Promise<Project[]> {
        let query: any = this.firebaseService.getFirestore().collection('projects');

        // RBAC Logic for Listing: 
        if (role === UserRole.COORDINADOR) {
            query = query.where('coordinatorId', '==', userId);
        } else if (role === UserRole.SUPERVISOR) {
            query = query.where('supervisorId', '==', userId);
        }
        // PMO/GERENTE see everything (default query)

        const snapshot = await query.get();
        return snapshot.docs.map(doc => doc.data() as Project);
    }

    async findOne(id: string, userId: string, role: string): Promise<Project | null> {
        const project = await this.findOneRaw(id);
        if (!project) return null;

        // Verify Assignment
        if (role === UserRole.GERENTE || role === UserRole.PMO) return project;
        if (role === UserRole.COORDINADOR && project.coordinatorId === userId) return project;
        if (role === UserRole.SUPERVISOR && project.supervisorId === userId) return project;

        throw new Error('No tienes permiso para acceder a este proyecto');
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
}
