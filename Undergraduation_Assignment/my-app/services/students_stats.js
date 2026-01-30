"use client";

import {
  collection,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./firebase";

// Utility: last N days
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

/**
 * Returns an object of counts:
 * - total
 * - active30d  (lastActive > now-30d)
 * - essayStage (needsEssayHelp == true)
 * - highIntent (highIntent == true)
 * - byStatus   ({Exploring, Shortlisting, Applying, Submitted})
 */
export async function getStudentStats() {
  const col = collection(db, "students");

  const qTotal = query(col);
  const qActive30d = query(col, where("lastActive", ">", daysAgo(30)));
  const qEssay = query(col, where("needsEssayHelp", "==", true));
  const qHigh = query(col, where("highIntent", "==", true));

  const statuses = ["Exploring", "Shortlisting", "Applying", "Submitted", "Accepted"];
  const qStatus = statuses.map((s) => query(col, where("status", "==", s)));

  try {
    const [
      totalSnap,
      activeSnap,
      essaySnap,
      highSnap,
      ...statusSnaps
    ] = await Promise.all([
      getCountFromServer(qTotal),
      getCountFromServer(qActive30d),
      getCountFromServer(qEssay),
      getCountFromServer(qHigh),
      ...qStatus.map((qs) => getCountFromServer(qs)),
    ]);

    const byStatus = {};
    statusSnaps.forEach((snap, idx) => {
      byStatus[statuses[idx]] = snap.data().count || 0;
    });

    return {
      total: totalSnap.data().count || 0,
      active30d: activeSnap.data().count || 0,
      essayStage: essaySnap.data().count || 0,
      highIntent: highSnap.data().count || 0,
      byStatus,
    };
  } catch (err) {
    console.error("getStudentStats error:", err);
    throw err;
  }
}
