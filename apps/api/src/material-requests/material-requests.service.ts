import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateMaterialRequestDto, MaterialRequest } from '@erp/shared';

@Injectable()
export class MaterialRequestsService {
    constructor(private firebaseService: FirebaseService) { }

    async create(data: CreateMaterialRequestDto): Promise<string> {
        const docRef = this.firebaseService.getFirestore().collection('material_requests').doc();

        await docRef.set({
            ...data,
            id: docRef.id,
            createdAt: new Date().toISOString()
        });

        return docRef.id;
    }

    async findByProject(projectId: string): Promise<MaterialRequest[]> {
        const snapshot = await this.firebaseService.getFirestore()
            .collection('material_requests')
            .where('projectId', '==', projectId)
            .get();

        const requests = snapshot.docs.map(doc => doc.data() as MaterialRequest);
        // Sort in memory to avoid composite index requirement issues during dev
        return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async updateStatus(id: string, status: MaterialRequest['status'], rejectionReason?: string): Promise<void> {
        const updateData: any = { status };
        if (rejectionReason) {
            updateData.rejectionReason = rejectionReason;
        }
        await this.firebaseService.getFirestore().collection('material_requests').doc(id).update(updateData);
    }
}
