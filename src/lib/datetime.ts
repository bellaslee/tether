export function toDatetimeLocalInputValue(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** First-of-month `YYYY-MM-DD` or ISO date string → e.g. "March 2024". */
export function formatMonthYear(isoDate: string): string {
  const day = isoDate.slice(0, 10);
  const [y, m] = day.split("-").map(Number);
  if (!y || !m) {
    return isoDate;
  }
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}
