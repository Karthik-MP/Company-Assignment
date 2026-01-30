// /app/students/components/SummaryStats.jsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getStudentStats } from "@/services/students_stats";

export default function SummaryStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const s = await getStudentStats();
      setStats(s);
    } catch (err) {
      console.error(err);
      toast.error(
        <div>
          <p className="font-semibold">Failed to load summary</p>
          <p className="text-sm text-muted-foreground">
            {err?.message || "Unknown error"}
          </p>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border rounded-2xl">
            <CardHeader>
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const { total, active30d, essayStage, highIntent, byStatus } = stats;

  return (
    <div className="space-y-4">
      {/* Top KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="border rounded-2xl">
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Total Students</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-indigo-700">{total}</p></CardContent>
        </Card>

        <Card className="border rounded-2xl">
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Active (30 days)</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-indigo-700">{active30d}</p></CardContent>
        </Card>

        <Card className="border rounded-2xl">
          <CardHeader><CardTitle className="text-sm text-muted-foreground">In Essay Stage</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-indigo-700">{essayStage}</p></CardContent>
        </Card>

        <Card className="border rounded-2xl">
          <CardHeader><CardTitle className="text-sm text-muted-foreground">High Intent</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-indigo-700">{highIntent}</p></CardContent>
        </Card>
      </div>

      {/* Status breakdown */}
      <Card className="border rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">By Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(byStatus).map(([k, v]) => (
              <div key={k} className="p-3 rounded-xl border">
                <p className="text-xs text-gray-500">{k}</p>
                <p className="text-xl font-semibold text-indigo-700">{v}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Refresh */}
      <div className="flex justify-end">
        <button
          onClick={load}
          className="text-sm px-3 py-2 rounded-lg border hover:bg-indigo-50"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
