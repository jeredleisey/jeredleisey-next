export function formatDate(iso: string): string {
  // Content dates are date-only ISO strings (e.g. "2026-06-11"), which Date
  // parses as UTC midnight. Format in UTC so the displayed day doesn't shift
  // backward in timezones behind UTC.
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
