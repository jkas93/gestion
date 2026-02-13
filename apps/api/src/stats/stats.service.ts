import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class StatsService {
    constructor(private firebaseService: FirebaseService) { }

    async getDashboardStats() {
        const firestore = this.firebaseService.getFirestore();

        // 1. Project Stats
        const projectsSnapshot = await firestore.collection('projects').get();
        const projects = projectsSnapshot.docs.map(doc => doc.data());

        const activeProjectsCount = projects.filter(p => p.status === 'ACTIVE').length;
        const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

        // 2. Employee Stats
        const employeesSnapshot = await firestore.collection('employees').get();
        const collaboratorsCount = employeesSnapshot.size;

        // 3. Financial Actual Cost
        const purchasesSnapshot = await firestore.collection('purchases').get();
        const totalActualCost = purchasesSnapshot.docs
            .map(doc => doc.data())
            .filter(p => p.status === 'APROBADO' || p.status === 'PAGADO' || p.status === 'RECIBIDO')
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        // 4. Efficiency (Mocked for now)
        const efficiency = 92;

        return {
            activeProjects: activeProjectsCount,
            totalBudget,
            actualCost: totalActualCost,
            collaborators: collaboratorsCount,
            efficiency,
            timestamp: new Date().toISOString()
        };
    }
}
