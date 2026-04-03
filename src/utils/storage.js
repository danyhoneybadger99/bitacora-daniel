import { defaultState, STORAGE_KEY } from '../data/defaultState';
import { normalizeDateString } from './date';

export const APP_STORAGE_KEYS = [STORAGE_KEY];
const isDevStorageLogEnabled = typeof import.meta !== 'undefined' ? Boolean(import.meta.env?.DEV) : false;

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function logStorage(action, details = {}) {
  if (!isDevStorageLogEnabled) return;
  console.info(`[Mi Diario][storage] ${action}`, {
    keys: APP_STORAGE_KEYS,
    ...details,
  });
}

function getCollectionCounts(data = {}) {
  return {
    foods: Array.isArray(data.foods) ? data.foods.length : 0,
    foodTemplates: Array.isArray(data.foodTemplates) ? data.foodTemplates.length : 0,
    hydrationEntries: Array.isArray(data.hydrationEntries) ? data.hydrationEntries.length : 0,
    supplements: Array.isArray(data.supplements) ? data.supplements.length : 0,
    routines: Array.isArray(data.routines) ? data.routines.length : 0,
    fastingProtocols: Array.isArray(data.fastingProtocols) ? data.fastingProtocols.length : 0,
    fastingLogs: Array.isArray(data.fastingLogs) ? data.fastingLogs.length : 0,
    exercises: Array.isArray(data.exercises) ? data.exercises.length : 0,
    bodyMetrics: Array.isArray(data.bodyMetrics) ? data.bodyMetrics.length : 0,
    objectives: Array.isArray(data.objectives) ? data.objectives.length : 0,
  };
}

function normalizeFoods(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        date: normalizeDateString(item.date),
        time: item.time ?? '',
        mealType: item.mealType ?? 'comida',
        name: item.name ?? '',
        quantity: item.quantity ?? '',
        unit: item.unit ?? '',
        category: item.category ?? '',
        calories: item.calories ?? 0,
        protein: item.protein ?? 0,
        carbs: item.carbs ?? 0,
        fat: item.fat ?? 0,
        notes: item.notes ?? '',
      }))
    : [];
}

function normalizeHydrationEntries(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        date: normalizeDateString(item.date),
        time: item.time ?? '',
        drinkType: item.drinkType ?? 'agua',
        name: item.name ?? '',
        quantity: item.quantity ?? '',
        unit: item.unit ?? 'ml',
        containsCaffeine: item.containsCaffeine ?? 'no',
        containsElectrolytes: item.containsElectrolytes ?? 'no',
        notes: item.notes ?? '',
      }))
    : [];
}

function normalizeFastingProtocols(items) {
  return Array.isArray(items) && items.length > 0
    ? items.map((item) => ({
        ...item,
        dayOfWeek: item.dayOfWeek ?? 'lunes',
        fastingType: item.fastingType ?? 'omad',
        startTime: item.startTime ?? '',
        eatingWindow: item.eatingWindow ?? '',
        expectedDuration: item.expectedDuration ?? '',
        notes: item.notes ?? '',
      }))
    : defaultState.fastingProtocols;
}

function normalizeFastingLogs(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        date: normalizeDateString(item.date),
        expectedProtocol: item.expectedProtocol ?? '',
        actualStartDateTime:
          item.actualStartDateTime ??
          (item.actualStartTime && normalizeDateString(item.date)
            ? `${normalizeDateString(item.date)}T${item.actualStartTime}`
            : ''),
        actualBreakDateTime:
          item.actualBreakDateTime ??
          (item.actualBreakTime && normalizeDateString(item.date)
            ? `${normalizeDateString(item.date)}T${item.actualBreakTime}`
            : ''),
        actualDuration: item.actualDuration ?? '',
        completed: item.completed ?? 'no',
        hunger: item.hunger ?? 'media',
        energy: item.energy ?? 'media',
        cravings: item.cravings ?? 'media',
        notes: item.notes ?? '',
      }))
    : [];
}

