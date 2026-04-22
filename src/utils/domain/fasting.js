import { getToday, normalizeDateString } from '../date';
import { shiftDateByDays } from './shared';

export function createEmptyFastingProtocol() {
  return {
    dayOfWeek: 'lunes',
    fastingType: 'omad',
    startTime: '',
    eatingWindow: '',
    expectedDuration: '',
    notes: '',
  };
}

export function createEmptyFastingLog() {
  return {
    date: getToday(),
    expectedProtocol: '',
    targetHours: '',
    actualStartDateTime: '',
    actualBreakDateTime: '',
    actualDuration: '',
    completed: 'no',
    hunger: 'media',
    energy: 'media',
    cravings: 'media',
    notes: '',
  };
}

export const fastingDayLabels = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miercoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sabado',
  domingo: 'Domingo',
};

export const fastingDayOrder = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  domingo: 7,
};

export const fastingTypeLabels = {
  '36-horas': 'Ayuno de 36 horas',
  omad: 'OMAD',
  '18-6': 'Ayuno 18/6',
  '12-12': 'Ayuno 12/12',
  personalizado: 'Personalizado',
};

export const fastingFeelingLabels = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
};

export function getDayOfWeekKey(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  const keys = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return keys[date.getDay()] || 'lunes';
}

export function formatProtocolLabel(protocol) {
  if (!protocol) return 'Sin protocolo';
  return fastingTypeLabels[protocol.fastingType] || protocol.fastingType || 'Sin protocolo';
}

export function findFastingProtocolForDate(protocols, dateString) {
  const dayOfWeek = getDayOfWeekKey(dateString || getToday());
  return (protocols || []).find((item) => item.dayOfWeek === dayOfWeek) || null;
}

