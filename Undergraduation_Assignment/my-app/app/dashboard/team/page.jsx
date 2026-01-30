// /app/team/page.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  listMembers, listTasks, createTask, updateTask, deleteTask, getTaskStats
} from "@/services/team";

const TaskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  team: z.enum(["counselor", "digital_marketing"]),
  status: z.enum(["open", "in_progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  assignees: z.array(z.string()).default([]), // array of memberIds
  relatedStudentId: z.string().optional().nullable(),
  dueAt: z.string().optional().nullable(),    // ISO local datetime
  remindAt: z.string().optional().nullable(), // ISO local datetime
});

export default function TeamPage() {
  // Filters
  const [teamFilter, setTeamFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [members, setMembers] = useState([]);

  // Tasks
  const [rows, setRows] = useState([]);
  const cursorRef = useRef(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    team: "counselor",
    status: "open",
    priority: "medium",
    assignees: [],
    relatedStudentId: "",
    dueAt: "",
    remindAt: "",
  });
  const [editingTaskId, setEditingTaskId] = useState(null);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      team: "counselor",
      status: "open",
      priority: "medium",
      assignees: [],
      relatedStudentId: "",
      dueAt: "",
      remindAt: "",
    });
    setEditingTaskId(null);
  };

  const loadMembers = async () => {
    try {
      const [c, m] = await Promise.all([
        listMembers({ team: "counselor" }),
        listMembers({ team: "digital_marketing" }),
      ]);
      setMembers([...c, ...m]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load team members.");
    }
  };

  const loadStats = async () => {
    try {
      const s = await getTaskStats();
      setStats(s);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load team stats.");
    }
  };

  const resetAndLoadTasks = async () => {
    try {
      setLoading(true);
      cursorRef.current = null;
      const { items, nextCursor } = await listTasks({
        team: teamFilter,
        status: statusFilter,
        assigneeId: assigneeFilter,
        pageSize: 10,
      });
      setRows(items);
      cursorRef.current = nextCursor;
      setHasMore(!!nextCursor);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!cursorRef.current) return;
    try {
      setLoading(true);
      const { items, nextCursor } = await listTasks({
        team: teamFilter,
        status: statusFilter,
        assigneeId: assigneeFilter,
        pageSize: 10,
        cursor: cursorRef.current,
      });
      setRows(prev => [...prev, ...items]);
      cursorRef.current = nextCursor;
      setHasMore(!!nextCursor);
    } catch (err) {
      console.error(err);
      toast.error("Could not load more.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    loadStats();
    resetAndLoadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assigneeOptions = useMemo(() => members, [members]);

  const toggleAssignee = (id) => {
    setForm(prev => {
      const exists = prev.assignees.includes(id);
      return { ...prev, assignees: exists ? prev.assignees.filter(a => a !== id) : [...prev.assignees, id] };
    });
  };

  const submitTask = async () => {
    try {
      const parsed = TaskFormSchema.parse(form);

      const selected = assigneeOptions.filter(m => parsed.assignees.includes(m.id));
      const assignees = selected.map(m => ({
        memberId: m.id, name: m.name, email: m.email, team: m.team,
      }));
      const assigneesIds = selected.map(m => m.id);

      const payload = {
        title: parsed.title,
        description: parsed.description || "",
        team: parsed.team,
        status: parsed.status,
        priority: parsed.priority,
        assignees,
        assigneesIds,
        relatedStudentId: parsed.relatedStudentId || null,
        dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null,
        remindAt: parsed.remindAt ? new Date(parsed.remindAt) : null,
        createdBy: "admin@undergraduation.com",
      };

      if (!editingTaskId) {
        const id = await createTask(payload);
        // optimistic prepend
        setRows(prev => [{ id, ...payload }, ...prev]);
        toast.success("Task created.");
      } else {
        await updateTask(editingTaskId, payload);
        setRows(prev => prev.map(t => t.id === editingTaskId ? { ...t, ...payload } : t));
        toast.success("Task updated.");
      }

      resetForm();
      loadStats();
    } catch (err) {
      console.error(err);
      toast.error(
        <div>
          <p className="font-semibold">Task save failed</p>
          <p className="text-sm text-muted-foreground">{err?.message || "Unknown error"}</p>
        </div>
      );
    }
  };

  const startEdit = (task) => {
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      description: task.description || "",
      team: task.team,
      status: task.status,
      priority: task.priority,
      assignees: task.assignees?.map(a => a.memberId) || [],
      relatedStudentId: task.relatedStudentId || "",
      dueAt: task.dueAt?.toDate ? new Date(task.dueAt.toDate()).toISOString().slice(0,16)
            : (task.dueAt ? new Date(task.dueAt).toISOString().slice(0,16) : ""),
      remindAt: task.remindAt?.toDate ? new Date(task.remindAt.toDate()).toISOString().slice(0,16)
              : (task.remindAt ? new Date(task.remindAt).toISOString().slice(0,16) : ""),
    });
  };

  const markComplete = async (taskId) => {
    try {
      setRows(prev => prev.map(t => t.id === taskId ? { ...t, status: "completed" } : t));
      await updateTask(taskId, { status: "completed" });
      loadStats();
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete task.");
    }
  };

  const removeTask = async (taskId) => {
    const ok = window.confirm("Delete this task? This cannot be undone.");
    if (!ok) return;
    try {
      const old = rows;
      setRows(prev => prev.filter(t => t.id !== taskId));
      await deleteTask(taskId);
      loadStats();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Summary */}
      <Card className="rounded-2xl border">
        <CardHeader>
          <CardTitle className="text-2xl text-indigo-700">Team Tasks</CardTitle>
          <p className="text-sm text-gray-500">Schedule reminders, assign tasks, and track work</p>
        </CardHeader>
        <CardContent>
          {!stats ? (
            <div className="animate-pulse text-muted-foreground">Loading stats…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-indigo-700">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl border">
                <p className="text-xs text-gray-500">Open</p>
                <p className="text-2xl font-semibold text-indigo-700">{stats.byStatus?.open ?? 0}</p>
              </div>
              <div className="p-3 rounded-xl border">
                <p className="text-xs text-gray-500">In Progress</p>
                <p className="text-2xl font-semibold text-indigo-700">{stats.byStatus?.in_progress ?? 0}</p>
              </div>
              <div className="p-3 rounded-xl border">
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-indigo-700">{stats.byStatus?.completed ?? 0}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Task */}
      <Card className="rounded-2xl border">
        <CardHeader><CardTitle>{editingTaskId ? "Edit Task" : "Create Task"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm(s => ({...s, title: e.target.value}))} className="focus-visible:ring-indigo-500" />
            </div>
            <div>
              <Label>Team</Label>
              <Select value={teamFilter || "all"} onValueChange={(v) => setTeamFilter(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>  ✅
                  <SelectItem value="counselor">Counselor</SelectItem>
                  <SelectItem value="digital_marketing">Digital Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm(s => ({ ...s, priority: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm(s => ({...s, description: e.target.value}))} />
            </div>
            <div>
              <Label>Due (date & time)</Label>
              <Input type="datetime-local" value={form.dueAt} onChange={(e) => setForm(s => ({...s, dueAt: e.target.value}))} />
            </div>
            <div>
              <Label>Reminder (date & time)</Label>
              <Input type="datetime-local" value={form.remindAt} onChange={(e) => setForm(s => ({...s, remindAt: e.target.value}))} />
            </div>
            <div>
              <Label>Related Student ID (optional)</Label>
              <Input value={form.relatedStudentId} onChange={(e) => setForm(s => ({...s, relatedStudentId: e.target.value}))} placeholder="e.g., stu_001" />
            </div>
            <div className="md:col-span-2">
              <Label>Assign to (multi-select)</Label>
              <div className="rounded-xl border p-3 max-h-40 overflow-auto">
                {assigneeOptions.map(m => (
                  <label key={m.id} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={form.assignees.includes(m.id)}
                      onChange={() => toggleAssignee(m.id)}
                    />
                    <span className="text-sm">{m.name} <span className="text-xs text-muted-foreground">({m.team === "counselor" ? "Counselor" : "Digital Marketing"})</span></span>
                  </label>
                ))}
                {assigneeOptions.length === 0 && <p className="text-sm text-muted-foreground">No members yet.</p>}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={submitTask}>
              {editingTaskId ? "Update Task" : "Create Task"}
            </Button>
            {editingTaskId && (
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="rounded-2xl border">
        <CardHeader><CardTitle>Filter Tasks</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          <div>
            <Label>Team</Label>
            <Select value={teamFilter || "all"} onValueChange={(v) => setTeamFilter(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>  ✅
                <SelectItem value="counselor">Counselor</SelectItem>
                <SelectItem value="digital_marketing">Digital Marketing</SelectItem>
              </SelectContent>
            </Select>

          </div>

          <div>
            <Label>Status</Label>
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Assignee</Label>
            <Select value={assigneeFilter || "all"} onValueChange={(v) => setAssigneeFilter(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Anyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Anyone</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={resetAndLoadTasks} className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? "Loading..." : "Apply"}
            </Button>
            <Button variant="outline" onClick={() => { setTeamFilter(""); setStatusFilter(""); setAssigneeFilter(""); }}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border">
        <CardHeader><CardTitle>Tasks</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Title</th>
                  <th className="px-4 py-2 text-left font-semibold">Team</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-left font-semibold">Priority</th>
                  <th className="px-4 py-2 text-left font-semibold">Assignees</th>
                  <th className="px-4 py-2 text-left font-semibold">Due</th>
                  <th className="px-4 py-2 text-left font-semibold">Reminder</th>
                  <th className="px-4 py-2 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(t => (
                  <tr key={t.id} className="hover:bg-indigo-50/30">
                    <td className="px-4 py-2">{t.title}</td>
                    <td className="px-4 py-2 capitalize">{t.team.replace("_"," ")}</td>
                    <td className="px-4 py-2 capitalize">{t.status.replace("_"," ")}</td>
                    <td className="px-4 py-2 capitalize">{t.priority}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        {(t.assignees || []).map(a => (
                          <span key={a.memberId} className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700">
                            {a.name}
                          </span>
                        ))}
                        {(!t.assignees || t.assignees.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {t.dueAt?.toDate ? t.dueAt.toDate().toLocaleString()
                        : t.dueAt ? new Date(t.dueAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2">
                      {t.remindAt?.toDate ? t.remindAt.toDate().toLocaleString()
                        : t.remindAt ? new Date(t.remindAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        {t.status !== "completed" && (
                          <Button size="sm" variant="outline" onClick={() => markComplete(t.id)}>
                            Complete
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => startEdit(t)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => removeTask(t.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No tasks found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center">
            {hasMore && (
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? "Loading..." : "Load more"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
