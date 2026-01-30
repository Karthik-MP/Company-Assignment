// --- Notes CRUD ---
import {
  collection, addDoc, serverTimestamp, getDocs, orderBy, query,
  doc, updateDoc, deleteDoc
} from "firebase/firestore";
import { db } from "@/services/firebase";

export async function listNotes(studentId) {
  const notesQ = query(collection(db, "students", studentId, "notes"), orderBy("createdAt", "desc"));
  const snap = await getDocs(notesQ);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addNote(studentId, { text, createdBy }) {
  const ref = collection(db, "students", studentId, "notes");
  const docRef = await addDoc(ref, {
    text,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateNote(studentId, noteId, { text }) {
  const ref = doc(db, "students", studentId, "notes", noteId);
  await updateDoc(ref, { text, updatedAt: serverTimestamp() });
}

export async function deleteNote(studentId, noteId) {
  const ref = doc(db, "students", studentId, "notes", noteId);
  await deleteDoc(ref);
}
