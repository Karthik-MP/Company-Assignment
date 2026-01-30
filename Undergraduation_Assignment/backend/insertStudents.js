import admin from 'firebase-admin';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Setup __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account
const serviceAccount = JSON.parse(
  fs.readFileSync(`${__dirname}/undergraduation-4e8c4-firebase-adminsdk-fbsvc-e0b88434dd.json`, 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Load students from JSON
const students = JSON.parse(
  fs.readFileSync(`${__dirname}/students.json`, 'utf8')
);

// Replace `_serverTimestamp` placeholders with actual Firestore timestamps
const fixTimestamps = (obj) => {
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (obj[key]._serverTimestamp) {
        obj[key] = admin.firestore.FieldValue.serverTimestamp();
      } else {
        fixTimestamps(obj[key]);
      }
    }
  }
};

const insertData = async () => {
  for (const entry of students) {
    const docRef = db.collection(entry.collection).doc(entry.id);
    const dataCopy = JSON.parse(JSON.stringify(entry.data)); // deep clone
    fixTimestamps(dataCopy);
    await docRef.set(dataCopy);
    console.log(`✅ Inserted: ${entry.id}`);
  }

  console.log('🎉 All students inserted into Firestore!');
};

insertData().catch(console.error);
