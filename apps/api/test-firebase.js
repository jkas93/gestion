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
    console.log('Firebase initialized successfully in test script!');
    process.exit(0);
} catch (error) {
    console.error('Firebase initialization failed:');
    console.error(error);
    process.exit(1);
}