export function calculateFastingDurationHours(startTime, breakTime) {
  if (!startTime || !breakTime) return '';

  const start = new Date(startTime);
  const end = new Date(breakTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';

  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return '';

  return (diffMs / (1000 * 60 * 60)).toFixed(1);
}

export function calculateLiveElapsedHours(startDateTime, nowTimestamp) {
  if (!startDateTime) return 0;

  const start = new Date(startDateTime);
  const now = new Date(nowTimestamp);
  const diffMs = now.getTime() - start.getTime();

  if (!Number.isFinite(diffMs) || diffMs <= 0) return 0;
  return diffMs / (1000 * 60 * 60);
}

function parseFastingTargetHours(value) {
  const protocolText = String(value || '').toLowerCase();
  if (!protocolText) return 0;

  const hoursMatch = protocolText.match(/(\d+(?:\.\d+)?)\s*horas?/);
  if (hoursMatch) return Number(hoursMatch[1] || 0);

  const windowMatch = protocolText.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (windowMatch) return Number(windowMatch[1] || 0);

  if (protocolText.includes('omad')) return 23;
  return 0;
}

export function isFastingLogActiveAt(log, nowTimestamp = Date.now()) {
  if (!log?.actualStartDateTime) return false;

  const start = new Date(log.actualStartDateTime);
  if (Number.isNaN(start.getTime())) return false;

  const now = new Date(nowTimestamp);
  if (now.getTime() < start.getTime()) return false;

  if (!log.actualBreakDateTime) return true;

  const breakDate = new Date(log.actualBreakDateTime);
  if (Number.isNaN(breakDate.getTime())) return true;

  return now.getTime() < breakDate.getTime();
}

export function getFastingPlannedDurationHours(log) {
  if (!log?.actualStartDateTime) {
    const manualDuration = Number(log?.actualDuration || 0);
    return manualDuration > 0 ? manualDuration : 0;
  }

  if (log.actualBreakDateTime) {
    const calculatedDuration = Number(
      calculateFastingDurationHours(log.actualStartDateTime, log.actualBreakDateTime) || 0
    );
    if (calculatedDuration > 0) return calculatedDuration;
  }

  const directDuration = Number(log.actualDuration || 0);
  if (directDuration > 0) return directDuration;

  const targetDuration = Number(log.targetHours || log.expectedDuration || log.plannedDuration || 0);
  if (Number.isFinite(targetDuration) && targetDuration > 0) return targetDuration;

  return parseFastingTargetHours(log.expectedProtocol);
}

export function getEffectiveFastingTargetHours(log, protocol) {
  const directLogTarget = Number(log?.targetHours || log?.expectedDuration || log?.plannedDuration || 0);
  if (Number.isFinite(directLogTarget) && directLogTarget > 0) return directLogTarget;

  const explicitLogTarget = parseFastingTargetHours(log?.expectedProtocol);
  if (explicitLogTarget > 0) return explicitLogTarget;

  const protocolTarget = Number(protocol?.expectedDuration || 0);
  return Number.isFinite(protocolTarget) && protocolTarget > 0 ? protocolTarget : 0;
}

export function compareFastingPriority(a, b, nowTimestamp = Date.now()) {
  const plannedA = getFastingPlannedDurationHours(a);
  const plannedB = getFastingPlannedDurationHours(b);
  if (plannedB !== plannedA) return plannedB - plannedA;

  const elapsedA = getFastingElapsedHours(a, nowTimestamp);
  const elapsedB = getFastingElapsedHours(b, nowTimestamp);
  if (elapsedB !== elapsedA) return elapsedB - elapsedA;

  const startA = new Date(a.actualStartDateTime || `${a.date}T00:00`).getTime();
  const startB = new Date(b.actualStartDateTime || `${b.date}T00:00`).getTime();
  if (startA !== startB) return startA - startB;

  return String(a.id || '').localeCompare(String(b.id || ''));
}

export function doFastingLogsOverlap(a, b, nowTimestamp = Date.now()) {
  const rangeA = getFastingTimeRange(a, nowTimestamp);
  const rangeB = getFastingTimeRange(b, nowTimestamp);
  if (!rangeA || !rangeB) return false;

  return rangeA.start < rangeB.end && rangeB.start < rangeA.end;
}

export function resolveFastingLogConflicts(logs, nowTimestamp = Date.now()) {
  const sortedByPriority = [...(logs || [])].sort((a, b) => compareFastingPriority(a, b, nowTimestamp));
  const selected = [];

  sortedByPriority.forEach((candidate) => {
    const overlapsExisting = selected.some((kept) => doFastingLogsOverlap(candidate, kept, nowTimestamp));
    if (!overlapsExisting) {
      selected.push(candidate);
    }
  });

  return selected.sort((a, b) => {
    const refA = a.actualStartDateTime || a.actualBreakDateTime || `${a.date}T00:00`;
    const refB = b.actualStartDateTime || b.actualBreakDateTime || `${b.date}T00:00`;
    return refB.localeCompare(refA);
  });
}

export function getActiveFastingLog(logs, nowTimestamp = Date.now()) {
  const activeLogs = (logs || []).filter((item) => isFastingLogActiveAt(item, nowTimestamp));
  if (activeLogs.length === 0) return null;

  return [...activeLogs].sort((a, b) => compareFastingPriority(a, b, nowTimestamp))[0];
}

function hasRealFastingData(log) {
  return Boolean(
    log?.actualStartDateTime ||
      log?.actualBreakDateTime ||
      Number(log?.actualDuration || 0) > 0
  );
}

function doesFastingLogTouchDate(log, dateString, nowTimestamp = Date.now()) {
  const targetDate = normalizeDateString(dateString);
  if (!targetDate || !hasRealFastingData(log)) return false;

  const recordDate = getFastingRecordDate(log);
  const breakDate = normalizeDateString(log?.actualBreakDateTime);
  const range = getFastingTimeRange(log, nowTimestamp);
  if (range) {
    const dayStart = new Date(`${targetDate}T00:00:00`);
    const dayEnd = new Date(`${shiftDateByDays(targetDate, 1)}T00:00:00`);
    return (range.start < dayEnd && range.end > dayStart) || recordDate === targetDate || breakDate === targetDate;
  }

  return recordDate === targetDate || breakDate === targetDate;
}

export function getPrimaryFastingLogForDate(logs, dateString, nowTimestamp = Date.now()) {
  const targetDate = normalizeDateString(dateString || getToday());
  if (!targetDate) return null;

  const candidates = (logs || []).filter((item) =>
    doesFastingLogTouchDate(item, targetDate, nowTimestamp)
  );
  if (candidates.length === 0) return null;

  const activeCandidates = candidates.filter((item) => isFastingLogActiveAt(item, nowTimestamp));
  if (activeCandidates.length > 0) {
    return [...activeCandidates].sort((a, b) => compareFastingPriority(a, b, nowTimestamp))[0];
  }

  const resolvedCandidates = resolveFastingLogConflicts(candidates, nowTimestamp);
  if (resolvedCandidates.length === 0) return null;

  return [...resolvedCandidates].sort((a, b) => compareFastingPriority(a, b, nowTimestamp))[0];
}

export function getFastingElapsedHours(log, nowTimestamp = Date.now()) {
  if (!log?.actualStartDateTime) return Number(log?.actualDuration || 0);

  if (log.actualBreakDateTime && !isFastingLogActiveAt(log, nowTimestamp)) {
    return Number(log.actualDuration || calculateFastingDurationHours(log.actualStartDateTime, log.actualBreakDateTime) || 0);
  }

  return calculateLiveElapsedHours(log.actualStartDateTime, nowTimestamp);
}

export function getFastingStatusLabel(log, protocol, nowTimestamp = Date.now()) {
  if (!log) return 'pendiente';

  if (!log.actualStartDateTime && Number(log.actualDuration || 0) > 0) {
    const duration = getFastingElapsedHours(log, nowTimestamp);
    const expected = getEffectiveFastingTargetHours(log, protocol);

    if (log.completed === 'si') return 'cumplido';
    if (expected > 0) return duration >= expected ? 'cumplido' : 'roto';
    return 'roto';
  }

  if (!log.actualStartDateTime) return 'pendiente';

  const start = new Date(log.actualStartDateTime);
  if (Number.isNaN(start.getTime()) || nowTimestamp < start.getTime()) return 'pendiente';

  const duration = getFastingElapsedHours(log, nowTimestamp);
  const expected = getEffectiveFastingTargetHours(log, protocol);

  if (isFastingLogActiveAt(log, nowTimestamp)) {
    return 'en curso';
  }

  if (!log.actualBreakDateTime) return 'en curso';

  if (log.completed === 'si') return 'cumplido';
  if (expected > 0) return duration >= expected ? 'cumplido' : 'roto';
  return 'roto';
}

export function getCurrentDateTimeValue(nowTimestamp = Date.now()) {
  const now = new Date(nowTimestamp);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getFastingDisplayText(protocol, log) {
  const logProtocol = String(log?.expectedProtocol || '').trim();
  if (logProtocol && (!log || !log.actualBreakDateTime)) return `Objetivo: ${logProtocol}`;
  if (logProtocol) return `Protocolo esperado: ${logProtocol}`;
  if (!protocol) return 'Sin protocolo esperado';
  if (!log || !log.actualBreakDateTime) return `Objetivo: ${formatProtocolLabel(protocol)}`;
  return protocol.eatingWindow || `Protocolo esperado: ${formatProtocolLabel(protocol)}`;
}

export function getFastingStatusClass(status) {
  if (status === 'cumplido') return 'supplement-status-ready';
  if (status === 'en curso') return 'metrics-source-chip-inbody';
  if (status === 'roto') return 'supplement-status-wait';
  return '';
}

export function formatHoursLabel(hoursValue) {
  const safeHours = Number(hoursValue || 0);
  if (!Number.isFinite(safeHours) || safeHours <= 0) return '0 h 0 min';

  const totalMinutes = Math.round(safeHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} h ${minutes} min`;
}

export function getFastingRecordDate(log, fallbackDate = '') {
  return normalizeDateString(log?.date || log?.actualStartDateTime || log?.actualBreakDateTime || fallbackDate);
}

export function isFastingFreeDay(freeDays = [], dateString = '') {
  const targetDate = normalizeDateString(dateString);
  if (!targetDate) return false;

  return (freeDays || []).some((item) => normalizeDateString(item) === targetDate);
}

function isDateInsideFastingRange(dateString, startDate, endDate) {
  const targetDate = normalizeDateString(dateString);
  return Boolean(targetDate && targetDate >= startDate && targetDate <= endDate);
}

export function getFastingTimeRange(log, nowTimestamp = Date.now()) {
  if (!log?.actualStartDateTime) return null;

  const start = new Date(log.actualStartDateTime);
  if (Number.isNaN(start.getTime())) return null;

  const now = new Date(nowTimestamp);
  const breakDate = log.actualBreakDateTime ? new Date(log.actualBreakDateTime) : null;
  const effectiveEnd =
    breakDate && !Number.isNaN(breakDate.getTime()) && breakDate.getTime() <= now.getTime() ? breakDate : now;
  const end = effectiveEnd.getTime() >= start.getTime() ? effectiveEnd : start;

  return { start, end };
}

export function doesFastingOverlapWeek(log, startDate, endDate, nowTimestamp = Date.now()) {
  const range = getFastingTimeRange(log, nowTimestamp);
  if (!range) {
    return hasRealFastingData(log) && isDateInsideFastingRange(getFastingRecordDate(log), startDate, endDate);
  }

  const weekStart = new Date(`${startDate}T00:00:00`);
  const weekEndExclusive = new Date(`${shiftDateByDays(endDate, 1)}T00:00:00`);

  return range.start < weekEndExclusive && range.end > weekStart;
}

export function getFastingHoursInsideRange(log, startDate, endDate, nowTimestamp = Date.now()) {
  const range = getFastingTimeRange(log, nowTimestamp);
  if (!range) {
    return isDateInsideFastingRange(getFastingRecordDate(log), startDate, endDate)
      ? Number(log?.actualDuration || 0)
      : 0;
  }

  const weekStart = new Date(`${startDate}T00:00:00`);
  const weekEndExclusive = new Date(`${shiftDateByDays(endDate, 1)}T00:00:00`);
  const overlapStart = Math.max(range.start.getTime(), weekStart.getTime());
  const overlapEnd = Math.min(range.end.getTime(), weekEndExclusive.getTime());

  if (overlapEnd <= overlapStart) return 0;
  return (overlapEnd - overlapStart) / (1000 * 60 * 60);
}

export function getFastingDatesInsideRange(log, startDate, endDate, nowTimestamp = Date.now()) {
  const range = getFastingTimeRange(log, nowTimestamp);
  if (!range) {
    const recordDate = getFastingRecordDate(log);
    return hasRealFastingData(log) && isDateInsideFastingRange(recordDate, startDate, endDate) ? [recordDate] : [];
  }

  const weekStart = new Date(`${startDate}T00:00:00`);
  const weekEndInclusive = new Date(`${endDate}T23:59:59`);
  const overlapStart = new Date(Math.max(range.start.getTime(), weekStart.getTime()));
  const overlapEnd = new Date(Math.min(range.end.getTime(), weekEndInclusive.getTime()));

  if (overlapEnd < overlapStart) return [];

  const dates = [];
  const cursor = new Date(`${normalizeDateString(overlapStart)}T12:00:00`);
  const finalDate = normalizeDateString(overlapEnd);

  while (normalizeDateString(cursor) <= finalDate) {
    dates.push(normalizeDateString(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function getWeeklyFastingStatus(log, protocol, nowTimestamp = Date.now()) {
  if (!log?.actualStartDateTime && Number(log?.actualDuration || 0) > 0) {
    const duration = getFastingElapsedHours(log, nowTimestamp);
    const expected = getEffectiveFastingTargetHours(log, protocol);

    if (log.completed === 'si') return 'cumplido';
    if (expected > 0) return duration >= expected ? 'cumplido' : 'roto';
    return 'roto';
  }

  if (!log?.actualStartDateTime) return 'pendiente';
  if (!log.actualBreakDateTime) return 'en curso';

  const duration = getFastingElapsedHours(log, nowTimestamp);
  const expected = getEffectiveFastingTargetHours(log, protocol);

  if (log.completed === 'si') return 'cumplido';
  if (expected > 0) return duration >= expected ? 'cumplido' : 'roto';
  return 'roto';
}
