import { APP_NAME } from "../constants/branding";

/** App shell first paint */
function AppLoadingScreen() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-slate-200 border-t-red-600 dark:border-gray-700 dark:border-t-red-500" />
      <p className="mt-5 font-display text-lg font-bold text-slate-800 dark:text-white">{APP_NAME}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">Loading…</p>
    </div>
  );
}

export default AppLoadingScreen;
