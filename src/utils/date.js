function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function normalizeDateString(dateString) {
  if (!dateString) return '';

  if (typeof dateString === 'string') {
    const trimmed = dateString.trim();

    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    const slashOrDashMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (slashOrDashMatch) {
      const first = Number(slashOrDashMatch[1]);
      const second = Number(slashOrDashMatch[2]);
      const year = slashOrDashMatch[3];

      const month = first > 12 ? second : first;
      const day = first > 12 ? first : second;

      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return toLocalDateString(parsed);
    }

    return '';
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return '';

  return toLocalDateString(parsed);
}

export function getToday() {
  return toLocalDateString(new Date());
}

export function formatDate(dateString) {
  if (!dateString) return 'Sin fecha';

  const date = new Date(`${dateString}T12:00:00`);

  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeHuman(dateTimeString) {
  if (!dateTimeString) return 'sin dato';

  const parsed = new Date(dateTimeString);
  if (Number.isNaN(parsed.getTime())) return 'sin dato';

  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
    .format(parsed)
    .replace(/^([A-ZÁÉÍÓÚÑ])/, (match) => match.toLowerCase())
    .replace(/, (?=\d{1,2}:\d{2})/, ', ')
    .replace(/\b(a\.?\s?m\.?)\b/i, 'a. m.')
    .replace(/\b(p\.?\s?m\.?)\b/i, 'p. m.');
}

export function getStartOfWeek(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toLocalDateString(date);
}

export function getEndOfWeek(dateString) {
  const start = new Date(`${getStartOfWeek(dateString)}T12:00:00`);
  start.setDate(start.getDate() + 6);
  return toLocalDateString(start);
}

export function isDateInRange(dateString, start, end) {
  const normalized = normalizeDateString(dateString);
  return normalized >= start && normalized <= end;
}

export function isSameDate(dateString, targetDate) {
  return normalizeDateString(dateString) === normalizeDateString(targetDate);
}

export function sortByDateDesc(items) {
  return [...items].sort((a, b) => {
    const dateA = normalizeDateString(a.date);
    const dateB = normalizeDateString(b.date);

    if (dateA === dateB) {
      return String(b.id).localeCompare(String(a.id));
    }

    return dateB.localeCompare(dateA);
  });
}
