import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class ActivitiesService {
    constructor(private firebaseService: FirebaseService) { }

    private get collection() {
        return this.firebaseService.getFirestore().collection('activities');
    }

    async create(data: any): Promise<string> {
        const docRef = this.collection.doc();
        await docRef.set({
            ...data,
            id: docRef.id,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    }

    async findAll(): Promise<any[]> {
        const snapshot = await this.collection.orderBy('name', 'asc').get();
        return snapshot.docs.map(doc => doc.data());
    }

    async findOne(id: string): Promise<any | null> {
        const doc = await this.collection.doc(id).get();
        return doc.exists ? doc.data() : null;
    }

    async update(id: string, data: any): Promise<void> {
        await this.collection.doc(id).update(data);
    }

    async delete(id: string): Promise<void> {
        await this.collection.doc(id).delete();
    }
}
