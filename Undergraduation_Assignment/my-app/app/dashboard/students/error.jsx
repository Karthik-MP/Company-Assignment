// /app/students/error.jsx
"use client";
export default function StudentsError({ error, reset }) {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="rounded-xl border p-6 bg-red-50">
        <p className="font-semibold text-red-700">Something went wrong loading the directory.</p>
        <p className="text-sm text-red-600 mt-2">{error?.message || "Unknown error"}</p>
        <button onClick={() => reset()} className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white">Try again</button>
      </div>
    </div>
  );
}

// /app/students/loading.jsx
export function StudentsLoading() {
  return (
    <div className="p-6 max-w-6xl mx-auto animate-pulse text-muted-foreground">
      Loading students…
    </div>
  );
}
