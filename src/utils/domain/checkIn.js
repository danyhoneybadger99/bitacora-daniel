import { getStartOfWeek, getToday, normalizeDateString } from '../date';

export const checkInEmotionOptions = [
  { value: 'tranquilo', label: 'Tranquilo' },
  { value: 'enfocado', label: 'Enfocado' },
  { value: 'motivado', label: 'Motivado' },
  { value: 'cansado', label: 'Cansado' },
  { value: 'estresado', label: 'Estresado' },
  { value: 'ansioso', label: 'Ansioso' },
  { value: 'irritable', label: 'Irritable' },
  { value: 'agradecido', label: 'Agradecido' },
];

export function createEmptyDailyCheckIn(date = getToday()) {
  return {
    id: '',
    date: normalizeDateString(date) || getToday(),
    generalState: '7',
    energy: '7',
    sleepQuality: '7',
    emotions: [],
    note: '',
    gratitudeDone: false,
    gratitudeText: '',
    confessionReady: false,
  };
}

export function normalizeDailyCheckIn(item = {}) {
  const source = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
  const base = createEmptyDailyCheckIn(source.date);
  return {
    ...base,
    ...source,
    id: source.id || base.id,
    date: normalizeDateString(source.date) || base.date,
    generalState: String(source.generalState ?? source.state ?? base.generalState),
    energy: String(source.energy ?? base.energy),
    sleepQuality: String(source.sleepQuality ?? source.sleep ?? base.sleepQuality),
    emotions: Array.isArray(source.emotions)
      ? source.emotions.filter(Boolean)
      : String(source.emotions || '')
          .split(',')
          .map((emotion) => emotion.trim())
          .filter(Boolean),
    note: source.note ?? source.notes ?? '',
    gratitudeDone: Boolean(source.gratitudeDone),
    gratitudeText: source.gratitudeText ?? '',
    confessionReady: Boolean(source.confessionReady),
  };
}

export function getSpiritualWeekStart(date = getToday()) {
  return getStartOfWeek(normalizeDateString(date) || getToday());
}

export function normalizeSpiritualWeeklyCheck(item = {}) {
  const source = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
  const attendedAt = normalizeDateString(source.attendedAt || source.date);
  const weekStart = normalizeDateString(source.weekStart) || getSpiritualWeekStart(attendedAt || getToday());

  return {
    id: source.id || `spiritual-week-${weekStart}`,
    weekStart,
    attendedMass: Boolean(source.attendedMass ?? source.massAttended ?? source.massAttendedThisWeek),
    attendedAt,
    updatedAt: source.updatedAt ?? '',
  };
}

export function createDanielSpiritualWeeklySeeds() {
  return ['2026-04-25', '2026-05-02', '2026-05-09'].map((date) =>
    normalizeSpiritualWeeklyCheck({
      id: `spiritual-mass-${date}`,
      weekStart: getSpiritualWeekStart(date),
      attendedMass: true,
      attendedAt: date,
      updatedAt: `${date}T12:00:00`,
    })
  );
}

export function mergeDanielSpiritualWeeklySeeds(items = []) {
  const normalized = Array.isArray(items)
    ? items.map((item) => normalizeSpiritualWeeklyCheck(item)).filter((item) => item.weekStart)
    : [];
  const byWeek = new Map(normalized.map((item) => [item.weekStart, item]));

  createDanielSpiritualWeeklySeeds().forEach((seed) => {
    if (!byWeek.has(seed.weekStart)) {
      byWeek.set(seed.weekStart, seed);
    }
  });

  return [...byWeek.values()].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}

export function hasMassAttendanceForWeek(items = [], date = getToday()) {
  const weekStart = getSpiritualWeekStart(date);
  return (items || []).some((item) => item.weekStart === weekStart && item.attendedMass);
}

export function calculateMassAttendanceStreak(items = [], date = getToday()) {
  const attendedWeeks = new Set(
    (items || [])
      .filter((item) => item.attendedMass)
      .map((item) => item.weekStart)
      .filter(Boolean)
  );

  const currentWeekStart = getSpiritualWeekStart(date);
  const currentDate = new Date(`${normalizeDateString(date) || getToday()}T12:00:00`);
  const currentWeekIsComplete = currentDate.getDay() === 0;
  let cursor = currentWeekStart;

  if (!attendedWeeks.has(cursor)) {
    if (currentWeekIsComplete) return 0;
    const previousWeek = new Date(`${cursor}T12:00:00`);
    previousWeek.setDate(previousWeek.getDate() - 7);
    cursor = normalizeDateString(previousWeek);
  }

  let streak = 0;

  while (attendedWeeks.has(cursor)) {
    streak += 1;
    const previousWeek = new Date(`${cursor}T12:00:00`);
    previousWeek.setDate(previousWeek.getDate() - 7);
    cursor = normalizeDateString(previousWeek);
  }

  return streak;
}
