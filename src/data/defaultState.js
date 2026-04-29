import { repairPrivateCycle2026Data } from '../utils/domain/private';
import { createEmptyKravSettings, createOrangeKravCurriculum } from '../utils/domain/krav';
import { createInitialMetricSeed, createRecentManualMetricSeed } from '../utils/domain/metrics';
import { getToday } from '../utils/date';

const defaultFastingProtocols = [
  {
    id: 'fasting-mon',
    dayOfWeek: 'lunes',
    fastingType: '36-horas',
    startTime: '',
    eatingWindow: 'Objetivo: ayuno de 36 horas',
    expectedDuration: '36',
    notes: '',
  },
  {
    id: 'fasting-tue',
    dayOfWeek: 'martes',
    fastingType: 'omad',
    startTime: '07:00',
    eatingWindow: 'Ventana de comida 07:00 a 08:00',
    expectedDuration: '23',
    notes: '',
  },
  {
    id: 'fasting-wed',
    dayOfWeek: 'miercoles',
    fastingType: 'omad',
    startTime: '07:00',
    eatingWindow: 'Ventana de comida 07:00 a 08:00',
    expectedDuration: '23',
    notes: '',
  },
  {
    id: 'fasting-thu',
    dayOfWeek: 'jueves',
    fastingType: 'omad',
    startTime: '07:00',
    eatingWindow: 'Ventana de comida 07:00 a 08:00',
    expectedDuration: '23',
    notes: '',
  },
  {
    id: 'fasting-fri',
    dayOfWeek: 'viernes',
    fastingType: 'omad',
    startTime: '07:00',
    eatingWindow: 'Ventana de comida 07:00 a 08:00',
    expectedDuration: '23',
    notes: '',
  },
  {
    id: 'fasting-sat',
    dayOfWeek: 'sabado',
    fastingType: '18-6',
    startTime: '07:00',
    eatingWindow: 'Ventana usual 07:00 a 13:00 o 08:00 a 14:00',
    expectedDuration: '18',
    notes: '',
  },
  {
    id: 'fasting-sun',
    dayOfWeek: 'domingo',
    fastingType: '12-12',
    startTime: '07:00',
    eatingWindow: 'Ventana de comida 07:00 a 19:00',
    expectedDuration: '12',
    notes: '',
  },
];

export const STORAGE_KEY = 'mi-diario-data';

export const USER_PROFILE_TAB_PRESETS = {
  'daniel-full': [
    'dashboard',
    'objectives',
    'foods',
    'supplements',
    'fasting',
    'exercises',
    'krav',
    'metrics',
    'weekly',
    'history',
    'private',
    'settings',
  ],
  'krav-360': ['dashboard', 'exercises', 'krav', 'foods', 'metrics', 'weekly', 'history', 'settings'],
  'fitness-basic': [
    'dashboard',
    'objectives',
    'foods',
    'supplements',
    'fasting',
    'exercises',
    'metrics',
    'weekly',
    'history',
    'settings',
  ],
  custom: [],
};

export const USER_PROFILE_LABELS = {
  'daniel-full': 'Daniel full',
  'krav-360': 'Krav 360',
  'fitness-basic': 'Fitness basic',
  custom: 'Personalizado',
};

const USER_PROFILE_ALIASES = {
  'krav-student': 'krav-360',
};

export function createUserSettings(profileType = 'fitness-basic', enabledTabs = null) {
  const migratedProfileType = USER_PROFILE_ALIASES[profileType] || profileType;
  const normalizedProfileType = USER_PROFILE_TAB_PRESETS[migratedProfileType] ? migratedProfileType : 'fitness-basic';
  const presetTabs = USER_PROFILE_TAB_PRESETS[normalizedProfileType] || USER_PROFILE_TAB_PRESETS['fitness-basic'];
  const safeEnabledTabs = normalizedProfileType === 'custom'
    ? Array.isArray(enabledTabs) && enabledTabs.length > 0
      ? enabledTabs
      : presetTabs
    : presetTabs;

  return {
    profileType: normalizedProfileType,
    enabledTabs: [...new Set(safeEnabledTabs.filter((tabId) => typeof tabId === 'string' && tabId.trim()))],
  };
}

function createDefaultObjective() {
  return {
    id: 'objective-active-default',
    title: 'Corte mayo 2026',
    goalType: 'corte',
    startDate: getToday(),
    deadlineDate: '2026-05-31',
    startWeight: '76.1',
    currentWeight: '76.1',
    targetWeight: '72',
    estimatedProgress: '',
    status: 'activa',
    notes: 'Deficit moderado con prioridad en proteina, adherencia y preservacion muscular.',
    averageCaloriesTarget: '2100',
    averageUpperLimit: '2300',
    minimumUsual: '1900',
    proteinMinimum: '175',
    hydrationBase: '3200',
    hydrationHighActivity: '4000',
    strategicReminders:
      '- No pasar en promedio de 2300 kcal\n- No bajar habitualmente de 1900 kcal\n- Mantener proteina minima de 175 g\n- Priorizar promedio semanal, no un solo dia\n- Proteger masa muscular',
  };
}

