import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class RRHHService {
    constructor(private firebaseService: FirebaseService) { }

    async createEmployee(data: any): Promise<string> {
        const id = data.id || this.firebaseService.getFirestore().collection('employees').doc().id;
        const docRef = this.firebaseService.getFirestore().collection('employees').doc(id);

        await docRef.set({
            ...data,
            id,
            createdAt: new Date().toISOString()
        });
        return id;
    }

    async findAllEmployees(): Promise<any[]> {
        const snapshot = await this.firebaseService.getFirestore().collection('employees').get();
        return snapshot.docs.map(doc => doc.data());
    }

    async updateEmployee(id: string, data: any): Promise<void> {
        await this.firebaseService.getFirestore().collection('employees').doc(id).update(data);
    }

    // --- Attendance Management ---
    async recordAttendance(data: any): Promise<string> {
        const firestore = this.firebaseService.getFirestore();
        // Use employeeId + date as a unique composite ID for the record (one entry per day)
        const docId = `${data.employeeId}_${data.date}`;
        const docRef = firestore.collection('attendance').doc(docId);

        await docRef.set({
            ...data,
            id: docId,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return docId;
    }

    async getEmployeeAttendance(employeeId: string): Promise<any[]> {
        const snapshot = await this.firebaseService.getFirestore()
            .collection('attendance')
            .where('employeeId', '==', employeeId)
            .get();
        return snapshot.docs.map(doc => doc.data());
    }

    // --- Incident Management ---
    async createIncident(data: any): Promise<string> {
        const docRef = this.firebaseService.getFirestore().collection('incidents').doc();
        await docRef.set({
            ...data,
            id: docRef.id,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    }

    async findAllIncidents(): Promise<any[]> {
        const snapshot = await this.firebaseService.getFirestore().collection('incidents').get();
        return snapshot.docs.map(doc => doc.data());
    }

    async updateIncidentStatus(id: string, status: string): Promise<void> {
        await this.firebaseService.getFirestore().collection('incidents').doc(id).update({ status });
    }
}
