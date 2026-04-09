import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const ToastContext = createContext(null);

const noop = () => {};

const fallbackToast = {
  success: noop,
  error: noop,
  sos: noop,
};

let toastId = 0;

const ICON = {
  success: "✅",
  error: "❌",
  sos: "🚨",
};

function ToastItem({ type, message }) {
  const t = type === "sos" || type === "error" || type === "success" ? type : "success";
  const icon = ICON[t];
  const styles =
    t === "success"
      ? "bg-white text-emerald-950 ring-emerald-200/90 shadow-soft-lg dark:bg-gray-800 dark:text-emerald-100 dark:ring-emerald-700/50"
      : t === "error"
        ? "bg-white text-red-950 ring-red-200/90 shadow-soft-lg dark:bg-gray-800 dark:text-red-100 dark:ring-red-700/50"
        : "bg-white text-slate-900 ring-red-200/80 shadow-soft-lg dark:bg-gray-800 dark:text-gray-100 dark:ring-red-800/50";

  return (
    <div
      role="status"
      className={`pointer-events-auto flex max-w-sm gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium leading-snug ring-1 transition-all duration-300 ease-in-out animate-toast-in ${styles}`}
    >
      <span className="shrink-0 text-base leading-none" aria-hidden>
        {icon}
      </span>
      <span className="pt-0.5">{message}</span>
    </div>
  );
}

/**
 * Global toasts: success (✅), error (❌), sos (🚨). Top-right, premium cards.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      const safeMsg =
        message != null && String(message).trim() !== ""
          ? String(message)
          : "Something went wrong.";
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, type, message: safeMsg }]);
      setTimeout(() => remove(id), 4800);
    },
    [remove]
  );

  const success = useCallback((message) => push("success", message), [push]);
  const error = useCallback((message) => push("error", message), [push]);
  const sos = useCallback((message) => push("sos", message), [push]);

  const value = useMemo(() => ({ success, error, sos }), [success, error, sos]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex max-h-[50vh] flex-col gap-2 overflow-y-auto p-4 sm:inset-x-auto sm:left-auto sm:right-4 sm:top-4 sm:max-w-md sm:flex-col sm:p-0"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((item) => (
          <ToastItem key={item.id} type={item.type} message={item.message} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx ?? fallbackToast;
}
