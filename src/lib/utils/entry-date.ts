function toISODate(year: number, monthIndex: number, day: number) {
  return `${String(year).padStart(4, "0")}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * The date a new transaction should default to. Today, unless the user is
 * viewing a different month (via the month selector's ?month=&year= params),
 * in which case today is clamped into that month — the last day of a past
 * month, the first day of a future one — so they don't have to page the date
 * picker back to the month they're already looking at.
 */
export function defaultEntryDate(monthParam?: string | null, yearParam?: string | null) {
  const now = new Date();
  const month = Number(monthParam);
  const year = Number(yearParam);
  const viewingSpecificMonth =
    Number.isInteger(month) && month >= 1 && month <= 12 && Number.isInteger(year) && year >= 1970;

  if (!viewingSpecificMonth) return toISODate(now.getFullYear(), now.getMonth(), now.getDate());

  const monthIndex = month - 1;
  const viewed = year * 12 + monthIndex;
  const current = now.getFullYear() * 12 + now.getMonth();

  if (viewed === current) return toISODate(year, monthIndex, now.getDate());
  if (viewed < current) return toISODate(year, monthIndex, new Date(year, month, 0).getDate());
  return toISODate(year, monthIndex, 1);
}
