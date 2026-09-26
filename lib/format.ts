// Dates on access pages, in one fixed time zone so that every server shows the same date.
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' });
}
