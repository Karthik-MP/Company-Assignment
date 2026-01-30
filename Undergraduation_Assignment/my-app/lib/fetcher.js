export async function safeFetch(input, init = {}) {
  try {
    const res = await fetch(input, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers || {}) },
      cache: "no-store",
    });
    const isJson = res.headers.get("content-type")?.includes("application/json");
    const body = isJson ? await res.json().catch(() => ({})) : await res.text();

    if (!res.ok) {
      const message =
        (isJson && (body?.message || body?.error)) ||
        (typeof body === "string" ? body : "Request failed");
      const err = new Error(message);
      err.status = res.status;
      err.meta = body?.meta;
      throw err;
    }
    return body;
  } catch (e) {
    // normalize & rethrow
    const err = new Error(e?.message || "Network error");
    err.cause = e;
    err.status = e?.status || 0;
    throw err;
  }
}
