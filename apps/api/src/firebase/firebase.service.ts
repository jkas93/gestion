import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private firebaseApp: admin.app.App;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
        const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
        const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

        if (!admin.apps.length) {
            this.firebaseApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    privateKey,
                    clientEmail,
                }),
            });
        } else {
            this.firebaseApp = admin.app();
        }
    }

    getAuth(): admin.auth.Auth {
        return admin.auth(this.firebaseApp);
    }

    getFirestore(): admin.firestore.Firestore {
        return admin.firestore(this.firebaseApp);
    }
}
