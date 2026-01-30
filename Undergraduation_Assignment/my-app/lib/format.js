export const formatDate = (d) =>
  d ? new Date(d).toLocaleString() : "—";

export const cn = (...a) => a.filter(Boolean).join(" ");
