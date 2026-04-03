export const appDataValidationKeys = [
  'foods',
  'foodTemplates',
  'hydrationEntries',
  'supplements',
  'routines',
  'exercises',
  'bodyMetrics',
  'fastingProtocols',
  'fastingLogs',
  'objectives',
  'goals',
];

export function isValidAppDataPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  return appDataValidationKeys.some((key) => key in payload);
}

export function getPersistenceCollectionCounts(data = {}) {
  return {
    foods: Array.isArray(data.foods) ? data.foods.length : 0,
    hydrationEntries: Array.isArray(data.hydrationEntries) ? data.hydrationEntries.length : 0,
    supplements: Array.isArray(data.supplements) ? data.supplements.length : 0,
    routines: Array.isArray(data.routines) ? data.routines.length : 0,
    fastingLogs: Array.isArray(data.fastingLogs) ? data.fastingLogs.length : 0,
    exercises: Array.isArray(data.exercises) ? data.exercises.length : 0,
    bodyMetrics: Array.isArray(data.bodyMetrics) ? data.bodyMetrics.length : 0,
    objectives: Array.isArray(data.objectives) ? data.objectives.length : 0,
    backupMeta: data.backupMeta ? 1 : 0,
  };
}
