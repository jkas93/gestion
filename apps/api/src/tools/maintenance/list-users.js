const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

async function checkUsers() {
    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
            });
        }
        const db = admin.firestore();
        const auth = admin.auth();

        console.log('--- FIRESTORE USERS ---');
        const snapshot = await db.collection('users').get();
        snapshot.docs.forEach(doc => {
            console.log(`FS: ${doc.id} | ${doc.data().email} | ${doc.data().status}`);
        });

        console.log('\n--- AUTH USERS ---');
        const authList = await auth.listUsers();
        authList.users.forEach(u => {
            console.log(`AUTH: ${u.uid} | ${u.email} | ${u.displayName}`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkUsers();
