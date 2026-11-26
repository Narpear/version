// Date helpers that always use the user's LOCAL calendar day.
//
// Why: `date.toISOString().split('T')[0]` gives the UTC date (in New York it rolls
// over to tomorrow at 7pm), and `new Date('YYYY-MM-DD')` is parsed as UTC midnight
// (which displays as the previous day west of UTC). Use these instead everywhere.

/** Format a Date as YYYY-MM-DD in local time. */
export function toLocalDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today's date as YYYY-MM-DD in local time. */
export function todayStr(): string {
  return toLocalDateStr(new Date());
}

/** Parse YYYY-MM-DD as local midnight (not UTC). Falls back to Date parsing for other formats. */
export function parseLocalDate(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(s);
}
