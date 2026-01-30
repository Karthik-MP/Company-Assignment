import admin from 'firebase-admin';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { faker } from '@faker-js/faker';
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

const TEAM_TYPES = ['counselor', 'digital_marketing'];

async function createTeamMembers(count = 5) {
  for (let i = 0; i < count; i++) {
    const team = faker.helpers.arrayElement(TEAM_TYPES);
    const name = faker.person.fullName();
    const email = faker.internet.email({ firstName: name.split(" ")[0], lastName: name.split(" ")[1] });

    const memberRef = db.collection('team_members').doc();

    await memberRef.set({
      name,
      email,
      team,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Created team member: ${name} (${team})`);
  }
}

createTeamMembers(10)
  .then(() => {
    console.log('✅ Done creating team members');
    process.exit(0);
  })
  .catch(console.error);
