import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Purchase } from '@erp/shared';

@Injectable()
export class FinanceService {
    constructor(private firebaseService: FirebaseService) { }

    async createPurchase(data: any): Promise<string> {
        const firestore = this.firebaseService.getFirestore();
        const docRef = firestore.collection('purchases').doc();

        await docRef.set({
            ...data,
            id: docRef.id,
            createdAt: new Date().toISOString()
        });

        return docRef.id;
    }

    async findAllPurchases(): Promise<any[]> {
        const snapshot = await this.firebaseService.getFirestore().collection('purchases').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => doc.data());
    }

    async findPurchasesByProject(projectId: string): Promise<any[]> {
        const snapshot = await this.firebaseService.getFirestore()
            .collection('purchases')
            .where('projectId', '==', projectId)
            .get();
        const purchases = snapshot.docs.map(doc => doc.data());
        return purchases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async updatePurchaseStatus(id: string, status: string): Promise<void> {
        await this.firebaseService.getFirestore().collection('purchases').doc(id).update({
            status,
            updatedAt: new Date().toISOString()
        });
    }

    async getProjectFinancialSummary(projectId: string): Promise<any> {
        const purchases = await this.findPurchasesByProject(projectId);
        const totalActualCost = purchases
            .filter(p => p.status === 'APROBADO' || p.status === 'PAGADO' || p.status === 'RECIBIDO')
            .reduce((sum, p) => sum + Number(p.amount), 0);

        return {
            totalActualCost,
            purchaseCount: purchases.length,
            currency: purchases[0]?.currency || 'PEN'
        };
    }
}
