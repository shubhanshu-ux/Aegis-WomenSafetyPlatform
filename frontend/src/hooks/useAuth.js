import { safeLocalStorage } from "../utils/safeStorage";
import { normalizeUserRole } from "../utils/roles";

/**
 * Helper to read the current user role from storage without React context.
 */
export function getCurrentUserRole() {
  try {
    const raw = safeLocalStorage.getItem("user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (!user || typeof user !== "object") return null;
    const role = user.role;
    if (typeof role !== "string") return null;
    return normalizeUserRole(role);
  } catch {
    return null;
  }
}

function parseUser(raw) {
  if (!raw) return null;
  try {
    const user = JSON.parse(raw);
    if (!user || typeof user !== "object" || Array.isArray(user)) return null;
    return user;
  } catch {
    return null;
  }
}

export default function useAuth() {
  const token = safeLocalStorage.getItem("token");
  const isAuthenticated = Boolean(token && String(token).trim());

  const saveSession = ({ token: nextToken, user }) => {
    if (nextToken != null && String(nextToken).trim()) {
      safeLocalStorage.setItem("token", String(nextToken));
    }
    if (user != null && typeof user === "object" && !Array.isArray(user)) {
      try {
        const stored = { ...user };
        if (stored.role != null) {
          const n = normalizeUserRole(stored.role);
          if (n) stored.role = n;
        }
        safeLocalStorage.setItem("user", JSON.stringify(stored));
      } catch {
        /* ignore */
      }
    }
  };

  const clearToken = () => {
    safeLocalStorage.removeItem("token");
    safeLocalStorage.removeItem("user");
  };

  const getUser = () => parseUser(safeLocalStorage.getItem("user"));

  const role = getCurrentUserRole();

  return {
    token: token || null,
    isAuthenticated,
    saveSession,
    clearToken,
    user: getUser(),
    role,
  };
}
