// Dates are plain "YYYY-MM-DD" strings everywhere: no time zones, no daylight-saving surprises.

export type ISODate = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function toISO(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): ISODate {
  return toISO(new Date());
}

/** Parse as a calendar day at noon UTC so arithmetic never crosses a DST boundary. */
function utc(iso: ISODate): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d, 12);
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = new Date(utc(iso) + n * 86_400_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Whole days from a to b (b - a). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

export function isValidISO(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function weekday(iso: ISODate): number {
  return new Date(utc(iso)).getUTCDay(); // 0 = Sunday
}

export function monthStart(iso: ISODate): ISODate {
  return iso.slice(0, 8) + "01";
}

export function addMonths(iso: ISODate, n: number): ISODate {
  const [y, m] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}-01`;
}

export function daysInMonth(iso: ISODate): number {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT_MONTHS = MONTHS.map((m) => m.slice(0, 3));
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatMonth(iso: ISODate): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** "Mon, Nov 24" */
export function formatShort(iso: ISODate): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${WEEKDAYS[weekday(iso)]}, ${SHORT_MONTHS[m - 1]} ${d}`;
}

/** "Nov 24" */
export function formatDayMonth(iso: ISODate): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${SHORT_MONTHS[m - 1]} ${d}`;
}

export { WEEKDAYS };
