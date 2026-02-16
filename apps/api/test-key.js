const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
console.log('--- START KEY ---');
console.log(privateKey);
console.log('--- END KEY ---');
console.log('Has literal \\n:', privateKey.includes('\\n'));
console.log('Has real newline:', privateKey.includes('\n'));

const processed = privateKey.replace(/\\n/g, '\n');
console.log('--- PROCESSED KEY ---');
console.log(processed);
console.log('--- END PROCESSED ---');
