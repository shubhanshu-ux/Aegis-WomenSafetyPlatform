/** Normalizes Axios / network errors for UI copy. */
export function getApiErrorMessage(err, fallback = "Something went wrong.") {
  const m = err?.response?.data?.message ?? err?.message;
  if (typeof m === "string" && m.trim()) return m;
  return fallback;
}
