export function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function sumBy(items, key) {
  return items.reduce((total, item) => total + Number(item[key] || 0), 0);
}

export function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function uniqueDates(items) {
  return [...new Set(items.map((item) => item.date))];
}

export function shiftDateByDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function getLatestEntry(items) {
  return [...items].sort((a, b) => b.date.localeCompare(a.date))[0] || null;
}

export function getNumericMetric(value) {
  if (value === '' || value === null || value === undefined || value === '--') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) || !Number.isFinite(parsed) ? null : parsed;
}
