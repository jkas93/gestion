import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { ProgressLog, CreateProgressLogDto } from '@erp/shared';

@Injectable()
export class ProgressLogsService {
    constructor(private firebaseService: FirebaseService) { }

    async create(projectId: string, logData: CreateProgressLogDto, recordedBy: string): Promise<string> {
        const firestore = this.firebaseService.getFirestore();
        const batch = firestore.batch();

        // 1. Create the historical log entry
        const logRef = firestore.collection('projects').doc(projectId).collection('progress_logs').doc();
        const newLog: ProgressLog = {
            ...logData,
            id: logRef.id,
            recordedBy,
            createdAt: new Date().toISOString(),
        };
        batch.set(logRef, newLog);

        // 2. Update the task's current progress
        const taskRef = firestore.collection('projects').doc(projectId).collection('tasks').doc(logData.taskId);
        batch.update(taskRef, { progress: logData.progressPercentage });

        await batch.commit();
        return logRef.id;
    }

    async findByProject(projectId: string): Promise<ProgressLog[]> {
        const snapshot = await this.firebaseService.getFirestore()
            .collection('projects')
            .doc(projectId)
            .collection('progress_logs')
            .orderBy('date', 'asc')
            .get();

        return snapshot.docs.map(doc => doc.data() as ProgressLog);
    }

    async findByTask(projectId: string, taskId: string): Promise<ProgressLog[]> {
        const snapshot = await this.firebaseService.getFirestore()
            .collection('projects')
            .doc(projectId)
            .collection('progress_logs')
            .where('taskId', '==', taskId)
            .orderBy('date', 'asc')
            .get();

        return snapshot.docs.map(doc => doc.data() as ProgressLog);
    }
}
