import { useEffect, useState } from "react";
import { formatTimeAgo } from "../utils/timeAgo";

/**
 * Re-computes label on an interval (default 12s) for live-updating UI.
 */
export function useLiveTimeAgo(dateInput, intervalMs = 12000) {
  const [label, setLabel] = useState(() => formatTimeAgo(dateInput));

  useEffect(() => {
    const tick = () => setLabel(formatTimeAgo(dateInput));
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [dateInput, intervalMs]);

  return label;
}
