// /app/students/page.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchStudentsPage } from "@/services/students";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";

export default function StudentsPage() {
  const [qText, setQText] = useState("");
  const [status, setStatus] = useState("");
  const [quick, setQuick] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const cursorRef = useRef(null);
  const [hasMore, setHasMore] = useState(false);

  const resetAndLoad = async () => {
    try {
      setLoading(true);
      cursorRef.current = null;
      const { items, nextCursor } = await fetchStudentsPage({ qText, status, quick, pageSize: 10 });
      setRows(items);
      cursorRef.current = nextCursor;
      setHasMore(!!nextCursor);
    } catch (err) {
      console.error(err);
      toast.error(
        <div>
          <p className="font-semibold">Failed to load students</p>
          <p className="text-sm text-muted-foreground">{err?.message || "Unknown error"}</p>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!cursorRef.current) return;
    try {
      setLoading(true);
      const { items, nextCursor } = await fetchStudentsPage({
        qText, status, quick, pageSize: 10, cursor: cursorRef.current,
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
    resetAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusOptions = useMemo(() => ([
    "Exploring", "Shortlisting", "Applying", "Submitted", "Accepted"
  ]), []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card className="shadow-xl rounded-2xl border border-gray-200">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl text-indigo-700">Student Directory</CardTitle>
            <p className="text-sm text-gray-500">Search, filter, and manage students</p>
          </div>
          <Button
            asChild
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Link href="/dashboard/addstudent">
              Add Student
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Search by name..."
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                className="focus-visible:ring-indigo-500"
              />
            </div>
            <div>
              <Label>Status</Label>
            <Select onValueChange={(val) => setStatus(val === "all" ? "" : val)} value={status || "all"}>
                <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {statusOptions.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            </div>
            <div>
              <Label>Quick Filters</Label>
              <Select onValueChange={(val) => setQuick(val === "none" ? "" : val)} value={quick || "none"}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="not-contacted-7d">Not contacted in 7 days</SelectItem>
                        <SelectItem value="high-intent">High intent</SelectItem>
                        <SelectItem value="needs-essay">Needs essay help</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={resetAndLoad}
                disabled={loading}
              >
                {loading ? "Loading..." : "Apply"}
              </Button>
              <Button variant="outline" onClick={() => { setQText(""); setStatus(""); setQuick(""); }}>
                Clear
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Name</th>
                  <th className="px-4 py-2 text-left font-semibold">Email</th>
                  <th className="px-4 py-2 text-left font-semibold">Country</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-left font-semibold">Progress</th>
                  <th className="px-4 py-2 text-left font-semibold">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(stu => (
                  <tr key={stu.id} className="hover:bg-indigo-50/30">
                    <td className="px-4 py-2">
                      <Link href={`/dashboard/students/${stu.id}`} className="text-indigo-700 hover:underline font-medium">
                        {stu.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{stu.email}</td>
                    <td className="px-4 py-2">{stu.country || "-"}</td>
                    <td className="px-4 py-2">{stu.status}</td>
                    <td className="px-4 py-2">
                      <div className="w-40 bg-gray-200 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${stu.progress || 0}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {stu.lastActive?.toDate ? stu.lastActive.toDate().toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && !loading && (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No students found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center pt-2">
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
