const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_RANGE_DAYS = 31;

/** Returns the number of whole days spanned by [start, end], inclusive. */
export function daysBetween(start: string, end: string): number {
  const startMs = new Date(`${start}T00:00:00Z`).getTime();
  const endMs = new Date(`${end}T00:00:00Z`).getTime();
  return Math.round((endMs - startMs) / 86_400_000) + 1;
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime());
}

export function isFutureDate(value: string): boolean {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return new Date(`${value}T00:00:00Z`).getTime() > today.getTime();
}
