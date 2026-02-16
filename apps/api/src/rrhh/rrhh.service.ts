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
        const firestore = this.firebaseService.getFirestore();

        // 1. Obtener todos los usuarios (accesos)
        const usersSnapshot = await firestore.collection('users').get();
        const usersMap = new Map();
        usersSnapshot.docs.forEach(doc => {
            usersMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        // 2. Obtener todos los empleados (fichas laborales)
        const employeesSnapshot = await firestore.collection('employees').get();
        const employeesMap = new Map();
        employeesSnapshot.docs.forEach(doc => {
            employeesMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        // 3. Unificar: Todos los que están en 'users' son empleados.
        // Si no tienen ficha laboral en 'employees', se usan sus datos de 'users'.
        const unifiedList: any[] = [];

        usersMap.forEach((userData, id) => {
            const employeeData = employeesMap.get(id);
            unifiedList.push({
                ...userData, // Datos de acceso (name, email, role)
                ...(employeeData || {}), // Datos laborales si existen (salary, dni, etc)
                id, // Asegurar id consistente
                hasLaborProfile: !!employeeData // Flag para saber si tiene ficha laboral completa
            });
        });

        // 4. Agregar empleados que NO tienen cuenta de usuario (si existen operarios sin acceso)
        employeesMap.forEach((empData, id) => {
            if (!usersMap.has(id)) {
                unifiedList.push({
                    ...empData,
                    hasLaborProfile: true,
                    hasAccess: false
                });
            }
        });

        return unifiedList;
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
