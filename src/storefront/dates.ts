const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-09-24" → "24 September 2026", or "24 Sep 2026" when space is short. */
export function dateLabel(iso: string, short = false): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  const month = MONTHS[d.getUTCMonth()];
  return `${d.getUTCDate()} ${short ? month.slice(0, 3) : month} ${d.getUTCFullYear()}`;
}
