// seedTasks.js
import { faker } from '@faker-js/faker';
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

const STATUS = ['open', 'in_progress', 'completed'];
const PRIORITY = ['low', 'medium', 'high'];

async function createTasks(count = 15) {
    const membersSnapshot = await db.collection('team_members').get();
    const members = membersSnapshot.docs.map(doc => ({
        memberId: doc.id,
        ...doc.data()
    }));

    if (members.length === 0) {
        console.log("❌ No team members found. Run seedTeamMembers.js first.");
        return;
    }

    for (let i = 0; i < count; i++) {
        const team = faker.helpers.arrayElement(['counselor', 'digital_marketing']);
        const possibleAssignees = members.filter(m => m.team === team);
        const selectedAssignees = faker.helpers.arrayElements(possibleAssignees, faker.number.int({ min: 1, max: 2 }));

        const assignees = selectedAssignees.map(m => ({
            memberId: m.memberId,
            name: m.name,
            email: m.email,
            team: m.team,
        }));

        const taskRef = db.collection('tasks').doc();

        await taskRef.set({
            title: faker.hacker.phrase(),
            description: faker.lorem.sentence(),
            team,
            status: faker.helpers.arrayElement(STATUS),
            priority: faker.helpers.arrayElement(PRIORITY),
            assignees,
            relatedStudentId: faker.datatype.boolean() ? `stu_${faker.number.int({ min: 1, max: 999 }).toString().padStart(3, '0')}` : null,
            dueAt: admin.firestore.FieldValue.serverTimestamp(),
            remindAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: "admin@undergraduation.com",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`✅ Created task assigned to: ${assignees.map(a => a.name).join(', ')}`);
    }
}

createTasks()
    .then(() => {
        console.log('🎉 Done creating tasks');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error creating tasks:', err);
        process.exit(1);
    });