function createDefaultPrivateVault() {
  return {
    pin: '',
    pinMode: 'numeric-4',
    autoLockMinutes: '5',
    lastPrivateExportAt: '',
    lastPrivateImportAt: '',
  };
}

function createDefaultSyncMeta() {
  return {
    updatedAt: '',
    lastSyncedAt: '',
    deviceId: '',
    schemaVersion: 1,
  };
}

export function createPrivateSeedData() {
  return repairPrivateCycle2026Data();
}

function createEmptyGoals() {
  return {
    calories: '',
    protein: '',
    weight: '',
    hydrationBase: '',
    hydrationHighActivity: '',
    cutReferenceCurrentWeight: '',
    cutReferenceTargetWeight10: '',
    cutReferenceFatToLose: '',
    cutReferenceEstimatedDeficit: '',
    cutReferenceBmr: '',
    cutReferenceTdee: '',
    cutReferenceMaintenanceMin: '',
    cutReferenceMaintenanceMax: '',
    cutReferenceCutMin: '',
    cutReferenceCutMax: '',
    cutReferenceConservativeMin: '',
    cutReferenceConservativeMax: '',
    cutReferenceEffectiveMin: '',
    cutReferenceEffectiveMax: '',
    cutReferenceAggressiveBelow: '',
    cutReferenceProteinMin: '',
    cutReferenceProteinMax: '',
    cutReferenceFatMin: '',
    cutReferenceFatMax: '',
  };
}

function createDanielGoals() {
  return {
    calories: '2200',
    protein: '160',
    weight: '75',
    hydrationBase: '3200',
    hydrationHighActivity: '4000',
    cutReferenceCurrentWeight: '75.5',
    cutReferenceTargetWeight10: '73.0',
    cutReferenceFatToLose: '2.5',
    cutReferenceEstimatedDeficit: '19250',
    cutReferenceBmr: '1788',
    cutReferenceTdee: '2800',
    cutReferenceMaintenanceMin: '2750',
    cutReferenceMaintenanceMax: '2900',
    cutReferenceCutMin: '2250',
    cutReferenceCutMax: '2500',
    cutReferenceConservativeMin: '2400',
    cutReferenceConservativeMax: '2500',
    cutReferenceEffectiveMin: '2250',
    cutReferenceEffectiveMax: '2400',
    cutReferenceAggressiveBelow: '2200',
    cutReferenceProteinMin: '160',
    cutReferenceProteinMax: '190',
    cutReferenceFatMin: '60',
    cutReferenceFatMax: '70',
  };
}

function createBackupMeta() {
  return {
    lastExportAt: '',
    lastImportAt: '',
  };
}

export function createCleanDefaultState() {
  return {
    profileId: 'clean',
    foods: [],
    foodTemplates: [],
    hydrationEntries: [],
    supplements: [],
    routines: [],
    exercises: [],
    bodyMetrics: [],
    fastingProtocols: [],
    fastingLogs: [],
    fastingFreeDays: [],
    privateCycles: [],
    privateProducts: [],
    privatePayments: [],
    privateHormonalEntries: [],
    privateDailyChecks: [],
    privateCycleMedications: [],
    kravCurriculum: [],
    kravPracticeLogs: [],
    kravSettings: {
      currentBelt: '',
      targetBelt: '',
      examDate: '',
      forgottenThresholdDays: '5',
    },
    privateVault: createDefaultPrivateVault(),
    privateSeedVersion: 0,
    objectives: [],
    goals: createEmptyGoals(),
    userSettings: createUserSettings('fitness-basic'),
    syncMeta: createDefaultSyncMeta(),
    backupMeta: createBackupMeta(),
  };
}

export function createDanielDefaultState() {
  const privateSeedData = createPrivateSeedData();

  return {
    profileId: 'daniel-full',
    foods: [],
    foodTemplates: [],
    hydrationEntries: [],
    supplements: [],
    routines: [],
    exercises: [],
    bodyMetrics: [createRecentManualMetricSeed(), createInitialMetricSeed()],
    fastingProtocols: defaultFastingProtocols.map((item) => ({ ...item })),
    fastingLogs: [],
    fastingFreeDays: [],
    privateCycles: privateSeedData.privateCycles,
    privateProducts: privateSeedData.privateProducts,
    privatePayments: privateSeedData.privatePayments,
    privateHormonalEntries: privateSeedData.privateHormonalEntries,
    privateDailyChecks: privateSeedData.privateDailyChecks,
    privateCycleMedications: privateSeedData.privateCycleMedications,
    kravCurriculum: createOrangeKravCurriculum(),
    kravPracticeLogs: [],
    kravSettings: createEmptyKravSettings(),
    privateVault: createDefaultPrivateVault(),
    privateSeedVersion: privateSeedData.privateSeedVersion,
    objectives: [createDefaultObjective()],
    goals: createDanielGoals(),
    userSettings: createUserSettings('daniel-full'),
    syncMeta: createDefaultSyncMeta(),
    backupMeta: createBackupMeta(),
  };
}

export const defaultState = createDanielDefaultState();