function normalizeObjectives(items) {
  return Array.isArray(items) && items.length > 0
    ? items.map((item) => ({
        ...item,
        title: item.title ?? '',
        goalType: item.goalType ?? 'personalizada',
        startDate: normalizeDateString(item.startDate),
        deadlineDate: normalizeDateString(item.deadlineDate),
        startWeight: item.startWeight ?? '',
        currentWeight: item.currentWeight ?? '',
        targetWeight: item.targetWeight ?? '',
        estimatedProgress: item.estimatedProgress ?? '',
        status: item.status ?? 'activa',
        notes: item.notes ?? '',
        averageCaloriesTarget: item.averageCaloriesTarget ?? '',
        averageUpperLimit: item.averageUpperLimit ?? '',
        minimumUsual: item.minimumUsual ?? '',
        proteinMinimum: item.proteinMinimum ?? '',
        hydrationBase: item.hydrationBase ?? '',
        hydrationHighActivity: item.hydrationHighActivity ?? '',
        strategicReminders: item.strategicReminders ?? '',
      }))
    : defaultState.objectives;
}

function normalizeFoodTemplates(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        mealType: item.mealType ?? 'comida',
        name: item.name ?? '',
        quantity: item.quantity ?? '',
        unit: item.unit ?? '',
        category: item.category ?? '',
        calories: item.calories ?? 0,
        protein: item.protein ?? 0,
        carbs: item.carbs ?? 0,
        fat: item.fat ?? 0,
        notes: item.notes ?? '',
      }))
    : [];
}

function normalizeSupplements(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        date: normalizeDateString(item.date),
        time: item.time ?? '',
        category: item.category ?? 'suplemento',
        dose: item.dose ?? '',
        unit: item.unit ?? '',
        stockRemaining: item.stockRemaining ?? '',
        daytime: item.daytime ?? 'manana',
        foodRelation: item.foodRelation ?? 'no-aplica',
        frequency: item.frequency ?? 'diario',
        taken: item.taken ?? 'si',
        notes: item.notes ?? '',
      }))
    : [];
}

function normalizeRoutines(items) {
  return Array.isArray(items)
    ? items.map((routine) => ({
        ...routine,
        items: Array.isArray(routine.items)
          ? routine.items.map((item) => ({
              ...item,
              category: item.category ?? 'suplemento',
              dose: item.dose ?? '',
              unit: item.unit ?? '',
              daytime: item.daytime ?? 'manana',
              foodRelation: item.foodRelation ?? 'no-aplica',
              frequency: item.frequency ?? 'diario',
              notes: item.notes ?? '',
            }))
          : [],
      }))
    : [];
}

function normalizeExercises(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        date: normalizeDateString(item.date),
        time: item.time ?? '',
        name: item.name ?? item.type ?? '',
        modality: item.modality ?? 'cardio',
        duration: item.duration ?? '',
        caloriesBurned: item.caloriesBurned ?? '',
        distance: item.distance ?? '',
        distanceUnit: item.distanceUnit ?? 'no-aplica',
        intensity: item.intensity ?? 'media',
        completed: item.completed ?? 'si',
        notes: item.notes ?? '',
      }))
    : [];
}

function normalizeBodyMetrics(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        date: normalizeDateString(item.date),
        chest: item.chest ?? '',
        hips: item.hips ?? '',
        neck: item.neck ?? '',
        height: item.height ?? '',
        skeletalMuscleMass: item.skeletalMuscleMass ?? '',
        bodyFatMass: item.bodyFatMass ?? '',
        fatFreeMass: item.fatFreeMass ?? '',
        totalBodyWater: item.totalBodyWater ?? '',
        proteinsMass: item.proteinsMass ?? '',
        mineralsMass: item.mineralsMass ?? '',
        bmi: item.bmi ?? '',
        basalMetabolicRate: item.basalMetabolicRate ?? '',
        waistHipRatio: item.waistHipRatio ?? '',
        visceralFatLevel: item.visceralFatLevel ?? '',
        recommendedCalorieIntake: item.recommendedCalorieIntake ?? '',
        dataSource: item.dataSource ?? 'manual',
        observations: item.observations ?? item.notes ?? '',
      }))
    : [];
}

