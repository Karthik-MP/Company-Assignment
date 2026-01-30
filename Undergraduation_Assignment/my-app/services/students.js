// /lib/students.js
"use client";
import {
  collection, doc, getDocs, getDoc, query, where, orderBy, limit, startAfter,
  addDoc, serverTimestamp, updateDoc
} from "firebase/firestore";
import { z } from "zod";
import { db } from "@/services/firebase";

// Zod schema for robust runtime validation
export const StudentSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  status: z.enum(["Exploring", "Shortlisting", "Applying", "Submitted", "Accepted"]),
  lastActive: z.any().optional(),
  highIntent: z.boolean().optional().default(false),
  needsEssayHelp: z.boolean().optional().default(false),
  progress: z.number().min(0).max(100).default(0),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

// transform Firestore doc -> Student
const asStudent = (d) => {
  const data = d.data();
  const parsed = StudentSchema.safeParse({ id: d.id, ...data });
  if (!parsed.success) {
    const msg = parsed.error?.issues?.map(i => i.message).join(", ");
    throw new Error(`Student parse error for ${d.id}: ${msg}`);
  }
  return parsed.data;
};

export async function fetchStudentsPage({
  qText = "",
  status = "",
  quick = "",
  pageSize = 10,
  cursor = null,
}) {
  try {
    const colRef = collection(db, "students");
    const filters = [];

    console.log("Incoming filter values:", {
      qText,
      status,
      quick,
      pageSize,
      cursor,
    });

    // 🔍 Search filter
    if (qText) {
      const qlc = qText.toLowerCase();
      console.log(`Applying name search filter for prefix: '${qlc}'`);
      filters.push(where("name_lc", ">=", qlc));
      filters.push(where("name_lc", "<=", qlc + "\uf8ff"));
    }

    // 📌 Status filter
    if (status) {
      console.log(`Applying status filter: status == '${status}'`);
      filters.push(where("status", "==", status));
    }

    // ⚡ Quick filters
    if (quick === "high-intent") {
      console.log("Applying quick filter: highIntent == true");
      filters.push(where("highIntent", "==", true));
    } else if (quick === "needs-essay") {
      console.log("Applying quick filter: needsEssayHelp == true");
      filters.push(where("needsEssayHelp", "==", true));
    } else if (quick === "not-contacted-7d") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      console.log(
        `Applying quick filter: lastActive < ${sevenDaysAgo.toISOString()}`
      );
      filters.push(where("lastActive", "<", sevenDaysAgo));
    }

    console.log("Final Firestore filters:", filters);

    // 🔄 Build the Firestore query
    let qy = query(
      colRef,
      ...filters,
      orderBy("lastActive", "desc"),
      limit(pageSize)
    );

    if (cursor) {
      console.log("Using pagination cursor:", cursor);
      qy = query(
        colRef,
        ...filters,
        orderBy("lastActive", "desc"),
        startAfter(cursor),
        limit(pageSize)
      );
    }

    console.log("Running Firestore query...");
    const snap = await getDocs(qy);

    console.log(`Fetched ${snap.docs.length} student(s) from Firestore.`);

    // 👇 NEW: Print raw document data
    snap.docs.forEach((doc, index) => {
      console.log(`Document #${index + 1}:`, {
        id: doc.id,
        data: doc.data(),
      });
    });

    const docs = snap.docs.map(asStudent);
    const nextCursor =
      snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

    console.log("Returning result with nextCursor:", nextCursor);

    return { items: docs, nextCursor };
  } catch (err) {
    console.error("fetchStudentsPage error:", err);
    throw err;
  }
}


export async function fetchStudentById(id) {
  const ref = doc(db, "students", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Student not found");
  return asStudent(snap);
}

export async function addCommunication(studentId, payload) {
  const ref = collection(db, "students", studentId, "communications");
  await addDoc(ref, {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

export async function addNote(studentId, payload) {
  const ref = collection(db, "students", studentId, "notes");
  await addDoc(ref, {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

export async function updateStudentProgress(studentId, progress, status) {
  const ref = doc(db, "students", studentId);
  await updateDoc(ref, {
    progress,
    ...(status ? { status } : {}),
    updatedAt: serverTimestamp(),
  });
}
