const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

async function verifyUnification() {
    console.log('--- Verifying Unification Logic ---');

    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    privateKey,
                    clientEmail,
                }),
            });
        }

        const firestore = admin.firestore();

        // Simulating the new logic
        const usersSnapshot = await firestore.collection('users').get();
        const usersMap = new Map();
        usersSnapshot.docs.forEach(doc => {
            usersMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        const employeesSnapshot = await firestore.collection('employees').get();
        const employeesMap = new Map();
        employeesSnapshot.docs.forEach(doc => {
            employeesMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        const unifiedList = [];
        usersMap.forEach((userData, id) => {
            const employeeData = employeesMap.get(id);
            unifiedList.push({
                ...userData,
                ...(employeeData || {}),
                id,
                hasLaborProfile: !!employeeData
            });
        });

        employeesMap.forEach((empData, id) => {
            if (!usersMap.has(id)) {
                unifiedList.push({
                    ...empData,
                    hasLaborProfile: true,
                    hasAccess: false
                });
            }
        });

        console.log(`Total Unified Personal: ${unifiedList.length}`);
        unifiedList.forEach(p => {
            console.log(`- [${p.role || 'N/A'}] ${p.name || 'Sin Nombre'} (${p.email || 'Sin Email'}) - Labor Profile: ${p.hasLaborProfile}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verifyUnification();
