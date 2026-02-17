const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
        }),
    });

    const db = admin.firestore();

    async function checkCollections() {
        console.log('--- Database Check ---');

        const employeesSnap = await db.collection('employees').get();
        console.log(`Employees count: ${employeesSnap.size}`);
        employeesSnap.docs.forEach(doc => {
            console.log(`- Employee: ${doc.data().name} (${doc.data().email})`);
        });

        const usersSnap = await db.collection('users').get();
        console.log(`\nUsers count: ${usersSnap.size}`);
        usersSnap.docs.forEach(doc => {
            console.log(`- User: ${doc.data().name} (${doc.data().email}) - Role: ${doc.data().role}`);
        });

        process.exit(0);
    }

    checkCollections();
} catch (error) {
    console.error(error);
    process.exit(1);
}
