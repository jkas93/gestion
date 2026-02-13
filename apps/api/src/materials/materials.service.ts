import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Material, CreateMaterialDto } from '@erp/shared';

@Injectable()
export class MaterialsService {
    constructor(private firebaseService: FirebaseService) { }

    async create(data: CreateMaterialDto): Promise<string> {
        const docRef = this.firebaseService.getFirestore().collection('materials').doc();
        await docRef.set({
            ...data,
            id: docRef.id,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    }

    async findAll(): Promise<Material[]> {
        const snapshot = await this.firebaseService.getFirestore().collection('materials').orderBy('name').get();
        return snapshot.docs.map(doc => doc.data() as Material);
    }

    async findOne(id: string): Promise<Material | null> {
        const doc = await this.firebaseService.getFirestore().collection('materials').doc(id).get();
        return doc.exists ? (doc.data() as Material) : null;
    }
}
