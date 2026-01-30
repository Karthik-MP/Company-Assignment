import fs from 'fs';
import { faker } from '@faker-js/faker';

const students = [];

for (let i = 1; i <= 50; i++) {
  const id = `stu_${String(i).padStart(3, '0')}`;
  const name = faker.person.fullName();
  const email = faker.internet.email(name.split(' ')[0], name.split(' ')[1]);
  const phone = faker.phone.number();
  const country = faker.location.country();
  const grade = faker.helpers.arrayElement(["9", "10", "11", "12"]);
  const status = faker.helpers.arrayElement(["Exploring", "Applying", "Accepted"]);
  const highIntent = faker.datatype.boolean();
  const needsEssayHelp = faker.datatype.boolean();
  const progress = faker.number.int({ min: 0, max: 100 });

  students.push({
    collection: "students",
    id,
    data: {
      name,
      name_lc: name.toLowerCase(),
      email,
      email_lc: email.toLowerCase(),
      phone,
      country,
      grade,
      status,
      lastActive: { "_serverTimestamp": true },
      highIntent,
      needsEssayHelp,
      progress,
      createdAt: { "_serverTimestamp": true },
      updatedAt: { "_serverTimestamp": true }
    }
  });
}

fs.writeFileSync('students.json', JSON.stringify(students, null, 2));
console.log('✅ Generated 50 dummy students in students.json');