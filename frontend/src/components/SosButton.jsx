import ButtonSpinner from "./ButtonSpinner";

/**
 * Premium SOS control with modern SaaS styling.
 */
function SosButton({
  loading = false,
  disabled = false,
  onClick,
  hintText = "Tap to send emergency alert",
  blockedHintText = "SOS already active",
}) {
  const blocked = disabled && !loading;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
        <span
          className="absolute inset-0 rounded-full bg-red-500/15 animate-sos-ring"
          aria-hidden
        />
        <span
          className="absolute inset-4 rounded-full bg-red-500/10 animate-sos-ring-delayed"
          aria-hidden
        />

        <button
          type="button"
          onClick={onClick}
          disabled={loading || disabled}
          aria-busy={loading}
          aria-disabled={blocked}
          className="glass-button-danger relative z-10 flex h-64 w-64 flex-col items-center justify-center text-6xl font-black tracking-tight sm:h-72 sm:w-72 animate-pulse-glow"
        >
          {loading ? (
            <ButtonSpinner className="h-12 w-12 text-white" />
          ) : (
            "SOS"
          )}
        </button>
      </div>

      <p className="mt-8 max-w-xs text-center text-base font-medium leading-relaxed text-white/70">
        {blocked ? blockedHintText : hintText}
      </p>
    </div>
  );
}

export default SosButton;
