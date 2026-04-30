import { createCleanDefaultState, createUserSettings, defaultState, STORAGE_KEY } from '../data/defaultState';
import { normalizeDailyCheckIn } from './domain/checkIn';
import { createEmptyKravSettings, mergeOrangeKravCurriculum } from './domain/krav';
import { mergeInitialMetricSeed } from './domain/metrics';
import { repairPrivateCycle2026Data } from './domain/private';
import { normalizeDateString } from './date';

export const APP_STORAGE_KEYS = [STORAGE_KEY];
const isDevStorageLogEnabled = typeof import.meta !== 'undefined' ? Boolean(import.meta.env?.DEV) : false;

export function getUserStorageKey(userId) {
  return userId ? `${STORAGE_KEY}:user:${userId}` : STORAGE_KEY;
}

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
    dailyCheckIns: Array.isArray(data.dailyCheckIns) ? data.dailyCheckIns.length : 0,
    foodTemplates: Array.isArray(data.foodTemplates) ? data.foodTemplates.length : 0,
    hydrationEntries: Array.isArray(data.hydrationEntries) ? data.hydrationEntries.length : 0,
    supplements: Array.isArray(data.supplements) ? data.supplements.length : 0,
    routines: Array.isArray(data.routines) ? data.routines.length : 0,
    fastingProtocols: Array.isArray(data.fastingProtocols) ? data.fastingProtocols.length : 0,
    fastingLogs: Array.isArray(data.fastingLogs) ? data.fastingLogs.length : 0,
    privateCycles: Array.isArray(data.privateCycles) ? data.privateCycles.length : 0,
    privateProducts: Array.isArray(data.privateProducts) ? data.privateProducts.length : 0,
    privatePayments: Array.isArray(data.privatePayments) ? data.privatePayments.length : 0,
    privateHormonalEntries: Array.isArray(data.privateHormonalEntries) ? data.privateHormonalEntries.length : 0,
    privateDailyChecks: Array.isArray(data.privateDailyChecks) ? data.privateDailyChecks.length : 0,
    privateCycleMedications: Array.isArray(data.privateCycleMedications) ? data.privateCycleMedications.length : 0,
    kravCurriculum: Array.isArray(data.kravCurriculum) ? data.kravCurriculum.length : 0,
    kravPracticeLogs: Array.isArray(data.kravPracticeLogs) ? data.kravPracticeLogs.length : 0,
    exercises: Array.isArray(data.exercises) ? data.exercises.length : 0,
    bodyMetrics: Array.isArray(data.bodyMetrics) ? data.bodyMetrics.length : 0,
    objectives: Array.isArray(data.objectives) ? data.objectives.length : 0,
    kravSettings: data.kravSettings ? 1 : 0,
  };
}

function normalizeDailyCheckIns(items) {
  return Array.isArray(items)
    ? items.map((item) => normalizeDailyCheckIn(item)).filter((item) => item.date)
    : [];
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
        costMxn: item.costMxn ?? '',
        caffeineMg: item.caffeineMg ?? '',
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

function normalizeFastingProtocols(items, fallbackState = defaultState) {
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
    : fallbackState.fastingProtocols;
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

function normalizeFastingFreeDays(items) {
  if (!Array.isArray(items)) return [];

  return [...new Set(items.map((item) => normalizeDateString(item)).filter(Boolean))];
}

function normalizeObjectives(items, fallbackState = defaultState) {
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
    : fallbackState.objectives;
}

function normalizePrivateHormonalEntries(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        date: normalizeDateString(item.date),
        time: item.time ?? '',
        cycleId: item.cycleId ?? '',
        productId: item.productId ?? '',
        eventType: item.eventType ?? 'otro',
        name: item.name ?? '',
        category: item.category ?? 'otro-compuesto',
        dose: item.dose ?? '',
        unit: item.unit ?? '',
        route: item.route ?? '',
        frequency: item.frequency ?? '',
        nextApplication: item.nextApplication ?? '',
        notes: item.notes ?? '',
      }))
    : [];
}

