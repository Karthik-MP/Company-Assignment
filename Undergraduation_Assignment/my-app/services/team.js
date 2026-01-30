// /lib/team.js
"use client";

import { z } from "zod";
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp, getCountFromServer
} from "firebase/firestore";
import { db } from "@/services/firebase";

/* ========= Schemas ========= */
export const MemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  team: z.enum(["counselor", "digital_marketing"]),
  active: z.boolean().default(true),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional().nullable(),
  team: z.enum(["counselor", "digital_marketing"]),
  status: z.enum(["open", "in_progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  assignees: z.array(
    z.object({
      memberId: z.string(),
      name: z.string(),
      email: z.string().email(),
      team: z.enum(["counselor", "digital_marketing"]),
    })
  ).default([]),
  relatedStudentId: z.string().optional().nullable(),
  dueAt: z.any().optional().nullable(),
  remindAt: z.any().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

const toParsed = (snap, schema) => {
  const data = { id: snap.id, ...snap.data() };
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const msg = parsed.error?.issues?.map(i => i.message).join(", ");
    throw new Error(`Parse error for ${schema === TaskSchema ? "Task" : "Member"} ${snap.id}: ${msg}`);
  }
  return parsed.data;
};

/* ========= Members ========= */
export async function listMembers({ team = "", activeOnly = true } = {}) {
  const col = collection(db, "team_members");
  const filters = [];
  if (team) filters.push(where("team", "==", team));
  if (activeOnly) filters.push(where("active", "==", true));

  const qy = filters.length ? query(col, ...filters, orderBy("name", "asc")) : query(col, orderBy("name", "asc"));
  const snap = await getDocs(qy);
  return snap.docs.map(d => toParsed(d, MemberSchema));
}

/* ========= Tasks ========= */
export async function createTask(payload) {
  // Minimal validation on input
  const required = ["title", "team", "status", "priority"];
  required.forEach(k => {
    if (!payload?.[k]) throw new Error(`Missing required field: ${k}`);
  });

  const col = collection(db, "tasks");
  const docRef = await addDoc(col, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTask(taskId, updates) {
  const ref = doc(db, "tasks", taskId);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteTask(taskId) {
  const ref = doc(db, "tasks", taskId);
  await deleteDoc(ref);
}

export async function getTask(taskId) {
  const ref = doc(db, "tasks", taskId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Task not found");
  return toParsed(snap, TaskSchema);
}

export async function listTasks({
  team = "",
  status = "",
  assigneeId = "",
  pageSize = 10,
  cursor = null,
} = {}) {
  const col = collection(db, "tasks");
  const filters = [];
  if (team) filters.push(where("team", "==", team));
  if (status) filters.push(where("status", "==", status));
  // For assignee filter we store array of maps, so use where on element equality via memberId (requires a denormalized field):
  if (assigneeId) filters.push(where("assigneesIds", "array-contains", assigneeId));

  // NOTE: add `assigneesIds` (array of memberId) to each task when creating/updating for fast filtering.
  let qy = query(col, ...filters, orderBy("dueAt", "asc"), limit(pageSize));
  if (cursor) qy = query(col, ...filters, orderBy("dueAt", "asc"), startAfter(cursor), limit(pageSize));
  const snap = await getDocs(qy);

  const items = snap.docs.map(d => toParsed(d, TaskSchema));
  const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
  return { items, nextCursor };
}

/* ========= Stats ========= */
export async function getTaskStats() {
  const col = collection(db, "tasks");

  const statuses = ["open", "in_progress", "completed"];
  const teams = ["counselor", "digital_marketing"];

  const statusQs = statuses.map(s => query(col, where("status", "==", s)));
  const teamQs = teams.map(t => query(col, where("team", "==", t)));

  const [totalSnap, ...rest] = await Promise.all([
    getCountFromServer(query(col)),
    ...statusQs.map(qs => getCountFromServer(qs)),
    ...teamQs.map(qt => getCountFromServer(qt)),
  ]);

  const counts = {
    total: totalSnap.data().count || 0,
    byStatus: {},
    byTeam: {},
  };
  rest.slice(0, statuses.length).forEach((snap, i) => {
    counts.byStatus[statuses[i]] = snap.data().count || 0;
  });
  rest.slice(statuses.length).forEach((snap, i) => {
    counts.byTeam[teams[i]] = snap.data().count || 0;
  });
  return counts;
}
