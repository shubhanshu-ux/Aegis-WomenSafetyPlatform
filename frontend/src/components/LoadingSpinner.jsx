/**
 * Centered loader — ring style for a premium feel.
 */
function LoadingSpinner({ label = "Loading", className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-14 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>
      <div
        className="h-12 w-12 animate-spin rounded-full border-[3px] border-slate-200 border-t-red-600"
        aria-hidden
      />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

export default LoadingSpinner;