function normalizePrivateDailyChecks(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        date: normalizeDateString(item.date),
        cycleId: item.cycleId ?? '',
        energy: item.energy ?? '',
        mood: item.mood ?? '',
        libido: item.libido ?? '',
        sleep: item.sleep ?? '',
        focus: item.focus ?? '',
        appetite: item.appetite ?? '',
        retention: item.retention ?? 'ninguna',
        sideEffects: item.sideEffects ?? '',
        notes: item.notes ?? '',
      }))
    : [];
}

function normalizePrivateCycleMedications(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        cycleId: item.cycleId ?? '',
        name: item.name ?? '',
        alias: item.alias ?? '',
        medicationType: item.medicationType ?? 'protector',
        initialInventory: item.initialInventory ?? '',
        remainingInventory: item.remainingInventory ?? item.initialInventory ?? '',
        unit: item.unit ?? 'tableta',
        expectedDailyDose: item.expectedDailyDose ?? '1',
        scheduleMode: item.scheduleMode ?? 'single',
        intakeHistory: Array.isArray(item.intakeHistory)
          ? item.intakeHistory.map((entry) => ({
              date: normalizeDateString(entry?.date),
              takenSlots: Array.isArray(entry?.takenSlots) ? entry.takenSlots.filter(Boolean) : [],
              updatedAt: entry?.updatedAt ?? '',
            }))
          : [],
        lastTakenAt: item.lastTakenAt ?? '',
        notes: item.notes ?? '',
      }))
    : [];
}

function normalizeKravCurriculum(items, { applySeed = true } = {}) {
  const sourceItems = applySeed
    ? mergeOrangeKravCurriculum(items)
    : Array.isArray(items)
      ? items
      : [];

  return sourceItems.map((item) => ({
    ...item,
    name: item.name ?? '',
    category: item.category ?? 'striking',
    stage: item.stage ?? 'etapa1',
    description: item.description ?? '',
    tips: item.tips ?? '',
    videoUrl: item.videoUrl ?? '',
    level: Number.isFinite(Number(item.level)) ? Number(item.level) : 0,
    lastPracticedAt: normalizeDateString(item.lastPracticedAt),
    notes: item.notes ?? '',
    isExamRelevant: typeof item.isExamRelevant === 'boolean' ? item.isExamRelevant : true,
  }));
}

function normalizeKravPracticeLogs(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        date: normalizeDateString(item.date),
        coach: item.coach ?? 'oseas-tonche',
        coachCustomName: item.coachCustomName ?? '',
        techniqueIds: Array.isArray(item.techniqueIds) ? item.techniqueIds.filter(Boolean) : [],
        sparring: item.sparring ?? 'no',
        observations: item.observations ?? '',
        mistakes: item.mistakes ?? '',
        reviewNeeded: item.reviewNeeded ?? '',
      }))
    : [];
}

function normalizeKravSettings(item) {
  const base = createEmptyKravSettings();
  if (!item || typeof item !== 'object' || Array.isArray(item)) return base;

  return {
    currentBelt: item.currentBelt ?? base.currentBelt,
    targetBelt: item.targetBelt ?? base.targetBelt,
    examDate: normalizeDateString(item.examDate) || base.examDate,
    forgottenThresholdDays: item.forgottenThresholdDays ?? base.forgottenThresholdDays,
  };
}

function normalizePrivateCycles(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        name: item.name ?? '',
        type: item.type ?? 'personalizado',
        startDate: normalizeDateString(item.startDate),
        estimatedEndDate: normalizeDateString(item.estimatedEndDate),
        status: item.status ?? 'planeado',
        objective: item.objective ?? '',
        notes: item.notes ?? '',
      }))
    : [];
}

function normalizePrivateProducts(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        cycleId: item.cycleId ?? '',
        name: item.name ?? '',
        category: item.category ?? 'otro-compuesto',
        presentation: item.presentation ?? '',
        purchasedQuantity: item.purchasedQuantity ?? '',
        unit: item.unit ?? '',
        totalCost: item.totalCost ?? '',
        supplier: item.supplier ?? '',
        purchaseDate: normalizeDateString(item.purchaseDate),
        status: item.status ?? 'pendiente',
        notes: item.notes ?? '',
      }))
    : [];
}

