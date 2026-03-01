import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno
dotenv.config({ path: resolve(__dirname, '../../.env') });

// Inicializar Firebase Admin
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
        });
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        process.exit(1);
    }
}

const db = admin.firestore();


import * as fs from 'fs';

async function checkLatest() {
    console.log('🔍 Verificando últimos registros en base de datos...\n');
    const result: any = {
        timestamp: new Date().toISOString(),
        latestEmployee: null,
        latestUser: null
    };

    try {
        // 1. Verificar último empleado en colección 'employees'
        const employeesSnapshot = await db.collection('employees')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (!employeesSnapshot.empty) {
            const doc = employeesSnapshot.docs[0];
            result.latestEmployee = {
                id: doc.id,
                ...doc.data()
            };
        }

        // 2. Verificar último usuario en colección 'users'
        const usersSnapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (!usersSnapshot.empty) {
            const doc = usersSnapshot.docs[0];
            result.latestUser = {
                id: doc.id,
                ...doc.data()
            };
        }

        fs.writeFileSync('latest_employee_check.json', JSON.stringify(result, null, 2));
        console.log('✅ Resultados guardados en latest_employee_check.json');

    } catch (error) {
        console.error('❌ Error al consultar la base de datos:', error);
        fs.writeFileSync('latest_employee_check_error.json', JSON.stringify({ error: error.message }, null, 2));
    }
}

checkLatest();
