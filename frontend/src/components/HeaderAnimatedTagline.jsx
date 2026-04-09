/**
 * Subtle header-only motion — single line, slow opacity pulse (no typing carousel).
 */
function HeaderAnimatedTagline({ className = "" }) {
  return (
    <p
      className={`animate-tagline-soft text-sm font-medium text-slate-600 dark:text-gray-300 ${className}`}
    >
      Stay Safe. Stay Connected.
    </p>
  );
}

export default HeaderAnimatedTagline;
