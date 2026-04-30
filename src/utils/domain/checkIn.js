import { getToday, normalizeDateString } from '../date';

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
  };
}
