/**
 * localStorage/sessionStorage wrappers — never throw (private mode, quota, disabled storage).
 */
function wrap(getStorage) {
  return {
    getItem(key) {
      try {
        return getStorage()?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        getStorage()?.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    removeItem(key) {
      try {
        getStorage()?.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
  };
}

export const safeLocalStorage = wrap(() =>
  typeof localStorage !== "undefined" ? localStorage : null
);
