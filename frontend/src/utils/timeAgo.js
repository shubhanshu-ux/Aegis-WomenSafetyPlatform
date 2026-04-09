/**
 * Relative time from a date (ISO string, Date, or timestamp).
 */
export function formatTimeAgo(dateInput) {
  if (dateInput == null || dateInput === "") return "";
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const t = d.getTime();
  if (Number.isNaN(t)) return "";

  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 0) return "Just now";
  if (sec < 5) return "Just now";
  if (sec < 60) return `${sec} sec ago`;

  const min = Math.floor(sec / 60);
  if (min === 1) return "1 min ago";
  if (min < 60) return `${min} min ago`;

  const hr = Math.floor(min / 60);
  if (hr === 1) return "1 hr ago";
  if (hr < 24) return `${hr} hr ago`;

  const day = Math.floor(hr / 24);
  if (day === 1) return "1 day ago";
  return `${day} days ago`;
}
