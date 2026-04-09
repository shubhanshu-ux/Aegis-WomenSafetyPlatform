/** API base includes `/api` path segment (matches Axios instance). */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/** Socket.io server origin (no path). */
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";