function normalizePrivatePayments(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        cycleId: item.cycleId ?? '',
        concept: item.concept ?? '',
        date: normalizeDateString(item.date),
        amount: item.amount ?? '',
        method: item.method ?? '',
        status: item.status ?? 'pagado',
        notes: item.notes ?? '',
      }))
    : [];
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
        costMxn: item.costMxn ?? '',
        caffeineMg: item.caffeineMg ?? '',
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
        calf: item.calf ?? '',
        forearm: item.forearm ?? '',
        upperBackTorso: item.upperBackTorso ?? '',
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

function normalizeGoals(goals, fallbackState = defaultState) {
  return {
    calories: goals?.calories ?? fallbackState.goals.calories,
    protein: goals?.protein ?? fallbackState.goals.protein,
    weight: goals?.weight ?? fallbackState.goals.weight,
    hydrationBase: goals?.hydrationBase ?? fallbackState.goals.hydrationBase,
    hydrationHighActivity: goals?.hydrationHighActivity ?? fallbackState.goals.hydrationHighActivity,
    cutReferenceCurrentWeight:
      goals?.cutReferenceCurrentWeight ?? fallbackState.goals.cutReferenceCurrentWeight,
    cutReferenceTargetWeight10:
      goals?.cutReferenceTargetWeight10 ?? fallbackState.goals.cutReferenceTargetWeight10,
    cutReferenceFatToLose:
      goals?.cutReferenceFatToLose ?? fallbackState.goals.cutReferenceFatToLose,
    cutReferenceEstimatedDeficit:
      goals?.cutReferenceEstimatedDeficit ?? fallbackState.goals.cutReferenceEstimatedDeficit,
    cutReferenceBmr: goals?.cutReferenceBmr ?? fallbackState.goals.cutReferenceBmr,
    cutReferenceTdee: goals?.cutReferenceTdee ?? fallbackState.goals.cutReferenceTdee,
    cutReferenceMaintenanceMin:
      goals?.cutReferenceMaintenanceMin ?? fallbackState.goals.cutReferenceMaintenanceMin,
    cutReferenceMaintenanceMax:
      goals?.cutReferenceMaintenanceMax ?? fallbackState.goals.cutReferenceMaintenanceMax,
    cutReferenceCutMin: goals?.cutReferenceCutMin ?? fallbackState.goals.cutReferenceCutMin,
    cutReferenceCutMax: goals?.cutReferenceCutMax ?? fallbackState.goals.cutReferenceCutMax,
    cutReferenceConservativeMin:
      goals?.cutReferenceConservativeMin ?? fallbackState.goals.cutReferenceConservativeMin,
    cutReferenceConservativeMax:
      goals?.cutReferenceConservativeMax ?? fallbackState.goals.cutReferenceConservativeMax,
    cutReferenceEffectiveMin:
      goals?.cutReferenceEffectiveMin ?? fallbackState.goals.cutReferenceEffectiveMin,
    cutReferenceEffectiveMax:
      goals?.cutReferenceEffectiveMax ?? fallbackState.goals.cutReferenceEffectiveMax,
    cutReferenceAggressiveBelow:
      goals?.cutReferenceAggressiveBelow ?? fallbackState.goals.cutReferenceAggressiveBelow,
    cutReferenceProteinMin:
      goals?.cutReferenceProteinMin ?? fallbackState.goals.cutReferenceProteinMin,
    cutReferenceProteinMax:
      goals?.cutReferenceProteinMax ?? fallbackState.goals.cutReferenceProteinMax,
    cutReferenceFatMin: goals?.cutReferenceFatMin ?? fallbackState.goals.cutReferenceFatMin,
    cutReferenceFatMax: goals?.cutReferenceFatMax ?? fallbackState.goals.cutReferenceFatMax,
  };
}

function normalizeSyncMeta(syncMeta, fallbackState = defaultState) {
  return {
    updatedAt: syncMeta?.updatedAt ?? fallbackState.syncMeta.updatedAt,
    lastSyncedAt: syncMeta?.lastSyncedAt ?? fallbackState.syncMeta.lastSyncedAt,
    deviceId: syncMeta?.deviceId ?? fallbackState.syncMeta.deviceId,
    schemaVersion: syncMeta?.schemaVersion ?? fallbackState.syncMeta.schemaVersion,
  };
}