function normalizeGoals(goals) {
  return {
    calories: goals?.calories ?? defaultState.goals.calories,
    protein: goals?.protein ?? defaultState.goals.protein,
    weight: goals?.weight ?? defaultState.goals.weight,
    hydrationBase: goals?.hydrationBase ?? defaultState.goals.hydrationBase,
    hydrationHighActivity: goals?.hydrationHighActivity ?? defaultState.goals.hydrationHighActivity,
  };
}

function normalizeBackupMeta(backupMeta) {
  return {
    lastExportAt: backupMeta?.lastExportAt ?? defaultState.backupMeta.lastExportAt,
    lastImportAt: backupMeta?.lastImportAt ?? defaultState.backupMeta.lastImportAt,
  };
}

export function migrateAppData(parsed = {}) {
  const hydrationSource = parsed.hydrationEntries ?? parsed.hydration;
  const routinesSource = parsed.routines ?? parsed.supplementRoutines;
  const migrated = {
    foods: normalizeFoods(parsed.foods),
    foodTemplates: normalizeFoodTemplates(parsed.foodTemplates),
    hydrationEntries: normalizeHydrationEntries(hydrationSource),
    supplements: normalizeSupplements(parsed.supplements),
    routines: normalizeRoutines(routinesSource),
    exercises: normalizeExercises(parsed.exercises),
    bodyMetrics: normalizeBodyMetrics(parsed.bodyMetrics),
    fastingProtocols: normalizeFastingProtocols(parsed.fastingProtocols),
    fastingLogs: normalizeFastingLogs(parsed.fastingLogs),
    objectives: normalizeObjectives(parsed.objectives),
    goals: normalizeGoals(parsed.goals),
    backupMeta: normalizeBackupMeta(parsed.backupMeta),
  };

  logStorage('migrate', {
    foundCollections: Object.keys(parsed || {}),
    migratedCollections: Object.keys(migrated),
    collectionCounts: getCollectionCounts(migrated),
  });

  return migrated;
}

export function loadAppData() {
  try {
    logStorage('load:start');
    if (!canUseLocalStorage()) {
      logStorage('load:unavailable', { storageKey: STORAGE_KEY });
      return defaultState;
    }
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      logStorage('load:empty', { storageKey: STORAGE_KEY });
      return defaultState;
    }

    const parsed = JSON.parse(raw);
    const migrated = migrateAppData(parsed);

    logStorage('load:success', {
      storageKey: STORAGE_KEY,
      topLevelKeys: Object.keys(parsed || {}),
      collectionCounts: getCollectionCounts(migrated),
    });

    return migrated;
  } catch (error) {
    console.error('[Mi Diario][storage] load:error', error);
    return defaultState;
  }
}

export function saveAppData(data) {
  if (!canUseLocalStorage()) {
    logStorage('save:skipped', { storageKey: STORAGE_KEY, reason: 'localStorage unavailable' });
    return;
  }
  logStorage('save:start', {
    storageKey: STORAGE_KEY,
    topLevelKeys: Object.keys(data || {}),
    collectionCounts: getCollectionCounts(data),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  logStorage('save:success', {
    storageKey: STORAGE_KEY,
    collectionCounts: getCollectionCounts(data),
  });
}

export function clearAppData() {
  if (!canUseLocalStorage()) {
    logStorage('clear:skipped', { storageKey: STORAGE_KEY, reason: 'localStorage unavailable' });
    return;
  }
  logStorage('clear:start', { storageKey: STORAGE_KEY });
  localStorage.removeItem(STORAGE_KEY);
  logStorage('clear:success', { storageKey: STORAGE_KEY });
}

export function loadDiaryData() {
  return loadAppData();
}

export function saveDiaryData(data) {
  saveAppData(data);
}
