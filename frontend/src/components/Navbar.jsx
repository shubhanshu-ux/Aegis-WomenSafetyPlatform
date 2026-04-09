import { Link } from "react-router-dom";
import { APP_NAME } from "../constants/branding";
import ButtonSpinner from "./ButtonSpinner";

/**
 * Premium glass navbar with modern SaaS styling.
 */
function Navbar({
  showLogout = false,
  onLogout,
  logoutLoading = false,
  userRole = null,
}) {
  const roleLabel =
    userRole === "volunteer"
      ? "Volunteer"
      : userRole === "user"
        ? "User"
        : null;

  return (
    <header className="sticky top-0 z-40 glass-card border-b border-white/10 mb-8 animate-fade-in">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:gap-6 sm:px-8">
        <Link
          to="/"
          className="font-display text-2xl font-bold tracking-tight text-white transition-all duration-300 ease hover:text-teal-300 active:scale-[0.98]"
        >
          {APP_NAME}
        </Link>

        <div className="flex items-center gap-3">
          {roleLabel ? (
            <span className="hidden rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/80 shadow-lg sm:inline-flex">
              {roleLabel}
            </span>
          ) : null}

          {showLogout ? (
            <button
              type="button"
              onClick={() => (typeof onLogout === "function" ? onLogout() : undefined)}
              disabled={logoutLoading}
              className="glass-button-secondary px-4 py-2 text-sm"
            >
              {logoutLoading ? (
                <>
                  <ButtonSpinner className="h-4 w-4 text-white" />
                  <span className="hidden sm:inline">Signing out…</span>
                </>
              ) : (
                "Logout"
              )}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
