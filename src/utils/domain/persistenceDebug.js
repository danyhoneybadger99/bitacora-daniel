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
  'privateCycles',
  'privateProducts',
  'privatePayments',
  'privateHormonalEntries',
  'privateDailyChecks',
  'privateCycleMedications',
  'privateVault',
  'objectives',
  'goals',
  'syncMeta',
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
    privateCycles: Array.isArray(data.privateCycles) ? data.privateCycles.length : 0,
    privateProducts: Array.isArray(data.privateProducts) ? data.privateProducts.length : 0,
    privatePayments: Array.isArray(data.privatePayments) ? data.privatePayments.length : 0,
    privateHormonalEntries: Array.isArray(data.privateHormonalEntries) ? data.privateHormonalEntries.length : 0,
    privateDailyChecks: Array.isArray(data.privateDailyChecks) ? data.privateDailyChecks.length : 0,
    privateCycleMedications: Array.isArray(data.privateCycleMedications) ? data.privateCycleMedications.length : 0,
    exercises: Array.isArray(data.exercises) ? data.exercises.length : 0,
    bodyMetrics: Array.isArray(data.bodyMetrics) ? data.bodyMetrics.length : 0,
    objectives: Array.isArray(data.objectives) ? data.objectives.length : 0,
    syncMeta: data.syncMeta ? 1 : 0,
    backupMeta: data.backupMeta ? 1 : 0,
  };
}
