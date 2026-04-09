/** Normalize API/storage role strings for comparisons. */
export function normalizeUserRole(role) {
  if (role == null || role === "") return null;
  const s = String(role).trim().toLowerCase();
  if (s === "volunteer" || s === "user") return s;
  return s || null;
}

export function isVolunteerRole(role) {
  return normalizeUserRole(role) === "volunteer";
}
