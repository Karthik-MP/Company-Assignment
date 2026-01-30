// /app/students/[id]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { db } from "@/services/firebase";
import {
  fetchStudentById,
  addCommunication,
  updateStudentProgress,
} from "@/services/students";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { listNotes, addNote, updateNote, deleteNote } from "@/services/student_notes";
export default function StudentProfilePage() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comms, setComms] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteMsg, setNoteMsg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  // form states
  const [commType, setCommType] = useState("note");
  const [commMsg, setCommMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const s = await fetchStudentById(id);
        setStudent(s);
        setProgress(s.progress || 0);
        setStatus(s.status);

        await getComms();

        const intQ = query(
          collection(db, "students", id, "interactions"),
          orderBy("createdAt", "desc")
        );
        const intSnap = await getDocs(intQ);
        setInteractions(intSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        await getNotes();
      } catch (err) {
        console.error(err);
        toast.error(
          <div>
            <p className="font-semibold">Failed to load student</p>
            <p className="text-sm text-muted-foreground">
              {err?.message || "Unknown error"}
            </p>
          </div>
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const getComms = async () => {
    const commQ = query(
      collection(db, "students", id, "communications"),
      orderBy("createdAt", "desc")
    );
    const commSnap = await getDocs(commQ);
    setComms(commSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const getNotes = async () => {
    // const notesQ = query(
    //   collection(db, "students", id, "notes"),
    //   orderBy("createdAt", "desc")
    // );
    // const notesSnap = await getDocs(notesQ);
    // setNotes(notesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    // notes
    const n = await listNotes(id);
    setNotes(n);
  };

  const saveCommunication = async () => {
    try {
      if (!commMsg.trim()) return toast.error("Message can’t be empty.");
      await addCommunication(id, {
        type: commType,
        message: commMsg,
        createdBy: "admin@undergraduation.com",
      });
      setCommMsg("");
      getComms();
      toast.success("Communication added.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add communication.");
    }
  };

  // create
  const saveNote = async () => {
    try {
      if (!noteMsg.trim()) return toast.error("Note can’t be empty.");
      const newId = await addNote(id, {
        text: noteMsg,
        createdBy: "admin@undergraduation.com",
      });
      setNotes((prev) => [
        {
          id: newId,
          text: noteMsg,
          createdBy: "admin@undergraduation.com",
          createdAt: { toDate: () => new Date() },
        },
        ...prev,
      ]);
      setNoteMsg("");
      getNotes();
      toast.success("Note added.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add note.");
    }
  };

  const startEdit = (n) => {
    setEditingId(n.id);
    setEditingText(n.text || "");
  };

  // save edit
  const saveEdit = async () => {
    try {
      if (!editingText.trim()) return toast.error("Note can’t be empty.");
      const noteId = editingId;
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, text: editingText } : n))
      ); // optimistic
      await updateNote(id, noteId, { text: editingText });
      setEditingId(null);
      setEditingText("");
      toast.success("Note updated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update note.");
    }
  };

  // cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  // delete
  const removeNote = async (noteId) => {
    const ok = window.confirm("Delete this note? This cannot be undone.");
    if (!ok) return;
    try {
      const old = notes;
      setNotes((prev) => prev.filter((n) => n.id !== noteId)); // optimistic
      await deleteNote(id, noteId);
      toast.success("Note deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete note.");
    }
  };

  const saveProgress = async () => {
    try {
      await updateStudentProgress(id, Number(progress), status);
      toast.success("Progress updated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update progress.");
    }
  };

  if (loading) return <div className="p-6 max-w-5xl mx-auto">Loading…</div>;
  if (!student) return <div className="p-6">Student not found.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Link
        href="/dashboard/students"
        className="text-indigo-600 hover:underline"
      >
        &larr; Back to Directory
      </Link>

      <Card className="rounded-2xl border">
        <CardHeader>
          <CardTitle className="text-2xl text-indigo-700">
            {student.name}
          </CardTitle>
          <p className="text-sm text-gray-500">Profile & Activity</p>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          {/* Basic info */}
          <div className="space-y-2">
            <p>
              <span className="font-medium">Email:</span> {student.email}
            </p>
            <p>
              <span className="font-medium">Phone:</span> {student.phone || "-"}
            </p>
            <p>
              <span className="font-medium">Country:</span>{" "}
              {student.country || "-"}
            </p>
            <p>
              <span className="font-medium">Grade:</span> {student.grade || "-"}
            </p>
            <p>
              <span className="font-medium">Last Active:</span>{" "}
              {student.lastActive?.toDate
                ? student.lastActive.toDate().toLocaleString()
                : "-"}
            </p>
          </div>

          {/* Progress + Status */}
          <div className="space-y-3">
            <Label>Application Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Exploring",
                  "Shortlisting",
                  "Applying",
                  "Submitted",
                  "Accepted",
                ].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label className="mt-2">Progress (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
            />

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${Number(progress) || 0}%` }}
              />
            </div>

            <Button
              onClick={saveProgress}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Save Progress
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interaction Timeline */}
      <Card className="rounded-2xl border">
        <CardHeader>
          <CardTitle>Interaction Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {interactions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No interactions yet.
            </p>
          )}
          {interactions.map((it) => (
            <div key={it.id} className="border rounded-lg p-3">
              <p className="font-medium">{it.kind}</p>
              <p className="text-sm text-muted-foreground">
                {typeof it.details === "string"
                  ? it.details
                  : JSON.stringify(it.details)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {it.createdAt?.toDate
                  ? it.createdAt.toDate().toLocaleString()
                  : "-"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Communications */}
      <Card className="rounded-2xl border">
        <CardHeader>
          <CardTitle>Communication Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="md:col-span-1">
              <Label className="my-2">Type</Label>
              <Select value={commType} onValueChange={setCommType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label>Message</Label>
              <Textarea
                placeholder="Write a brief message…"
                value={commMsg}
                onChange={(e) => setCommMsg(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={saveCommunication}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Log Communication
          </Button>

          <div className="space-y-3 pt-4">
            {comms.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No communications yet.
              </p>
            )}
            {comms.length !== 0 && (
              <div className="flex justify-end items-end">
                <Button className="mt-2 bg-orange-400 hover:bg-orange-700">
                  Follow-up
                </Button>
              </div>
            )}
            {comms.map((c) => (
              <div
                key={c.id}
                className="border rounded-lg p-3 flex justify-between items-start"
              >
                <div>
                  <p className="font-medium capitalize">{c.type}</p>
                  <p className="text-sm text-muted-foreground">{c.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {c.createdAt?.toDate
                      ? c.createdAt.toDate().toLocaleString()
                      : "-"}{" "}
                    — {c.createdBy || "system"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Internal Notes */}
      {/* Internal Notes */}
      <Card className="rounded-2xl border">
        <CardHeader>
          <CardTitle>Internal Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New note */}
          <div>
            <Label className="my-2">New Note</Label>
            <Textarea
              placeholder="Add a note for the team…"
              value={noteMsg}
              onChange={(e) => setNoteMsg(e.target.value)}
            />
            <Button
              onClick={saveNote}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700"
            >
              Add Note
            </Button>
          </div>

          {/* Existing notes */}
          <div className="space-y-3">
            {notes.length === 0 && (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
            {notes.map((n) => (
              <div key={n.id} className="border rounded-lg p-3">
                {/* View mode */}
                {editingId !== n.id ? (
                  <>
                    <p className="whitespace-pre-wrap">{n.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {n.createdAt?.toDate
                        ? n.createdAt.toDate().toLocaleString()
                        : "-"}{" "}
                      — {n.createdBy || "system"}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" onClick={() => startEdit(n)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => removeNote(n.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Edit mode */
                  <>
                    <Label>Edit Note</Label>
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={saveEdit}
                      >
                        Save
                      </Button>
                      <Button variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* <Card className="rounded-2xl border">
        <CardHeader>
          <CardTitle>Internal Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>New Note</Label>
            <Textarea
              placeholder="Add a note for the team…"
              value={noteMsg}
              onChange={(e) => setNoteMsg(e.target.value)}
            />
            <Button
              onClick={saveNote}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700"
            >
              Add Note
            </Button>
          </div>
          <div className="space-y-3">
            {notes.length === 0 && (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
            {notes.map((n) => (
              <div key={n.id} className="border rounded-lg p-3">
                <p>{n.text}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {n.createdAt?.toDate
                    ? n.createdAt.toDate().toLocaleString()
                    : "-"}{" "}
                  — {n.createdBy || "system"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
