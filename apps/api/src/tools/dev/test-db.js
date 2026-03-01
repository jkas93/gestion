const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
    console.error('Error: Missing environment variables in .env');
    process.exit(1);
}

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
        }),
    });

    const db = admin.firestore();

    async function testConnection() {
        console.log('Testing connection to Firebase...');
        console.log('Project ID:', projectId);
        
        try {
            const collections = await db.listCollections();
            console.log('Successfully connected to Firestore!');
            console.log('Available collections:', collections.map(c => c.id));
            
            if (collections.length === 0) {
                console.log('Warning: No collections found. Database might be empty.');
            } else {
                // Try to get a count from 'projects' if it exists
                const projectsRef = db.collection('projects');
                const snapshot = await projectsRef.limit(1).get();
                if (snapshot.empty) {
                    console.log('No documents found in "projects" collection.');
                } else {
                    console.log('Found at least one document in "projects" collection.');
                }
            }
            
            process.exit(0);
        } catch (error) {
            console.error('Error listing collections:', error.message);
            process.exit(1);
        }
    }

    testConnection();
} catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    process.exit(1);
}