function normalizeBackupMeta(backupMeta, fallbackState = defaultState) {
  return {
    lastExportAt: backupMeta?.lastExportAt ?? fallbackState.backupMeta.lastExportAt,
    lastImportAt: backupMeta?.lastImportAt ?? fallbackState.backupMeta.lastImportAt,
  };
}

function normalizePrivateVault(privateVault, fallbackState = defaultState) {
  return {
    pin: privateVault?.pin ?? fallbackState.privateVault.pin,
    pinMode: privateVault?.pinMode ?? fallbackState.privateVault.pinMode,
    autoLockMinutes: privateVault?.autoLockMinutes ?? fallbackState.privateVault.autoLockMinutes,
    lastPrivateExportAt: privateVault?.lastPrivateExportAt ?? fallbackState.privateVault.lastPrivateExportAt,
    lastPrivateImportAt: privateVault?.lastPrivateImportAt ?? fallbackState.privateVault.lastPrivateImportAt,
  };
}

function normalizeUserSettings(userSettings, fallbackState = defaultState) {
  const fallbackUserSettings = fallbackState.userSettings || createUserSettings('fitness-basic');
  if (!userSettings || typeof userSettings !== 'object' || Array.isArray(userSettings)) {
    return createUserSettings(fallbackUserSettings.profileType, fallbackUserSettings.enabledTabs);
  }

  const profileType = userSettings.profileType || fallbackUserSettings.profileType;
  const enabledTabs = userSettings.profileType === 'custom'
    ? userSettings.enabledTabs || fallbackUserSettings.enabledTabs
    : userSettings.enabledTabs;

  return createUserSettings(profileType, enabledTabs);
}

export function migrateAppData(parsed = {}, options = {}) {
  const inferredProfileId = parsed.profileId || options.profileId || 'daniel-full';
  const isCleanProfile = inferredProfileId === 'clean';
  const fallbackState = options.fallbackState || (isCleanProfile ? createCleanDefaultState() : defaultState);
  const shouldApplyDanielSeeds = inferredProfileId === 'daniel-full';
  const hydrationSource = parsed.hydrationEntries ?? parsed.hydration;
  const routinesSource = parsed.routines ?? parsed.supplementRoutines;
  const privateSeedVersion = Number(parsed.privateSeedVersion) || 0;
  const normalizedPrivateCycles = normalizePrivateCycles(parsed.privateCycles);
  const normalizedPrivateProducts = normalizePrivateProducts(parsed.privateProducts);
  const normalizedPrivatePayments = normalizePrivatePayments(parsed.privatePayments);
  const normalizedPrivateEntries = normalizePrivateHormonalEntries(parsed.privateHormonalEntries);
  const normalizedPrivateDailyChecks = normalizePrivateDailyChecks(parsed.privateDailyChecks);
  const normalizedPrivateCycleMedications = normalizePrivateCycleMedications(parsed.privateCycleMedications);
  const normalizedKravCurriculum = normalizeKravCurriculum(parsed.kravCurriculum, {
    applySeed: shouldApplyDanielSeeds,
  });
  const normalizedKravPracticeLogs = normalizeKravPracticeLogs(parsed.kravPracticeLogs);
  const seededPrivate = shouldApplyDanielSeeds
    ? repairPrivateCycle2026Data({
        privateCycles: normalizedPrivateCycles,
        privateProducts: normalizedPrivateProducts,
        privatePayments: normalizedPrivatePayments,
        privateHormonalEntries: normalizedPrivateEntries,
        privateDailyChecks: normalizedPrivateDailyChecks,
        privateCycleMedications: normalizedPrivateCycleMedications,
        privateSeedVersion,
      })
    : {
        privateCycles: normalizedPrivateCycles,
        privateProducts: normalizedPrivateProducts,
        privatePayments: normalizedPrivatePayments,
        privateHormonalEntries: normalizedPrivateEntries,
        privateDailyChecks: normalizedPrivateDailyChecks,
        privateCycleMedications: normalizedPrivateCycleMedications,
        privateSeedVersion,
      };
  const normalizedMetricEntries = shouldApplyDanielSeeds
    ? mergeInitialMetricSeed(normalizeBodyMetrics(parsed.bodyMetrics))
    : normalizeBodyMetrics(parsed.bodyMetrics);
  const migrated = {
    profileId: inferredProfileId,
    dailyCheckIns: normalizeDailyCheckIns(parsed.dailyCheckIns),
    foods: normalizeFoods(parsed.foods),
    foodTemplates: normalizeFoodTemplates(parsed.foodTemplates),
    hydrationEntries: normalizeHydrationEntries(hydrationSource),
    supplements: normalizeSupplements(parsed.supplements),
    routines: normalizeRoutines(routinesSource),
    exercises: normalizeExercises(parsed.exercises),
    bodyMetrics: normalizedMetricEntries,
    fastingProtocols: normalizeFastingProtocols(parsed.fastingProtocols, fallbackState),
    fastingLogs: normalizeFastingLogs(parsed.fastingLogs),
    fastingFreeDays: normalizeFastingFreeDays(parsed.fastingFreeDays),
    privateCycles: seededPrivate.privateCycles,
    privateProducts: seededPrivate.privateProducts,
    privatePayments: seededPrivate.privatePayments,
    privateHormonalEntries: seededPrivate.privateHormonalEntries,
    privateDailyChecks: seededPrivate.privateDailyChecks,
    privateCycleMedications: seededPrivate.privateCycleMedications,
    kravCurriculum: normalizedKravCurriculum,
    kravPracticeLogs: normalizedKravPracticeLogs,
    kravSettings: normalizeKravSettings(parsed.kravSettings),
    privateVault: normalizePrivateVault(parsed.privateVault, fallbackState),
    privateSeedVersion: seededPrivate.privateSeedVersion,
    objectives: normalizeObjectives(parsed.objectives, fallbackState),
    goals: normalizeGoals(parsed.goals, fallbackState),
    userSettings: normalizeUserSettings(parsed.userSettings, fallbackState),
    syncMeta: normalizeSyncMeta(parsed.syncMeta, fallbackState),
    backupMeta: normalizeBackupMeta(parsed.backupMeta, fallbackState),
  };

  logStorage('migrate', {
    foundCollections: Object.keys(parsed || {}),
    migratedCollections: Object.keys(migrated),
    collectionCounts: getCollectionCounts(migrated),
  });

  return migrated;
}

