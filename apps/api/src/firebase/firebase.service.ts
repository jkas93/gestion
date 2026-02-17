import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);
    private firebaseApp: admin.app.App;
    private initializationTime: number;

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        const startTime = Date.now();
        this.logger.log('🔄 Iniciando Firebase Admin SDK...');

        try {
            // Validar credenciales antes de inicializar
            const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
            const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
            const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

            if (!projectId || !privateKey || !clientEmail) {
                throw new Error('Faltan credenciales de Firebase. Verifica las variables de entorno: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
            }

            // Validar formato de private key
            if (!privateKey.includes('BEGIN PRIVATE KEY')) {
                throw new Error('FIREBASE_PRIVATE_KEY tiene formato inválido. Debe incluir "-----BEGIN PRIVATE KEY-----"');
            }

            // Timeout para la inicialización
            const initPromise = new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Firebase initialization timeout (5s)'));
                }, 5000);

                try {
                    if (!admin.apps.length) {
                        this.firebaseApp = admin.initializeApp({
                            credential: admin.credential.cert({
                                projectId,
                                privateKey,
                                clientEmail,
                            }),
                        });
                        this.logger.log(`✅ Firebase App inicializada: ${this.firebaseApp.name}`);
                    } else {
                        this.firebaseApp = admin.app();
                        this.logger.log('ℹ️ Firebase App ya estaba inicializada, reutilizando instancia');
                    }
                    clearTimeout(timeout);
                    resolve();
                } catch (error) {
                    clearTimeout(timeout);
                    reject(error);
                }
            });

            await initPromise;

            this.initializationTime = Date.now() - startTime;
            this.logger.log(`✅ Firebase inicializado correctamente en ${this.initializationTime}ms`);
            this.logger.log(`📊 Project ID: ${projectId}`);

        } catch (error) {
            this.initializationTime = Date.now() - startTime;
            this.logger.error(`❌ Error al inicializar Firebase (${this.initializationTime}ms):`, error.message);
            this.logger.error('Stack trace:', error.stack);

            // Re-throw para que la aplicación falle visiblemente si Firebase no se puede inicializar
            throw new Error(`Firebase initialization failed: ${error.message}`);
        }
    }

    getAuth(): admin.auth.Auth {
        if (!this.firebaseApp) {
            throw new Error('Firebase no está inicializado. Verifica los logs de arranque.');
        }
        return admin.auth(this.firebaseApp);
    }

    getFirestore(): admin.firestore.Firestore {
        if (!this.firebaseApp) {
            throw new Error('Firebase no está inicializado. Verifica los logs de arranque.');
        }
        return admin.firestore(this.firebaseApp);
    }

    getInitializationTime(): number {
        return this.initializationTime;
    }

    isInitialized(): boolean {
        return !!this.firebaseApp;
    }
}
