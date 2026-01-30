// /app/students/[id]/error.jsx
"use client";
export function StudentError({ error, reset }) {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="rounded-xl border p-6 bg-red-50">
        <p className="font-semibold text-red-700">Failed to load profile.</p>
        <p className="text-sm text-red-600 mt-2">{error?.message || "Unknown error"}</p>
        <button onClick={() => reset()} className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white">Retry</button>
      </div>
    </div>
  );
}

// /app/students/[id]/loading.jsx
export default function StudentLoading() {
  return <div className="p-6 max-w-5xl mx-auto animate-pulse text-muted-foreground">Loading profile…</div>;
}