export function loadAppData(storageKey = STORAGE_KEY, options = {}) {
  const fallbackState = options.fallbackState || defaultState;

  try {
    logStorage('load:start', { storageKey });
    if (!canUseLocalStorage()) {
      logStorage('load:unavailable', { storageKey });
      return fallbackState;
    }
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      logStorage('load:empty', { storageKey });
      return fallbackState;
    }

    const parsed = JSON.parse(raw);
    const migrated = migrateAppData(parsed);

    logStorage('load:success', {
      storageKey,
      topLevelKeys: Object.keys(parsed || {}),
      collectionCounts: getCollectionCounts(migrated),
    });

    return migrated;
  } catch (error) {
    console.error('[Mi Diario][storage] load:error', error);
    return fallbackState;
  }
}

export function saveAppData(data, storageKey = STORAGE_KEY) {
  if (!canUseLocalStorage()) {
    logStorage('save:skipped', { storageKey, reason: 'localStorage unavailable' });
    return;
  }
  logStorage('save:start', {
    storageKey,
    topLevelKeys: Object.keys(data || {}),
    collectionCounts: getCollectionCounts(data),
  });
  localStorage.setItem(storageKey, JSON.stringify(data));
  logStorage('save:success', {
    storageKey,
    collectionCounts: getCollectionCounts(data),
  });
}

export function clearAppData(storageKey = STORAGE_KEY) {
  if (!canUseLocalStorage()) {
    logStorage('clear:skipped', { storageKey, reason: 'localStorage unavailable' });
    return;
  }
  logStorage('clear:start', { storageKey });
  localStorage.removeItem(storageKey);
  logStorage('clear:success', { storageKey });
}

export function loadDiaryData() {
  return loadAppData();
}

export function saveDiaryData(data) {
  saveAppData(data);
}
