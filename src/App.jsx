
import { useEffect, useMemo, useRef, useState } from 'react';
import EntryList from './components/EntryList';
import GoalForm from './components/GoalForm';
import ProgressCard from './components/ProgressCard';
import RecordForm from './components/RecordForm';
import SectionCard from './components/SectionCard';
import DashboardTab from './components/tabs/DashboardTab';
import FastingTab from './components/tabs/FastingTab';
import HistoryTab from './components/tabs/HistoryTab';
import HormonalTab from './components/tabs/HormonalTab';
import KravMagaTab from './components/tabs/KravMagaTab';
import MetricsTab from './components/tabs/MetricsTab';
import ObjectivesTab from './components/tabs/ObjectivesTab';
import SupplementsTab from './components/tabs/SupplementsTab';
import WeeklyTab from './components/tabs/WeeklyTab';
import { cutMayReferenceGroups, cutMayReferenceRule } from './data/cutMayReference';
import {
  createCleanDefaultState,
  createUserSettings,
  defaultState,
  USER_PROFILE_LABELS,
  USER_PROFILE_TAB_PRESETS,
} from './data/defaultState';
import { isSupabaseConfigured } from './lib/supabase';
import { buildTodaySummary } from './utils/domain/dashboardSummary';
import {
  calculateFastingDurationHours,
  calculateLiveElapsedHours,
  createEmptyFastingLog,
  createEmptyFastingProtocol,
  doesFastingOverlapWeek,
  fastingDayLabels,
  fastingDayOrder,
  fastingFeelingLabels,
  fastingTypeLabels,
  formatHoursLabel,
  formatProtocolLabel,
  getCurrentDateTimeValue,
  getDayOfWeekKey,
  getEffectiveFastingTargetHours,
  getFastingDatesInsideRange,
  getFastingDisplayText,
  getFastingElapsedHours,
  getFastingHoursInsideRange,
  getFastingRecordDate,
  getFastingStatusClass,
  getFastingStatusLabel,
  getPrimaryFastingLogForDate,
  isFastingFreeDay,
  getWeeklyFastingStatus,
} from './utils/domain/fasting';
import {
  createEmptyMetric,
  formatMetricText,
  formatMetricValue,
  getLatestMetricFieldSnapshot,
  getMetricComparisonPair,
  getMetricDeltaLabel,
  getMetricTrend,
} from './utils/domain/metrics';
import {
  calculateObjectiveProgress,
  createEmptyObjective,
  getWeightMessage,
  objectiveStatusLabels,
  objectiveTypeLabels,
} from './utils/domain/objectives';
import { getPersistenceCollectionCounts, isValidAppDataPayload } from './utils/domain/persistenceDebug';
import {
  buildPrivateHormonalWeeklySummary,
  buildPrivateOperationalAlerts,
  buildPrivateSummary,
  buildPrivateTimeline,
  applyPrivateMedicationDose,
  removePrivateMedicationDose,
  createEmptyPrivateCycle,
  createEmptyPrivateDailyCheck,
  createEmptyPrivateEntry,
  createEmptyPrivateMedication,
  createEmptyPrivatePayment,
  createEmptyPrivateProduct,
  getPrivateActiveCycle,
  getPrivateMedicationDailyStatus,
  getPrivateCycleFinancialSummary,
  privateMedicationScheduleLabels,
  privateMedicationSlotLabels,
  privateMedicationTypeLabels,
  privateDailyRetentionLabels,
  getPrivatePinLength,
  isValidPrivatePin,
  repairPrivateCycle2026Data,
  privateCategoryLabels,
  privateCycleStatusLabels,
  privateCycleTypeLabels,
  privateEventTypeLabels,
  privatePaymentStatusLabels,
  privateProductStatusLabels,
} from './utils/domain/private';
import {
  buildKravAlerts,
  buildKravExamStatus,
  buildKravProgress,
  createEmptyKravPracticeLog,
  getDaysSincePractice,
  getKravTechniqueProgress,
  getNextKravTechnique,
  kravCategoryLabels,
  kravCoachOptions,
  kravStageLabels,
  markKravTechniquePracticed,
} from './utils/domain/krav';
import {
  chooseSnapshotWinner,
  createDeviceId,
  ensureSyncMeta,
  explainSnapshotWinner,
  fetchRemoteSnapshot,
  getSnapshotSummary,
  getSupabaseSession,
  logSyncDebug,
  markDataSynced,
  markDataUpdated,
  mergeRemoteSnapshot,
  onSupabaseAuthChange,
  pushRemoteSnapshot,
  signInWithSupabasePassword,
  signOutFromSupabase,
  signUpWithSupabasePassword,
  syncStatusLabels,
} from './services/syncService';
import {
  createEmptyExercise,
  createEmptyFood,
  createEmptyFoodTemplate,
  createEmptyHydration,
  createEmptySupplement,
  daytimeLabels,
  drinkTypeLabels,
  emptyRoutineItem,
  exerciseFilterOptions,
  exerciseIntensityLabels,
  exerciseModalityLabels,
  foodRelationLabels,
  frequencyLabels,
  getHydrationMl,
  mealTypeLabels,
  recommendedSupplementChecklist,
  sortExercises,
  sortFoods,
  sortHydrationEntries,
  sortSupplements,
  supplementCategoryLabels,
  supplementFilterOptions,
} from './utils/domain/records';
import {
  average,
  createId,
  formatIntegerValue,
  formatPercentValue,
  formatUnitValue,
  formatWeightValue,
  getNumericMetric,
  getLatestEntry,
  shiftDateByDays,
  sumBy,
} from './utils/domain/shared';
import { buildWeeklySummary } from './utils/domain/weeklySummary';
import {
  formatDate,
  formatDateTimeHuman,
  getEndOfWeek,
  getStartOfWeek,
  getToday,
  isDateInRange,
  isSameDate,
  normalizeDateString,
  sortByDateDesc,
} from './utils/date';
import { clearAppData, getUserStorageKey, loadAppData, migrateAppData, saveAppData } from './utils/storage';

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'objectives', label: 'Objetivos' },
  { id: 'foods', label: 'Alimentos' },
  { id: 'supplements', label: 'Suplementos' },
  { id: 'fasting', label: 'Ayuno' },
  { id: 'exercises', label: 'Ejercicio' },
  { id: 'krav', label: 'Krav Maga' },
  { id: 'metrics', label: 'Metricas' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'history', label: 'Historial' },
  { id: 'private', label: 'Salud hormonal' },
  { id: 'settings', label: 'Ajustes' },
];

const tabLabelById = Object.fromEntries(tabs.map((tab) => [tab.id, tab.label]));
const selectableUserProfiles = ['fitness-basic', 'krav-360', 'daniel-full'];

const goalSettingFields = ['calories', 'protein', 'weight', 'hydrationBase', 'hydrationHighActivity'];
const cutReferenceFieldGroups = [
  {
    title: 'Composición objetivo',
    helper: 'Referencia corporal para el corte rumbo a 10% de grasa.',
    fields: [
      { name: 'cutReferenceCurrentWeight', label: 'Peso actual (kg)', step: '0.1' },
      { name: 'cutReferenceTargetWeight10', label: 'Peso objetivo 10% (kg)', step: '0.1' },
      { name: 'cutReferenceFatToLose', label: 'Grasa a perder (kg)', step: '0.1' },
      { name: 'cutReferenceEstimatedDeficit', label: 'Déficit total estimado (kcal)', step: '1' },
    ],
  },
  {
    title: 'Gasto energético',
    helper: 'Base operativa para no perder contexto entre mantenimiento y corte.',
    fields: [
      { name: 'cutReferenceBmr', label: 'BMR (kcal)', step: '1' },
      { name: 'cutReferenceTdee', label: 'TDEE operativo (kcal)', step: '1' },
      { name: 'cutReferenceMaintenanceMin', label: 'Mantenimiento útil mínimo (kcal)', step: '1' },
      { name: 'cutReferenceMaintenanceMax', label: 'Mantenimiento útil máximo (kcal)', step: '1' },
    ],
  },
  {
    title: 'Rangos calóricos',
    helper: 'Zona útil de corte y límites de agresividad.',
    fields: [
      { name: 'cutReferenceCutMin', label: 'Corte útil mínimo (kcal)', step: '1' },
      { name: 'cutReferenceCutMax', label: 'Corte útil máximo (kcal)', step: '1' },
      { name: 'cutReferenceConservativeMin', label: 'Corte conservador mínimo (kcal)', step: '1' },
      { name: 'cutReferenceConservativeMax', label: 'Corte conservador máximo (kcal)', step: '1' },
      { name: 'cutReferenceEffectiveMin', label: 'Corte efectivo mínimo (kcal)', step: '1' },
      { name: 'cutReferenceEffectiveMax', label: 'Corte efectivo máximo (kcal)', step: '1' },
      { name: 'cutReferenceAggressiveBelow', label: 'Muy agresivo debajo de (kcal)', step: '1' },
    ],
  },
  {
    title: 'Rangos de macros',
    helper: 'Guardrails mínimos y máximos para sostener el corte.',
    fields: [
      { name: 'cutReferenceProteinMin', label: 'Proteína mínima recomendada (g)', step: '1' },
      { name: 'cutReferenceProteinMax', label: 'Proteína máxima recomendada (g)', step: '1' },
      { name: 'cutReferenceFatMin', label: 'Grasa mínima recomendada (g)', step: '1' },
      { name: 'cutReferenceFatMax', label: 'Grasa máxima recomendada (g)', step: '1' },
    ],
  },
];
const cutReferenceFieldNames = cutReferenceFieldGroups.flatMap((group) => group.fields.map((field) => field.name));

const kravBeltOptions = ['amarilla', 'naranja', 'verde', 'azul', 'marron', 'negra'];
const privateDailyHormonalPanelOrder = ['oxandrolona', 'liver-cleanse', 'tamoxifeno', 'clomifeno'];

function pickGoalFormValues(goals = {}) {
  return goalSettingFields.reduce((result, fieldName) => {
    result[fieldName] = goals?.[fieldName] ?? defaultState.goals[fieldName] ?? '';
    return result;
  }, {});
}

function pickCutReferenceFormValues(goals = {}) {
  return cutReferenceFieldNames.reduce((result, fieldName) => {
    result[fieldName] = goals?.[fieldName] ?? defaultState.goals[fieldName] ?? '';
    return result;
  }, {});
}

function normalizeOperationalKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function getPrivateDailyHormonalPanelKey(item) {
  const normalizedName = normalizeOperationalKey(item?.name);
  const normalizedAlias = normalizeOperationalKey(item?.alias);

  if (normalizedName.includes('oxandrol') || normalizedAlias.includes('oxandrol')) return 'oxandrolona';
  if (normalizedName.includes('liver')) return 'liver-cleanse';
  if (normalizedName.includes('tamox')) return 'tamoxifeno';
  if (normalizedName.includes('clomif')) return 'clomifeno';
  return '';
}

function getPrivateMedicationDisplayName(item) {
  const key = getPrivateDailyHormonalPanelKey(item);
  if (key === 'liver-cleanse') return 'Liver Cleanse';
  return item?.name || 'Control sin nombre';
}

function sortPrivateRecordsByDate(items = [], dateField = 'date') {
  return [...items].sort((a, b) => {
    const dateA = a?.[dateField] || '';
    const dateB = b?.[dateField] || '';
    if (dateA !== dateB) return String(dateB).localeCompare(String(dateA));
    return String(b?.id || '').localeCompare(String(a?.id || ''));
  });
}

function formatCurrencyMx(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatShortDateTimeHuman(value) {
  if (!value) return 'Aun no exportado';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed).replace(',', ' ·');
}

function formatSettingsRange(minValue, maxValue, unit = '') {
  const hasMin = getNumericMetric(minValue) !== null;
  const hasMax = getNumericMetric(maxValue) !== null;

  if (!hasMin && !hasMax) return 'Sin dato';
  if (hasMin && hasMax) {
    return `${formatUnitValue(minValue, unit, { maximumFractionDigits: 0, fallback: '--' })} · ${formatUnitValue(maxValue, unit, {
      maximumFractionDigits: 0,
      fallback: '--',
    })}`;
  }

  const singleValue = hasMin ? minValue : maxValue;
  return formatUnitValue(singleValue, unit, { maximumFractionDigits: 0, fallback: 'Sin dato' });
}

function formatCompactSettingsRange(minValue, maxValue, unit = '') {
  const min = getNumericMetric(minValue);
  const max = getNumericMetric(maxValue);
  const formatter = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });

  if (min === null && max === null) return 'Sin dato';
  if (min !== null && max !== null) {
    return `${formatter.format(min)}-${formatter.format(max)}${unit ? ` ${unit}` : ''}`;
  }

  const singleValue = min ?? max;
  return `${formatter.format(singleValue)}${unit ? ` ${unit}` : ''}`;
}

function formatPrivateDate(value) {
  if (!value) return 'Sin fecha';

  const parsed = new Date(`${normalizeDateString(value)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
    .format(parsed)
    .replace(/\.$/, '')
    .toLowerCase();
}

function formatPrivateDateTimeHuman(value) {
  if (!value) return 'Sin fecha';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
    .format(parsed)
    .replace(',', ' ·')
    .replace(/\b(a\.?\s?m\.?)\b/i, 'a. m.')
    .replace(/\b(p\.?\s?m\.?)\b/i, 'p. m.')
    .toLowerCase();
}

function getPrivateAgendaDateTime(entry) {
  if (!entry) return null;

  const reference = entry.nextApplication || (entry.date ? `${entry.date}T${entry.time || '00:00'}` : '');
  if (!reference) return null;

  const parsed = new Date(reference);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getPrivateAgendaDate(entry) {
  if (!entry) return '';
  if (entry.nextApplication) return normalizeDateString(entry.nextApplication);
  return normalizeDateString(entry.date);
}

function scrollElementIntoViewIfNeeded(element) {
  if (!element || typeof window === 'undefined') return;

  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

  if (rect.top >= 84 && rect.bottom <= viewportHeight - 24) return;

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

function formatAgendaDayLabel(dateString) {
  if (!dateString) return '';
  const parsed = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';

  return new Intl.DateTimeFormat('es-MX', { weekday: 'short' })
    .format(parsed)
    .replace('.', '')
    .toLowerCase();
}

function formatAgendaShortDate(dateString) {
  if (!dateString) return '';
  const parsed = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
  })
    .format(parsed)
    .toLowerCase();
}

function formatAgendaTime(value) {
  if (!value) return 'Sin hora';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sin hora';

  return new Intl.DateTimeFormat('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
  })
    .format(parsed)
    .replace(/\b(a\.?\s?m\.?)\b/i, 'a. m.')
    .replace(/\b(p\.?\s?m\.?)\b/i, 'p. m.');
}

function formatPrivateScaleValue(value) {
  if (!value) return 'Sin dato';
  return `${value}/5`;
}

function formatPrivateAverageValue(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'Sin dato';
  return `${Number(value).toFixed(1)}/5`;
}

function normalizeTextToken(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getMetricTrendPresentation(trend) {
  if (trend === 'bajo') {
    return { label: '↓ bajó', className: 'metric-trend metric-trend-down' };
  }

  if (trend === 'subio') {
    return { label: '↑ subió', className: 'metric-trend metric-trend-up' };
  }

  if (trend === 'sin cambio') {
    return { label: 'Sin cambio aún', className: 'metric-trend metric-trend-neutral' };
  }

  return { label: 'Sin referencia', className: 'metric-trend metric-trend-muted' };
}

function formatFastingStatusCopy(status, { isFreeDay = false, reachedGoal = false } = {}) {
  if (isFreeDay) return 'Día libre';
  if (status === 'en curso') return reachedGoal ? 'Meta alcanzada · en curso' : 'Ayuno en curso';
  if (status === 'cumplido') return 'Ayuno completado';
  if (status === 'sin registro' || status === 'pendiente') return 'Sin registro de ayuno';
  if (status === 'roto') return 'Ayuno cerrado';
  return status || 'Sin registro de ayuno';
}

function getEstimatedFastingBreakDateTime(startDateTime, targetHours) {
  const start = new Date(startDateTime || '');
  const hours = Number(targetHours || 0);
  if (Number.isNaN(start.getTime()) || !Number.isFinite(hours) || hours <= 0) return '';

  const estimated = new Date(start.getTime() + hours * 60 * 60 * 1000);
  const pad = (value) => String(value).padStart(2, '0');
  return `${estimated.getFullYear()}-${pad(estimated.getMonth() + 1)}-${pad(estimated.getDate())}T${pad(estimated.getHours())}:${pad(estimated.getMinutes())}`;
}

function itemToSortableAgendaValue(item) {
  if (item?.scheduledAt) return item.scheduledAt.toISOString();
  if (item?.scheduledDate) return `${item.scheduledDate}T23:59:59`;
  return '9999-12-31T23:59:59';
}

function getPrivateEventChipClass(eventType) {
  switch (eventType) {
    case 'aplicacion':
      return 'private-event-chip private-event-chip-application';
    case 'toma':
      return 'private-event-chip private-event-chip-oral';
    case 'analitica':
      return 'private-event-chip private-event-chip-lab';
    case 'compra':
      return 'private-event-chip private-event-chip-purchase';
    case 'sintoma':
      return 'private-event-chip private-event-chip-symptom';
    case 'control':
      return 'private-event-chip private-event-chip-control';
    default:
      return 'private-event-chip';
  }
}

function getPrivateCycleStatusPhrase(status) {
  switch (status) {
    case 'planeado':
      return 'Ciclo en planeacion';
    case 'activo':
      return 'Ciclo activo';
    case 'pausado':
      return 'Ciclo pausado';
    case 'cerrado':
      return 'Ciclo finalizado';
    default:
      return 'Sin estado operativo';
  }
}

function getPrivateAgendaPrimaryState(item, { now, currentDate, nextEventId } = {}) {
  if (!item) return 'Sin evento';
  if (nextEventId && item.id === nextEventId) {
    return item.scheduledDate === currentDate ? 'Proximo hoy' : 'Proximo';
  }
  if (item.scheduledDate === currentDate) {
    if (item.scheduledAt && item.scheduledAt.getTime() < now.getTime()) return 'Ya paso hoy';
    return 'Hoy';
  }
  if (!item.scheduledAt) return 'Sin hora';
  return 'Programado';
}

function getPrivateAgendaFlags(item, { now, currentDate, nextEventId } = {}) {
  if (!item) return [];

  const flags = [];

  if (item.scheduledDate === currentDate) {
    if (item.scheduledAt && item.scheduledAt.getTime() < now.getTime()) {
      flags.push('Ya paso hoy');
    } else {
      flags.push('Hoy');
    }
  }

  if (nextEventId && item.id === nextEventId) {
    flags.push('Proximo');
  }

  if (!item.scheduledAt) {
    flags.push('Sin hora');
  }

  return [...new Set(flags)];
}

function getPrivateAgendaFlagClass(flag) {
  switch (flag) {
    case 'Hoy':
      return 'private-agenda-flag private-agenda-flag-today';
    case 'Proximo':
    case 'Proximo hoy':
      return 'private-agenda-flag private-agenda-flag-next';
    case 'Ya paso hoy':
      return 'private-agenda-flag private-agenda-flag-past';
    case 'Sin hora':
      return 'private-agenda-flag private-agenda-flag-no-time';
    default:
      return 'private-agenda-flag';
  }
}

function getPrivateAgendaEventDetail(item, linkedProduct) {
  const detailParts = [];

  if (item?.eventType) {
    detailParts.push(privateEventTypeLabels[item.eventType] || item.eventType);
  }

  if (item?.category) {
    detailParts.push(privateCategoryLabels[item.category] || item.category);
  }

  if (item?.dose) {
    detailParts.push(`${item.dose} ${item.unit || ''}`.trim());
  }

  if (linkedProduct?.name) {
    detailParts.push(linkedProduct.name);
  }

  return detailParts.join(' · ');
}

function App() {
  const currentDate = getToday();
  const currentWeekStart = getStartOfWeek(currentDate);
  const currentWeekEnd = getEndOfWeek(currentDate);
  const isDevMode = import.meta.env.DEV;
  const canShowPrivateRepair =
    Boolean(import.meta.env.DEV) &&
    !Boolean(import.meta.env.PROD) &&
    (typeof window === 'undefined' || ['localhost', '127.0.0.1'].includes(window.location.hostname));
  const appBuildLabel = __APP_BUILD_LABEL__;
  const remoteSyncEnabled = isSupabaseConfigured;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [diaryData, setDiaryData] = useState(defaultState);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [goalForm, setGoalForm] = useState(() => pickGoalFormValues(defaultState.goals));
  const [cutReferenceForm, setCutReferenceForm] = useState(() => pickCutReferenceFormValues(defaultState.goals));
  const [objectiveForm, setObjectiveForm] = useState(defaultState.objectives?.[0] || createEmptyObjective());
  const [foodForm, setFoodForm] = useState(createEmptyFood);
  const [hydrationForm, setHydrationForm] = useState(createEmptyHydration);
  const [foodTemplateForm, setFoodTemplateForm] = useState(createEmptyFoodTemplate);
  const [fastingProtocolForm, setFastingProtocolForm] = useState(createEmptyFastingProtocol);
  const [fastingLogForm, setFastingLogForm] = useState(createEmptyFastingLog);
  const [supplementForm, setSupplementForm] = useState(createEmptySupplement);
  const [routineName, setRoutineName] = useState('');
  const [routineItemForm, setRoutineItemForm] = useState(emptyRoutineItem);
  const [routineItems, setRoutineItems] = useState([]);
  const [exerciseForm, setExerciseForm] = useState(createEmptyExercise);
  const [kravPracticeForm, setKravPracticeForm] = useState(createEmptyKravPracticeLog);
  const [metricForm, setMetricForm] = useState(createEmptyMetric);
  const [privateEntryForm, setPrivateEntryForm] = useState(createEmptyPrivateEntry);
  const [privateCycleForm, setPrivateCycleForm] = useState(createEmptyPrivateCycle);
  const [privateProductForm, setPrivateProductForm] = useState(createEmptyPrivateProduct);
  const [privatePaymentForm, setPrivatePaymentForm] = useState(createEmptyPrivatePayment);
  const [privateDailyCheckForm, setPrivateDailyCheckForm] = useState(createEmptyPrivateDailyCheck);
  const [privateMedicationForm, setPrivateMedicationForm] = useState(createEmptyPrivateMedication);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [editingHydrationId, setEditingHydrationId] = useState(null);
  const [editingFoodTemplateId, setEditingFoodTemplateId] = useState(null);
  const [editingFastingProtocolId, setEditingFastingProtocolId] = useState(null);
  const [editingFastingLogId, setEditingFastingLogId] = useState(null);
  const [editingSupplementId, setEditingSupplementId] = useState(null);
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [editingKravPracticeId, setEditingKravPracticeId] = useState(null);
  const [editingMetricId, setEditingMetricId] = useState(null);
  const [editingPrivateEntryId, setEditingPrivateEntryId] = useState(null);
  const [editingPrivateCycleId, setEditingPrivateCycleId] = useState(null);
  const [editingPrivateProductId, setEditingPrivateProductId] = useState(null);
  const [editingPrivatePaymentId, setEditingPrivatePaymentId] = useState(null);
  const [editingPrivateDailyCheckId, setEditingPrivateDailyCheckId] = useState(null);
  const [editingPrivateMedicationId, setEditingPrivateMedicationId] = useState(null);
  const [weekReferenceDate, setWeekReferenceDate] = useState(currentDate);
  const [showAllRecentFoods, setShowAllRecentFoods] = useState(false);
  const [showFoodTemplateBuilder, setShowFoodTemplateBuilder] = useState(true);
  const [showRoutineBuilder, setShowRoutineBuilder] = useState(true);
  const [showFastingProtocolBuilder, setShowFastingProtocolBuilder] = useState(false);
  const [showFastingManualForm, setShowFastingManualForm] = useState(false);
  const [showKravPracticeBuilder, setShowKravPracticeBuilder] = useState(false);
  const [supplementFilter, setSupplementFilter] = useState('todos');
  const [exerciseFilter, setExerciseFilter] = useState('todos');
  const [selectedKravTechniqueId, setSelectedKravTechniqueId] = useState('');
  const [kravTechniqueNoteDraft, setKravTechniqueNoteDraft] = useState('');
  const [kravExpandedCategories, setKravExpandedCategories] = useState({});
  const [kravCategoryShowAll, setKravCategoryShowAll] = useState({});
  const [fastingNow, setFastingNow] = useState(() => Date.now());
  const [backupInputKey, setBackupInputKey] = useState(0);
  const [backupFeedback, setBackupFeedback] = useState({ type: '', text: '' });
  const [fastingFeedback, setFastingFeedback] = useState({ type: '', text: '' });
  const [privateBackupInputKey, setPrivateBackupInputKey] = useState(0);
  const [privateFeedback, setPrivateFeedback] = useState({ type: '', text: '' });
  const [syncFeedback, setSyncFeedback] = useState({ type: '', text: '' });
  const [syncStatus, setSyncStatus] = useState(remoteSyncEnabled ? 'auth' : 'local');
  const [syncCredentials, setSyncCredentials] = useState({ email: '', password: '' });
  const [syncUser, setSyncUser] = useState(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [hasResolvedSyncSession, setHasResolvedSyncSession] = useState(!remoteSyncEnabled);
  const [hasResolvedRemoteSnapshot, setHasResolvedRemoteSnapshot] = useState(!remoteSyncEnabled);
  const [syncLastSyncedAt, setSyncLastSyncedAt] = useState('');
  const [privateUnlockPin, setPrivateUnlockPin] = useState('');
  const [privateSetupPin, setPrivateSetupPin] = useState('');
  const [privateSetupPinConfirm, setPrivateSetupPinConfirm] = useState('');
  const [privatePinUpdate, setPrivatePinUpdate] = useState({ current: '', next: '', confirm: '' });
  const [privateFormVisibility, setPrivateFormVisibility] = useState({
    cycle: false,
    medication: false,
    product: false,
    event: false,
    payment: false,
  });
  const [privateSecurityExpanded, setPrivateSecurityExpanded] = useState(false);
  const [privateTimelineFilter, setPrivateTimelineFilter] = useState('all');
  const [privateAgendaSelectedDate, setPrivateAgendaSelectedDate] = useState('');
  const [privateAgendaShowAll, setPrivateAgendaShowAll] = useState(false);
  const [privateBlockedTarget, setPrivateBlockedTarget] = useState('');
  const [isPrivateUnlocked, setIsPrivateUnlocked] = useState(false);
  const [debugLastLoadAt, setDebugLastLoadAt] = useState('');
  const [debugLastSaveAt, setDebugLastSaveAt] = useState('');
  const persistReasonRef = useRef('inicio');
  const syncDeviceIdRef = useRef('');
  const latestPersistedDataRef = useRef(defaultState);
  const activeStorageKeyRef = useRef(getUserStorageKey());
  const syncDebounceTimeoutRef = useRef(null);
  const skipNextRemoteSyncRef = useRef(false);
  const syncRefreshInFlightRef = useRef(false);
  const lastSyncRefreshAtRef = useRef(0);
  const privateAutoLockTimeoutRef = useRef(null);
  const privateDailyHormonalSectionRef = useRef(null);
  const privateCycleSectionRef = useRef(null);
  const privateDailyCheckSectionRef = useRef(null);
  const privateMedicationSectionRef = useRef(null);
  const privateProductSectionRef = useRef(null);
  const privatePaymentSectionRef = useRef(null);
  const privateEventSectionRef = useRef(null);
  const privateFinancialSummaryRef = useRef(null);
  const kravTechniqueDetailRef = useRef(null);
  const pendingKravDetailScrollRef = useRef(false);

  useEffect(() => {
    document.title = 'Bitacora Daniel';
  }, []);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
      setSyncStatus('offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!remoteSyncEnabled) {
      setHasResolvedSyncSession(true);
      return undefined;
    }

    let isMounted = true;

    getSupabaseSession()
      .then((session) => {
        if (!isMounted) return;
        setSyncUser(session?.user || null);
        setHasResolvedSyncSession(true);
        setSyncStatus(session?.user ? (isOnline ? 'pending' : 'offline') : isOnline ? 'auth' : 'offline');
      })
      .catch((error) => {
        if (!isMounted) return;
        setHasResolvedSyncSession(true);
        setSyncStatus(isOnline ? 'error' : 'offline');
        setSyncFeedback({
          type: 'error',
          text: error instanceof Error ? error.message : 'No se pudo iniciar la sesion de sincronizacion.',
        });
      });

    const subscription = onSupabaseAuthChange((session) => {
      setSyncUser(session?.user || null);
      setHasResolvedSyncSession(true);
      setHasResolvedRemoteSnapshot(false);
      setSyncStatus(session?.user ? (isOnline ? 'pending' : 'offline') : isOnline ? 'auth' : 'offline');
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
    };
  }, [isOnline, remoteSyncEnabled]);

  useEffect(() => {
    if (!remoteSyncEnabled || !hasLoadedData || !hasResolvedRemoteSnapshot || !syncUser) return undefined;

    const handleForegroundSync = () => {
      if (document.visibilityState !== 'visible') return;
      pullRemoteSnapshotAndHydrate({ reason: 'visibility-return' })
        .then((result) => {
          if (result.status === 'hydrated-remote' || result.status === 'equal') {
            setSyncStatus('synced');
          }
        })
        .catch((error) => {
          logSyncDebug('foreground-pull:error', {
            message: error instanceof Error ? error.message : String(error),
          });
        });
    };

    const handleWindowFocus = () => {
      pullRemoteSnapshotAndHydrate({ reason: 'window-focus' })
        .then((result) => {
          if (result.status === 'hydrated-remote' || result.status === 'equal') {
            setSyncStatus('synced');
          }
        })
        .catch((error) => {
          logSyncDebug('focus-pull:error', {
            message: error instanceof Error ? error.message : String(error),
          });
        });
    };

    document.addEventListener('visibilitychange', handleForegroundSync);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleForegroundSync);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [hasLoadedData, hasResolvedRemoteSnapshot, remoteSyncEnabled, syncUser, isOnline]);

  function togglePrivateForm(formKey) {
    setPrivateFormVisibility((current) => ({
      ...current,
      [formKey]: !current[formKey],
    }));
  }

  function openPrivateForm(formKey, options = {}) {
    const nextFormKey = formKey;

    if (formKey === 'cycle') {
      setPrivateBlockedTarget('');
    } else if (!activePrivateCycle && ['medication', 'product', 'event', 'payment'].includes(formKey)) {
      setPrivateBlockedTarget(formKey);
    } else {
      setPrivateBlockedTarget('');
    }

    setPrivateFormVisibility((current) => ({
      ...current,
      [nextFormKey]: true,
    }));

    const targetMap = {
      cycle: privateCycleSectionRef,
      medication: privateMedicationSectionRef,
      product: privateProductSectionRef,
      event: privateEventSectionRef,
      payment: privatePaymentSectionRef,
    };

    window.setTimeout(() => {
      const targetNode = targetMap[nextFormKey]?.current;
      targetNode?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const focusSelector = options.focusSelector || 'input, select, textárea';
      const firstField = targetNode?.querySelector(focusSelector);
      if (firstField instanceof HTMLElement) {
        firstField.focus();
      }
    }, 60);
  }

  function openPrivateEventFormForDate(dateValue = '') {
    const targetDate = dateValue || currentDate;
    setPrivateEntryForm((current) => ({
      ...current,
      cycleId: activePrivateCycle?.id || current.cycleId,
      date: targetDate,
    }));
    openPrivateForm('event', {
      focusSelector: 'input[name="time"], input[name="name"], select[name="eventType"], textárea[name="notes"]',
    });
  }

  function scrollToPrivateSection(sectionKey) {
    const targetMap = {
      cycle: privateCycleSectionRef,
      medication: privateMedicationSectionRef,
      event: privateEventSectionRef,
      product: privateProductSectionRef,
      payment: privatePaymentSectionRef,
      financial: privateFinancialSummaryRef,
    };

    const targetNode = targetMap[sectionKey]?.current;
    if (!targetNode) return;

    window.setTimeout(() => {
      targetNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  }

  function getPrivateBlockedCopy(formKey) {
    if (formKey === 'medication') return 'Primero activa un ciclo para registrar tomas y proteger el inventario.';
    if (formKey === 'product') return 'Primero activa un ciclo para asociar un componente.';
    if (formKey === 'payment') return 'Primero activa un ciclo para registrar un pago.';
    return 'Primero activa un ciclo para registrar un evento.';
  }

  function markPersistenceReason(reason) {
    persistReasonRef.current = reason;
    if (isDevMode) {
      console.info('[Mi Diario][debug] persist:queued', { reason });
    }
  }

  function getFallbackStateForSnapshot(snapshot = latestPersistedDataRef.current) {
    return snapshot?.profileId === 'clean' ? createCleanDefaultState() : defaultState;
  }

  function applyFormStateFromSnapshot(snapshot) {
    const fallbackState = getFallbackStateForSnapshot(snapshot);
    setGoalForm(pickGoalFormValues(snapshot.goals || fallbackState.goals));
    setCutReferenceForm(pickCutReferenceFormValues(snapshot.goals || fallbackState.goals));
    setObjectiveForm(
      (snapshot.objectives && snapshot.objectives[0]) ||
        fallbackState.objectives?.[0] ||
        createEmptyObjective()
    );
  }

  function applyHydratedSnapshot(snapshot, options = {}) {
    if (!snapshot) return;

    latestPersistedDataRef.current = snapshot;
    saveAppData(snapshot, options.storageKey || activeStorageKeyRef.current);
    skipNextRemoteSyncRef.current = true;
    setDiaryData(snapshot);
    applyFormStateFromSnapshot(snapshot);
    setSyncLastSyncedAt(snapshot.syncMeta?.lastSyncedAt || '');

    if (options.feedbackText) {
      setSyncFeedback({ type: 'success', text: options.feedbackText });
    }
  }

  async function pullRemoteSnapshotAndHydrate({ reason = 'manual', force = false } = {}) {
    if (!remoteSyncEnabled || !syncUser || !isOnline) return { status: 'skipped', winner: 'local' };
    if (syncRefreshInFlightRef.current) return { status: 'busy', winner: 'local' };

    const now = Date.now();
    if (!force && now - lastSyncRefreshAtRef.current < 12000) {
      return { status: 'throttled', winner: 'local' };
    }

    syncRefreshInFlightRef.current = true;
    lastSyncRefreshAtRef.current = now;

    try {
      const localSnapshot = latestPersistedDataRef.current;
      logSyncDebug('reconcile:local-before', {
        reason,
        summary: getSnapshotSummary(localSnapshot),
      });
      console.log('LOCAL STATE BEFORE MERGE:', localSnapshot);

      const remoteSnapshot = await fetchRemoteSnapshot(syncUser.id);

      if (!remoteSnapshot?.payload) {
        logSyncDebug('reconcile:no-remote', { reason });
        return { status: 'no-remote', winner: 'local', localSnapshot };
      }

      console.log('REMOTE SNAPSHOT:', remoteSnapshot.payload);

      const mergedRemoteData = mergeRemoteSnapshot({
        remoteData: migrateAppData(remoteSnapshot.payload),
        localData: localSnapshot,
        deviceId: syncDeviceIdRef.current || localSnapshot.syncMeta?.deviceId || createDeviceId(),
        lastSyncedAt: remoteSnapshot.last_synced_at || remoteSnapshot.updated_at || getCurrentDateTimeValue(),
      });

      const decision = explainSnapshotWinner(localSnapshot, mergedRemoteData);
      logSyncDebug('reconcile:decision', {
        reason,
        winner: decision.winner,
        why: decision.reason,
        local: getSnapshotSummary(localSnapshot),
        remote: getSnapshotSummary(mergedRemoteData),
        localValue: decision.localValue,
        remoteValue: decision.remoteValue,
      });

      if (decision.winner === 'remote') {
        applyHydratedSnapshot(mergedRemoteData);
        return { status: 'hydrated-remote', winner: 'remote', remoteSnapshot: mergedRemoteData };
      }

      if (decision.winner === 'equal') {
        setSyncLastSyncedAt(mergedRemoteData.syncMeta?.lastSyncedAt || '');
        return { status: 'equal', winner: 'equal', remoteSnapshot: mergedRemoteData, localSnapshot };
      }

      return { status: 'keep-local', winner: 'local', remoteSnapshot: mergedRemoteData, localSnapshot };
    } finally {
      syncRefreshInFlightRef.current = false;
    }
  }

  useEffect(() => {
    const initialStorageKey = getUserStorageKey();
    activeStorageKeyRef.current = initialStorageKey;
    const loadedData = loadAppData(initialStorageKey);
    const preparedData = ensureSyncMeta(
      loadedData,
      loadedData?.syncMeta?.deviceId || createDeviceId()
    );
    syncDeviceIdRef.current = preparedData.syncMeta.deviceId;
    latestPersistedDataRef.current = preparedData;
    setDiaryData(preparedData);
    applyFormStateFromSnapshot(preparedData);
    setSyncLastSyncedAt(preparedData.syncMeta?.lastSyncedAt || '');
    const loadTimestamp = getCurrentDateTimeValue();
    setDebugLastLoadAt(loadTimestamp);
    if (isDevMode) {
      console.info('[Mi Diario][debug] load:applied', {
        at: loadTimestamp,
        collectionCounts: getPersistenceCollectionCounts(preparedData),
      });
    }
    setHasLoadedData(true);
  }, [isDevMode]);

  useEffect(() => {
    if (!hasLoadedData) return;

    // Avoid bumping updatedAt when the app is only hydrating an already-persisted snapshot
    // from local storage or from Supabase. Real edits create a new diaryData object and
    // should continue through the normal updatedAt flow.
    if (diaryData === latestPersistedDataRef.current) {
      return;
    }

    const saveTimestamp = getCurrentDateTimeValue();
    const dataToPersist = markDataUpdated(diaryData, {
      updatedAt: saveTimestamp,
      deviceId: syncDeviceIdRef.current || diaryData.syncMeta?.deviceId || createDeviceId(),
    });
    latestPersistedDataRef.current = dataToPersist;
    saveAppData(dataToPersist, activeStorageKeyRef.current);
    setDebugLastSaveAt(saveTimestamp);
    if (isDevMode) {
      console.info('[Mi Diario][debug] save:applied', {
        at: saveTimestamp,
        reason: persistReasonRef.current,
        collectionCounts: getPersistenceCollectionCounts(dataToPersist),
      });
    }
  }, [diaryData, hasLoadedData, isDevMode]);

  useEffect(() => {
    if (!hasLoadedData || !hasResolvedSyncSession || !remoteSyncEnabled) return;

    const nextStorageKey = getUserStorageKey(syncUser?.id);
    if (activeStorageKeyRef.current === nextStorageKey) return;

    const fallbackState = syncUser?.id ? createCleanDefaultState() : defaultState;
    activeStorageKeyRef.current = nextStorageKey;
    const loadedData = loadAppData(nextStorageKey, { fallbackState });
    const preparedData = ensureSyncMeta(
      loadedData,
      loadedData?.syncMeta?.deviceId || syncDeviceIdRef.current || createDeviceId()
    );
    syncDeviceIdRef.current = preparedData.syncMeta.deviceId;
    latestPersistedDataRef.current = preparedData;
    setDiaryData(preparedData);
    applyFormStateFromSnapshot(preparedData);
    setSyncLastSyncedAt(preparedData.syncMeta?.lastSyncedAt || '');
    const loadTimestamp = getCurrentDateTimeValue();
    setDebugLastLoadAt(loadTimestamp);
    if (isDevMode) {
      console.info('[Mi Diario][debug] user-cache:switched', {
        at: loadTimestamp,
        userId: syncUser?.id || 'local',
        collectionCounts: getPersistenceCollectionCounts(preparedData),
      });
    }
  }, [hasLoadedData, hasResolvedSyncSession, isDevMode, remoteSyncEnabled, syncUser?.id]);

  useEffect(() => {
    if (!hasLoadedData || !hasResolvedSyncSession) return;

    if (!remoteSyncEnabled) {
      setHasResolvedRemoteSnapshot(true);
      setSyncStatus('local');
      return;
    }

    if (!syncUser) {
      setHasResolvedRemoteSnapshot(true);
      setSyncStatus(isOnline ? 'auth' : 'offline');
      return;
    }

    if (!isOnline) {
      setHasResolvedRemoteSnapshot(true);
      setSyncStatus('offline');
      return;
    }

    let cancelled = false;

    setSyncStatus('syncing');
    setHasResolvedRemoteSnapshot(false);

    pullRemoteSnapshotAndHydrate({ reason: 'initial-session', force: true })
      .then((result) => {
        if (cancelled) return;
        if (result.status === 'hydrated-remote' || result.status === 'equal') {
          setSyncStatus('synced');
        } else if (result.status === 'no-remote') {
          setSyncStatus(result.localSnapshot?.syncMeta?.updatedAt ? 'pending' : 'synced');
        } else {
          setSyncStatus('pending');
        }
        setHasResolvedRemoteSnapshot(true);
      })
      .catch((error) => {
        if (cancelled) return;
        setHasResolvedRemoteSnapshot(true);
        setSyncStatus(isOnline ? 'error' : 'offline');
        setSyncFeedback({
          type: 'error',
          text: error instanceof Error ? error.message : 'No se pudo cargar el snapshot remoto.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [hasLoadedData, hasResolvedSyncSession, isOnline, remoteSyncEnabled, syncUser]);

  useEffect(() => {
    if (!hasLoadedData || !hasResolvedRemoteSnapshot || !remoteSyncEnabled || !syncUser) return;

    if (!isOnline) {
      setSyncStatus('offline');
      return;
    }

    if (skipNextRemoteSyncRef.current) {
      skipNextRemoteSyncRef.current = false;
      return;
    }

    window.clearTimeout(syncDebounceTimeoutRef.current);
    setSyncStatus('pending');

    syncDebounceTimeoutRef.current = window.setTimeout(async () => {
      try {
        setSyncStatus('syncing');
        const currentSnapshot = latestPersistedDataRef.current;
        logSyncDebug('autosync:queued-push', {
          summary: getSnapshotSummary(currentSnapshot),
        });
        const syncResult = await pushRemoteSnapshot({
          userId: syncUser.id,
          data: currentSnapshot,
        });
        const syncedSnapshot = markDataSynced(currentSnapshot, {
          deviceId: syncDeviceIdRef.current || currentSnapshot.syncMeta?.deviceId || createDeviceId(),
          lastSyncedAt: syncResult.lastSyncedAt || getCurrentDateTimeValue(),
        });
        applyHydratedSnapshot(syncedSnapshot);
        const reconcileResult = await pullRemoteSnapshotAndHydrate({ reason: 'post-push-confirmation', force: true });
        if (reconcileResult.status === 'hydrated-remote' || reconcileResult.status === 'equal' || reconcileResult.status === 'keep-local' || reconcileResult.status === 'no-remote') {
          setSyncStatus('synced');
          if (reconcileResult.status === 'hydrated-remote') {
            setSyncFeedback({ type: 'success', text: 'Snapshot remoto confirmado y aplicado.' });
          } else {
            setSyncFeedback({ type: 'success', text: 'Cambios locales enviados y confirmados.' });
          }
        } else {
          setSyncStatus('pending');
        }
      } catch (error) {
        setSyncStatus(isOnline ? 'error' : 'offline');
        setSyncFeedback({
          type: 'error',
          text: error instanceof Error ? error.message : 'No se pudo sincronizar con Supabase.',
        });
      }
    }, 900);

    return () => {
      window.clearTimeout(syncDebounceTimeoutRef.current);
    };
  }, [diaryData, hasLoadedData, hasResolvedRemoteSnapshot, isOnline, remoteSyncEnabled, syncUser]);

  const todaysFoods = useMemo(
    () => sortFoods(diaryData.foods).filter((item) => item.date && isSameDate(item.date, currentDate)),
    [currentDate, diaryData.foods]
  );

  const todaysSupplements = useMemo(
    () => sortSupplements(diaryData.supplements).filter((item) => isSameDate(item.date, currentDate)),
    [currentDate, diaryData.supplements]
  );

  const todaysHydrationEntries = useMemo(
    () => sortHydrationEntries(diaryData.hydrationEntries || []).filter((item) => item.date && isSameDate(item.date, currentDate)),
    [currentDate, diaryData.hydrationEntries]
  );

  const sortedFastingLogs = useMemo(() => {
    return [...(diaryData.fastingLogs || [])].sort((a, b) => {
      const refA = a.actualStartDateTime || a.actualBreakDateTime || `${a.date}T00:00`;
      const refB = b.actualStartDateTime || b.actualBreakDateTime || `${b.date}T00:00`;
      return refB.localeCompare(refA);
    });
  }, [diaryData.fastingLogs]);

  const todaysFastingLogs = useMemo(
    () =>
      sortedFastingLogs.filter((item) => {
        const recordDate = getFastingRecordDate(item);
        const breakDate = normalizeDateString(item.actualBreakDateTime);
        const activeDates = getFastingDatesInsideRange(item, currentDate, currentDate, fastingNow);
        return activeDates.length > 0 || isSameDate(recordDate, currentDate) || (!!breakDate && isSameDate(breakDate, currentDate));
      }),
    [currentDate, fastingNow, sortedFastingLogs]
  );

  const primaryFastingLogForToday = useMemo(
    () => getPrimaryFastingLogForDate(sortedFastingLogs, currentDate, fastingNow),
    [currentDate, fastingNow, sortedFastingLogs]
  );

  const todaysExercises = useMemo(
    () => sortExercises(diaryData.exercises).filter((item) => isSameDate(item.date, currentDate)),
    [currentDate, diaryData.exercises]
  );

  const todaysMetrics = useMemo(
    () => sortByDateDesc(diaryData.bodyMetrics).filter((item) => isSameDate(item.date, currentDate)),
    [currentDate, diaryData.bodyMetrics]
  );

  const sortedMetrics = useMemo(() => sortByDateDesc(diaryData.bodyMetrics), [diaryData.bodyMetrics]);
  const latestMetric = useMemo(() => getLatestEntry(diaryData.bodyMetrics), [diaryData.bodyMetrics]);
  const metricFieldSnapshots = useMemo(
    () => ({
      weight: getLatestMetricFieldSnapshot(sortedMetrics, 'weight'),
      bodyFat: getLatestMetricFieldSnapshot(sortedMetrics, 'bodyFat'),
      skeletalMuscleMass: getLatestMetricFieldSnapshot(sortedMetrics, 'skeletalMuscleMass'),
      bodyFatMass: getLatestMetricFieldSnapshot(sortedMetrics, 'bodyFatMass'),
      waist: getLatestMetricFieldSnapshot(sortedMetrics, 'waist'),
      chest: getLatestMetricFieldSnapshot(sortedMetrics, 'chest'),
      arm: getLatestMetricFieldSnapshot(sortedMetrics, 'arm'),
      leg: getLatestMetricFieldSnapshot(sortedMetrics, 'leg'),
      calf: getLatestMetricFieldSnapshot(sortedMetrics, 'calf'),
      forearm: getLatestMetricFieldSnapshot(sortedMetrics, 'forearm'),
      upperBackTorso: getLatestMetricFieldSnapshot(sortedMetrics, 'upperBackTorso'),
      hips: getLatestMetricFieldSnapshot(sortedMetrics, 'hips'),
      neck: getLatestMetricFieldSnapshot(sortedMetrics, 'neck'),
    }),
    [sortedMetrics]
  );
  const metricComparisonPairs = useMemo(
    () => ({
      weight: getMetricComparisonPair(sortedMetrics, 'weight'),
      bodyFat: getMetricComparisonPair(sortedMetrics, 'bodyFat'),
      skeletalMuscleMass: getMetricComparisonPair(sortedMetrics, 'skeletalMuscleMass'),
      bodyFatMass: getMetricComparisonPair(sortedMetrics, 'bodyFatMass'),
    }),
    [sortedMetrics]
  );
  const metricBaseEntry = useMemo(
    () => sortedMetrics.find((item) => item.id === 'metric-base-2026-04-10') || sortedMetrics.find((item) => item.date === '2026-04-10') || null,
    [sortedMetrics]
  );
  const metricBaseComparisonCards = useMemo(() => {
    function buildBaseComparison({ label, field, unit = '', formatter = 'unit', prefer = 'down' }) {
      const baseValue = getNumericMetric(metricBaseEntry?.[field]);
      const latestSnapshot = metricFieldSnapshots[field];
      const latestValue = getNumericMetric(latestSnapshot?.rawValue);
      const currentDateLabel = latestSnapshot?.date ? formatDate(latestSnapshot.date) : '';

      const formatValue = (value) => {
        if (formatter === 'weight') return formatWeightValue(value, unit || 'kg', 'sin dato');
        if (formatter === 'percent') return formatPercentValue(value, 'sin dato');
        return formatUnitValue(value, unit, { maximumFractionDigits: 1, fallback: 'sin dato' });
      };

      if (baseValue === null) {
        return {
          label,
          currentValue: 'Sin base',
          changeLabel: 'Sin referencia',
          detail: 'No existe referencia base para comparar.',
          trendClass: 'metric-base-trend metric-base-trend-muted',
          snapshotLabel: 'Sin base',
        };
      }

      if (latestValue === null || !latestSnapshot?.date) {
        return {
          label,
          currentValue: 'Sin dato actual',
          changeLabel: `Base ${formatValue(baseValue)}`,
          detail: 'Todavía no hay una medición reciente para esta referencia.',
          trendClass: 'metric-base-trend metric-base-trend-muted',
          snapshotLabel: 'Sin medición reciente',
        };
      }

      const delta = latestValue - baseValue;
        if (delta === 0 || latestSnapshot.date === metricBaseEntry?.date) {
          return {
            label,
            currentValue: formatValue(latestValue),
            changeLabel: 'Sin cambio aún',
            detail: `Base ${formatValue(baseValue)}${currentDateLabel ? ` · ${currentDateLabel}` : ''}`,
            trendClass: 'metric-base-trend metric-change-neutral',
            snapshotLabel: currentDateLabel || 'Registro actual',
          };
        }

      const arrow = delta > 0 ? '↑' : '↓';
      const absoluteDelta = Math.abs(delta);
      const deltaText =
        formatter === 'weight'
          ? formatWeightValue(absoluteDelta, unit || 'kg', '--')
          : formatter === 'percent'
            ? formatPercentValue(absoluteDelta, '--')
            : formatUnitValue(absoluteDelta, unit, { maximumFractionDigits: 1, fallback: '--' });
      const directionLabel = delta > 0 ? 'Subió' : 'Bajó';

        return {
          label,
          currentValue: formatValue(latestValue),
          changeLabel: `${arrow} ${deltaText}`,
          detail: `${directionLabel} vs base ${formatValue(baseValue)}${currentDateLabel ? ` · ${currentDateLabel}` : ''}`,
          trendClass: delta > 0 ? 'metric-base-trend metric-change-up' : 'metric-base-trend metric-change-down',
          snapshotLabel: currentDateLabel || 'Última medición',
        };
      }

    return [
      buildBaseComparison({ label: 'Peso', field: 'weight', unit: 'kg', formatter: 'weight', prefer: 'down' }),
      buildBaseComparison({ label: 'Grasa corporal', field: 'bodyFat', unit: '%', formatter: 'percent', prefer: 'down' }),
      buildBaseComparison({ label: 'Músculo esquelético', field: 'skeletalMuscleMass', unit: 'kg', formatter: 'weight', prefer: 'up' }),
      buildBaseComparison({ label: 'Masa grasa', field: 'bodyFatMass', unit: 'kg', formatter: 'weight', prefer: 'down' }),
      buildBaseComparison({ label: 'Cintura', field: 'waist', unit: 'cm', formatter: 'unit', prefer: 'down' }),
      buildBaseComparison({ label: 'Pecho', field: 'chest', unit: 'cm', formatter: 'unit', prefer: 'up' }),
      buildBaseComparison({ label: 'Brazo', field: 'arm', unit: 'cm', formatter: 'unit', prefer: 'up' }),
      buildBaseComparison({ label: 'Pierna', field: 'leg', unit: 'cm', formatter: 'unit', prefer: 'up' }),
      buildBaseComparison({ label: 'Pantorrilla', field: 'calf', unit: 'cm', formatter: 'unit', prefer: 'up' }),
      buildBaseComparison({ label: 'Antebrazo', field: 'forearm', unit: 'cm', formatter: 'unit', prefer: 'up' }),
      buildBaseComparison({ label: 'Dorsal', field: 'upperBackTorso', unit: 'cm', formatter: 'unit', prefer: 'up' }),
      buildBaseComparison({ label: 'Cadera', field: 'hips', unit: 'cm', formatter: 'unit', prefer: 'down' }),
      buildBaseComparison({ label: 'Cuello', field: 'neck', unit: 'cm', formatter: 'unit', prefer: 'neutral' }),
    ];
  }, [metricBaseEntry, metricFieldSnapshots]);
  const fastingFreeDays = useMemo(
    () => [...new Set((diaryData.fastingFreeDays || []).map(normalizeDateString).filter(Boolean))],
    [diaryData.fastingFreeDays]
  );
  const isTodayFastingFree = useMemo(
    () => isFastingFreeDay(fastingFreeDays, currentDate),
    [currentDate, fastingFreeDays]
  );
  const activeFastingLog = primaryFastingLogForToday || null;
  const shouldTreatTodayAsFastingFree = isTodayFastingFree && !activeFastingLog;
  const activeFastingProtocol = null;
  const activeFastingProtocolLabel =
    activeFastingLog ? activeFastingLog.expectedProtocol || 'Ayuno manual real' : 'Sin registro de ayuno';
  const activeFastingGoalHours = activeFastingLog ? getEffectiveFastingTargetHours(activeFastingLog, null) || null : null;
  const activeFastingElapsedHours = useMemo(
    () => getFastingElapsedHours(activeFastingLog, fastingNow),
    [activeFastingLog, fastingNow]
  );
  const activeFastingReachedGoal = useMemo(() => {
    if (!activeFastingGoalHours || activeFastingGoalHours <= 0) return false;
    return activeFastingElapsedHours >= activeFastingGoalHours;
  }, [activeFastingElapsedHours, activeFastingGoalHours]);
  const activeFastingStatus = useMemo(
    () => (activeFastingLog ? getFastingStatusLabel(activeFastingLog, null, fastingNow) : 'sin registro'),
    [activeFastingLog, fastingNow]
  );
  const activeFastingDisplay = activeFastingLog
    ? getFastingDisplayText(null, activeFastingLog)
    : 'Sin registro real de ayuno';
  const activeFastingRemainingHours = useMemo(() => {
    if (!activeFastingGoalHours || activeFastingGoalHours <= 0 || activeFastingReachedGoal) return null;
    return Math.max(activeFastingGoalHours - activeFastingElapsedHours, 0);
  }, [activeFastingElapsedHours, activeFastingGoalHours, activeFastingReachedGoal]);
  const activeFastingEstimatedBreakDateTime = useMemo(
    () => getEstimatedFastingBreakDateTime(activeFastingLog?.actualStartDateTime, activeFastingGoalHours),
    [activeFastingGoalHours, activeFastingLog?.actualStartDateTime]
  );
  const activeFastingProgressPercent = useMemo(() => {
    if (!activeFastingGoalHours || activeFastingGoalHours <= 0) return 0;
    return Math.min((activeFastingElapsedHours / activeFastingGoalHours) * 100, 100);
  }, [activeFastingElapsedHours, activeFastingGoalHours]);
  const activeFastingDifferenceHours = useMemo(() => {
    if (!activeFastingGoalHours) return null;
    return activeFastingElapsedHours - activeFastingGoalHours;
  }, [activeFastingElapsedHours, activeFastingGoalHours]);
  const activeFastingDifferenceText = useMemo(() => {
    if (activeFastingDifferenceHours === null) return 'Sin meta esperada';
    if (activeFastingDifferenceHours >= 0) return `Meta alcanzada · superaste ${formatHoursLabel(activeFastingDifferenceHours)}`;
    return `Faltaron ${formatHoursLabel(Math.abs(activeFastingDifferenceHours))}`;
  }, [activeFastingDifferenceHours]);
  const activeFastingAutophagy = activeFastingStatus === 'en curso' && activeFastingElapsedHours >= 16;
  const activeFastingProgressLabel = shouldTreatTodayAsFastingFree
    ? 'Excluido'
    : activeFastingStatus === 'sin registro'
      ? 'Sin registro'
    : !activeFastingGoalHours
      ? 'Sin meta'
      : activeFastingStatus === 'en curso' && activeFastingReachedGoal
        ? 'Meta alcanzada · en curso'
        : formatPercentValue(activeFastingProgressPercent, '0%');
  const displayedFastingStatus = shouldTreatTodayAsFastingFree ? 'día libre' : activeFastingStatus;
  const displayedFastingStatusLabel = formatFastingStatusCopy(activeFastingStatus, {
    isFreeDay: shouldTreatTodayAsFastingFree,
    reachedGoal: activeFastingReachedGoal,
  });
  const displayedFastingProtocolLabel = shouldTreatTodayAsFastingFree ? 'Hoy no hay ayuno' : activeFastingProtocolLabel;
  const displayedFastingDisplay = shouldTreatTodayAsFastingFree ? 'Día libre de ayuno' : activeFastingDisplay;
  const displayedFastingProgressPercent = shouldTreatTodayAsFastingFree ? 0 : activeFastingProgressPercent;
  const displayedFastingRemainingHours = shouldTreatTodayAsFastingFree ? null : activeFastingRemainingHours;
  const displayedFastingElapsedLabel = shouldTreatTodayAsFastingFree
    ? 'Día libre de ayuno'
    : activeFastingStatus === 'sin registro'
      ? 'Sin registro'
      : formatHoursLabel(activeFastingElapsedHours);
  const displayedFastingSummaryText = shouldTreatTodayAsFastingFree
    ? todaysFastingLogs.length > 0
      ? 'Día libre marcado. El registro del día se conserva sin contar como falla.'
      : 'Día libre marcado. No cuenta como falla ni como pendiente.'
    : activeFastingStatus === 'pendiente'
      ? 'Sin registro de ayuno'
      : activeFastingStatus === 'sin registro'
        ? 'Sin registro real para hoy'
      : activeFastingStatus === 'en curso'
        ? activeFastingReachedGoal
          ? `Meta alcanzada. El ayuno sigue en curso con ${formatHoursLabel(activeFastingElapsedHours)} acumuladas.`
          : `Tiempo transcurrido ${formatHoursLabel(activeFastingElapsedHours)}`
        : activeFastingStatus === 'cumplido' && !activeFastingLog?.actualBreakDateTime
          ? `Meta alcanzada con ${formatHoursLabel(activeFastingElapsedHours)}`
          : `Duracion final ${formatHoursLabel(activeFastingElapsedHours)}`;
  const displayedFastingBreakLabel = activeFastingLog?.actualBreakDateTime && activeFastingStatus !== 'en curso'
    ? `Ruptura real ${formatDateTimeHuman(activeFastingLog.actualBreakDateTime)}`
    : activeFastingLog?.actualBreakDateTime && activeFastingStatus === 'en curso'
      ? `Ruptura estimada ${formatDateTimeHuman(activeFastingLog.actualBreakDateTime)}`
    : activeFastingStatus === 'en curso' && activeFastingEstimatedBreakDateTime
      ? `Ruptura estimada ${formatDateTimeHuman(activeFastingEstimatedBreakDateTime)}`
      : activeFastingStatus === 'en curso' && activeFastingGoalHours
        ? `Meta estimada ${formatHoursLabel(activeFastingGoalHours)}`
      : activeFastingStatus === 'cumplido'
        ? 'Meta alcanzada'
      : shouldTreatTodayAsFastingFree
        ? 'Día libre guardado'
        : activeFastingLog
          ? 'Registro editable manualmente'
          : 'Sin ruptura registrada';
  const fastingFormStatus = getFastingStatusLabel(fastingLogForm, null, fastingNow);
  const fastingFormGoalHours = getEffectiveFastingTargetHours(fastingLogForm, null) || null;
  const fastingFormElapsedHours = useMemo(() => {
    if (!fastingLogForm.actualStartDateTime) return 0;
    if (fastingLogForm.actualBreakDateTime) {
      return Number(
        fastingLogForm.actualDuration ||
          calculateFastingDurationHours(fastingLogForm.actualStartDateTime, fastingLogForm.actualBreakDateTime) ||
          0
      );
    }

    return calculateLiveElapsedHours(fastingLogForm.actualStartDateTime, fastingNow);
  }, [fastingLogForm.actualBreakDateTime, fastingLogForm.actualDuration, fastingLogForm.actualStartDateTime, fastingNow]);
  const fastingFormRemainingHours = useMemo(() => {
    if (!fastingFormGoalHours) return null;
    return Math.max(fastingFormGoalHours - fastingFormElapsedHours, 0);
  }, [fastingFormElapsedHours, fastingFormGoalHours]);
  const fastingFormProgressPercent = useMemo(() => {
    if (!fastingFormGoalHours || fastingFormGoalHours <= 0) return 0;
    return Math.min((fastingFormElapsedHours / fastingFormGoalHours) * 100, 100);
  }, [fastingFormElapsedHours, fastingFormGoalHours]);
  const fastingFormDifferenceHours = useMemo(() => {
    if (!fastingFormGoalHours) return null;
    return fastingFormElapsedHours - fastingFormGoalHours;
  }, [fastingFormElapsedHours, fastingFormGoalHours]);
  const fastingFormDifferenceText = useMemo(() => {
    if (fastingFormDifferenceHours === null) return 'Sin meta esperada';
    if (fastingFormDifferenceHours >= 0) return `Superaste la meta por ${formatHoursLabel(fastingFormDifferenceHours)}`;
    return `Faltaron ${formatHoursLabel(Math.abs(fastingFormDifferenceHours))}`;
  }, [fastingFormDifferenceHours]);
  const activeObjective = useMemo(() => {
    const objectives = diaryData.objectives || [];
    return objectives.find((item) => item.status === 'activa') || objectives[0] || null;
  }, [diaryData.objectives]);
  const activeObjectiveProgress = useMemo(() => {
    if (!activeObjective) return null;
    return calculateObjectiveProgress(activeObjective.startWeight, activeObjective.currentWeight, activeObjective.targetWeight);
  }, [activeObjective]);
  const objectiveFormProgress = useMemo(
    () => calculateObjectiveProgress(objectiveForm.startWeight, objectiveForm.currentWeight, objectiveForm.targetWeight),
    [objectiveForm.currentWeight, objectiveForm.startWeight, objectiveForm.targetWeight]
  );
  const isObjectiveCutGoal = objectiveForm.goalType === 'corte';
  const backupMeta = diaryData.backupMeta || defaultState.backupMeta;
  const syncMeta = diaryData.syncMeta || defaultState.syncMeta;
  const userSettings = useMemo(
    () => {
      const fallbackProfile = diaryData.profileId === 'clean' ? 'fitness-basic' : 'daniel-full';
      return createUserSettings(
        diaryData.userSettings?.profileType || fallbackProfile,
        diaryData.userSettings?.enabledTabs
      );
    },
    [diaryData.profileId, diaryData.userSettings]
  );
  const enabledTabIds = userSettings.enabledTabs;
  const enabledTabsKey = enabledTabIds.join('|');
  const visibleTabs = useMemo(
    () => tabs.filter((tab) => enabledTabIds.includes(tab.id)),
    [enabledTabsKey]
  );
  const safeActiveTab = enabledTabIds.includes(activeTab) ? activeTab : 'dashboard';
  useEffect(() => {
    if (enabledTabIds.includes(activeTab)) return;
    setActiveTab('dashboard');
  }, [activeTab, enabledTabsKey, enabledTabIds]);
  const privateVault = diaryData.privateVault || defaultState.privateVault;
  const privatePinLength = getPrivatePinLength(privateVault);
  const syncStatusLabel = syncStatusLabels[syncStatus] || syncStatusLabels.local;
  const syncUserLabel = syncUser?.email || 'Sin cuenta conectada';
  const privateCycles = useMemo(
    () => sortPrivateRecordsByDate(diaryData.privateCycles || [], 'startDate'),
    [diaryData.privateCycles]
  );
  const privateProducts = useMemo(
    () => sortPrivateRecordsByDate(diaryData.privateProducts || [], 'purchaseDate'),
    [diaryData.privateProducts]
  );
  const privatePayments = useMemo(
    () => sortPrivateRecordsByDate(diaryData.privatePayments || [], 'date'),
    [diaryData.privatePayments]
  );
  const privateEntries = useMemo(
    () =>
      sortByDateDesc(diaryData.privateHormonalEntries || []).sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        const timeA = a.time || '99:99';
        const timeB = b.time || '99:99';
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return String(b.id).localeCompare(String(a.id));
    }),
  [diaryData.privateHormonalEntries]
  );
  const privateDailyChecks = useMemo(
    () =>
      sortByDateDesc(diaryData.privateDailyChecks || []).sort((a, b) => String(b.id || '').localeCompare(String(a.id || ''))),
    [diaryData.privateDailyChecks]
  );
  const privateCycleMedications = useMemo(
    () =>
      [...(diaryData.privateCycleMedications || [])].sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''), 'es-MX')
      ),
    [diaryData.privateCycleMedications]
  );
  const kravCurriculum = useMemo(
    () =>
      [...(diaryData.kravCurriculum || [])].sort((a, b) => {
        if (a.category !== b.category) {
          return String(kravCategoryLabels[a.category] || a.category).localeCompare(
            String(kravCategoryLabels[b.category] || b.category),
            'es-MX'
          );
        }
        if (a.stage !== b.stage) return String(a.stage || '').localeCompare(String(b.stage || ''), 'es-MX');
        return String(a.name || '').localeCompare(String(b.name || ''), 'es-MX');
      }),
    [diaryData.kravCurriculum]
  );
  const kravPracticeLogs = useMemo(
    () =>
      sortByDateDesc(diaryData.kravPracticeLogs || []).sort((a, b) => String(b.id || '').localeCompare(String(a.id || ''))),
    [diaryData.kravPracticeLogs]
  );
  const kravSettings = useMemo(
    () => ({
      ...defaultState.kravSettings,
      ...(diaryData.kravSettings || {}),
    }),
    [diaryData.kravSettings]
  );
  const kravCoachLabelByValue = useMemo(
    () => Object.fromEntries(kravCoachOptions.map((item) => [item.value, item.label])),
    []
  );
  function formatKravPercent(value) {
    return `${Math.round(Number(value) || 0)}%`;
  }
  function formatKravBeltLabel(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return 'Sin cinta';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
  function getKravExamStatusText(status) {
    if (status === 'listo') return 'Listo';
    if (status === 'riesgo-medio') return 'Riesgo medio';
    return 'Riesgo alto';
  }
  function formatKravTechniqueCount(value) {
    const count = Number(value) || 0;
    return `${count} ${count === 1 ? 'técnica' : 'técnicas'}`;
  }
  function formatKravDaysWithoutPractice(value) {
    if (value === null || value === undefined) return 'Sin práctica registrada';
    if (value === 0) return 'Practicada hoy';
    if (value === 1) return '1 día sin práctica';
    return `${value} días sin práctica`;
  }
  const kravProgress = useMemo(() => buildKravProgress(kravCurriculum), [kravCurriculum]);
  const nextKravTechnique = useMemo(
    () => getNextKravTechnique(kravCurriculum, currentDate),
    [kravCurriculum, currentDate]
  );
  const kravExamStatus = useMemo(
    () => buildKravExamStatus(kravCurriculum, kravSettings, currentDate),
    [kravCurriculum, kravSettings, currentDate]
  );
  const kravAlerts = useMemo(
    () => buildKravAlerts(kravCurriculum, kravSettings, currentDate),
    [kravCurriculum, kravSettings, currentDate]
  );
  const kravDashboardSnapshot = useMemo(() => {
    const currentBelt = formatKravBeltLabel(kravSettings.currentBelt || 'amarilla');
    const targetBelt = formatKravBeltLabel(kravSettings.targetBelt || 'naranja');
    const normalizedExamDate = normalizeDateString(kravSettings.examDate);
    const examDateLabel = normalizedExamDate ? formatPrivateDate(normalizedExamDate) : 'Fecha de examen pendiente';
    let examCountdownLabel = '';
    if (normalizedExamDate) {
      const examDate = new Date(`${normalizedExamDate}T12:00:00`);
      const referenceDate = new Date(`${currentDate}T12:00:00`);
      const diffDays = Math.round((examDate.getTime() - referenceDate.getTime()) / 86400000);
      examCountdownLabel =
        diffDays > 1 ? `${diffDays} días restantes` : diffDays === 1 ? '1 día restante' : diffDays === 0 ? 'Examen hoy' : `Vencido hace ${Math.abs(diffDays)} día${Math.abs(diffDays) === 1 ? '' : 's'}`;
    }

    return {
      currentBelt,
      targetBelt,
      examDate: normalizedExamDate,
      examDateLabel,
      examCountdownLabel,
      totalProgress: kravProgress.totalProgress,
      pendingTechniques: kravExamStatus.pendingTechniques,
      nextTechniqueName: nextKravTechnique?.name || 'Sin técnica priorizada',
      examStatusLabel: getKravExamStatusText(kravExamStatus.status),
    };
  }, [currentDate, kravExamStatus.pendingTechniques, kravExamStatus.status, kravProgress.totalProgress, kravSettings.currentBelt, kravSettings.examDate, kravSettings.targetBelt, nextKravTechnique]);
  const kravCurriculumByCategory = useMemo(
    () =>
      Object.entries(kravCategoryLabels)
        .map(([category, label]) => ({
          category,
          label,
          items: kravCurriculum.filter((item) => item.category === category),
        }))
        .filter((group) => group.items.length > 0),
    [kravCurriculum]
  );
  const kravPriorityReason = useMemo(() => {
    if (!nextKravTechnique) return '';

    const minLevel = kravCurriculum.reduce((currentMin, item) => Math.min(currentMin, Number(item.level) || 0), 4);
    const sameLevelItems = kravCurriculum.filter((item) => (Number(item.level) || 0) === minLevel);
    const nextDays = nextKravTechnique.daysSincePractice;
    const maxDaysInLowestLevel = sameLevelItems.reduce((currentMax, item) => {
      const days = getDaysSincePractice(item.lastPracticedAt, currentDate);
      return Math.max(currentMax, days === null ? 999 : days);
    }, 0);

    if ((Number(nextKravTechnique.level) || 0) === minLevel && (nextDays === null || nextDays >= maxDaysInLowestLevel)) {
      return 'Priorizada por nivel bajo y días sin práctica';
    }

    if ((Number(nextKravTechnique.level) || 0) === minLevel) {
      return 'Priorizada por nivel bajo';
    }

    return 'Priorizada por días sin práctica';
  }, [nextKravTechnique, kravCurriculum, currentDate]);
  const selectedKravTechnique = useMemo(
    () => kravCurriculum.find((item) => item.id === selectedKravTechniqueId) || null,
    [kravCurriculum, selectedKravTechniqueId]
  );
  const kravPracticeLogCards = useMemo(
    () =>
      sortByDateDesc(kravPracticeLogs).map((item) => ({
        ...item,
        coachLabel: item.coach === 'otro' ? item.coachCustomName || 'Otro coach' : kravCoachLabelByValue[item.coach] || item.coach,
        techniqueNames: item.techniqueIds
          .map((techniqueId) => kravCurriculum.find((technique) => technique.id === techniqueId)?.name)
          .filter(Boolean),
      })),
    [kravPracticeLogs, kravCoachLabelByValue, kravCurriculum]
  );
  const latestKravPracticeLog = kravPracticeLogCards[0] || null;
  const kravPracticeLogsThisWeek = useMemo(
    () => kravPracticeLogCards.filter((item) => item.date && isDateInRange(item.date, currentWeekStart, currentWeekEnd)),
    [kravPracticeLogCards, currentWeekEnd, currentWeekStart]
  );
  const kravWeeklyTechniqueNames = useMemo(
    () => [...new Set(kravPracticeLogsThisWeek.flatMap((item) => item.techniqueNames || []))],
    [kravPracticeLogsThisWeek]
  );
  const kravPendingReviewNotes = useMemo(
    () =>
      kravPracticeLogsThisWeek
        .map((item) => String(item.reviewNeeded || '').trim())
        .filter(Boolean),
    [kravPracticeLogsThisWeek]
  );
  const kravLogSummaryCards = useMemo(
    () => [
      {
        label: 'Última práctica',
        value: latestKravPracticeLog ? formatDate(latestKravPracticeLog.date) : 'Sin práctica registrada',
        detail: latestKravPracticeLog ? latestKravPracticeLog.techniqueNames.slice(0, 2).join(' · ') || 'Sin técnica listada' : 'Registra tu primera sesión técnica.',
      },
      {
        label: 'Coach más reciente',
        value: latestKravPracticeLog?.coachLabel || 'Sin coach registrado',
        detail: latestKravPracticeLog ? (latestKravPracticeLog.sparring === 'si' ? 'Última sesión con sparring' : 'Última sesión sin sparring') : 'Aún no hay sesiones cargadas.',
      },
      {
        label: 'Técnicas esta semana',
        value: kravWeeklyTechniqueNames.length > 0 ? `${kravWeeklyTechniqueNames.length}` : 'Sin técnicas registradas',
        detail: kravWeeklyTechniqueNames.length > 0 ? kravWeeklyTechniqueNames.slice(0, 3).join(' · ') : 'Esta semana todavía no sumas práctica técnica.',
      },
      {
        label: 'Sparring esta semana',
        value: `${kravPracticeLogsThisWeek.filter((item) => item.sparring === 'si').length}`,
        detail: kravPracticeLogsThisWeek.length > 0 ? `${kravPracticeLogsThisWeek.length} sesión(es) técnicas en la semana` : 'Sin sesiones registradas en la semana.',
      },
      {
        label: 'Puntos a repasar',
        value: kravPendingReviewNotes.length > 0 ? `${kravPendingReviewNotes.length}` : 'Sin repaso abierto',
        detail: kravPendingReviewNotes[0] || 'Aún no hay táreas de repaso pendientes.',
      },
    ],
    [kravPendingReviewNotes, kravPracticeLogsThisWeek, kravWeeklyTechniqueNames, latestKravPracticeLog]
  );
  const activePrivateCycle = useMemo(() => getPrivateActiveCycle(privateCycles), [privateCycles]);
  const hasActivePrivateCycle = Boolean(activePrivateCycle);
  const privateSummary = useMemo(
    () =>
      buildPrivateSummary({
        privateCycles,
        privateProducts,
        privatePayments,
        privateEntries,
        now: new Date(),
    }),
    [privateCycles, privateProducts, privatePayments, privateEntries]
  );
  const privateCycleFinancialMap = useMemo(
    () =>
      new Map(
        privateCycles.map((item) => [item.id, getPrivateCycleFinancialSummary(item.id, privateProducts, privatePayments)])
      ),
    [privateCycles, privateProducts, privatePayments]
  );
  const activeCycleFinancialSummary = useMemo(
    () => getPrivateCycleFinancialSummary(activePrivateCycle?.id || '', privateProducts, privatePayments),
    [activePrivateCycle, privateProducts, privatePayments]
  );
  const activeCycleProducts = useMemo(
    () => (activePrivateCycle ? privateProducts.filter((item) => item.cycleId === activePrivateCycle.id) : []),
    [activePrivateCycle, privateProducts]
  );
  const activeCyclePayments = useMemo(
    () => activeCycleFinancialSummary.orderedPayments || [],
    [activeCycleFinancialSummary]
  );
  const activeCycleEntries = useMemo(
    () => (activePrivateCycle ? privateEntries.filter((item) => item.cycleId === activePrivateCycle.id) : []),
    [activePrivateCycle, privateEntries]
  );
  const activeCycleDailyChecks = useMemo(
    () => (activePrivateCycle ? privateDailyChecks.filter((item) => item.cycleId === activePrivateCycle.id) : []),
    [activePrivateCycle, privateDailyChecks]
  );
  function formatPrivateMedicationInventoryLabel(count, unit = 'unidad') {
    const safeCount = Number.isFinite(Number(count)) ? Number(count) : 0;
    const normalizedUnit = String(unit || 'unidad').trim().toLowerCase();

    if (normalizedUnit === 'tableta' || normalizedUnit === 'tabletas') {
      return `${safeCount} ${safeCount === 1 ? 'tableta' : 'tabletas'}`;
    }

    if (normalizedUnit === 'capsula' || normalizedUnit === 'cápsula' || normalizedUnit === 'capsulas' || normalizedUnit === 'cápsulas') {
      return `${safeCount} ${safeCount === 1 ? 'cápsula' : 'cápsulas'}`;
    }

    if (normalizedUnit === 'unidad' || normalizedUnit === 'unidades') {
      return `${safeCount} ${safeCount === 1 ? 'unidad' : 'unidades'}`;
    }

    return `${safeCount} ${normalizedUnit}`;
  }
  const activeCycleMedications = useMemo(
    () => {
      if (!activePrivateCycle) return [];

      const displayOrder = ['oxandrolona', 'liver', 'tamoxifeno', 'clomifeno'];
      const getMedicationPriority = (item) => {
        const normalizedName = String(item.name || '').trim().toLowerCase();
        const index = displayOrder.indexOf(normalizedName);
        return index === -1 ? displayOrder.length : index;
      };

      return privateCycleMedications
        .filter((item) => item.cycleId === activePrivateCycle.id)
        .sort((a, b) => {
          const priorityA = getMedicationPriority(a);
          const priorityB = getMedicationPriority(b);
          if (priorityA !== priorityB) return priorityA - priorityB;
          return String(a.name || '').localeCompare(String(b.name || ''), 'es-MX');
        });
    },
    [activePrivateCycle, privateCycleMedications]
  );
  const todayPrivateDailyCheck = useMemo(
    () => activeCycleDailyChecks.find((item) => item.date === currentDate) || null,
    [activeCycleDailyChecks, currentDate]
  );
  const privateMedicationCards = useMemo(
    () =>
      activeCycleMedications.map((item) => {
        const status = getPrivateMedicationDailyStatus(item, currentDate);
        return {
          ...item,
          displayName: getPrivateMedicationDisplayName(item),
          panelKey: getPrivateDailyHormonalPanelKey(item),
          dailyStatus: status,
          dailyLabel:
            status.expectedCount > 1
              ? `Hoy: ${status.takenCount}/${status.expectedCount}`
              : status.hasTakenToday
                ? 'Tomado hoy'
                : 'Hoy: pendiente',
          inventoryLabel: formatPrivateMedicationInventoryLabel(status.remainingInventory, item.unit || 'unidad'),
          inventoryTone: status.isOutOfStock ? 'out' : status.isLowInventory ? 'low' : 'normal',
        };
      }),
    [activeCycleMedications, currentDate]
  );
  const dailyHormonalMedicationCards = useMemo(() => {
    const panelOrderMap = new Map(privateDailyHormonalPanelOrder.map((value, index) => [value, index]));

    return privateMedicationCards
      .filter((item) => panelOrderMap.has(item.panelKey))
      .sort((a, b) => {
        const orderA = panelOrderMap.get(a.panelKey) ?? 99;
        const orderB = panelOrderMap.get(b.panelKey) ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        return String(a.displayName || a.name || '').localeCompare(String(b.displayName || b.name || ''), 'es-MX');
      });
  }, [privateMedicationCards]);
  const dailyHormonalMedicationSummary = useMemo(() => {
    const totalControls = dailyHormonalMedicationCards.length;
    const completedControls = dailyHormonalMedicationCards.filter((item) => item.dailyStatus.isComplete).length;
    const lowInventoryControls = dailyHormonalMedicationCards.filter(
      (item) => item.dailyStatus.isLowInventory || item.dailyStatus.isOutOfStock
    ).length;
    const completedDoses = dailyHormonalMedicationCards.reduce((sum, item) => sum + item.dailyStatus.takenCount, 0);
    const expectedDoses = dailyHormonalMedicationCards.reduce((sum, item) => sum + item.dailyStatus.expectedCount, 0);

    return {
      totalControls,
      completedControls,
      lowInventoryControls,
      completedDoses,
      expectedDoses,
    };
  }, [dailyHormonalMedicationCards]);
  const privateTimeline = useMemo(
    () =>
      activePrivateCycle
        ? buildPrivateTimeline({
            privateEntries,
            privateProducts,
            privatePayments,
            cycleId: activePrivateCycle.id,
          })
        : [],
    [privateEntries, privateProducts, privatePayments, activePrivateCycle]
  );
  const privateCycleOptions = useMemo(
    () => privateCycles.map((item) => ({ value: item.id, label: item.name || 'Ciclo sin nombre' })),
    [privateCycles]
  );
  const privateProductOptions = useMemo(
    () =>
      privateProducts
        .filter((item) => !privateEntryForm.cycleId || item.cycleId === privateEntryForm.cycleId)
        .map((item) => ({ value: item.id, label: item.name || 'Componente sin nombre' })),
    [privateProducts, privateEntryForm.cycleId]
  );
  const nextPrivateEventProduct = useMemo(
    () => privateProducts.find((item) => item.id === privateSummary.nextEvent?.productId) || null,
    [privateProducts, privateSummary.nextEvent]
  );
  const latestPrivateTimelineItem = useMemo(() => privateTimeline[0] || null, [privateTimeline]);
  const activeCycleEvents = useMemo(
    () =>
      activeCycleEntries
        .map((item) => {
          const scheduledAt = getPrivateAgendaDateTime(item);
          const scheduledDate = getPrivateAgendaDate(item);

          return {
            ...item,
            scheduledAt,
            scheduledDate,
          };
        })
        .filter((item) => item.scheduledDate)
        .sort((a, b) => {
          const valueA = itemToSortableAgendaValue(a);
          const valueB = itemToSortableAgendaValue(b);
          return valueA.localeCompare(valueB);
        }),
    [activeCycleEntries]
  );
  const privateAgendaTodayEntries = useMemo(
    () => activeCycleEvents.filter((item) => item.scheduledDate === currentDate),
    [activeCycleEvents, currentDate]
  );
  const privateAgendaTodayNextEntry = useMemo(() => {
    const now = new Date();
    return (
      privateAgendaTodayEntries.find((item) => item.scheduledAt && item.scheduledAt.getTime() >= now.getTime()) || null
    );
  }, [privateAgendaTodayEntries]);
  const tomorrowDate = useMemo(() => shiftDateByDays(currentDate, 1), [currentDate]);
  const privateAgendaTomorrowEntries = useMemo(
    () => activeCycleEvents.filter((item) => item.scheduledDate === tomorrowDate),
    [activeCycleEvents, tomorrowDate]
  );
  const privateUpcomingEntries = useMemo(() => {
    const now = new Date();

    return activeCycleEvents.filter((item) => {
      if (item.scheduledAt) return item.scheduledAt.getTime() >= now.getTime();
      return item.scheduledDate >= currentDate;
    });
  }, [activeCycleEvents, currentDate]);
  const nextUpcomingEvent = privateUpcomingEntries[0] || null;
  const privateAgendaNow = useMemo(
    () => new Date(),
    [activeCycleEvents, currentDate, privateAgendaSelectedDate, privateAgendaShowAll]
  );
  const privateNextEventDay = nextUpcomingEvent?.scheduledDate || '';
  const agendaDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = shiftDateByDays(currentDate, index);
        const count = activeCycleEvents.filter((item) => item.scheduledDate === date).length;

        return {
          date,
          count,
          isToday: date === currentDate,
          isNextWithEvent: !!privateNextEventDay && date === privateNextEventDay && date !== currentDate,
        };
      }),
    [activeCycleEvents, currentDate, privateNextEventDay]
  );
  const selectedAgendaDate = privateAgendaSelectedDate || currentDate;
  const selectedAgendaEvents = useMemo(() => {
    if (privateAgendaShowAll) return privateUpcomingEntries;
    return activeCycleEvents.filter((item) => item.scheduledDate === selectedAgendaDate);
  }, [activeCycleEvents, privateAgendaShowAll, privateUpcomingEntries, selectedAgendaDate]);
  const selectedAgendaDateLabel = privateAgendaShowAll
    ? 'Todos los proximos'
    : selectedAgendaDate === currentDate
      ? 'Hoy'
      : formatPrivateDate(selectedAgendaDate);
  const privateAgendaMicroSummary = useMemo(
    () => [
      {
        label: 'Hoy',
        value:
          privateAgendaTodayEntries.length > 0
            ? `${privateAgendaTodayEntries.length} evento(s)`
            : 'Sin actividad',
        accent: privateAgendaTodayEntries.length > 0 ? 'today' : '',
      },
      {
        label: 'Mañana',
        value:
          privateAgendaTomorrowEntries.length > 0
            ? `${privateAgendaTomorrowEntries.length} evento(s)`
            : 'Libre',
        accent: privateAgendaTomorrowEntries.length > 0 ? 'next' : '',
      },
      {
        label: 'Proximos 3',
        value:
          privateUpcomingEntries.length > 0
            ? privateUpcomingEntries
                .slice(0, 3)
                .map((item) => item.name || privateEventTypeLabels[item.eventType] || 'Evento')
                .join(', ')
            : 'Sin eventos',
        accent: privateUpcomingEntries.length > 0 ? 'neutral' : '',
      },
    ],
    [privateAgendaTodayEntries, privateAgendaTomorrowEntries, privateUpcomingEntries]
  );
  const nextUpcomingEventPrimaryState = useMemo(
    () =>
      getPrivateAgendaPrimaryState(nextUpcomingEvent, {
        now: privateAgendaNow,
        currentDate,
        nextEventId: nextUpcomingEvent?.id || '',
      }),
    [nextUpcomingEvent, privateAgendaNow, currentDate]
  );
  const privateProductSubmitDisabled = !activePrivateCycle;
  const privatePaymentSubmitDisabled = !activePrivateCycle;
  const privateEventSubmitDisabled = !activePrivateCycle;
  const filteredPrivateTimeline = useMemo(() => {
    if (privateTimelineFilter === 'all') return privateTimeline;
    if (privateTimelineFilter === 'events') return privateTimeline.filter((item) => item.kind === 'entry');
    if (privateTimelineFilter === 'products') return privateTimeline.filter((item) => item.kind === 'product');
    if (privateTimelineFilter === 'payments') return privateTimeline.filter((item) => item.kind === 'payment');
    return privateTimeline;
  }, [privateTimeline, privateTimelineFilter]);
  const privateNextStepRecommendation = useMemo(() => {
    if (!activePrivateCycle) return '';
    if (activeCycleProducts.length === 0) return 'Agrega un componente al ciclo activo.';
    if (activeCycleEntries.length === 0) return 'Registra un evento para alimentar la bitacora.';
    if (activeCyclePayments.length === 0) return 'Registra un pago para reflejar el avance financiero.';
    if (!todayPrivateDailyCheck) return 'Completa el chequeo diario para capturar energia, animo y sueño.';
    return '';
  }, [activePrivateCycle, activeCycleEntries.length, activeCyclePayments.length, activeCycleProducts.length, todayPrivateDailyCheck]);
  const privateHormonalWeeklySummary = useMemo(
    () =>
      buildPrivateHormonalWeeklySummary({
        activeCycle: activePrivateCycle,
        privateEntries,
        privateProducts,
        privatePayments,
        privateDailyChecks,
        weekStart: currentWeekStart,
        weekEnd: currentWeekEnd,
        currentDate,
        now: new Date(),
      }),
    [
      activePrivateCycle,
      privateEntries,
      privateProducts,
      privatePayments,
      privateDailyChecks,
      currentWeekStart,
      currentWeekEnd,
      currentDate,
    ]
  );
  const privateOperationalAlerts = useMemo(
    () =>
      buildPrivateOperationalAlerts({
        activeCycle: activePrivateCycle,
        privateEntries,
        privatePayments,
        privateDailyChecks,
        weekStart: currentWeekStart,
        weekEnd: currentWeekEnd,
        currentDate,
        now: new Date(),
      }),
    [activePrivateCycle, privateEntries, privatePayments, privateDailyChecks, currentWeekStart, currentWeekEnd, currentDate]
  );
  const privateDailySummaryCards = useMemo(
    () => [
      {
        label: 'Chequeo de hoy',
        value: todayPrivateDailyCheck ? 'Registrado' : 'Pendiente',
        detail: todayPrivateDailyCheck ? formatPrivateDate(todayPrivateDailyCheck.date) : 'Completa el registro diario.',
      },
      {
        label: 'Energía semanal',
        value: formatPrivateAverageValue(privateHormonalWeeklySummary.energyAverage),
        detail: 'Promedio de energia percibida.',
      },
      {
        label: 'Sueño semanal',
        value: formatPrivateAverageValue(privateHormonalWeeklySummary.sleepAverage),
        detail: 'Promedio semanal de sueño.',
      },
      {
        label: 'Animo semanal',
        value: formatPrivateAverageValue(privateHormonalWeeklySummary.moodAverage),
        detail: 'Promedio semanal de estado de animo.',
      },
    ],
    [
      todayPrivateDailyCheck,
      privateHormonalWeeklySummary.energyAverage,
      privateHormonalWeeklySummary.moodAverage,
      privateHormonalWeeklySummary.sleepAverage,
    ]
  );
  const privateDailyScaleFieldOptions = useMemo(
    () => [
      { value: '', label: 'Sin registrar' },
      { value: '1', label: '1 - Muy bajo' },
      { value: '2', label: '2 - Bajo' },
      { value: '3', label: '3 - Medio' },
      { value: '4', label: '4 - Bueno' },
      { value: '5', label: '5 - Muy bueno' },
    ],
    []
  );
  const persistenceDebugCounts = useMemo(() => getPersistenceCollectionCounts(diaryData), [diaryData]);

  useEffect(() => {
    if (!activePrivateCycle) {
      if (privateAgendaSelectedDate) setPrivateAgendaSelectedDate('');
      if (privateAgendaShowAll) setPrivateAgendaShowAll(false);
      return;
    }

    if (!privateAgendaSelectedDate) {
      setPrivateAgendaSelectedDate(currentDate);
    }
  }, [activePrivateCycle, currentDate, privateAgendaSelectedDate, privateAgendaShowAll]);

  useEffect(() => {
    if (hasActivePrivateCycle && privateBlockedTarget) {
      setPrivateBlockedTarget('');
    }
  }, [hasActivePrivateCycle, privateBlockedTarget]);

  function clearPrivateAutoLockTimeout() {
    if (privateAutoLockTimeoutRef.current) {
      window.clearTimeout(privateAutoLockTimeoutRef.current);
      privateAutoLockTimeoutRef.current = null;
    }
  }

function lockPrivateModule(feedbackText = '') {
  setIsPrivateUnlocked(false);
  setPrivateUnlockPin('');
  setPrivateFormVisibility({ cycle: false, medication: false, product: false, event: false, payment: false });
  setPrivateSecurityExpanded(false);
  clearPrivateAutoLockTimeout();
    if (feedbackText) {
      setPrivateFeedback({ type: 'info', text: feedbackText });
    }
  }

  function bumpPrivateActivity() {
    if (!isPrivateUnlocked) return;
    clearPrivateAutoLockTimeout();
    const autoLockMinutes = Math.max(Number(privateVault.autoLockMinutes || 5), 1);
    privateAutoLockTimeoutRef.current = window.setTimeout(() => {
      lockPrivateModule('Area privada bloqueada por inactividad.');
    }, autoLockMinutes * 60 * 1000);
  }

  useEffect(() => {
    if (activeFastingStatus !== 'en curso' && fastingFormStatus !== 'en curso') return undefined;

    const intervalId = window.setInterval(() => {
      setFastingNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [activeFastingStatus, fastingFormStatus]);

  useEffect(() => {
    if (editingFastingLogId) return;

    setFastingLogForm((current) => ({
      ...current,
      date: current.date || currentDate,
    }));
  }, [currentDate, editingFastingLogId]);

  useEffect(() => {
    if (!activeObjective) return;
    setObjectiveForm(activeObjective);
  }, [activeObjective]);

  useEffect(() => {
    if (!isPrivateUnlocked) return undefined;

    const events = ['pointerdown', 'keydown', 'touchstart'];
    const handleActivity = () => bumpPrivateActivity();

    bumpPrivateActivity();
    events.forEach((eventName) => window.addEventListener(eventName, handleActivity));

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
      clearPrivateAutoLockTimeout();
    };
  }, [isPrivateUnlocked, privateVault.autoLockMinutes]);

  useEffect(() => {
    if (editingPrivateEntryId || editingPrivateProductId || editingPrivatePaymentId || editingPrivateDailyCheckId || editingPrivateMedicationId) return;

    const activeCycleId = activePrivateCycle?.id || '';
    setPrivateEntryForm((current) => (current.cycleId === activeCycleId ? current : { ...current, cycleId: activeCycleId, productId: '' }));
    setPrivateProductForm((current) => (current.cycleId === activeCycleId ? current : { ...current, cycleId: activeCycleId }));
    setPrivatePaymentForm((current) => (current.cycleId === activeCycleId ? current : { ...current, cycleId: activeCycleId }));
    setPrivateDailyCheckForm((current) =>
      current.cycleId === activeCycleId && current.date === currentDate
        ? current
        : { ...current, cycleId: activeCycleId, date: current.date || currentDate || getToday() }
    );
    setPrivateMedicationForm((current) =>
      current.cycleId === activeCycleId
        ? current
        : { ...current, cycleId: activeCycleId, remainingInventory: current.remainingInventory || current.initialInventory || '' }
    );
  }, [activePrivateCycle, editingPrivateDailyCheckId, editingPrivateEntryId, editingPrivatePaymentId, editingPrivateProductId, editingPrivateMedicationId, currentDate]);

  useEffect(() => {
    if (!isPrivateUnlocked) return;
    if (editingPrivateCycleId || editingPrivateProductId || editingPrivatePaymentId || editingPrivateEntryId || editingPrivateMedicationId) return;

    setPrivateFormVisibility((current) => {
      const hasAnyOpen = Object.values(current).some(Boolean);
      if (hasAnyOpen) return current;

      return activePrivateCycle
        ? { cycle: false, medication: false, product: false, event: false, payment: false }
        : { cycle: true, medication: false, product: false, event: false, payment: false };
    });
  }, [isPrivateUnlocked, activePrivateCycle, editingPrivateCycleId, editingPrivateProductId, editingPrivatePaymentId, editingPrivateEntryId, editingPrivateMedicationId]);

  const calorieGoal = Number(diaryData.goals?.calories || 0);
  const proteinGoal = Number(diaryData.goals?.protein || 0);
  const weightGoal = Number(diaryData.goals?.weight || 0);
  const hydrationBaseGoal = Number(diaryData.goals?.hydrationBase || 0);
  const hydrationHighActivityGoal = Number(diaryData.goals?.hydrationHighActivity || 0);
  const cutReferenceGoals = diaryData.goals || defaultState.goals;
  const cutReferenceTdee = getNumericMetric(cutReferenceGoals.cutReferenceTdee);
  const cutReferenceProteinMin = getNumericMetric(cutReferenceGoals.cutReferenceProteinMin);
  const cutReferenceProteinMax = getNumericMetric(cutReferenceGoals.cutReferenceProteinMax);
  const cutReferenceFatMin = getNumericMetric(cutReferenceGoals.cutReferenceFatMin);
  const cutReferenceFatMax = getNumericMetric(cutReferenceGoals.cutReferenceFatMax);
  const cutReferenceCutMin = getNumericMetric(cutReferenceGoals.cutReferenceCutMin);
  const cutReferenceCutMax = getNumericMetric(cutReferenceGoals.cutReferenceCutMax);
  const cutReferenceProteinRangeLabel = formatCompactSettingsRange(
    cutReferenceGoals.cutReferenceProteinMin,
    cutReferenceGoals.cutReferenceProteinMax,
    'g'
  );
  const cutReferenceFatRangeLabel = formatCompactSettingsRange(
    cutReferenceGoals.cutReferenceFatMin,
    cutReferenceGoals.cutReferenceFatMax,
    'g'
  );
  const cutReferenceCutRangeLabel = formatCompactSettingsRange(
    cutReferenceGoals.cutReferenceCutMin,
    cutReferenceGoals.cutReferenceCutMax,
    'kcal'
  );
  const cutReferenceMacrosLabel = `${cutReferenceProteinRangeLabel} proteína · ${cutReferenceFatRangeLabel} grasa`;
  const hasCutReferenceLoaded =
    cutReferenceTdee !== null ||
    cutReferenceProteinMin !== null ||
    cutReferenceProteinMax !== null ||
    cutReferenceCutMin !== null ||
    cutReferenceCutMax !== null ||
    cutReferenceFatMin !== null ||
    cutReferenceFatMax !== null;
  const cutReferenceSummaryCards = useMemo(
    () => [
      {
        label: 'Objetivo 10%',
        value: `${formatWeightValue(cutReferenceForm.cutReferenceTargetWeight10, 'kg', 'Sin dato')}`,
        detail: `Actual ${formatWeightValue(cutReferenceForm.cutReferenceCurrentWeight, 'kg', 'Sin dato')} · Grasa a perder ${formatWeightValue(
          cutReferenceForm.cutReferenceFatToLose,
          'kg',
          'Sin dato'
        )}`,
      },
      {
        label: 'TDEE operativo',
        value: formatIntegerValue(cutReferenceForm.cutReferenceTdee, 'kcal', 'Sin dato'),
        detail: `Mantenimiento útil ${formatSettingsRange(cutReferenceForm.cutReferenceMaintenanceMin, cutReferenceForm.cutReferenceMaintenanceMax, 'kcal')}`,
      },
      {
        label: 'Corte útil',
        value: formatSettingsRange(cutReferenceForm.cutReferenceCutMin, cutReferenceForm.cutReferenceCutMax, 'kcal'),
        detail: `Efectivo ${formatSettingsRange(cutReferenceForm.cutReferenceEffectiveMin, cutReferenceForm.cutReferenceEffectiveMax, 'kcal')} · Muy agresivo debajo de ${formatIntegerValue(cutReferenceForm.cutReferenceAggressiveBelow, 'kcal', 'Sin dato')}`,
      },
      {
        label: 'Proteína',
        value: formatSettingsRange(cutReferenceForm.cutReferenceProteinMin, cutReferenceForm.cutReferenceProteinMax, 'g'),
        detail: `Meta diaria guardada ${formatIntegerValue(proteinGoal, 'g', 'Sin dato')}`,
      },
      {
        label: 'Grasa',
        value: formatSettingsRange(cutReferenceForm.cutReferenceFatMin, cutReferenceForm.cutReferenceFatMax, 'g'),
        detail: `Déficit total estimado ${formatIntegerValue(cutReferenceForm.cutReferenceEstimatedDeficit, 'kcal', 'Sin dato')}`,
      },
    ],
    [cutReferenceForm, proteinGoal]
  );

  const todaySummary = useMemo(
    () =>
      buildTodaySummary({
        todaysFoods,
        todaysHydrationEntries,
        todaysSupplements,
        todaysExercises,
        todaysMetrics,
        todaysFastingLogs,
        metricFieldSnapshots,
        activeFastingStatus: displayedFastingStatus,
        activeFastingProtocol,
      }),
    [
      activeFastingProtocol,
      displayedFastingStatus,
      metricFieldSnapshots,
      todaysExercises,
      todaysFastingLogs,
      todaysFoods,
      todaysHydrationEntries,
      todaysMetrics,
      todaysSupplements,
    ]
  );
  const weeklySummary = useMemo(
    () =>
      buildWeeklySummary({
        diaryData,
        fastingNow,
        fastingFreeDays,
        hydrationBaseGoal,
        proteinGoal,
        weekReferenceDate,
      }),
    [diaryData, fastingFreeDays, fastingNow, hydrationBaseGoal, proteinGoal, weekReferenceDate]
  );
  const weeklyFastingHasData = weeklySummary.fastingLogsCount > 0 || weeklySummary.fastingFreeDays > 0;
  const weeklyProteinStatusLabel = weeklySummary.foodDays === 0
    ? 'Sin registros'
    : proteinGoal > 0 && weeklySummary.averageProteinTracked >= proteinGoal
      ? 'Proteína bien'
      : proteinGoal > 0
        ? 'Proteína baja'
        : 'Sin meta';
  const weeklyConsistencyLabel = weeklySummary.trackedDays >= 5
    ? 'Consistente'
    : weeklySummary.trackedDays >= 3
      ? 'Intermitente'
      : weeklySummary.trackedDays > 0
        ? 'Desordenado'
        : 'Sin historial';

  const historyDays = useMemo(() => {
    const dateMap = new Map();
    const collections = [
      ['foods', diaryData.foods],
      ['hydrationEntries', diaryData.hydrationEntries || []],
      ['supplements', diaryData.supplements],
      ['fastingLogs', diaryData.fastingLogs || []],
      ['exercises', diaryData.exercises],
      ['bodyMetrics', diaryData.bodyMetrics],
    ];

    collections.forEach(([key, items]) => {
      items.forEach((item) => {
        if (!dateMap.has(item.date)) {
          dateMap.set(item.date, {
            date: item.date,
            foods: [],
            hydrationEntries: [],
            supplements: [],
            fastingLogs: [],
            exercises: [],
            bodyMetrics: [],
            totalItems: 0,
          });
        }

        const day = dateMap.get(item.date);
        day[key].push(item);
        day.totalItems += 1;
      });
    });

    return Array.from(dateMap.values())
      .map((day) => ({
        ...day,
        foods: sortByDateDesc(day.foods),
        hydrationEntries: sortHydrationEntries(day.hydrationEntries),
        supplements: sortByDateDesc(day.supplements),
        fastingLogs: sortByDateDesc(day.fastingLogs).map((item) => ({
          ...item,
          derivedStatus: getFastingStatusLabel(item, null),
        })),
        exercises: sortByDateDesc(day.exercises),
        bodyMetrics: sortByDateDesc(day.bodyMetrics),
        summary: {
          calories: sumBy(day.foods, 'calories'),
          protein: sumBy(day.foods, 'protein'),
          hydrationMl: day.hydrationEntries.reduce((total, item) => total + getHydrationMl(item), 0),
          supplementsTaken: day.supplements.filter((item) => item.taken === 'si').length,
          fastingCompleted: day.fastingLogs.filter((item) => {
            return getFastingStatusLabel(item, null) === 'cumplido';
          }).length,
          exerciseMinutes: sumBy(day.exercises, 'duration'),
          weight: sortByDateDesc(day.bodyMetrics)[0]?.weight || null,
        },
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [diaryData]);

  const dailyFatLimitGrams = 80;
  const todayFatGrams = Number(todaySummary.fat || 0);
  const proteinAlert = proteinGoal > 0 && todaySummary.protein < proteinGoal;
  const fatAlert = todayFatGrams > dailyFatLimitGrams;
  const dailyFatProgress = dailyFatLimitGrams > 0 ? (todayFatGrams / dailyFatLimitGrams) * 100 : 0;
  const hasDailyFatCutRange = cutReferenceFatMin !== null && cutReferenceFatMax !== null;
  const dailyFatStatus = fatAlert
    ? 'Excedida'
    : hasDailyFatCutRange
      ? todayFatGrams < cutReferenceFatMin
        ? 'Baja'
        : todayFatGrams <= cutReferenceFatMax
          ? 'En rango'
          : 'Arriba del rango'
      : dailyFatProgress >= 80
        ? 'Cerca del límite'
        : 'Normal';
  const dailyFatTone = fatAlert ? 'alert' : dailyFatStatus === 'Arriba del rango' ? 'energy' : dailyFatStatus === 'En rango' ? 'success' : undefined;
  const calorieProgress = calorieGoal > 0 ? (todaySummary.calories / calorieGoal) * 100 : 0;
  const proteinProgress = proteinGoal > 0 ? (todaySummary.protein / proteinGoal) * 100 : 0;
  const hydrationProgress = hydrationBaseGoal > 0 ? (todaySummary.hydrationMl / hydrationBaseGoal) * 100 : 0;
  const hydrationTone = hydrationProgress < 70 ? 'alert' : hydrationProgress < 100 ? 'energy' : 'success';
  const weightProgress =
    weightGoal > 0 && Number(todaySummary.weight) > 0
      ? Math.max(0, 100 - (Math.abs(Number(todaySummary.weight) - weightGoal) / weightGoal) * 100)
      : 0;
  const isSundayReminderVisible = getDayOfWeekKey(currentDate) === 'domingo';
  const dashboardProteinReferenceLabel =
    cutReferenceProteinMin !== null && cutReferenceProteinMax !== null ? `Rango corte: ${cutReferenceProteinRangeLabel}` : 'Sin referencia de corte';
  const dashboardProteinHelper = proteinGoal > 0
    ? proteinAlert
      ? `Te faltan ${formatUnitValue(proteinGoal - todaySummary.protein, 'g', { maximumFractionDigits: 1, fallback: '0 g' })} · ${dashboardProteinReferenceLabel}`
      : `Meta de proteína cumplida · ${dashboardProteinReferenceLabel}`
    : dashboardProteinReferenceLabel;
  const dashboardFatSubtitle = hasDailyFatCutRange
    ? `Límite operativo: ${formatUnitValue(dailyFatLimitGrams, 'g', { maximumFractionDigits: 0, fallback: '80 g' })} · Meta corte: ${cutReferenceFatRangeLabel}`
    : `Límite operativo: ${formatUnitValue(dailyFatLimitGrams, 'g', { maximumFractionDigits: 0, fallback: '80 g' })}`;
  const dashboardCutReferenceMiniLabel =
    cutReferenceCutMin !== null || cutReferenceCutMax !== null
      ? cutReferenceCutRangeLabel
      : 'Sin referencia de corte';
  const recentFoods = useMemo(() => sortFoods(diaryData.foods), [diaryData.foods]);
  const visibleRecentFoods = useMemo(
    () => (showAllRecentFoods ? recentFoods : recentFoods.slice(0, 5)),
    [recentFoods, showAllRecentFoods]
  );

  const visibleSupplements = useMemo(() => {
    const sorted = sortSupplements(todaysSupplements);
    if (supplementFilter === 'todos') return sorted;
    return sorted.filter((item) => item.category === supplementFilter);
  }, [supplementFilter, todaysSupplements]);

  const pendingSupplements = useMemo(
    () => visibleSupplements.filter((item) => item.taken !== 'si'),
    [visibleSupplements]
  );

  const takenSupplements = useMemo(
    () => visibleSupplements.filter((item) => item.taken === 'si'),
    [visibleSupplements]
  );

  const dailySupplementChecklist = useMemo(
    () =>
      recommendedSupplementChecklist.map((item) => {
        const matchedRecord =
          todaysSupplements.find((entry) => normalizeTextToken(entry.name) === normalizeTextToken(item.name)) || null;

        return {
          ...item,
          matchedRecord,
          checked: matchedRecord?.taken === 'si',
        };
      }),
    [todaysSupplements]
  );
  const visibleChecklistSupplements = useMemo(() => {
    if (supplementFilter === 'todos') return dailySupplementChecklist;
    return dailySupplementChecklist.filter((item) => item.category === supplementFilter);
  }, [dailySupplementChecklist, supplementFilter]);
  const checklistSupplementKeySet = useMemo(
    () => new Set(recommendedSupplementChecklist.map((item) => normalizeTextToken(item.name))),
    []
  );
  const visibleSupplementRecordsOutsideChecklist = useMemo(
    () =>
      visibleSupplements.filter((item) => !checklistSupplementKeySet.has(normalizeTextToken(item.name))),
    [checklistSupplementKeySet, visibleSupplements]
  );
  const visibleSupplementSummary = useMemo(() => {
    const total = visibleChecklistSupplements.length + visibleSupplementRecordsOutsideChecklist.length;
    const taken =
      visibleChecklistSupplements.filter((item) => item.checked).length +
      visibleSupplementRecordsOutsideChecklist.filter((item) => item.taken === 'si').length;
    const pending =
      visibleChecklistSupplements.filter((item) => !item.checked).length +
      visibleSupplementRecordsOutsideChecklist.filter((item) => item.taken !== 'si').length;
    const medications =
      visibleChecklistSupplements.filter((item) => item.category === 'medicamento').length +
      visibleSupplementRecordsOutsideChecklist.filter((item) => item.category === 'medicamento').length;

    return { total, taken, pending, medications };
  }, [visibleChecklistSupplements, visibleSupplementRecordsOutsideChecklist]);

  const visibleExercises = useMemo(() => {
    const sorted = sortExercises(diaryData.exercises);
    if (exerciseFilter === 'todos') return sorted;
    return sorted.filter((item) => item.modality === exerciseFilter);
  }, [diaryData.exercises, exerciseFilter]);

  const pendingExercises = useMemo(
    () => visibleExercises.filter((item) => item.completed !== 'si'),
    [visibleExercises]
  );

  const completedExercises = useMemo(
    () => visibleExercises.filter((item) => item.completed === 'si'),
    [visibleExercises]
  );

  const visibleExerciseSummary = useMemo(() => {
    const totalMinutes = sumBy(visibleExercises, 'duration');
    const totalCalories = sumBy(visibleExercises, 'caloriesBurned');
    const sessions = visibleExercises.length;
    const cardio = visibleExercises.filter(
      (item) => item.modality === 'cardio' || item.modality === 'caminata'
    ).length;
    const strength = visibleExercises.filter((item) => item.modality === 'pesas').length;

    return { totalMinutes, totalCalories, sessions, cardio, strength };
  }, [visibleExercises]);

  const sortedFastingProtocols = useMemo(
    () =>
      [...(diaryData.fastingProtocols || [])].sort(
        (a, b) => (fastingDayOrder[a.dayOfWeek] || 99) - (fastingDayOrder[b.dayOfWeek] || 99)
      ),
    [diaryData.fastingProtocols]
  );

  const metricSummary = useMemo(
    () => ({
      weight: metricFieldSnapshots.weight.rawValue ?? '--',
      bodyFat: metricFieldSnapshots.bodyFat.rawValue ?? '--',
      skeletalMuscleMass: metricFieldSnapshots.skeletalMuscleMass.rawValue ?? '--',
      bodyFatMass: metricFieldSnapshots.bodyFatMass.rawValue ?? '--',
      weightDelta: getMetricDeltaLabel(metricComparisonPairs.weight.current?.rawValue, metricComparisonPairs.weight.previous?.rawValue, 'kg'),
      bodyFatDelta: getMetricDeltaLabel(metricComparisonPairs.bodyFat.current?.rawValue, metricComparisonPairs.bodyFat.previous?.rawValue, '%'),
      skeletalMuscleMassDelta: getMetricDeltaLabel(
        metricComparisonPairs.skeletalMuscleMass.current?.rawValue,
        metricComparisonPairs.skeletalMuscleMass.previous?.rawValue,
        'kg'
      ),
      bodyFatMassDelta: getMetricDeltaLabel(
        metricComparisonPairs.bodyFatMass.current?.rawValue,
        metricComparisonPairs.bodyFatMass.previous?.rawValue,
        'kg'
      ),
    }),
    [metricComparisonPairs, metricFieldSnapshots]
  );

  const metricTrend = useMemo(
    () => ({
      weight: getMetricTrend(metricComparisonPairs.weight.current?.rawValue, metricComparisonPairs.weight.previous?.rawValue),
      bodyFat: getMetricTrend(metricComparisonPairs.bodyFat.current?.rawValue, metricComparisonPairs.bodyFat.previous?.rawValue),
      skeletalMuscleMass: getMetricTrend(
        metricComparisonPairs.skeletalMuscleMass.current?.rawValue,
        metricComparisonPairs.skeletalMuscleMass.previous?.rawValue
      ),
      bodyFatMass: getMetricTrend(metricComparisonPairs.bodyFatMass.current?.rawValue, metricComparisonPairs.bodyFatMass.previous?.rawValue),
    }),
    [metricComparisonPairs]
  );

  const metricSummarySourceLabels = useMemo(() => {
    const latestMetricDate = latestMetric?.date || null;
    const buildLabel = (snapshot, defaultDelta) => {
      if (!snapshot?.date) return 'sin dato';
      if (!latestMetricDate || snapshot.date === latestMetricDate) return defaultDelta;
      return `Disponible en ${formatDate(snapshot.date)}`;
    };

    return {
      weight: buildLabel(metricFieldSnapshots.weight, metricSummary.weightDelta),
      bodyFat: buildLabel(metricFieldSnapshots.bodyFat, metricSummary.bodyFatDelta),
      skeletalMuscleMass: buildLabel(metricFieldSnapshots.skeletalMuscleMass, metricSummary.skeletalMuscleMassDelta),
      bodyFatMass: buildLabel(metricFieldSnapshots.bodyFatMass, metricSummary.bodyFatMassDelta),
    };
  }, [latestMetric?.date, metricFieldSnapshots, metricSummary.bodyFatDelta, metricSummary.bodyFatMassDelta, metricSummary.skeletalMuscleMassDelta, metricSummary.weightDelta]);

  useEffect(() => {
    if (!selectedKravTechnique) {
      setKravTechniqueNoteDraft('');
      return;
    }

    setKravTechniqueNoteDraft(selectedKravTechnique.notes || '');
  }, [selectedKravTechnique]);

  useEffect(() => {
    if ((!selectedKravTechniqueId || !selectedKravTechnique) && nextKravTechnique?.id) {
      setSelectedKravTechniqueId(nextKravTechnique.id);
    }
  }, [selectedKravTechniqueId, selectedKravTechnique, nextKravTechnique]);

  useEffect(() => {
    if (!pendingKravDetailScrollRef.current || !selectedKravTechnique || !kravTechniqueDetailRef.current) return;

    const frameId = window.requestAnimationFrame(() => {
      scrollElementIntoViewIfNeeded(kravTechniqueDetailRef.current);
      pendingKravDetailScrollRef.current = false;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [selectedKravTechnique, kravExpandedCategories]);

  useEffect(() => {
    if (kravCurriculumByCategory.length === 0) return;
    setKravExpandedCategories((current) => {
      if (Object.keys(current).length > 0) return current;

      const isCompactViewport =
        typeof window !== 'undefined' && typeof window.matchMedia === 'function'
          ? window.matchMedia('(max-width: 720px)').matches
          : false;

      return Object.fromEntries(
        kravCurriculumByCategory.map((group, index) => [group.category, isCompactViewport ? false : index === 0])
      );
    });
  }, [kravCurriculumByCategory]);

  function handleFormChange(setter) {
    return (event) => {
      const { name, value } = event.target;
      setter((current) => ({ ...current, [name]: value }));
    };
  }

  function handleRecordFormChange(event, setter) {
    const { name, value } = event.target;
    setter((current) => ({ ...current, [name]: value }));
  }

  function handleFastingProtocolChange(event) {
    const { name, value } = event.target;

    setFastingProtocolForm((current) => {
      if (name !== 'dayOfWeek') {
        return { ...current, [name]: value };
      }

      if (editingFastingProtocolId) {
        return { ...current, dayOfWeek: value };
      }

      const existingProtocol = (diaryData.fastingProtocols || []).find((item) => item.dayOfWeek === value);

      if (existingProtocol) {
        return {
          dayOfWeek: existingProtocol.dayOfWeek || value,
          fastingType: existingProtocol.fastingType || 'omad',
          startTime: existingProtocol.startTime || '',
          eatingWindow: existingProtocol.eatingWindow || '',
          expectedDuration: existingProtocol.expectedDuration || '',
          notes: existingProtocol.notes || '',
        };
      }

      return { ...current, dayOfWeek: value };
    });
  }

  function upsertRecord(collectionName, formData, editingId, clearForm, clearEditing) {
    const record = editingId ? { ...formData, id: editingId } : { ...formData, id: createId() };
    markPersistenceReason(`${editingId ? 'editar' : 'crear'}:${collectionName}`);

    setDiaryData((current) => {
      const nextItems = editingId
        ? current[collectionName].map((item) => (item.id === editingId ? record : item))
        : [record, ...current[collectionName]];

      return {
        ...current,
        [collectionName]: nextItems,
      };
    });

    clearForm();
    clearEditing(null);
  }

  function deleteRecord(collectionName, id, clearEditing, clearForm) {
    markPersistenceReason(`eliminar:${collectionName}`);
    setDiaryData((current) => ({
      ...current,
      [collectionName]: current[collectionName].filter((item) => item.id !== id),
    }));

    clearEditing(null);
    clearForm();
  }

  function startEditing(collectionName, id, setForm, setEditing, tabId) {
    const item = diaryData[collectionName].find((entry) => entry.id === id);
    if (!item) return;
    setForm(item);
    setEditing(id);
    setActiveTab(tabId);
  }

  function resetFoodForm() {
    setFoodForm(createEmptyFood());
  }

  function resetHydrationForm() {
    setHydrationForm(createEmptyHydration());
  }

  function resetFoodTemplateForm() {
    setFoodTemplateForm(createEmptyFoodTemplate());
  }

  function resetFastingProtocolForm() {
    setFastingProtocolForm(createEmptyFastingProtocol());
  }

  function resetFastingLogForm() {
    setFastingLogForm({
      ...createEmptyFastingLog(),
    });
  }

  function resetSupplementForm() {
    setSupplementForm(createEmptySupplement());
  }

  function resetRoutineBuilder() {
    setRoutineName('');
    setRoutineItemForm(emptyRoutineItem);
    setRoutineItems([]);
  }

  function resetExerciseForm() {
    setExerciseForm(createEmptyExercise());
  }

  function resetKravPracticeForm() {
    setKravPracticeForm({
      ...createEmptyKravPracticeLog(),
      date: currentDate,
    });
  }

  function resetMetricForm() {
    setMetricForm(createEmptyMetric());
  }

  function resetPrivateEntryForm() {
    setPrivateEntryForm({
      ...createEmptyPrivateEntry(),
      cycleId: activePrivateCycle?.id || '',
    });
  }

  function resetPrivateCycleForm() {
    setPrivateCycleForm(createEmptyPrivateCycle());
  }

  function resetPrivateProductForm() {
    setPrivateProductForm({
      ...createEmptyPrivateProduct(),
      cycleId: activePrivateCycle?.id || '',
    });
  }

  function resetPrivatePaymentForm() {
    setPrivatePaymentForm({
      ...createEmptyPrivatePayment(),
      cycleId: activePrivateCycle?.id || '',
    });
  }

  function resetPrivateDailyCheckForm() {
    setPrivateDailyCheckForm({
      ...createEmptyPrivateDailyCheck(),
      cycleId: activePrivateCycle?.id || '',
      date: currentDate,
    });
  }

  function resetPrivateMedicationForm() {
    setPrivateMedicationForm({
      ...createEmptyPrivateMedication(),
      cycleId: activePrivateCycle?.id || '',
    });
  }

  function handleGoalSubmit(event) {
    event.preventDefault();
    markPersistenceReason('guardar:goals');
    setDiaryData((current) => ({
      ...current,
      goals: {
        ...current.goals,
        ...goalForm,
      },
    }));
  }

  function handleCutReferenceSubmit(event) {
    event.preventDefault();
    markPersistenceReason('guardar:cut-reference');
    setDiaryData((current) => ({
      ...current,
      goals: {
        ...current.goals,
        ...cutReferenceForm,
      },
    }));
  }

  function handleUserProfileChange(event) {
    const nextProfileType = event.target.value;
    const nextUserSettings = createUserSettings(nextProfileType, USER_PROFILE_TAB_PRESETS[nextProfileType]);

    markPersistenceReason('settings:update-user-profile');
    setDiaryData((current) => ({
      ...current,
      userSettings: nextUserSettings,
    }));
  }

  function handleObjectiveSubmit(event) {
    event.preventDefault();
    markPersistenceReason('guardar:objectives');

    const progress = calculateObjectiveProgress(
      objectiveForm.startWeight,
      objectiveForm.currentWeight,
      objectiveForm.targetWeight
    );

    const record = {
      ...(activeObjective || {}),
      ...objectiveForm,
      id: activeObjective?.id || createId(),
      estimatedProgress: progress === null ? '' : progress.toFixed(0),
    };

    setDiaryData((current) => {
      const existingObjectives = current.objectives || [];
      const hasActive = existingObjectives.some((item) => item.id === record.id);

      return {
        ...current,
        objectives: hasActive
          ? existingObjectives.map((item) => (item.id === record.id ? record : item))
          : [record, ...existingObjectives],
      };
    });
  }

  function handleExportBackup() {
    markPersistenceReason('exportar:backup');
    const exportTimestamp = getCurrentDateTimeValue();
    const payload = {
      ...diaryData,
      backupMeta: {
        ...backupMeta,
        lastExportAt: exportTimestamp,
      },
    };
    delete payload.privateCycles;
    delete payload.privateProducts;
    delete payload.privatePayments;
    delete payload.privateHormonalEntries;
    delete payload.privateDailyChecks;
    delete payload.privateCycleMedications;
    delete payload.privateVault;

    const fileSafeTimestamp = exportTimestamp.replace(/[:T]/g, '-');
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `mi-diario-backup-${fileSafeTimestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    setDiaryData(payload);
    setBackupFeedback({
      type: 'success',
      text: 'Respaldo exportado correctamente. Guarda ese archivo en un lugar seguro.',
    });
  }

  function handleImportBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const rawText = typeof reader.result === 'string' ? reader.result : '';
        const parsed = JSON.parse(rawText);

        if (!isValidAppDataPayload(parsed)) {
          throw new Error('El archivo no tiene la estructura minima esperada de Mi Diario.');
        }

        const migratedData = migrateAppData(parsed);
        const importedData = {
          ...migratedData,
          privateCycles: diaryData.privateCycles || defaultState.privateCycles,
          privateProducts: diaryData.privateProducts || defaultState.privateProducts,
          privatePayments: diaryData.privatePayments || defaultState.privatePayments,
          privateHormonalEntries: diaryData.privateHormonalEntries || defaultState.privateHormonalEntries,
          privateDailyChecks: diaryData.privateDailyChecks || defaultState.privateDailyChecks,
          privateCycleMedications: diaryData.privateCycleMedications || defaultState.privateCycleMedications,
          privateVault: diaryData.privateVault || defaultState.privateVault,
          privateSeedVersion: diaryData.privateSeedVersion || defaultState.privateSeedVersion,
          backupMeta: {
            ...(migratedData.backupMeta || defaultState.backupMeta),
            lastImportAt: getCurrentDateTimeValue(),
          },
        };

        markPersistenceReason('importar:backup');
        setDiaryData(importedData);
        setGoalForm(pickGoalFormValues(importedData.goals || defaultState.goals));
        setCutReferenceForm(pickCutReferenceFormValues(importedData.goals || defaultState.goals));
        setObjectiveForm(
          (importedData.objectives && importedData.objectives[0]) ||
            defaultState.objectives?.[0] ||
            createEmptyObjective()
        );
        setEditingFoodId(null);
        setEditingHydrationId(null);
        setEditingFoodTemplateId(null);
        setEditingFastingProtocolId(null);
        setEditingFastingLogId(null);
        setEditingSupplementId(null);
        setEditingExerciseId(null);
        setEditingMetricId(null);
        setBackupFeedback({
          type: 'success',
          text: 'Respaldo importado correctamente. Tus datos fueron restaurados.',
        });
      } catch (error) {
        console.error('[Mi Diario][backup] import:error', error);
        setBackupFeedback({
          type: 'error',
          text: error instanceof Error ? error.message : 'No se pudo importar el archivo seleccionado.',
        });
      } finally {
        setBackupInputKey((current) => current + 1);
      }
    };

    reader.onerror = () => {
      setBackupFeedback({
        type: 'error',
        text: 'No se pudo leer el archivo seleccionado.',
      });
      setBackupInputKey((current) => current + 1);
    };

    reader.readAsText(file);
  }

  function handleResetAppData() {
    const confirmed = window.confirm(
      'Esto reseteará todos los datos guardados localmente en este navegador. Esta acción no se puede deshacer. ¿Deseas continuar?'
    );

    if (!confirmed) return;

    markPersistenceReason('reset:app');
    const resetState = syncUser?.id ? createCleanDefaultState() : defaultState;
    clearAppData(activeStorageKeyRef.current);
    setDiaryData(resetState);
    setGoalForm(pickGoalFormValues(resetState.goals));
    setCutReferenceForm(pickCutReferenceFormValues(resetState.goals));
    setObjectiveForm(resetState.objectives?.[0] || createEmptyObjective());
    resetFoodForm();
    resetHydrationForm();
    resetFoodTemplateForm();
    resetFastingProtocolForm();
    resetFastingLogForm();
    resetSupplementForm();
    resetRoutineBuilder();
    resetExerciseForm();
    resetKravPracticeForm();
    resetMetricForm();
    resetPrivateEntryForm();
    resetPrivateCycleForm();
    resetPrivateProductForm();
    resetPrivatePaymentForm();
    resetPrivateDailyCheckForm();
    resetPrivateMedicationForm();
    setEditingFoodId(null);
    setEditingHydrationId(null);
    setEditingFoodTemplateId(null);
    setEditingFastingProtocolId(null);
    setEditingFastingLogId(null);
    setEditingSupplementId(null);
    setEditingExerciseId(null);
    setEditingKravPracticeId(null);
    setEditingMetricId(null);
    setEditingPrivateEntryId(null);
    setEditingPrivateCycleId(null);
    setEditingPrivateProductId(null);
    setEditingPrivatePaymentId(null);
    setEditingPrivateDailyCheckId(null);
    setEditingPrivateMedicationId(null);
    setBackupInputKey((current) => current + 1);
    setPrivateBackupInputKey((current) => current + 1);
    setPrivateSetupPin('');
    setPrivateSetupPinConfirm('');
    setPrivatePinUpdate({ current: '', next: '', confirm: '' });
    setShowKravPracticeBuilder(false);
    setSelectedKravTechniqueId('');
    setKravTechniqueNoteDraft('');
    setKravExpandedCategories({});
    setKravCategoryShowAll({});
    lockPrivateModule();
    setBackupFeedback({
      type: 'success',
      text: 'Todos los datos locales fueron reseteados y la app volvio a su estado inicial.',
    });
  }

  function handleSyncCredentialsChange(event) {
    const { name, value } = event.target;
    setSyncCredentials((current) => ({ ...current, [name]: value }));
  }

  async function handleSyncSignIn(event) {
    event.preventDefault();

    if (!remoteSyncEnabled) {
      setSyncFeedback({ type: 'error', text: 'Faltan las variables de entorno de Supabase.' });
      return;
    }

    try {
      setSyncStatus(isOnline ? 'syncing' : 'offline');
      await signInWithSupabasePassword(syncCredentials);
      setSyncCredentials((current) => ({ ...current, password: '' }));
      setSyncFeedback({ type: 'success', text: 'Sesion conectada. Se iniciara la sincronizacion.' });
    } catch (error) {
      setSyncStatus(isOnline ? 'error' : 'offline');
      setSyncFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'No se pudo iniciar sesion.',
      });
    }
  }

  async function handleSyncSignUp() {
    if (!remoteSyncEnabled) {
      setSyncFeedback({ type: 'error', text: 'Faltan las variables de entorno de Supabase.' });
      return;
    }

    try {
      setSyncStatus(isOnline ? 'syncing' : 'offline');
      const result = await signUpWithSupabasePassword(syncCredentials);
      setSyncCredentials((current) => ({ ...current, password: '' }));
      setSyncFeedback({
        type: 'success',
        text: result?.session
          ? 'Cuenta creada y sesion iniciada.'
          : 'Cuenta creada. Revisa tu correo si Supabase requiere confirmacion.',
      });
    } catch (error) {
      setSyncStatus(isOnline ? 'error' : 'offline');
      setSyncFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'No se pudo crear la cuenta.',
      });
    }
  }

  async function handleSyncSignOut() {
    try {
      await signOutFromSupabase();
      setSyncStatus(isOnline ? 'auth' : 'offline');
      setSyncFeedback({ type: 'info', text: 'Sesion cerrada. La app sigue operando con cache local.' });
    } catch (error) {
      setSyncFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'No se pudo cerrar la sesion.',
      });
    }
  }

  async function handleManualSync() {
    if (!remoteSyncEnabled) {
      setSyncFeedback({ type: 'error', text: 'Faltan las variables de entorno de Supabase.' });
      return;
    }

    if (!syncUser) {
      setSyncFeedback({ type: 'error', text: 'Inicia sesion para sincronizar entre dispositivos.' });
      return;
    }

    if (!isOnline) {
      setSyncStatus('offline');
      setSyncFeedback({ type: 'info', text: 'Sin conexion. La app sigue usando la cache local.' });
      return;
    }

    try {
      setSyncStatus('syncing');
      const initialResult = await pullRemoteSnapshotAndHydrate({ reason: 'manual-sync-preflight', force: true });

      if (initialResult.status === 'hydrated-remote') {
        setSyncStatus('synced');
        setSyncFeedback({ type: 'success', text: 'Snapshot remoto cargado y aplicado.' });
        return;
      }

      const currentSnapshot = latestPersistedDataRef.current;
      const syncResult = await pushRemoteSnapshot({
        userId: syncUser.id,
        data: currentSnapshot,
      });
      const syncedSnapshot = markDataSynced(currentSnapshot, {
        deviceId: syncDeviceIdRef.current || currentSnapshot.syncMeta?.deviceId || createDeviceId(),
        lastSyncedAt: syncResult.lastSyncedAt || getCurrentDateTimeValue(),
      });
      applyHydratedSnapshot(syncedSnapshot);

      const confirmationResult = await pullRemoteSnapshotAndHydrate({ reason: 'manual-sync-confirmation', force: true });

      if (confirmationResult.status === 'hydrated-remote') {
        setSyncStatus('synced');
        setSyncFeedback({ type: 'success', text: 'Snapshot remoto confirmado y aplicado.' });
      } else if (
        confirmationResult.status === 'equal' ||
        confirmationResult.status === 'keep-local' ||
        confirmationResult.status === 'no-remote'
      ) {
        setSyncStatus('synced');
        setSyncFeedback({ type: 'success', text: 'Cambios locales enviados y confirmados.' });
      } else {
        setSyncStatus('pending');
        setSyncFeedback({ type: 'info', text: 'La sincronizacion quedo pendiente de confirmacion.' });
      }
    } catch (error) {
      setSyncStatus(isOnline ? 'error' : 'offline');
      setSyncFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'No se pudo sincronizar ahora.',
      });
    }
  }

  function handlePrivateEntrySubmit(event) {
    event.preventDefault();
    if (!activePrivateCycle) {
      setPrivateFeedback({ type: 'info', text: 'Primero crea o activa un ciclo para registrar este evento.' });
      return;
    }
    upsertRecord('privateHormonalEntries', privateEntryForm, editingPrivateEntryId, resetPrivateEntryForm, setEditingPrivateEntryId);
    setPrivateFeedback({ type: 'success', text: 'Registro privado guardado correctamente.' });
  }

  function handlePrivateCycleSubmit(event) {
    event.preventDefault();
    const record = editingPrivateCycleId
      ? { ...privateCycleForm, id: editingPrivateCycleId }
      : { ...privateCycleForm, id: createId() };

    markPersistenceReason(`${editingPrivateCycleId ? 'editar' : 'crear'}:privateCycles`);
    setDiaryData((current) => {
      const baseCycles = editingPrivateCycleId
        ? (current.privateCycles || []).map((item) => (item.id === editingPrivateCycleId ? record : item))
        : [record, ...(current.privateCycles || [])];

      const normalizedCycles =
        record.status === 'activo'
          ? baseCycles.map((item) => {
              if (item.id === record.id) return { ...item, status: 'activo' };
              if (item.status === 'activo') return { ...item, status: 'planeado' };
              return item;
            })
          : baseCycles;

      return {
        ...current,
        privateCycles: normalizedCycles,
      };
    });
    resetPrivateCycleForm();
    setEditingPrivateCycleId(null);
    setPrivateFeedback({ type: 'success', text: 'Ciclo privado guardado correctamente.' });
  }

  function handlePrivateProductSubmit(event) {
    event.preventDefault();
    if (!activePrivateCycle) {
      setPrivateFeedback({ type: 'info', text: 'Primero crea o activa un ciclo para asociar este componente.' });
      return;
    }
    upsertRecord('privateProducts', privateProductForm, editingPrivateProductId, resetPrivateProductForm, setEditingPrivateProductId);
    setPrivateFeedback({ type: 'success', text: 'Componente privado guardado correctamente.' });
  }

  function handlePrivatePaymentSubmit(event) {
    event.preventDefault();
    if (!activePrivateCycle) {
      setPrivateFeedback({ type: 'info', text: 'Primero crea o activa un ciclo para registrar este pago.' });
      return;
    }
    upsertRecord('privatePayments', privatePaymentForm, editingPrivatePaymentId, resetPrivatePaymentForm, setEditingPrivatePaymentId);
    setPrivateFeedback({ type: 'success', text: 'Pago privado guardado correctamente.' });
  }

  function handlePrivateDailyCheckSubmit(event) {
    event.preventDefault();
    if (!activePrivateCycle) {
      setPrivateFeedback({ type: 'info', text: 'Primero crea o activa un ciclo para registrar el chequeo diario.' });
      return;
    }
    upsertRecord(
      'privateDailyChecks',
      privateDailyCheckForm,
      editingPrivateDailyCheckId,
      resetPrivateDailyCheckForm,
      setEditingPrivateDailyCheckId
    );
    setPrivateFeedback({ type: 'success', text: 'Chequeo diario guardado correctamente.' });
  }

  function handlePrivateMedicationSubmit(event) {
    event.preventDefault();
    if (!activePrivateCycle) {
      setPrivateFeedback({ type: 'info', text: 'Primero crea o activa un ciclo para registrar este control diario.' });
      return;
    }

    const normalizedMedication = {
      ...privateMedicationForm,
      cycleId: privateMedicationForm.cycleId || activePrivateCycle.id,
      initialInventory: String(privateMedicationForm.initialInventory || '').trim(),
      remainingInventory: String(
        privateMedicationForm.remainingInventory || privateMedicationForm.initialInventory || ''
      ).trim(),
      expectedDailyDose: String(privateMedicationForm.expectedDailyDose || '1').trim(),
      intakeHistory: Array.isArray(privateMedicationForm.intakeHistory) ? privateMedicationForm.intakeHistory : [],
      scheduleMode:
        Number(privateMedicationForm.expectedDailyDose || 0) >= 2 || privateMedicationForm.scheduleMode === 'split'
          ? 'split'
          : 'single',
    };

    upsertRecord(
      'privateCycleMedications',
      normalizedMedication,
      editingPrivateMedicationId,
      resetPrivateMedicationForm,
      setEditingPrivateMedicationId
    );
    setPrivateFeedback({ type: 'success', text: 'Control diario guardado correctamente.' });
  }

  function handlePrivateMedicationDose(medicationId, slot = 'single') {
    if (!activePrivateCycle) {
      setPrivateFeedback({ type: 'info', text: 'Primero activa un ciclo para registrar tomas del día.' });
      return;
    }

    const medication = activeCycleMedications.find((item) => item.id === medicationId);
    if (!medication) return;

    const status = getPrivateMedicationDailyStatus(medication, currentDate);
    if (status.isOutOfStock) {
      setPrivateFeedback({ type: 'info', text: `${medication.name} está agotado.` });
      return;
    }

    if (status.takenSlots.includes(slot)) {
      setPrivateFeedback({ type: 'info', text: `${privateMedicationSlotLabels[slot] || 'La toma'} ya fue registrada hoy.` });
      return;
    }

    const updatedMedication = applyPrivateMedicationDose(medication, slot, currentDate);
    markPersistenceReason(`tomar:privateCycleMedications:${slot}`);
    setDiaryData((current) => ({
      ...current,
      privateCycleMedications: (current.privateCycleMedications || []).map((item) =>
        item.id === medicationId ? updatedMedication : item
      ),
    }));

    setPrivateFeedback({
      type: 'success',
      text:
        status.expectedCount > 1
          ? `${medication.name}: ${privateMedicationSlotLabels[slot] || slot} registrada.`
          : `${medication.name} marcado como tomado hoy.`,
    });
  }

  function handleUndoPrivateMedicationDose(medicationId, slot = 'single') {
    if (!activePrivateCycle) {
      setPrivateFeedback({ type: 'info', text: 'Primero activa un ciclo para corregir tomas del día.' });
      return;
    }

    const medication = activeCycleMedications.find((item) => item.id === medicationId);
    if (!medication) return;

    const status = getPrivateMedicationDailyStatus(medication, currentDate);
    if (!status.takenSlots.includes(slot)) {
      setPrivateFeedback({ type: 'info', text: 'Esa toma de hoy ya está libre.' });
      return;
    }

    if (!window.confirm(`¿Deshacer ${privateMedicationSlotLabels[slot] || 'esta toma'} de hoy en ${medication.name}?`)) {
      return;
    }

    const updatedMedication = removePrivateMedicationDose(medication, slot, currentDate);
    markPersistenceReason(`deshacer:privateCycleMedications:${slot}`);
    setDiaryData((current) => ({
      ...current,
      privateCycleMedications: (current.privateCycleMedications || []).map((item) =>
        item.id === medicationId ? updatedMedication : item
      ),
    }));

    setPrivateFeedback({
      type: 'success',
      text:
        status.expectedCount > 1
          ? `${medication.name}: ${privateMedicationSlotLabels[slot] || slot} deshecha.`
          : `${medication.name} volvió a pendiente hoy.`,
    });
  }

  function duplicatePrivateProduct(id) {
    const original = diaryData.privateProducts.find((item) => item.id === id);
    if (!original) return;

    const duplicate = {
      ...original,
      id: createId(),
      purchaseDate: getToday(),
    };

    markPersistenceReason('duplicar:privateProducts');
    setDiaryData((current) => ({
      ...current,
      privateProducts: [duplicate, ...(current.privateProducts || [])],
    }));
    setPrivateFeedback({ type: 'success', text: 'Componente privado duplicado.' });
  }

  function duplicatePrivatePayment(id) {
    const original = diaryData.privatePayments.find((item) => item.id === id);
    if (!original) return;

    const duplicate = {
      ...original,
      id: createId(),
      date: getToday(),
    };

    markPersistenceReason('duplicar:privatePayments');
    setDiaryData((current) => ({
      ...current,
      privatePayments: [duplicate, ...(current.privatePayments || [])],
    }));
    setPrivateFeedback({ type: 'success', text: 'Pago privado duplicado.' });
  }

  function duplicatePrivateEntry(id) {
    const original = diaryData.privateHormonalEntries.find((item) => item.id === id);
    if (!original) return;

    const duplicate = {
      ...original,
      id: createId(),
      date: getToday(),
      time: '',
      nextApplication: '',
    };

    markPersistenceReason('duplicar:privateHormonalEntries');
    setDiaryData((current) => ({
      ...current,
      privateHormonalEntries: [duplicate, ...(current.privateHormonalEntries || [])],
    }));
    setPrivateFeedback({ type: 'success', text: 'Evento privado duplicado.' });
  }

  function setPrivateCycleAsActive(cycleId) {
    if (!cycleId) return;
    markPersistenceReason('guardar:privateCycles:set-active');
    setDiaryData((current) => ({
      ...current,
      privateCycles: (current.privateCycles || []).map((item) => {
        if (item.id === cycleId) return { ...item, status: 'activo' };
        if (item.status === 'activo') return { ...item, status: 'planeado' };
        return item;
      }),
    }));
    setPrivateFeedback({ type: 'success', text: 'Ciclo activo actualizado.' });
  }

  function handlePrivatePinSetup(event) {
    event.preventDefault();

    if (!isValidPrivatePin(privateSetupPin, privateVault)) {
      setPrivateFeedback({
        type: 'error',
        text: `El PIN debe tener exactamente ${privatePinLength} dígitos numéricos.`,
      });
      return;
    }

    if (privateSetupPin !== privateSetupPinConfirm) {
      setPrivateFeedback({ type: 'error', text: 'La confirmacion del PIN no coincide.' });
      return;
    }

    markPersistenceReason('guardar:privateVault:setup-pin');
    setDiaryData((current) => ({
      ...current,
      privateVault: {
        ...(current.privateVault || defaultState.privateVault),
        pin: privateSetupPin,
      },
    }));
    setPrivateSetupPin('');
    setPrivateSetupPinConfirm('');
    setIsPrivateUnlocked(true);
    setPrivateFeedback({
      type: 'success',
      text: 'PIN configurado correctamente.',
    });
  }

  function handlePrivateUnlock(event) {
    event.preventDefault();

    if (privateUnlockPin !== privateVault.pin) {
      setPrivateFeedback({ type: 'error', text: 'PIN incorrecto. Intenta de nuevo.' });
      return;
    }

    setIsPrivateUnlocked(true);
    setPrivateUnlockPin('');
    setPrivateFeedback({ type: 'success', text: 'Area privada desbloqueada.' });
  }

  function handlePrivatePinUpdate(event) {
    event.preventDefault();

    if (privatePinUpdate.current !== privateVault.pin) {
      setPrivateFeedback({ type: 'error', text: 'El PIN actual no coincide.' });
      return;
    }

    if (!isValidPrivatePin(privatePinUpdate.next, privateVault)) {
      setPrivateFeedback({
        type: 'error',
        text: `El nuevo PIN debe tener exactamente ${privatePinLength} dígitos numéricos.`,
      });
      return;
    }

    if (privatePinUpdate.next !== privatePinUpdate.confirm) {
      setPrivateFeedback({ type: 'error', text: 'La confirmacion del nuevo PIN no coincide.' });
      return;
    }

    markPersistenceReason('guardar:privateVault:update-pin');
    setDiaryData((current) => ({
      ...current,
      privateVault: {
        ...(current.privateVault || defaultState.privateVault),
        pin: privatePinUpdate.next,
      },
    }));
    setPrivatePinUpdate({ current: '', next: '', confirm: '' });
    setPrivateFeedback({ type: 'success', text: 'PIN actualizado correctamente.' });
  }

  function handlePrivateAutoLockMinutesChange(event) {
    const value = event.target.value;
    setPrivateFeedback({ type: '', text: '' });
    markPersistenceReason('guardar:privateVault:auto-lock');
    setDiaryData((current) => ({
      ...current,
      privateVault: {
        ...(current.privateVault || defaultState.privateVault),
        autoLockMinutes: value,
      },
    }));
  }

  function handleRepairPrivateCycle2026() {
    bumpPrivateActivity();
    const repaired = repairPrivateCycle2026Data({
      privateCycles: diaryData.privateCycles || [],
      privateProducts: diaryData.privateProducts || [],
      privatePayments: diaryData.privatePayments || [],
      privateHormonalEntries: diaryData.privateHormonalEntries || [],
      privateDailyChecks: diaryData.privateDailyChecks || [],
      privateCycleMedications: diaryData.privateCycleMedications || [],
      privateSeedVersion: diaryData.privateSeedVersion || 0,
    });
    const repairedCycle = repaired.privateCycles.find(
      (item) => String(item.name || '').trim().toLowerCase() === 'ciclo 2026'
    );

    markPersistenceReason('reparar:private-cycle-2026');
    setDiaryData((current) => ({
      ...current,
      privateCycles: repaired.privateCycles,
      privateProducts: repaired.privateProducts,
      privatePayments: repaired.privatePayments,
      privateHormonalEntries: repaired.privateHormonalEntries,
      privateDailyChecks: repaired.privateDailyChecks,
      privateCycleMedications: repaired.privateCycleMedications,
      privateSeedVersion: repaired.privateSeedVersion,
    }));

    if (repairedCycle?.id) {
      setPrivateEntryForm((current) => ({ ...current, cycleId: current.cycleId || repairedCycle.id }));
      setPrivateProductForm((current) => ({ ...current, cycleId: current.cycleId || repairedCycle.id }));
      setPrivatePaymentForm((current) => ({ ...current, cycleId: current.cycleId || repairedCycle.id }));
      setPrivateDailyCheckForm((current) => ({ ...current, cycleId: current.cycleId || repairedCycle.id }));
      setPrivateMedicationForm((current) => ({ ...current, cycleId: current.cycleId || repairedCycle.id }));
    }

    setPrivateFeedback({
      type: 'success',
      text: `Ciclo 2026 reparado: ${repaired.privateProducts.filter((item) => item.cycleId === repairedCycle?.id).length} productos y ${repaired.privatePayments.filter((item) => item.cycleId === repairedCycle?.id).length} pagos listos.`,
    });
  }

  function handlePrivateExportBackup() {
    const exportTimestamp = getCurrentDateTimeValue();
    const payload = {
      privateCycles: diaryData.privateCycles || [],
      privateProducts: diaryData.privateProducts || [],
      privatePayments: diaryData.privatePayments || [],
      privateHormonalEntries: diaryData.privateHormonalEntries || [],
      privateDailyChecks: diaryData.privateDailyChecks || [],
      privateCycleMedications: diaryData.privateCycleMedications || [],
      privateSeedVersion: diaryData.privateSeedVersion || defaultState.privateSeedVersion,
      privateVault: {
        ...(privateVault || defaultState.privateVault),
        lastPrivateExportAt: exportTimestamp,
      },
    };

    const fileSafeTimestamp = exportTimestamp.replace(/[:T]/g, '-');
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `mi-diario-private-backup-${fileSafeTimestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    markPersistenceReason('exportar:private-backup');
    setDiaryData((current) => ({
      ...current,
      privateVault: {
        ...(current.privateVault || defaultState.privateVault),
        lastPrivateExportAt: exportTimestamp,
      },
    }));
    setPrivateFeedback({
      type: 'success',
      text: 'Respaldo privado exportado correctamente.',
    });
  }

  function handlePrivateImportBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const rawText = typeof reader.result === 'string' ? reader.result : '';
        const parsed = JSON.parse(rawText);

        if (
          !parsed ||
          typeof parsed !== 'object' ||
          Array.isArray(parsed) ||
          (!('privateCycles' in parsed) &&
            !('privateProducts' in parsed) &&
            !('privatePayments' in parsed) &&
            !('privateHormonalEntries' in parsed) &&
            !('privateDailyChecks' in parsed) &&
            !('privateCycleMedications' in parsed) &&
            !('privateVault' in parsed))
        ) {
          throw new Error('El archivo no corresponde a un respaldo privado valido.');
        }

        const migratedPrivate = migrateAppData(parsed);
        const importTimestamp = getCurrentDateTimeValue();

        markPersistenceReason('importar:private-backup');
        setDiaryData((current) => ({
          ...current,
          privateCycles: migratedPrivate.privateCycles || [],
          privateProducts: migratedPrivate.privateProducts || [],
          privatePayments: migratedPrivate.privatePayments || [],
          privateHormonalEntries: migratedPrivate.privateHormonalEntries || [],
          privateDailyChecks: migratedPrivate.privateDailyChecks || [],
          privateCycleMedications: migratedPrivate.privateCycleMedications || [],
          privateSeedVersion: migratedPrivate.privateSeedVersion || current.privateSeedVersion || defaultState.privateSeedVersion,
          privateVault: {
            ...(migratedPrivate.privateVault || defaultState.privateVault),
            lastPrivateImportAt: importTimestamp,
          },
        }));
        setEditingPrivateCycleId(null);
        setEditingPrivateProductId(null);
        setEditingPrivatePaymentId(null);
        setEditingPrivateEntryId(null);
        setEditingPrivateDailyCheckId(null);
        setEditingPrivateMedicationId(null);
        resetPrivateCycleForm();
        resetPrivateProductForm();
        resetPrivatePaymentForm();
        resetPrivateEntryForm();
        resetPrivateDailyCheckForm();
        resetPrivateMedicationForm();
        lockPrivateModule();
        setPrivateFeedback({
          type: 'success',
          text: 'Respaldo privado importado. Vuelve a desbloquear el área privada para revisar los datos.',
        });
      } catch (error) {
        console.error('[Mi Diario][private] import:error', error);
        setPrivateFeedback({
          type: 'error',
          text: error instanceof Error ? error.message : 'No se pudo importar el respaldo privado.',
        });
      } finally {
        setPrivateBackupInputKey((current) => current + 1);
      }
    };

    reader.onerror = () => {
      setPrivateFeedback({
        type: 'error',
        text: 'No se pudo leer el archivo privado seleccionado.',
      });
      setPrivateBackupInputKey((current) => current + 1);
    };

    reader.readAsText(file);
  }

  function handleFoodSubmit(event) {
    event.preventDefault();
    upsertRecord('foods', foodForm, editingFoodId, resetFoodForm, setEditingFoodId);
  }

  function handleHydrationSubmit(event) {
    event.preventDefault();
    upsertRecord('hydrationEntries', hydrationForm, editingHydrationId, resetHydrationForm, setEditingHydrationId);
  }

  function handleFastingProtocolSubmit(event) {
    event.preventDefault();
    upsertRecord(
      'fastingProtocols',
      fastingProtocolForm,
      editingFastingProtocolId,
      resetFastingProtocolForm,
      setEditingFastingProtocolId
    );
  }

  function handleFastingLogSubmit(event) {
    event.preventDefault();
    const targetDate = normalizeDateString(fastingLogForm.date || currentDate);
    if (targetDate) {
      setDiaryData((current) => ({
        ...current,
        fastingFreeDays: (current.fastingFreeDays || []).filter((item) => !isSameDate(item, targetDate)),
      }));
    }
    upsertRecord('fastingLogs', fastingLogForm, editingFastingLogId, resetFastingLogForm, setEditingFastingLogId);
    setShowFastingManualForm(false);
  }

  function handleFoodTemplateSubmit(event) {
    event.preventDefault();
    if (!foodTemplateForm.name.trim()) return;

    upsertRecord('foodTemplates', foodTemplateForm, editingFoodTemplateId, resetFoodTemplateForm, setEditingFoodTemplateId);
  }

  function handleSupplementSubmit(event) {
    event.preventDefault();
    upsertRecord('supplements', supplementForm, editingSupplementId, resetSupplementForm, setEditingSupplementId);
  }

  function saveFoodAsTemplate(foodId) {
    const item = diaryData.foods.find((entry) => entry.id === foodId);
    if (!item) return;

    const template = {
      id: createId(),
      mealType: item.mealType || 'comida',
      name: item.name || '',
      quantity: item.quantity || '',
      unit: item.unit || '',
      category: item.category || '',
      calories: item.calories || '',
      protein: item.protein || '',
      carbs: item.carbs || '',
      fat: item.fat || '',
      costMxn: item.costMxn || '',
      caffeineMg: item.caffeineMg || '',
      notes: item.notes || '',
    };

    markPersistenceReason('crear:foodTemplates');
    setDiaryData((current) => ({
      ...current,
      foodTemplates: [template, ...(current.foodTemplates || [])],
    }));
  }

  function useFoodTemplate(templateId) {
    const template = diaryData.foodTemplates.find((item) => item.id === templateId);
    if (!template) return;

    const foodRecord = {
      ...template,
      id: createId(),
      date: getToday(),
      time: '',
    };

    markPersistenceReason('crear:foods:from-template');
    setDiaryData((current) => ({
      ...current,
      foods: [foodRecord, ...current.foods],
    }));
  }

  function loadFoodTemplateToForm(templateId) {
    const template = diaryData.foodTemplates.find((item) => item.id === templateId);
    if (!template) return;

    setFoodForm({
      date: getToday(),
      time: '',
      mealType: template.mealType || 'comida',
      name: template.name || '',
      quantity: template.quantity || '',
      unit: template.unit || '',
      category: template.category || '',
      calories: template.calories || '',
      protein: template.protein || '',
      carbs: template.carbs || '',
      fat: template.fat || '',
      costMxn: template.costMxn || '',
      caffeineMg: template.caffeineMg || '',
      notes: template.notes || '',
    });
    setEditingFoodId(null);
    setActiveTab('foods');
  }

  function duplicateFoodTemplate(templateId) {
    const template = diaryData.foodTemplates.find((item) => item.id === templateId);
    if (!template) return;

    markPersistenceReason('duplicar:foodTemplates');
    setDiaryData((current) => ({
      ...current,
      foodTemplates: [
        {
          ...template,
          id: createId(),
          name: `${template.name || 'Plantilla'} copia`,
        },
        ...current.foodTemplates,
      ],
    }));
  }

  function handleFastingLogChange(event) {
    const { name, value } = event.target;

    setFastingLogForm((current) => {
      const next = { ...current, [name]: value };

      if (name === 'actualStartDateTime' || name === 'actualBreakDateTime') {
        const calculatedDuration = calculateFastingDurationHours(
          name === 'actualStartDateTime' ? value : next.actualStartDateTime,
          name === 'actualBreakDateTime' ? value : next.actualBreakDateTime
        );

        next.actualDuration = calculatedDuration || '';
        if (name === 'actualStartDateTime' && value) {
          next.date = normalizeDateString(value) || next.date;
        }
      }

      if (
        name === 'targetHours' ||
        name === 'actualDuration' ||
        name === 'actualStartDateTime' ||
        name === 'actualBreakDateTime' ||
        name === 'date'
      ) {
        const derivedStatus = getFastingStatusLabel(next, null, fastingNow);
        if (derivedStatus === 'cumplido') next.completed = 'si';
        if (derivedStatus === 'roto') next.completed = 'no';
      }

      return next;
    });
  }

  function applyQuickFastingUpdate(updater) {
    setFastingLogForm((current) => {
      const base = {
        ...current,
        date: current.date || currentDate,
      };
      const next = updater(base);
      const calculatedDuration =
        next.actualStartDateTime && next.actualBreakDateTime
          ? calculateFastingDurationHours(next.actualStartDateTime, next.actualBreakDateTime)
          : '';
      const withDuration = {
        ...next,
        actualDuration: calculatedDuration || next.actualDuration || '',
      };
      const derivedStatus = getFastingStatusLabel(withDuration, null, fastingNow);

      return {
        ...withDuration,
        completed: derivedStatus === 'cumplido' ? 'si' : 'no',
      };
    });
  }

  function hasActiveRealFastingLog() {
    return Boolean(activeFastingLog && activeFastingStatus === 'en curso');
  }

  function getNocturnalFastingStartValue() {
    const now = new Date(fastingNow);
    const hour = now.getHours();

    if (hour >= 7 && hour < 19) return getCurrentDateTimeValue(fastingNow);

    const startDate = hour < 7 ? shiftDateByDays(currentDate, -1) : currentDate;
    return `${startDate}T19:00`;
  }

  function createRealFastingLogFromTemplate({ expectedProtocol, targetHours, actualStartDateTime, notes = '' }) {
    if (hasActiveRealFastingLog()) {
      setFastingFeedback({
        type: 'warning',
        text: 'Ya hay un ayuno real activo. Rompelo o editalo antes de iniciar otro.',
      });
      return;
    }

    const startValue = actualStartDateTime || getCurrentDateTimeValue();
    const nextLog = {
      ...createEmptyFastingLog(),
      id: createId(),
      date: normalizeDateString(startValue) || currentDate,
      expectedProtocol,
      targetHours,
      actualStartDateTime: startValue,
      actualBreakDateTime: '',
      actualDuration: '',
      completed: 'no',
      notes,
    };

    markPersistenceReason('crear:fastingLogs:plantilla-rapida');
    setDiaryData((current) => ({
      ...current,
      fastingFreeDays: (current.fastingFreeDays || []).filter((item) => !isSameDate(item, currentDate)),
      fastingLogs: [nextLog, ...(current.fastingLogs || [])],
    }));
    setEditingFastingLogId(null);
    setFastingLogForm(nextLog);
    setFastingFeedback({ type: 'success', text: `${expectedProtocol} iniciado como registro real.` });
  }

  function startFastingNow() {
    createRealFastingLogFromTemplate({
      expectedProtocol: fastingLogForm.expectedProtocol || 'Ayuno manual',
      targetHours: fastingLogForm.targetHours || '',
      actualStartDateTime: getCurrentDateTimeValue(),
      notes: fastingLogForm.notes || '',
    });
  }

  function startNocturnalFasting() {
    createRealFastingLogFromTemplate({
      expectedProtocol: 'Ayuno 12 horas nocturno',
      targetHours: '12',
      actualStartDateTime: getNocturnalFastingStartValue(),
      notes: 'Plantilla rápida: estructura base nocturna 7 pm a 7 am.',
    });
  }

  function start36HourFasting() {
    createRealFastingLogFromTemplate({
      expectedProtocol: 'Ayuno 36 horas',
      targetHours: '36',
      actualStartDateTime: getCurrentDateTimeValue(),
      notes: 'Plantilla rápida: ayuno largo semanal.',
    });
  }

  function start72HourFasting() {
    createRealFastingLogFromTemplate({
      expectedProtocol: 'Ayuno 72 horas',
      targetHours: '72',
      actualStartDateTime: getCurrentDateTimeValue(),
      notes: 'Plantilla rápida: ayuno extendido de primera semana del mes.',
    });
  }

  function updateActiveFastingLog(patchBuilder, feedbackText) {
    if (!activeFastingLog) {
      setFastingFeedback({ type: 'warning', text: 'No hay un ayuno real activo para actualizar.' });
      return;
    }

    const nowTimestamp = Date.now();
    setFastingNow(nowTimestamp);
    markPersistenceReason('actualizar:fastingLogs');
    setDiaryData((current) => ({
      ...current,
      fastingLogs: (current.fastingLogs || []).map((item) => {
        if (item.id !== activeFastingLog.id) return item;

        const next = patchBuilder(item, nowTimestamp);
        return next;
      }),
    }));
    setFastingFeedback({ type: 'success', text: feedbackText });
  }

  function breakFastingNow() {
    if (!hasActiveRealFastingLog()) {
      applyQuickFastingUpdate((current) => ({
        ...current,
        actualBreakDateTime: current.actualStartDateTime ? getCurrentDateTimeValue() : current.actualBreakDateTime,
      }));
      setFastingFeedback({ type: 'warning', text: 'No hay ayuno activo guardado. Solo actualice el formulario actual.' });
      return;
    }

    updateActiveFastingLog((item, nowTimestamp) => {
      const breakAt = getCurrentDateTimeValue(nowTimestamp);
      const actualDuration = calculateFastingDurationHours(item.actualStartDateTime, breakAt);
      const next = {
        ...item,
        actualBreakDateTime: breakAt,
        actualDuration: actualDuration || item.actualDuration || '',
      };
      const status = getFastingStatusLabel(next, null, nowTimestamp);

      return {
        ...next,
        completed: status === 'cumplido' ? 'si' : 'no',
      };
    }, 'Ayuno roto y registro real actualizado.');
  }

  function markFastingAsCompleted() {
    if (!hasActiveRealFastingLog()) {
      applyQuickFastingUpdate((current) => ({
        ...current,
        actualBreakDateTime: current.actualStartDateTime ? current.actualBreakDateTime || getCurrentDateTimeValue() : current.actualBreakDateTime,
        completed: current.actualStartDateTime ? 'si' : current.completed,
      }));
      setFastingFeedback({ type: 'warning', text: 'No hay ayuno activo guardado. Solo actualice el formulario actual.' });
      return;
    }

    updateActiveFastingLog((item, nowTimestamp) => {
      const breakAt = item.actualBreakDateTime || getCurrentDateTimeValue(nowTimestamp);
      const actualDuration = calculateFastingDurationHours(item.actualStartDateTime, breakAt);

      return {
        ...item,
        actualBreakDateTime: breakAt,
        actualDuration: actualDuration || item.actualDuration || '',
        completed: 'si',
      };
    }, 'Ayuno marcado como cumplido y cerrado.');
  }

  function clearFastingTimes() {
    applyQuickFastingUpdate((current) => ({
      ...current,
      actualStartDateTime: '',
      actualBreakDateTime: '',
      actualDuration: '',
      completed: 'no',
    }));
    setFastingFeedback({ type: 'success', text: 'Horas del formulario actual limpiadas. El historial guardado no se modifico.' });
  }

  function toggleTodayNoFasting() {
    if (hasActiveRealFastingLog()) {
      setFastingFeedback({
        type: 'warning',
        text: 'Hay un ayuno real activo. No se marcó día libre para evitar sobrescribirlo.',
      });
      return;
    }

    markPersistenceReason('actualizar:fastingFreeDays');
    setDiaryData((current) => {
      const currentFreeDays = current.fastingFreeDays || [];
      const alreadyMarked = currentFreeDays.some((item) => isSameDate(item, currentDate));

      return {
        ...current,
        fastingFreeDays: alreadyMarked
          ? currentFreeDays.filter((item) => !isSameDate(item, currentDate))
          : [...currentFreeDays, currentDate],
      };
    });
    setFastingFeedback({
      type: 'success',
      text: isTodayFastingFree ? 'Día libre retirado.' : 'Día libre marcado. No cuenta como falla.',
    });
  }

  function handleKravPracticeFieldChange(event) {
    const { name, value } = event.target;
    setKravPracticeForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'coach' && value !== 'otro' ? { coachCustomName: '' } : {}),
    }));
  }

  function toggleKravTechniqueSelection(techniqueId) {
    setKravPracticeForm((current) => {
      const currentIds = Array.isArray(current.techniqueIds) ? current.techniqueIds : [];
      const alreadySelected = currentIds.includes(techniqueId);
      return {
        ...current,
        techniqueIds: alreadySelected ? currentIds.filter((item) => item !== techniqueId) : [...currentIds, techniqueId],
      };
    });
  }

  function handleKravPracticeSubmit(event) {
    event.preventDefault();

    if (!Array.isArray(kravPracticeForm.techniqueIds) || kravPracticeForm.techniqueIds.length === 0) return;
    if (kravPracticeForm.coach === 'otro' && !String(kravPracticeForm.coachCustomName || '').trim()) return;

    const normalizedLog = {
      ...kravPracticeForm,
      date: kravPracticeForm.date || currentDate,
      coachCustomName: String(kravPracticeForm.coachCustomName || '').trim(),
      techniqueIds: [...new Set(kravPracticeForm.techniqueIds)],
    };

    const record = editingKravPracticeId ? { ...normalizedLog, id: editingKravPracticeId } : { ...normalizedLog, id: createId() };

    markPersistenceReason(`krav:${editingKravPracticeId ? 'editar' : 'crear'}:practice`);
    setDiaryData((current) => {
      const nextLogs = editingKravPracticeId
        ? (current.kravPracticeLogs || []).map((item) => (item.id === editingKravPracticeId ? record : item))
        : [record, ...(current.kravPracticeLogs || [])];

      const nextCurriculum = (current.kravCurriculum || []).map((item) =>
        normalizedLog.techniqueIds.includes(item.id)
          ? {
              ...item,
              lastPracticedAt: normalizedLog.date,
            }
          : item
      );

      return {
        ...current,
        kravPracticeLogs: nextLogs,
        kravCurriculum: nextCurriculum,
      };
    });

    resetKravPracticeForm();
    setEditingKravPracticeId(null);
  }

  function editKravPracticeLog(id) {
    const item = (diaryData.kravPracticeLogs || []).find((entry) => entry.id === id);
    if (!item) return;
    setKravPracticeForm({
      ...createEmptyKravPracticeLog(),
      ...item,
      techniqueIds: Array.isArray(item.techniqueIds) ? item.techniqueIds : [],
    });
    setEditingKravPracticeId(id);
    setShowKravPracticeBuilder(true);
    setActiveTab('krav');
  }

  function deleteKravPracticeLog(id) {
    if (!window.confirm('¿Eliminar este registro técnico?')) return;
    deleteRecord('kravPracticeLogs', id, setEditingKravPracticeId, resetKravPracticeForm);
  }

  function handleKravTechniquePractice(techniqueId, practiceDate = currentDate) {
    markPersistenceReason('krav:practice-today');
    setDiaryData((current) => ({
      ...current,
      kravCurriculum: markKravTechniquePracticed(current.kravCurriculum || [], techniqueId, practiceDate),
    }));
  }

  function handleKravTechniqueLevelChange(techniqueId, delta = 1) {
    markPersistenceReason('krav:update-level');
    setDiaryData((current) => ({
      ...current,
      kravCurriculum: (current.kravCurriculum || []).map((item) =>
        item.id === techniqueId
          ? {
              ...item,
              level: Math.min(4, Math.max(0, (Number(item.level) || 0) + delta)),
            }
          : item
      ),
    }));
  }

  function openKravTechniqueDetails(techniqueId) {
    const technique = kravCurriculum.find((item) => item.id === techniqueId);
    if (technique?.category) {
      setKravExpandedCategories((current) => ({
        ...current,
        [technique.category]: true,
      }));
    }
    pendingKravDetailScrollRef.current = true;
    setSelectedKravTechniqueId(techniqueId);
    setKravTechniqueNoteDraft(technique?.notes || '');

    if (selectedKravTechniqueId === techniqueId && kravTechniqueDetailRef.current) {
      window.requestAnimationFrame(() => {
        scrollElementIntoViewIfNeeded(kravTechniqueDetailRef.current);
        pendingKravDetailScrollRef.current = false;
      });
    }
  }

  function saveKravTechniqueNotes() {
    if (!selectedKravTechniqueId) return;
    markPersistenceReason('krav:update-notes');
    setDiaryData((current) => ({
      ...current,
      kravCurriculum: (current.kravCurriculum || []).map((item) =>
        item.id === selectedKravTechniqueId
          ? {
              ...item,
              notes: kravTechniqueNoteDraft,
            }
          : item
      ),
    }));
  }

  function toggleKravCategory(category) {
    setKravExpandedCategories((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  function toggleKravCategoryShowAll(category) {
    setKravCategoryShowAll((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  function handleKravSettingsFieldChange(event) {
    const { name, value } = event.target;
    markPersistenceReason('krav:update-settings');
    setDiaryData((current) => ({
      ...current,
      kravSettings: {
        ...(current.kravSettings || {}),
        [name]: value,
      },
    }));
  }

  function handleRoutineItemSubmit(event) {
    event.preventDefault();
    if (!routineItemForm.name.trim()) return;

    setRoutineItems((current) => [
      ...current,
      {
        ...routineItemForm,
        id: createId(),
      },
    ]);

    setRoutineItemForm(emptyRoutineItem);
  }

  function saveRoutine() {
    if (!routineName.trim() || routineItems.length === 0) return;

    markPersistenceReason('crear:routines');
    setDiaryData((current) => ({
      ...current,
      routines: [
        {
          id: createId(),
          name: routineName.trim(),
          items: routineItems.map(({ id, ...item }) => item),
        },
        ...current.routines,
      ],
    }));

    resetRoutineBuilder();
  }

  function removeRoutineItem(id) {
    setRoutineItems((current) => current.filter((item) => item.id !== id));
  }

  function applyRoutine(routineId) {
    const routine = diaryData.routines.find((item) => item.id === routineId);
    if (!routine) return;

    const createdSupplements = routine.items.map((item) => ({
      ...item,
      id: createId(),
      date: getToday(),
      time: '',
      taken: 'no',
      stockRemaining: '',
    }));

    markPersistenceReason('crear:supplements:from-routine');
    setDiaryData((current) => ({
      ...current,
      supplements: [...createdSupplements, ...current.supplements],
    }));
  }

  function markAllVisiblePendingAsTaken() {
    const pendingIds = new Set(pendingSupplements.map((item) => item.id));

    markPersistenceReason('actualizar:supplements:bulk-taken');
    setDiaryData((current) => ({
      ...current,
      supplements: current.supplements.map((item) =>
        pendingIds.has(item.id)
          ? {
              ...item,
              taken: 'si',
            }
          : item
      ),
    }));
  }

  function handleExerciseSubmit(event) {
    event.preventDefault();
    upsertRecord('exercises', exerciseForm, editingExerciseId, resetExerciseForm, setEditingExerciseId);
  }

  function handleMetricSubmit(event) {
    event.preventDefault();
    upsertRecord('bodyMetrics', metricForm, editingMetricId, resetMetricForm, setEditingMetricId);
  }

  function markSupplementAsTaken(id) {
    markPersistenceReason('actualizar:supplements:taken');
    setDiaryData((current) => ({
      ...current,
      supplements: current.supplements.map((item) =>
        item.id === id
          ? {
              ...item,
              taken: 'si',
            }
          : item
      ),
    }));
  }

function toggleRecommendedSupplement(itemConfig) {
    markPersistenceReason('actualizar:supplements:checklist');
    setDiaryData((current) => {
      const existing = (current.supplements || []).find(
        (item) => isSameDate(item.date, currentDate) && normalizeTextToken(item.name) === normalizeTextToken(itemConfig.name)
      );

      if (!existing) {
        const newRecord = {
          ...createEmptySupplement(),
          id: createId(),
          date: currentDate,
          name: itemConfig.name,
          category: itemConfig.category,
          daytime: itemConfig.daytime,
          foodRelation: itemConfig.foodRelation,
          frequency: 'diario',
          taken: 'si',
          notes: 'Checklist base del día.',
        };

        return {
          ...current,
          supplements: [newRecord, ...(current.supplements || [])],
        };
      }

      return {
        ...current,
        supplements: current.supplements.map((entry) =>
          entry.id === existing.id
            ? {
                ...entry,
                taken: entry.taken === 'si' ? 'no' : 'si',
              }
            : entry
        ),
      };
    });
  }

  function duplicateSupplement(id) {
    const original = diaryData.supplements.find((item) => item.id === id);
    if (!original) return;

    const duplicate = {
      ...original,
      id: createId(),
      date: getToday(),
      taken: 'no',
    };

    markPersistenceReason('duplicar:supplements');
    setDiaryData((current) => ({
      ...current,
      supplements: [duplicate, ...current.supplements],
    }));
  }

  function markExerciseAsCompleted(id) {
    markPersistenceReason('actualizar:exercises:completed');
    setDiaryData((current) => ({
      ...current,
      exercises: current.exercises.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: 'si',
            }
          : item
      ),
    }));
  }

  function duplicateExercise(id) {
    const original = diaryData.exercises.find((item) => item.id === id);
    if (!original) return;

    const duplicate = {
      ...original,
      id: createId(),
      date: getToday(),
      completed: 'no',
      time: '',
    };

    markPersistenceReason('duplicar:exercises');
    setDiaryData((current) => ({
      ...current,
      exercises: [duplicate, ...current.exercises],
    }));
  }

  function duplicateMetric(id) {
    const original = diaryData.bodyMetrics.find((item) => item.id === id);
    if (!original) return;

    const duplicate = {
      ...original,
      id: createId(),
      date: getToday(),
    };

    markPersistenceReason('duplicar:bodyMetrics');
    setDiaryData((current) => ({
      ...current,
      bodyMetrics: [duplicate, ...current.bodyMetrics],
    }));
  }

  return (
    <div className="app-shell">
      <header className="hero hero-modern">
        <div className="hero-copy">
          <div className="hero-brand-block">
            <div className="hero-title-block">
              <p className="eyebrow">SEGUIMIENTO PERSONAL</p>
              <h1>Bitacora Daniel</h1>
            </div>
            <p className="hero-text">
              Sistema personal para registrar nutricion, hidratacion, suplementacion, entrenamiento, ayuno y progreso fisico.
            </p>
            <div className="hero-identity-strip" aria-label="Identidad profesional">
              <span className="hero-identity-chip">Ingeniero Mecánico</span>
              <span className="hero-identity-chip">Consejero en adicciones</span>
            </div>
            <p className="hero-value">Te ayudo a cumplir tus metas</p>
            <a
              className="hero-signature"
              href="https://instagram.com/Daniel.Arredondo88"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram Daniel.Arredondo88"
            >
              <span className="hero-signature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img" focusable="false">
                  <path
                    d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7Zm5 2.75A4.25 4.25 0 1 1 7.75 12 4.25 4.25 0 0 1 12 7.75Zm0 2A2.25 2.25 0 1 0 14.25 12 2.25 2.25 0 0 0 12 9.75ZM17.3 6.7a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span>Daniel.Arredondo88</span>
            </a>
            <div className="hero-meta-row">
              <p className="hero-build-label">Build: {appBuildLabel}</p>
              <p className="hero-build-label">Sync: {syncStatusLabel}</p>
            </div>
          </div>
        </div>

        <div className="hero-panel">
          <span>Hoy</span>
          <strong>{formatDate(currentDate)}</strong>
          <p>{todaySummary.foodEntries + todaySummary.hydrationEntries + todaySummary.exerciseEntries + todaySummary.metricEntries + todaySummary.supplementEntries + todaySummary.fastingEntries} registros hoy</p>
        </div>
      </header>

      <nav className="tabs">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${safeActiveTab === tab.id ? 'tab-button-active' : ''}`}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {safeActiveTab === 'dashboard' ? (
          <DashboardTab
            todaySummary={todaySummary}
            calorieGoal={calorieGoal}
            formatIntegerValue={formatIntegerValue}
            calorieProgress={calorieProgress}
            proteinGoal={proteinGoal}
            dashboardProteinReferenceLabel={dashboardProteinReferenceLabel}
            formatUnitValue={formatUnitValue}
            proteinProgress={proteinProgress}
            proteinAlert={proteinAlert}
            dashboardProteinHelper={dashboardProteinHelper}
            dashboardFatSubtitle={dashboardFatSubtitle}
            dailyFatProgress={dailyFatProgress}
            dailyFatTone={dailyFatTone}
            dailyFatStatus={dailyFatStatus}
            displayedFastingProtocolLabel={displayedFastingProtocolLabel}
            displayedFastingStatusLabel={displayedFastingStatusLabel}
            displayedFastingProgressPercent={displayedFastingProgressPercent}
            displayedFastingRemainingHours={displayedFastingRemainingHours}
            activeFastingElapsedHours={activeFastingElapsedHours}
            formatHoursLabel={formatHoursLabel}
            todaySummaryWeight={formatMetricValue(todaySummary.weight, todaySummary.weight === '--' ? '' : ' kg')}
            weightGoal={weightGoal}
            formatWeightValue={formatWeightValue}
            weightProgress={weightProgress}
            getWeightMessage={getWeightMessage}
            hydrationBaseGoal={hydrationBaseGoal}
            hydrationProgress={hydrationProgress}
            hydrationTone={hydrationTone}
            todaysExercises={todaysExercises}
            hydrationHighActivityGoal={hydrationHighActivityGoal}
            kravDashboardSnapshot={kravDashboardSnapshot}
            formatKravPercent={formatKravPercent}
            isKravEnabled={enabledTabIds.includes('krav')}
            isFastingEnabled={enabledTabIds.includes('fasting')}
            isSupplementsEnabled={enabledTabIds.includes('supplements')}
            isObjectivesEnabled={enabledTabIds.includes('objectives')}
            setActiveTab={setActiveTab}
            fatAlert={fatAlert}
            isSundayReminderVisible={isSundayReminderVisible}
            dailyFatLimitGrams={dailyFatLimitGrams}
            goalForm={goalForm}
            handleFormChange={handleFormChange}
            setGoalForm={setGoalForm}
            handleGoalSubmit={handleGoalSubmit}
            latestMetric={latestMetric}
            dashboardCutReferenceMiniLabel={dashboardCutReferenceMiniLabel}
            cutReferenceTdee={cutReferenceTdee}
            todaysFoods={todaysFoods}
            todaysSupplements={todaysSupplements}
            activeFastingAutophagy={activeFastingAutophagy}
            shouldTreatTodayAsFastingFree={shouldTreatTodayAsFastingFree}
            activeFastingStatus={activeFastingStatus}
            activeFastingReachedGoal={activeFastingReachedGoal}
            activeObjective={activeObjective}
            metricFieldSnapshots={metricFieldSnapshots}
            formatMetricText={formatMetricText}
          />
        ) : null}

        {safeActiveTab === 'objectives' ? (
          <ObjectivesTab
            activeObjective={activeObjective}
            activeObjectiveProgress={activeObjectiveProgress}
            objectiveTypeLabels={objectiveTypeLabels}
            formatMetricText={formatMetricText}
            objectiveStatusLabels={objectiveStatusLabels}
            handleObjectiveSubmit={handleObjectiveSubmit}
            objectiveForm={objectiveForm}
            handleFormChange={handleFormChange}
            setObjectiveForm={setObjectiveForm}
            objectiveFormProgress={objectiveFormProgress}
            isObjectiveCutGoal={isObjectiveCutGoal}
            cutReferenceTdee={cutReferenceTdee}
            cutReferenceCutRangeLabel={cutReferenceCutRangeLabel}
            cutReferenceMacrosLabel={cutReferenceMacrosLabel}
            hasCutReferenceLoaded={hasCutReferenceLoaded}
            cutReferenceCutMin={cutReferenceCutMin}
            cutReferenceCutMax={cutReferenceCutMax}
            cutReferenceProteinMin={cutReferenceProteinMin}
            cutReferenceProteinRangeLabel={cutReferenceProteinRangeLabel}
            cutMayReferenceRule={cutMayReferenceRule}
            cutMayReferenceGroups={cutMayReferenceGroups}
            formatIntegerValue={formatIntegerValue}
            formatDate={formatDate}
          />
        ) : null}

        {safeActiveTab === 'settings' ? (
          <>
            <SectionCard
              title="Perfil de uso"
              subtitle="Controla qué módulos aparecen en la navegación sin borrar datos guardados."
              className="card-soft settings-profile-card"
            >
              <div className="backup-panel">
                <div className="backup-meta-grid">
                  <div className="backup-meta-card">
                    <span>Perfil actual</span>
                    <strong>{USER_PROFILE_LABELS[userSettings.profileType] || userSettings.profileType}</strong>
                  </div>
                  <div className="backup-meta-card">
                    <span>Tabs visibles</span>
                    <strong>{enabledTabIds.length}</strong>
                  </div>
                </div>

                <label className="field settings-profile-field">
                  <span>Cambiar perfil</span>
                  <select value={userSettings.profileType} onChange={handleUserProfileChange}>
                    {selectableUserProfiles.map((profileType) => (
                      <option key={profileType} value={profileType}>
                        {USER_PROFILE_LABELS[profileType]}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="settings-enabled-tabs">
                  {enabledTabIds.map((tabId) => (
                    <span className="metrics-source-chip" key={tabId}>
                      {tabLabelById[tabId] || tabId}
                    </span>
                  ))}
                </div>

                <p className="section-helper">
                  Cambiar perfil solo oculta o muestra tabs. Los datos existentes de los módulos ocultos se conservan.
                </p>
              </div>
            </SectionCard>

            <SectionCard
              title="Parámetros de corte"
              subtitle="Referencia fija, editable y persistente para consultar rápido tu corte rumbo a 10% de grasa."
              className="card-soft settings-cut-reference-card"
            >
              <div className="metrics-summary-grid settings-cut-reference-summary">
                {cutReferenceSummaryCards.map((item) => (
                  <div className="metrics-summary-card settings-cut-reference-summary-card" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.detail}</small>
                  </div>
                ))}
              </div>

              <form className="goal-form settings-cut-reference-form" onSubmit={handleCutReferenceSubmit}>
                <div className="settings-cut-reference-groups">
                  {cutReferenceFieldGroups.map((group) => (
                    <section className="settings-cut-reference-group" key={group.title}>
                      <div className="settings-cut-reference-group-head">
                        <strong>{group.title}</strong>
                        <small>{group.helper}</small>
                      </div>

                      <div className="goal-grid settings-cut-reference-grid">
                        {group.fields.map((field) => (
                          <label className="field" key={field.name}>
                            <span>{field.label}</span>
                            <input
                              name={field.name}
                              type="number"
                              min="0"
                              step={field.step}
                              value={cutReferenceForm[field.name] || ''}
                              onChange={handleFormChange(setCutReferenceForm)}
                            />
                          </label>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>

                <div className="form-actions">
                  <button className="button button-primary" type="submit">
                    Guardar parámetros de corte
                  </button>
                </div>
              </form>
            </SectionCard>

            <SectionCard
              title="Sincronizacion"
              subtitle="Cache local inmediata con snapshot remoto en Supabase para compartir tu diario entre dispositivos."
              className="card-soft"
            >
              <div className="backup-panel">
                <div className="backup-meta-grid">
                  <div className="backup-meta-card">
                    <span>Estado</span>
                    <strong>{syncStatusLabel}</strong>
                  </div>
                  <div className="backup-meta-card">
                    <span>Cuenta</span>
                    <strong>{syncUserLabel}</strong>
                  </div>
                  <div className="backup-meta-card">
                    <span>Ultima sincronizacion</span>
                    <strong>{syncLastSyncedAt ? formatDateTimeHuman(syncLastSyncedAt) : 'Aun no sincronizado'}</strong>
                  </div>
                  <div className="backup-meta-card">
                    <span>Dispositivo</span>
                    <strong>{syncMeta.deviceId ? syncMeta.deviceId.slice(0, 12) : 'Pendiente'}</strong>
                  </div>
                </div>

                <p className="section-helper">
                  El snapshot remoto excluye <strong>privateVault</strong>, incluido el PIN del módulo privado. La
                  estrategia de conflicto de esta fase es <strong>last write wins</strong> basada en <strong>updatedAt</strong>.
                </p>

                {remoteSyncEnabled ? (
                  <>
                    {syncUser ? (
                      <div className="backup-actions">
                        <button className="button button-primary" type="button" onClick={handleManualSync}>
                          Sincronizar ahora
                        </button>
                        <button className="button button-secondary" type="button" onClick={handleSyncSignOut}>
                          Cerrar sesion
                        </button>
                      </div>
                    ) : (
                      <form className="record-form objective-subform" onSubmit={handleSyncSignIn}>
                        <div className="form-grid">
                          <label className="field">
                            <span>Correo</span>
                            <input
                              type="email"
                              name="email"
                              autoComplete="email"
                              value={syncCredentials.email}
                              onChange={handleSyncCredentialsChange}
                              placeholder="tu-correo@ejemplo.com"
                            />
                          </label>
                          <label className="field">
                            <span>Contrasena</span>
                            <input
                              type="password"
                              name="password"
                              autoComplete="current-password"
                              value={syncCredentials.password}
                              onChange={handleSyncCredentialsChange}
                              placeholder="Minimo 6 caracteres"
                            />
                          </label>
                        </div>
                        <div className="form-actions">
                          <button className="button button-primary" type="submit">
                            Entrar y sincronizar
                          </button>
                          <button className="button button-secondary" type="button" onClick={handleSyncSignUp}>
                            Crear cuenta
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                ) : (
                  <p className="helper-text">
                    Configura <strong>VITE_SUPABASE_URL</strong> y <strong>VITE_SUPABASE_ANON_KEY</strong> para habilitar
                    la sincronizacion remota.
                  </p>
                )}

                {syncFeedback.text ? (
                  <div className={`backup-feedback backup-feedback-${syncFeedback.type || 'info'}`}>
                    {syncFeedback.text}
                  </div>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard
              title="Seguridad de datos"
              subtitle="Respalda tu diario antes de limpiar el navegador o mover la app a otro entorno."
              className="card-soft"
            >
              <div className="backup-panel">
                <div className="backup-meta-grid">
                  <div className="backup-meta-card">
                    <span>Ultimo respaldo exportado</span>
                    <strong>
                      {backupMeta.lastExportAt ? formatDateTimeHuman(backupMeta.lastExportAt) : 'Aun no exportado'}
                    </strong>
                  </div>
                  <div className="backup-meta-card">
                    <span>Ultimo respaldo importado</span>
                    <strong>
                      {backupMeta.lastImportAt ? formatDateTimeHuman(backupMeta.lastImportAt) : 'Aun no importado'}
                    </strong>
                  </div>
                </div>

                <p className="section-helper">
                  La app sigue usando <strong>mi-diario-data</strong> como cache local inmediata. El respaldo JSON sigue
                  exportando el snapshot actual del navegador para recuperacion manual.
                </p>

                <div className="backup-actions">
                  <button className="button button-primary" type="button" onClick={handleExportBackup}>
                    Exportar respaldo JSON
                  </button>
                  <label className="button button-secondary backup-import-button">
                    Importar respaldo JSON
                    <input
                      key={backupInputKey}
                      className="backup-file-input"
                      type="file"
                      accept="application/json,.json"
                      onChange={handleImportBackup}
                    />
                  </label>
                  <button className="button button-danger" type="button" onClick={handleResetAppData}>
                    Resetear datos
                  </button>
                </div>

                <p className="helper-text">
                  Importa solo archivos JSON exportados desde Mi Diario. Si el respaldo es viejo, la app intentara
                  migrarlo antes de guardarlo.
                </p>

                {backupFeedback.text ? (
                  <div className={`backup-feedback backup-feedback-${backupFeedback.type || 'info'}`}>
                    {backupFeedback.text}
                  </div>
                ) : null}
              </div>
            </SectionCard>

            {isDevMode ? (
              <SectionCard
                title="Diagnostico de persistencia"
                subtitle="Visible solo en desarrollo para revisar carga local, respaldo y conteo de colecciones."
                className="card-soft dev-storage-card"
              >
                <details className="dev-storage-disclosure">
                  <summary>Ver diagnostico tecnico</summary>
                  <div className="dev-storage-grid">
                    <div className="mini-stat">
                      <span>Foods</span>
                      <strong>{persistenceDebugCounts.foods}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Hydration entries</span>
                      <strong>{persistenceDebugCounts.hydrationEntries}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Supplements</span>
                      <strong>{persistenceDebugCounts.supplements}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Supplement routines</span>
                      <strong>{persistenceDebugCounts.routines}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Fasting logs</span>
                      <strong>{persistenceDebugCounts.fastingLogs}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Exercises</span>
                      <strong>{persistenceDebugCounts.exercises}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Body metrics</span>
                      <strong>{persistenceDebugCounts.bodyMetrics}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Objectives</span>
                      <strong>{persistenceDebugCounts.objectives}</strong>
                    </div>
                  <div className="mini-stat">
                    <span>Private entries</span>
                    <strong>{persistenceDebugCounts.privateHormonalEntries}</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Private cycles</span>
                    <strong>{persistenceDebugCounts.privateCycles}</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Private products</span>
                    <strong>{persistenceDebugCounts.privateProducts}</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Private payments</span>
                    <strong>{persistenceDebugCounts.privatePayments}</strong>
                  </div>
                    <div className="mini-stat">
                      <span>Ultimo load</span>
                      <strong>{debugLastLoadAt ? formatDateTimeHuman(debugLastLoadAt) : 'Sin dato'}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Ultimo save</span>
                      <strong>{debugLastSaveAt ? formatDateTimeHuman(debugLastSaveAt) : 'Sin dato'}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Ultimo export</span>
                      <strong>{backupMeta.lastExportAt ? formatDateTimeHuman(backupMeta.lastExportAt) : 'Sin dato'}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Ultimo import</span>
                      <strong>{backupMeta.lastImportAt ? formatDateTimeHuman(backupMeta.lastImportAt) : 'Sin dato'}</strong>
                    </div>
                  </div>
                </details>
              </SectionCard>
            ) : null}
          </>
        ) : null}

        {safeActiveTab === 'foods' ? (
          <>
            <div className="split-layout foods-layout">
              <SectionCard title="Registro de alimentos" subtitle="Guarda comida, macros y notas del día.">
                <RecordForm
                  title="Nuevo alimento"
                  fields={[
                    { name: 'date', label: 'Fecha', type: 'date' },
                    { name: 'time', label: 'Hora', type: 'time' },
                    {
                      name: 'mealType',
                      label: 'Tipo de comida',
                      type: 'select',
                      options: [
                        { value: 'desayuno', label: 'Desayuno' },
                        { value: 'comida', label: 'Comida' },
                        { value: 'cena', label: 'Cena' },
                        { value: 'snack', label: 'Snack' },
                        { value: 'bebida', label: 'Bebida' },
                      ],
                    },
                    { name: 'name', label: 'Nombre del alimento', type: 'text', placeholder: 'Ej. Pechuga con arroz' },
                    { name: 'quantity', label: 'Cantidad', type: 'number', min: '0', step: '0.1' },
                    { name: 'unit', label: 'Unidad', type: 'text', placeholder: 'Ej. g, ml, pieza, taza' },
                    { name: 'category', label: 'Categoria opcional', type: 'text', placeholder: 'Ej. proteina, fruta, lacteo' },
                    { name: 'calories', label: 'Calorias', type: 'number', min: '0', step: '1' },
                    { name: 'protein', label: 'Proteina (g)', type: 'number', min: '0', step: '0.1' },
                    { name: 'carbs', label: 'Carbohidratos (g)', type: 'number', min: '0', step: '0.1' },
                    { name: 'fat', label: 'Grasa (g)', type: 'number', min: '0', step: '0.1' },
                    { name: 'costMxn', label: 'Costo (MXN)', type: 'number', min: '0', step: '0.01' },
                    { name: 'caffeineMg', label: 'Cafeina (mg)', type: 'number', min: '0', step: '1' },
                    { name: 'notes', label: 'Notas', type: 'textárea', placeholder: 'Cómo te sentiste, porcion, contexto...' },
                  ]}
                  formData={foodForm}
                  onChange={handleFormChange(setFoodForm)}
                  onSubmit={handleFoodSubmit}
                  onCancel={() => {
                    resetFoodForm();
                    setEditingFoodId(null);
                  }}
                  isEditing={Boolean(editingFoodId)}
                />
              </SectionCard>

              <SectionCard title="Registros recientes" subtitle="Vista compacta para editar, eliminar o reutilizar alimentos.">
                <EntryList
                  title="Alimentos"
                  emptyMessage="No hay alimentos registrados todavía."
                  className="entry-list-compact foods-recent-list"
                  items={visibleRecentFoods.map((item) => ({
                    ...item,
                    primaryLabel: item.name || 'Sin nombre',
                    secondaryLabel: `${formatDate(item.date)}${item.time ? ` · ${item.time}` : ''}${item.mealType ? ` · ${mealTypeLabels[item.mealType] || item.mealType}` : ''}`,
                  }))}
                  renderDetails={(item) => (
                    <>
                      {item.quantity || item.unit ? <span className="entry-chip-amount">{`${item.quantity || '--'} ${item.unit || ''}`.trim()}</span> : null}
                      {item.category ? <span>{item.category}</span> : null}
                      <span className="entry-chip-strong">{item.calories || 0} kcal</span>
                      <span className="entry-chip-strong">{item.protein || 0} g proteina</span>
                      <span>{item.carbs || 0} g carbos</span>
                      <span>{item.fat || 0} g grasa</span>
                      {item.costMxn ? <span>{`$${Number(item.costMxn).toFixed(2)} MXN`}</span> : null}
                      {item.caffeineMg ? <span>{`${item.caffeineMg} mg cafeina`}</span> : null}
                      {item.notes ? <span>{item.notes}</span> : null}
                    </>
                  )}
                  renderActions={(item) => (
                    <button className="button button-secondary" type="button" onClick={() => saveFoodAsTemplate(item.id)}>
                      Guardar como plantilla
                    </button>
                  )}
                  onEdit={(id) => startEditing('foods', id, setFoodForm, setEditingFoodId, 'foods')}
                  onDelete={(id) => deleteRecord('foods', id, setEditingFoodId, resetFoodForm)}
                />
                {recentFoods.length > 5 ? (
                  <div className="section-inline-actions">
                    <button className="button button-secondary" type="button" onClick={() => setShowAllRecentFoods((current) => !current)}>
                      {showAllRecentFoods ? 'Ver menos' : `Ver mas (${recentFoods.length - 5})`}
                    </button>
                  </div>
                ) : null}
              </SectionCard>
            </div>

            <div className="split-layout food-template-layout">
              <SectionCard title="Plantillas frecuentes" subtitle="Guarda alimentos repetidos para registrarlos mas rapido.">
                <div className="section-inline-actions section-inline-actions-tight">
                  <button className="button button-secondary" type="button" onClick={() => setShowFoodTemplateBuilder((current) => !current)}>
                    {showFoodTemplateBuilder ? 'Ocultar formulario' : 'Nueva plantilla'}
                  </button>
                </div>
                {showFoodTemplateBuilder ? (
                  <>
                    <RecordForm
                      title="Nueva plantilla"
                      fields={[
                        {
                          name: 'mealType',
                          label: 'Tipo de comida',
                          type: 'select',
                          options: [
                            { value: 'desayuno', label: 'Desayuno' },
                            { value: 'comida', label: 'Comida' },
                            { value: 'cena', label: 'Cena' },
                            { value: 'snack', label: 'Snack' },
                            { value: 'bebida', label: 'Bebida' },
                          ],
                        },
                        { name: 'name', label: 'Nombre del alimento', type: 'text', placeholder: 'Ej. Yogurt griego' },
                        { name: 'quantity', label: 'Cantidad', type: 'number', min: '0', step: '0.1' },
                        { name: 'unit', label: 'Unidad', type: 'text', placeholder: 'Ej. g, pieza, taza' },
                        { name: 'category', label: 'Categoria opcional', type: 'text', placeholder: 'Ej. proteina, fruta, lacteo' },
                        { name: 'calories', label: 'Calorias', type: 'number', min: '0', step: '1' },
                        { name: 'protein', label: 'Proteina (g)', type: 'number', min: '0', step: '0.1' },
                        { name: 'carbs', label: 'Carbohidratos (g)', type: 'number', min: '0', step: '0.1' },
                        { name: 'fat', label: 'Grasa (g)', type: 'number', min: '0', step: '0.1' },
                        { name: 'costMxn', label: 'Costo (MXN)', type: 'number', min: '0', step: '0.01' },
                        { name: 'caffeineMg', label: 'Cafeina (mg)', type: 'number', min: '0', step: '1' },
                        { name: 'notes', label: 'Notas opcionales', type: 'textárea', placeholder: 'Preparacion, marca o contexto...' },
                      ]}
                      formData={foodTemplateForm}
                      onChange={handleFormChange(setFoodTemplateForm)}
                      onSubmit={handleFoodTemplateSubmit}
                      onCancel={() => {
                        resetFoodTemplateForm();
                        setEditingFoodTemplateId(null);
                      }}
                      isEditing={Boolean(editingFoodTemplateId)}
                    />
                    <p className="section-helper">
                      Esta base tambien deja listo el camino para crear comidas completas mas adelante usando varias plantillas juntas.
                    </p>
                  </>
                ) : (
                  <p className="section-helper">Mantienes tus plantillas guardadas listas para usar hoy o cargar al formulario cuando lo necesites.</p>
                )}
              </SectionCard>

              <SectionCard title="Plantillas guardadas" subtitle="Usa una plantilla para agregarla rapido al dia actual o mantener tu biblioteca.">
                <div className="food-template-list">
                  {diaryData.foodTemplates.length === 0 ? (
                    <p className="empty-state">
                      Aun no tienes plantillas frecuentes. Guarda un alimento existente como plantilla o crea una nueva para registrar mas rapido.
                    </p>
                  ) : null}
                  {diaryData.foodTemplates.map((item) => (
                    <article className="food-template-card" key={item.id}>
                      <div className="food-template-top">
                        <div>
                          <strong>{item.name || 'Sin nombre'}</strong>
                          <span>{mealTypeLabels[item.mealType] || item.mealType}</span>
                        </div>
                        <button className="button button-primary" type="button" onClick={() => useFoodTemplate(item.id)}>
                          Usar hoy
                        </button>
                      </div>

                      <div className="entry-details">
                        {item.quantity || item.unit ? <span>{`${item.quantity || '--'} ${item.unit || ''}`.trim()}</span> : null}
                        {item.category ? <span>{item.category}</span> : null}
                        <span>{item.calories || 0} kcal</span>
                        <span>{item.protein || 0} g proteina</span>
                        <span>{item.carbs || 0} g carbohidratos</span>
                        <span>{item.fat || 0} g grasa</span>
                        {item.costMxn ? <span>{`$${Number(item.costMxn).toFixed(2)} MXN`}</span> : null}
                        {item.caffeineMg ? <span>{`${item.caffeineMg} mg cafeina`}</span> : null}
                      </div>

                      {item.notes ? <p className="food-template-notes">{item.notes}</p> : null}

                      <div className="entry-actions food-template-actions">
                        <button className="button button-secondary" type="button" onClick={() => loadFoodTemplateToForm(item.id)}>
                          Cargar al formulario
                        </button>
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={() => startEditing('foodTemplates', item.id, setFoodTemplateForm, setEditingFoodTemplateId, 'foods')}
                        >
                          Editar
                        </button>
                        <button className="button button-secondary" type="button" onClick={() => duplicateFoodTemplate(item.id)}>
                          Duplicar
                        </button>
                        <button
                          className="button button-danger"
                          type="button"
                          onClick={() => deleteRecord('foodTemplates', item.id, setEditingFoodTemplateId, resetFoodTemplateForm)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </SectionCard>
            </div>

            <div className="split-layout hydration-layout">
              <SectionCard title="Hidratación" subtitle="Registra agua, cafe, te y otras bebidas del día.">
                <RecordForm
                  title="Nueva bebida"
                  fields={[
                    { name: 'date', label: 'Fecha', type: 'date' },
                    { name: 'time', label: 'Hora', type: 'time' },
                    {
                      name: 'drinkType',
                      label: 'Tipo de bebida',
                      type: 'select',
                      options: Object.entries(drinkTypeLabels).map(([value, label]) => ({ value, label })),
                    },
                    { name: 'name', label: 'Nombre', type: 'text', placeholder: 'Ej. Agua con limon, espresso, suero cero' },
                    { name: 'quantity', label: 'Cantidad', type: 'number', min: '0', step: '0.1' },
                    {
                      name: 'unit',
                      label: 'Unidad',
                      type: 'select',
                      options: [
                        { value: 'ml', label: 'ml' },
                        { value: 'l', label: 'L' },
                      ],
                    },
                    {
                      name: 'containsCaffeine',
                      label: 'Contiene cafeina',
                      type: 'select',
                      options: [
                        { value: 'no', label: 'No' },
                        { value: 'si', label: 'Si' },
                      ],
                    },
                    {
                      name: 'containsElectrolytes',
                      label: 'Contiene electrolitos',
                      type: 'select',
                      options: [
                        { value: 'no', label: 'No' },
                        { value: 'si', label: 'Si' },
                      ],
                    },
                    { name: 'notes', label: 'Notas', type: 'textárea', placeholder: 'Marca, sensacion o contexto...' },
                  ]}
                  formData={hydrationForm}
                  onChange={handleFormChange(setHydrationForm)}
                  onSubmit={handleHydrationSubmit}
                  onCancel={() => {
                    resetHydrationForm();
                    setEditingHydrationId(null);
                  }}
                  isEditing={Boolean(editingHydrationId)}
                />
              </SectionCard>

              <SectionCard
                title="Registros de hidratacion"
                subtitle={`Meta base ${hydrationBaseGoal || 0} ml${todaysExercises.length > 0 && hydrationHighActivityGoal > 0 ? ` · Alta actividad ${hydrationHighActivityGoal} ml` : ''}`}
              >
                <div className="mini-stat-grid hydration-mini-grid">
                  <div className="mini-stat">
                    <span>Hoy</span>
                    <strong>{todaySummary.hydrationMl.toFixed(0)} ml</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Meta base</span>
                    <strong>{hydrationBaseGoal || 0} ml</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Alta actividad</span>
                    <strong>{hydrationHighActivityGoal || 0} ml</strong>
                  </div>
                </div>
                <EntryList
                  title="Bebidas"
                  emptyMessage="Aun no registras bebidas en hidratacion."
                  items={sortHydrationEntries(diaryData.hydrationEntries || []).map((item) => ({
                    ...item,
                    primaryLabel: item.name || drinkTypeLabels[item.drinkType] || 'Sin nombre',
                    secondaryLabel: `${formatDate(item.date)}${item.time ? ` · ${item.time}` : ''}${item.drinkType ? ` · ${drinkTypeLabels[item.drinkType] || item.drinkType}` : ''}`,
                  }))}
                  renderDetails={(item) => (
                    <>
                      <span>{`${item.quantity || '--'} ${item.unit || ''}`.trim()}</span>
                      <span>{`${getHydrationMl(item).toFixed(0)} ml`}</span>
                      <span>Cafeina: {item.containsCaffeine === 'si' ? 'Si' : 'No'}</span>
                      <span>Electrolitos: {item.containsElectrolytes === 'si' ? 'Si' : 'No'}</span>
                      {item.notes ? <span>{item.notes}</span> : null}
                    </>
                  )}
                  onEdit={(id) => startEditing('hydrationEntries', id, setHydrationForm, setEditingHydrationId, 'foods')}
                  onDelete={(id) => deleteRecord('hydrationEntries', id, setEditingHydrationId, resetHydrationForm)}
                />
              </SectionCard>
            </div>
          </>
        ) : null}
                {safeActiveTab === 'fasting' ? (
          <FastingTab
            isTodayFastingFree={isTodayFastingFree}
            toggleTodayNoFasting={toggleTodayNoFasting}
            hasActiveRealFastingLog={hasActiveRealFastingLog}
            activeFastingLog={activeFastingLog}
            fastingFeedback={fastingFeedback}
            displayedFastingStatusLabel={displayedFastingStatusLabel}
            displayedFastingSummaryText={displayedFastingSummaryText}
            displayedFastingProtocolLabel={displayedFastingProtocolLabel}
            activeFastingAutophagy={activeFastingAutophagy}
            shouldTreatTodayAsFastingFree={shouldTreatTodayAsFastingFree}
            displayedFastingStatus={displayedFastingStatus}
            displayedFastingElapsedLabel={displayedFastingElapsedLabel}
            activeFastingGoalHours={activeFastingGoalHours}
            formatHoursLabel={formatHoursLabel}
            activeFastingProgressLabel={activeFastingProgressLabel}
            displayedFastingDisplay={displayedFastingDisplay}
            getFastingStatusClass={getFastingStatusClass}
            activeFastingStatus={activeFastingStatus}
            displayedFastingProgressPercent={displayedFastingProgressPercent}
            displayedFastingBreakLabel={displayedFastingBreakLabel}
            activeFastingDifferenceHours={activeFastingDifferenceHours}
            activeFastingDifferenceText={activeFastingDifferenceText}
            formatDateTimeHuman={formatDateTimeHuman}
            startFastingNow={startFastingNow}
            breakFastingNow={breakFastingNow}
            markFastingAsCompleted={markFastingAsCompleted}
            clearFastingTimes={clearFastingTimes}
            editingFastingLogId={editingFastingLogId}
            resetFastingLogForm={resetFastingLogForm}
            setEditingFastingLogId={setEditingFastingLogId}
            setShowFastingManualForm={setShowFastingManualForm}
            showFastingManualForm={showFastingManualForm}
            fastingLogForm={fastingLogForm}
            handleFastingLogChange={handleFastingLogChange}
            handleFastingLogSubmit={handleFastingLogSubmit}
            fastingFeelingLabels={fastingFeelingLabels}
            sortedFastingLogs={sortedFastingLogs}
            getFastingStatusLabel={getFastingStatusLabel}
            fastingNow={fastingNow}
            getFastingElapsedHours={getFastingElapsedHours}
            getEffectiveFastingTargetHours={getEffectiveFastingTargetHours}
            formatFastingStatusCopy={formatFastingStatusCopy}
            getEstimatedFastingBreakDateTime={getEstimatedFastingBreakDateTime}
            formatDate={formatDate}
            startEditing={startEditing}
            deleteRecord={deleteRecord}
            startNocturnalFasting={startNocturnalFasting}
            start36HourFasting={start36HourFasting}
            start72HourFasting={start72HourFasting}
            showFastingProtocolBuilder={showFastingProtocolBuilder}
            setShowFastingProtocolBuilder={setShowFastingProtocolBuilder}
            fastingProtocolForm={fastingProtocolForm}
            fastingDayLabels={fastingDayLabels}
            fastingTypeLabels={fastingTypeLabels}
            handleFastingProtocolChange={handleFastingProtocolChange}
            handleFastingProtocolSubmit={handleFastingProtocolSubmit}
            resetFastingProtocolForm={resetFastingProtocolForm}
            setEditingFastingProtocolId={setEditingFastingProtocolId}
            editingFastingProtocolId={editingFastingProtocolId}
            sortedFastingProtocols={sortedFastingProtocols}
            formatProtocolLabel={formatProtocolLabel}
            setFastingLogForm={setFastingLogForm}
            setFastingProtocolForm={setFastingProtocolForm}
          />
        ) : null}
        {safeActiveTab === 'supplements' ? (<SupplementsTab>
          <>
            <div className="supplement-summary-grid">
              <div className="supplement-summary-card">
                <span>Total visible hoy</span>
                <strong>{visibleSupplementSummary.total}</strong>
              </div>
              <div className="supplement-summary-card">
                <span>Tomados hoy</span>
                <strong>{visibleSupplementSummary.taken}</strong>
              </div>
              <div className="supplement-summary-card">
                <span>Pendientes hoy</span>
                <strong>{visibleSupplementSummary.pending}</strong>
              </div>
              <div className="supplement-summary-card">
                <span>Medicamentos hoy</span>
                <strong>{visibleSupplementSummary.medications}</strong>
              </div>
            </div>

            <SectionCard
              title="Checklist base del día"
              subtitle="Recordatorio rápido para suplementos recomendados y marcación ligera del día."
              className="card-soft supplement-checklist-card"
            >
              <div className="supplement-checklist-grid">
                {dailySupplementChecklist.map((item) => (
                  <button
                    key={item.key}
                    className={`supplement-checklist-item ${item.checked ? 'supplement-checklist-item-checked' : ''}`}
                    type="button"
                    onClick={() => toggleRecommendedSupplement(item)}
                  >
                    <span
                      className={`supplement-checklist-mark ${item.checked ? 'supplement-checklist-mark-checked' : ''}`}
                      aria-hidden="true"
                    >
                      {item.checked ? '✓' : ''}
                    </span>
                    <span className="supplement-checklist-copy">
                      <strong>{item.name}</strong>
                      <small>
                        {supplementCategoryLabels[item.category] || item.category}
                        {item.checked ? ' · tomado hoy' : ' · pendiente'}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            </SectionCard>

            {todaySummary.supplementsPendingToday > 0 ? (
              <div className="alert-banner">
                <strong>Pendientes del día:</strong> tienes {todaySummary.supplementsPendingToday} suplemento(s) o medicamento(s) aún sin marcar como tomados.
              </div>
            ) : null}

            <div className="supplement-routines-grid">
              <SectionCard title="Rutinas de suplementos" subtitle="Plantillas base para aplicar rapido durante el día." className="supplement-section-card">
                <div className="section-inline-actions section-inline-actions-tight">
                  <button className="button button-secondary" type="button" onClick={() => setShowRoutineBuilder((current) => !current)}>
                    {showRoutineBuilder ? 'Ocultar constructor' : 'Nueva rutina'}
                  </button>
                </div>
                {showRoutineBuilder ? (
                  <div className="routine-builder routine-builder-compact">
                    <label className="field">
                      <span>Nombre de la rutina</span>
                      <input
                        type="text"
                        value={routineName}
                        onChange={(event) => setRoutineName(event.target.value)}
                        placeholder="Ej. Rutina manana"
                      />
                    </label>

                    <form className="routine-item-form" onSubmit={handleRoutineItemSubmit}>
                      <div className="form-grid">
                        <label className="field">
                          <span>Nombre</span>
                          <input
                            name="name"
                            type="text"
                            value={routineItemForm.name}
                            onChange={handleFormChange(setRoutineItemForm)}
                            placeholder="Ej. Magnesio"
                          />
                        </label>

                        <label className="field">
                          <span>Categoria</span>
                          <select name="category" value={routineItemForm.category} onChange={handleFormChange(setRoutineItemForm)}>
                            {supplementFilterOptions
                              .filter((option) => option.value !== 'todos')
                              .map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                          </select>
                        </label>

                        <label className="field">
                          <span>Dosis</span>
                          <input name="dose" type="number" min="0" step="0.1" value={routineItemForm.dose} onChange={handleFormChange(setRoutineItemForm)} />
                        </label>

                        <label className="field">
                          <span>Unidad</span>
                          <input name="unit" type="text" value={routineItemForm.unit} onChange={handleFormChange(setRoutineItemForm)} placeholder="mg, capsulas, ml" />
                        </label>

                        <label className="field">
                          <span>Momento del dia</span>
                          <select name="daytime" value={routineItemForm.daytime} onChange={handleFormChange(setRoutineItemForm)}>
                            {Object.entries(daytimeLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="field">
                          <span>Relacion con comida</span>
                          <select name="foodRelation" value={routineItemForm.foodRelation} onChange={handleFormChange(setRoutineItemForm)}>
                            {Object.entries(foodRelationLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="field">
                          <span>Frecuencia</span>
                          <select name="frequency" value={routineItemForm.frequency} onChange={handleFormChange(setRoutineItemForm)}>
                            {Object.entries(frequencyLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="field field-full">
                          <span>Notas</span>
                          <textárea
                            name="notes"
                            value={routineItemForm.notes}
                            onChange={handleFormChange(setRoutineItemForm)}
                            rows="2"
                            placeholder="Indicaciones o contexto de la rutina..."
                          />
                        </label>
                      </div>

                      <div className="form-actions">
                        <button className="button button-primary" type="submit">
                          Agregar a rutina
                        </button>
                      </div>
                    </form>

                    <div className="routine-preview-list">
                      {routineItems.length === 0 ? <p className="empty-state">Todavia no agregas suplementos a esta rutina.</p> : null}
                      {routineItems.map((item) => (
                        <article className="routine-preview-item" key={item.id}>
                          <div>
                            <strong>{item.name}</strong>
                            <span>{`${supplementCategoryLabels[item.category] || item.category} · ${item.dose || '--'} ${item.unit || ''}`.trim()}</span>
                          </div>
                          <button className="button button-danger" type="button" onClick={() => removeRoutineItem(item.id)}>
                            Quitar
                          </button>
                        </article>
                      ))}
                    </div>

                    <div className="form-actions">
                      <button className="button button-primary" type="button" onClick={saveRoutine}>
                        Guardar rutina
                      </button>
                      <button className="button button-secondary" type="button" onClick={resetRoutineBuilder}>
                        Limpiar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="section-helper">Tus rutinas quedan listas para aplicar rapido cuando las necesites.</p>
                )}
              </SectionCard>

              <SectionCard title="Rutinas guardadas" subtitle="Biblioteca de rutinas listas para aplicar." className="supplement-section-card">
                <div className="routine-saved-list">
                  {diaryData.routines.length === 0 ? <p className="empty-state">Aun no has guardado rutinas.</p> : null}
                  {diaryData.routines.map((routine) => (
                    <article className="routine-card" key={routine.id}>
                      <div className="routine-card-top">
                        <div>
                          <strong>{routine.name}</strong>
                          <span>{routine.items.length} suplemento(s) en esta rutina</span>
                        </div>
                        <button className="button button-primary" type="button" onClick={() => applyRoutine(routine.id)}>
                          Aplicar rutina
                        </button>
                      </div>

                      <div className="entry-details">
                        {routine.items.map((item, index) => (
                          <span key={`${routine.id}-${index}`}>
                            {item.name} ({item.dose || '--'} {item.unit || ''})
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </SectionCard>
            </div>

            <div className="split-layout supplement-layout">
              <SectionCard title="Registro de suplementos" subtitle="Guarda suplementos, vitaminas, medicamentos y apoyo de entrenamiento.">
                <RecordForm
                  title="Nuevo registro"
                  fields={[
                    { name: 'date', label: 'Fecha', type: 'date' },
                    { name: 'time', label: 'Hora', type: 'time' },
                    { name: 'name', label: 'Nombre', type: 'text', placeholder: 'Ej. Magnesio, Omega 3, Creatina' },
                    {
                      name: 'category',
                      label: 'Categoria',
                      type: 'select',
                      options: [
                        { value: 'suplemento', label: 'Suplemento' },
                        { value: 'medicamento', label: 'Medicamento' },
                        { value: 'pre-entreno', label: 'Pre entreno' },
                        { value: 'post-entreno', label: 'Post entreno' },
                        { value: 'vitamina', label: 'Vitamina' },
                        { value: 'mineral', label: 'Mineral' },
                        { value: 'hormonal', label: 'Hormonal' },
                        { value: 'otro', label: 'Otro' },
                      ],
                    },
                    { name: 'dose', label: 'Dosis', type: 'number', min: '0', step: '0.1' },
                    { name: 'unit', label: 'Unidad', type: 'text', placeholder: 'mg, g, capsulas, ml' },
                    { name: 'stockRemaining', label: 'Stock restante (opcional)', type: 'number', min: '0', step: '0.1' },
                    {
                      name: 'daytime',
                      label: 'Momento del dia',
                      type: 'select',
                      options: [
                        { value: 'manana', label: 'Manana' },
                        { value: 'mediodia', label: 'Mediodia' },
                        { value: 'tarde', label: 'Tarde' },
                        { value: 'noche', label: 'Noche' },
                      ],
                    },
                    {
                      name: 'foodRelation',
                      label: 'Relacion con comida',
                      type: 'select',
                      options: [
                        { value: 'ayuno', label: 'En ayuno' },
                        { value: 'antes-comer', label: 'Antes de comer' },
                        { value: 'con-comida', label: 'Con comida' },
                        { value: 'despues-comer', label: 'Despues de comer' },
                        { value: 'no-aplica', label: 'No aplica' },
                      ],
                    },
                    {
                      name: 'frequency',
                      label: 'Frecuencia',
                      type: 'select',
                      options: [
                        { value: 'diario', label: 'Diario' },
                        { value: 'algunos-dias', label: 'Algunos dias' },
                        { value: 'ocasional', label: 'Ocasional' },
                      ],
                    },
                    {
                      name: 'taken',
                      label: 'Tomado',
                      type: 'select',
                      options: [
                        { value: 'si', label: 'Si' },
                        { value: 'no', label: 'No' },
                      ],
                    },
                    { name: 'notes', label: 'Notas', type: 'textárea', placeholder: 'Efecto, observaciones o recordatorios...' },
                  ]}
                  formData={supplementForm}
                  onChange={handleFormChange(setSupplementForm)}
                  onSubmit={handleSupplementSubmit}
                  onCancel={() => {
                    resetSupplementForm();
                    setEditingSupplementId(null);
                  }}
                  isEditing={Boolean(editingSupplementId)}
                />
              </SectionCard>

              <SectionCard title="Registros recientes del dia" subtitle="Pendientes y tomados con prioridad visual en lo que falta." className="supplement-section-card">
                <div className="supplement-filter-bar">
                  {supplementFilterOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`filter-chip ${supplementFilter === option.value ? 'filter-chip-active' : ''}`}
                      type="button"
                      onClick={() => setSupplementFilter(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="supplement-card-list">
                  {visibleSupplements.length === 0 ? (
                    <p className="empty-state">No hay suplementos o medicamentos registrados todavía.</p>
                  ) : null}

                  {pendingSupplements.length > 0 ? (
                    <div className={`supplement-block supplement-block-pending ${pendingSupplements.length === 1 ? 'supplement-block-pending-single' : ''}`}>
                      <div className="supplement-block-header">
                        <h3>Pendientes</h3>
                        <div className="supplement-block-actions">
                          <span>{pendingSupplements.length}</span>
                          <button className="button button-primary" type="button" onClick={markAllVisiblePendingAsTaken}>
                            Marcar todos como tomados
                          </button>
                        </div>
                      </div>

                      {pendingSupplements.map((item) => (
                        <article className="supplement-card supplement-card-pending" key={item.id}>
                          <div className="supplement-card-top">
                            <div>
                              <strong>{item.name || 'Sin nombre'}</strong>
                              <span>
                                {supplementCategoryLabels[item.category] || item.category}
                                {item.time ? ` · ${item.time}` : ''}
                              </span>
                            </div>
                            <span className="supplement-status supplement-status-wait">Pendiente</span>
                          </div>

                          <div className="entry-details supplement-details">
                            <span>{`${item.dose || '--'} ${item.unit || ''}`.trim()}</span>
                            {item.stockRemaining ? <span>Stock: {item.stockRemaining}</span> : null}
                            <span>{daytimeLabels[item.daytime] || item.daytime}</span>
                            <span>{foodRelationLabels[item.foodRelation] || item.foodRelation}</span>
                            <span>{frequencyLabels[item.frequency] || item.frequency}</span>
                            <span>{formatDate(item.date)}</span>
                          </div>

                          {item.notes ? (
                            <details className="inline-details">
                              <summary>Ver notas</summary>
                              <p className="supplement-notes">{item.notes}</p>
                            </details>
                          ) : null}

                          <div className="entry-actions">
                            <button className="button button-primary" type="button" onClick={() => markSupplementAsTaken(item.id)}>
                              Marcar como tomado
                            </button>
                            <button className="button button-secondary" type="button" onClick={() => duplicateSupplement(item.id)}>
                              Duplicar
                            </button>
                            <button className="button button-secondary" type="button" onClick={() => startEditing('supplements', item.id, setSupplementForm, setEditingSupplementId, 'supplements')}>
                              Editar
                            </button>
                            <button className="button button-danger" type="button" onClick={() => deleteRecord('supplements', item.id, setEditingSupplementId, resetSupplementForm)}>
                              Eliminar
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}

                  {takenSupplements.length > 0 ? (
                    <div className="supplement-block">
                      <div className="supplement-block-header">
                        <h3>Tomados</h3>
                        <span>{takenSupplements.length}</span>
                      </div>

                      {takenSupplements.map((item) => (
                        <article className="supplement-card supplement-card-taken" key={item.id}>
                          <div className="supplement-card-top">
                            <div>
                              <strong>{item.name || 'Sin nombre'}</strong>
                              <span>
                                {supplementCategoryLabels[item.category] || item.category}
                                {item.time ? ` · ${item.time}` : ''}
                              </span>
                            </div>
                            <span className="supplement-status supplement-status-ok">Tomado</span>
                          </div>

                          <div className="entry-details supplement-details">
                            <span>{`${item.dose || '--'} ${item.unit || ''}`.trim()}</span>
                            {item.stockRemaining ? <span>Stock: {item.stockRemaining}</span> : null}
                            <span>{daytimeLabels[item.daytime] || item.daytime}</span>
                            <span>{foodRelationLabels[item.foodRelation] || item.foodRelation}</span>
                            <span>{frequencyLabels[item.frequency] || item.frequency}</span>
                            <span>{formatDate(item.date)}</span>
                          </div>

                          {item.notes ? (
                            <details className="inline-details">
                              <summary>Ver notas</summary>
                              <p className="supplement-notes">{item.notes}</p>
                            </details>
                          ) : null}

                          <div className="entry-actions">
                            <button className="button button-secondary" type="button" onClick={() => duplicateSupplement(item.id)}>
                              Duplicar
                            </button>
                            <button className="button button-secondary" type="button" onClick={() => startEditing('supplements', item.id, setSupplementForm, setEditingSupplementId, 'supplements')}>
                              Editar
                            </button>
                            <button className="button button-danger" type="button" onClick={() => deleteRecord('supplements', item.id, setEditingSupplementId, resetSupplementForm)}>
                              Eliminar
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            </div>
          </>
          </SupplementsTab>
        ) : null}
        {safeActiveTab === 'exercises' ? (
          <>
            <div className="exercise-summary-grid">
              <div className="exercise-summary-card">
                <span>Minutos visibles</span>
                <strong>{visibleExerciseSummary.totalMinutes}</strong>
              </div>
              <div className="exercise-summary-card">
                <span>Calorias visibles</span>
                <strong>{visibleExerciseSummary.totalCalories}</strong>
              </div>
              <div className="exercise-summary-card">
                <span>Sesiones visibles</span>
                <strong>{visibleExerciseSummary.sessions}</strong>
              </div>
              <div className="exercise-summary-card">
                <span>Sesiones cardio visibles</span>
                <strong>{visibleExerciseSummary.cardio}</strong>
              </div>
              <div className="exercise-summary-card">
                <span>Sesiones fuerza visibles</span>
                <strong>{visibleExerciseSummary.strength}</strong>
              </div>
            </div>

            <SectionCard
              title="Resumen del dia"
              subtitle="Solo considera lo registrado en la fecha actual."
              className="card-soft"
            >
              <div className="exercise-day-summary">
                <p>Hoy registraste {todaySummary.exerciseEntries} sesiones.</p>
                <p>Quemaste {todaySummary.exerciseCalories} kcal.</p>
                <p>Hiciste {todaySummary.exerciseMinutes} min de actividad.</p>
              </div>
            </SectionCard>

            <div className="split-layout exercise-layout">
              <SectionCard title="Registro de ejercicio" subtitle="Guarda actividad fisica del dia con mas contexto y seguimiento.">
                <RecordForm
                  title="Nuevo ejercicio"
                  fields={[
                    { name: 'date', label: 'Fecha', type: 'date' },
                    { name: 'time', label: 'Hora', type: 'time' },
                    { name: 'name', label: 'Nombre del ejercicio', type: 'text', placeholder: 'Ej. Trote suave, rutina torso, caminata larga' },
                    {
                      name: 'modality',
                      label: 'Modalidad',
                      type: 'select',
                      options: [
                        { value: 'cardio', label: 'Cardio' },
                        { value: 'pesas', label: 'Pesas' },
                        { value: 'caminata', label: 'Caminata' },
                        { value: 'krav-maga', label: 'Krav Maga' },
                        { value: 'movilidad', label: 'Movilidad' },
                        { value: 'recuperacion', label: 'Recuperacion' },
                        { value: 'otro', label: 'Otro' },
                      ],
                    },
                    { name: 'duration', label: 'Duracion (minutos)', type: 'number', min: '0', step: '1' },
                    { name: 'caloriesBurned', label: 'Calorias quemadas', type: 'number', min: '0', step: '1' },
                    { name: 'distance', label: 'Distancia', type: 'number', min: '0', step: '0.1' },
                    {
                      name: 'distanceUnit',
                      label: 'Unidad de distancia',
                      type: 'select',
                      options: [
                        { value: 'km', label: 'km' },
                        { value: 'millas', label: 'millas' },
                        { value: 'metros', label: 'metros' },
                        { value: 'no-aplica', label: 'no aplica' },
                      ],
                    },
                    {
                      name: 'intensity',
                      label: 'Intensidad',
                      type: 'select',
                      options: [
                        { value: 'baja', label: 'Baja' },
                        { value: 'media', label: 'Media' },
                        { value: 'alta', label: 'Alta' },
                      ],
                    },
                    {
                      name: 'completed',
                      label: 'Completado',
                      type: 'select',
                      options: [
                        { value: 'si', label: 'Si' },
                        { value: 'no', label: 'No' },
                      ],
                    },
                    { name: 'notes', label: 'Notas', type: 'textárea', placeholder: 'Sensaciones, serie, ritmo, observaciones...' },
                  ]}
                  formData={exerciseForm}
                  onChange={handleFormChange(setExerciseForm)}
                  onSubmit={handleExerciseSubmit}
                  onCancel={() => {
                    resetExerciseForm();
                    setEditingExerciseId(null);
                  }}
                  isEditing={Boolean(editingExerciseId)}
                />
              </SectionCard>

              <SectionCard title="Sesiones registradas" subtitle="Filtra por modalidad y revisa lo pendiente o completado." className="exercise-section-card">
                <div className="exercise-filter-bar">
                  {exerciseFilterOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`filter-chip ${exerciseFilter === option.value ? 'filter-chip-active' : ''}`}
                      type="button"
                      onClick={() => setExerciseFilter(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="exercise-card-list">
                  {visibleExercises.length === 0 ? <p className="empty-state">No hay ejercicios registrados todavía.</p> : null}

                  {pendingExercises.length > 0 ? (
                    <div className="exercise-block">
                      <div className="exercise-block-header">
                        <h3>Pendientes</h3>
                        <span>{pendingExercises.length}</span>
                      </div>

                      {pendingExercises.map((item) => (
                        <article className="exercise-card exercise-card-pending" key={item.id}>
                          <div className="exercise-card-top">
                            <div>
                              <strong>{item.name || 'Sin nombre'}</strong>
                              <span>
                                {exerciseModalityLabels[item.modality] || item.modality}
                                {item.time ? ` · ${item.time}` : ''}
                              </span>
                            </div>
                            <span className="exercise-status exercise-status-wait">Pendiente</span>
                          </div>

                          <div className="entry-details exercise-details">
                            <span>{item.duration || 0} min</span>
                            <span>{item.caloriesBurned || 0} kcal</span>
                            {item.distance && item.distanceUnit !== 'no-aplica' ? <span>{`${item.distance} ${item.distanceUnit}`}</span> : null}
                            <span>{exerciseIntensityLabels[item.intensity] || item.intensity}</span>
                            <span>{formatDate(item.date)}</span>
                          </div>

                          {item.notes ? <p className="exercise-notes">{item.notes}</p> : null}

                          <div className="entry-actions">
                            <button className="button button-primary" type="button" onClick={() => markExerciseAsCompleted(item.id)}>
                              Marcar como completado
                            </button>
                            <button className="button button-secondary" type="button" onClick={() => duplicateExercise(item.id)}>
                              Duplicar
                            </button>
                            <button className="button button-secondary" type="button" onClick={() => startEditing('exercises', item.id, setExerciseForm, setEditingExerciseId, 'exercises')}>
                              Editar
                            </button>
                            <button className="button button-danger" type="button" onClick={() => deleteRecord('exercises', item.id, setEditingExerciseId, resetExerciseForm)}>
                              Eliminar
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}

                  {completedExercises.length > 0 ? (
                    <div className="exercise-block">
                      <div className="exercise-block-header">
                        <h3>Completados</h3>
                        <span>{completedExercises.length}</span>
                      </div>

                      {completedExercises.map((item) => (
                        <article className="exercise-card exercise-card-completed" key={item.id}>
                          <div className="exercise-card-top">
                            <div>
                              <strong>{item.name || 'Sin nombre'}</strong>
                              <span>
                                {exerciseModalityLabels[item.modality] || item.modality}
                                {item.time ? ` · ${item.time}` : ''}
                              </span>
                            </div>
                            <span className="exercise-status exercise-status-ok">Completado</span>
                          </div>

                          <div className="entry-details exercise-details">
                            <span>{item.duration || 0} min</span>
                            <span>{item.caloriesBurned || 0} kcal</span>
                            {item.distance && item.distanceUnit !== 'no-aplica' ? <span>{`${item.distance} ${item.distanceUnit}`}</span> : null}
                            <span>{exerciseIntensityLabels[item.intensity] || item.intensity}</span>
                            <span>{formatDate(item.date)}</span>
                          </div>

                          {item.notes ? <p className="exercise-notes">{item.notes}</p> : null}

                          <div className="entry-actions">
                            <button className="button button-secondary" type="button" onClick={() => duplicateExercise(item.id)}>
                              Duplicar
                            </button>
                            <button className="button button-secondary" type="button" onClick={() => startEditing('exercises', item.id, setExerciseForm, setEditingExerciseId, 'exercises')}>
                              Editar
                            </button>
                            <button className="button button-danger" type="button" onClick={() => deleteRecord('exercises', item.id, setEditingExerciseId, resetExerciseForm)}>
                              Eliminar
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            </div>
          </>
        ) : null}

        {safeActiveTab === 'krav' ? (<KravMagaTab>
          <div className="krav-board">
            <SectionCard
              title="Tablero de avance"
              subtitle="Lectura ejecutiva del currículo rumbo a cinta naranja."
              className="card-soft krav-panel krav-panel-progress"
            >
              <div className="metrics-summary-grid krav-progress-grid">
                <article className="metrics-summary-card krav-progress-card">
                  <span>% total de avance</span>
                  <strong>{formatKravPercent(kravProgress.totalProgress)}</strong>
                  <div className="krav-progress-track" aria-hidden="true">
                    <span style={{ width: `${Math.max(0, Math.min(100, Math.round((kravProgress.totalProgress || 0) * 100)))}%` }} />
                  </div>
                  <small>Promedio global de dominio técnico.</small>
                </article>
                <article className="metrics-summary-card krav-progress-card">
                  <span>% striking</span>
                  <strong>{formatKravPercent(kravProgress.categoryProgress.striking)}</strong>
                  <div className="krav-progress-track" aria-hidden="true">
                    <span style={{ width: `${Math.max(0, Math.min(100, Math.round(((kravProgress.categoryProgress.striking || 0) * 100))))}%` }} />
                  </div>
                  <small>Golpeo, combos y codos.</small>
                </article>
                <article className="metrics-summary-card krav-progress-card">
                  <span>% defensa personal</span>
                  <strong>{formatKravPercent(kravProgress.categoryProgress['defensa-personal'])}</strong>
                  <div className="krav-progress-track" aria-hidden="true">
                    <span
                      style={{
                        width: `${Math.max(0, Math.min(100, Math.round(((kravProgress.categoryProgress['defensa-personal'] || 0) * 100))))}%`,
                      }}
                    />
                  </div>
                  <small>Defensas, abrazos y salidas.</small>
                </article>
                <article className="metrics-summary-card krav-progress-card">
                  <span>% grappling</span>
                  <strong>{formatKravPercent(kravProgress.categoryProgress.grappling)}</strong>
                  <div className="krav-progress-track" aria-hidden="true">
                    <span style={{ width: `${Math.max(0, Math.min(100, Math.round(((kravProgress.categoryProgress.grappling || 0) * 100))))}%` }} />
                  </div>
                  <small>Piso, derribos y control de posición.</small>
                </article>
                <article className="metrics-summary-card krav-progress-card">
                  <span>% sparring</span>
                  <strong>{formatKravPercent(kravProgress.categoryProgress.sparring)}</strong>
                  <div className="krav-progress-track" aria-hidden="true">
                    <span style={{ width: `${Math.max(0, Math.min(100, Math.round(((kravProgress.categoryProgress.sparring || 0) * 100))))}%` }} />
                  </div>
                  <small>Drills vivos y lectura de combate.</small>
                </article>
              </div>
            </SectionCard>

            <SectionCard
              title="Próxima técnica a repasar"
              subtitle="La siguiente técnica priorizada por nivel y tiempo sin práctica."
              className="card-soft krav-panel krav-panel-next"
            >
              {nextKravTechnique ? (
                <div className="krav-next-card">
                  <div className="krav-next-head">
                    <div className="krav-heading-copy">
                      <strong>{nextKravTechnique.name}</strong>
                      <span className="krav-meta-line">
                        {kravCategoryLabels[nextKravTechnique.category] || nextKravTechnique.category} ·{' '}
                        {kravStageLabels[nextKravTechnique.stage] || nextKravTechnique.stage}
                      </span>
                      <small>{kravPriorityReason}</small>
                    </div>
                    <div className="krav-chip-row">
                      <span className="metrics-source-chip">Nivel {nextKravTechnique.level}/4</span>
                      <span className="metrics-source-chip">{nextKravTechnique.isExamRelevant ? 'Relevante para examen' : 'Apoyo técnico'}</span>
                    </div>
                  </div>
                  <div className="entry-details">
                    <span>{formatKravDaysWithoutPractice(nextKravTechnique.daysSincePractice)}</span>
                    <span>Dominio técnico {formatKravPercent(getKravTechniqueProgress(nextKravTechnique.level))}</span>
                  </div>
                  {nextKravTechnique.description ? <p className="metrics-notes">{nextKravTechnique.description}</p> : null}
                  <div className="entry-actions">
                    <button
                      className="button button-primary"
                      type="button"
                      onClick={() => handleKravTechniquePractice(nextKravTechnique.id)}
                    >
                      Practiqué hoy
                    </button>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => handleKravTechniqueLevelChange(nextKravTechnique.id, -1)}
                      disabled={(Number(nextKravTechnique.level) || 0) <= 0}
                    >
                      Bajar nivel
                    </button>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => handleKravTechniqueLevelChange(nextKravTechnique.id, 1)}
                      disabled={(Number(nextKravTechnique.level) || 0) >= 4}
                    >
                      Subir nivel
                    </button>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => openKravTechniqueDetails(nextKravTechnique.id)}
                    >
                      Ver técnica
                    </button>
                  </div>
                </div>
              ) : (
                <p className="empty-state">Aún no hay técnicas cargadas para priorizar el siguiente repaso.</p>
              )}
            </SectionCard>

            <SectionCard
              title="Meta de examen"
              subtitle="Referencia actual rumbo al siguiente examen."
              className="card-soft krav-panel krav-panel-goal"
            >
              <div className="mini-stat-grid">
                <div className="mini-stat">
                  <span>Cinta actual</span>
                  <strong>{kravDashboardSnapshot.currentBelt}</strong>
                </div>
                <div className="mini-stat">
                  <span>Cinta objetivo</span>
                  <strong>{kravDashboardSnapshot.targetBelt}</strong>
                </div>
                <div className="mini-stat">
                  <span>Fecha de examen</span>
                  <strong>{kravDashboardSnapshot.examDate ? kravDashboardSnapshot.examDateLabel : 'Pendiente'}</strong>
                  <small>{kravDashboardSnapshot.examCountdownLabel || 'Examen sin fecha definida'}</small>
                </div>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span>Cinta actual</span>
                  <select name="currentBelt" value={kravSettings.currentBelt || 'amarilla'} onChange={handleKravSettingsFieldChange}>
                    {kravBeltOptions.map((option) => (
                      <option key={`current-${option}`} value={option}>
                        {formatKravBeltLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Cinta objetivo</span>
                  <select name="targetBelt" value={kravSettings.targetBelt || 'naranja'} onChange={handleKravSettingsFieldChange}>
                    {kravBeltOptions.map((option) => (
                      <option key={`target-${option}`} value={option}>
                        {formatKravBeltLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Fecha de examen</span>
                  <input name="examDate" type="date" value={kravSettings.examDate || ''} onChange={handleKravSettingsFieldChange} />
                </label>
              </div>
              <p className="section-helper">
                {kravDashboardSnapshot.examDate
                  ? `Examen programado: ${kravDashboardSnapshot.examDateLabel}${kravDashboardSnapshot.examCountdownLabel ? ` · ${kravDashboardSnapshot.examCountdownLabel}` : ''}`
                  : 'Examen sin fecha definida.'}
              </p>
            </SectionCard>

            <SectionCard
              title="Estado de examen"
              subtitle={`Estado rumbo a cinta ${kravSettings.targetBelt || 'naranja'}.`}
              className="card-soft krav-panel krav-panel-exam"
            >
              <div className="krav-exam-card">
                <div className="krav-exam-head">
                  <div className="krav-heading-copy">
                    <strong>
                      {kravExamStatus.status === 'listo'
                        ? 'Listo para examen'
                        : kravExamStatus.status === 'riesgo-medio'
                          ? 'Riesgo medio'
                          : 'Riesgo alto'}
                    </strong>
                    <span className="krav-meta-line">Promedio global actual · {kravExamStatus.averageLevel.toFixed(1)} / 4</span>
                    <small>Lectura rápida de riesgo para no llegar al examen con huecos técnicos.</small>
                  </div>
                  <span className={`krav-risk-chip krav-risk-chip-${kravExamStatus.status}`}>
                    {kravExamStatus.status === 'listo'
                      ? 'Listo'
                      : kravExamStatus.status === 'riesgo-medio'
                        ? 'Atención'
                        : 'Prioridad'}
                  </span>
                </div>
                <div className="mini-stat-grid">
                  <div className="mini-stat">
                    <span>Técnicas pendientes</span>
                    <strong>{kravExamStatus.pendingTechniques}</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Técnicas en nivel 0 o 1</span>
                    <strong>{kravExamStatus.lowTechniques}</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Técnicas olvidadas (+5 días)</span>
                    <strong>{kravExamStatus.forgottenTechniques}</strong>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Currículo"
              subtitle="Currículo operativo de cinta naranja organizado por categoría."
              className="card-soft krav-panel krav-panel-curriculum"
            >
              {selectedKravTechnique ? (
                <div className="krav-technique-detail" id="krav-curriculum-detail" ref={kravTechniqueDetailRef}>
                  <span className="krav-feature-label">Técnica destacada</span>
                  <div className="krav-technique-detail-head">
                    <div className="krav-heading-copy">
                      <strong>{selectedKravTechnique.name}</strong>
                      <span className="krav-meta-line">
                        {kravCategoryLabels[selectedKravTechnique.category] || selectedKravTechnique.category} ·{' '}
                        {kravStageLabels[selectedKravTechnique.stage] || selectedKravTechnique.stage}
                      </span>
                      <small>
                        {selectedKravTechnique.isExamRelevant ? 'Técnica relevante para examen' : 'Técnica de apoyo'}
                      </small>
                    </div>
                    <div className="krav-chip-row">
                      <span className="metrics-source-chip">Nivel {selectedKravTechnique.level}/4</span>
                      <span className="metrics-source-chip">
                        {formatKravDaysWithoutPractice(getDaysSincePractice(selectedKravTechnique.lastPracticedAt, currentDate))}
                      </span>
                    </div>
                  </div>
                  <div className="entry-details">
                    <span>Dominio técnico {formatKravPercent(getKravTechniqueProgress(selectedKravTechnique.level))}</span>
                    <span>{selectedKravTechnique.videoUrl ? 'Video disponible' : 'Sin video cargado'}</span>
                  </div>
                  <div className="krav-detail-copy">
                    {selectedKravTechnique.description ? <p className="metrics-notes">{selectedKravTechnique.description}</p> : null}
                    {selectedKravTechnique.tips ? <p className="metrics-notes">Tip: {selectedKravTechnique.tips}</p> : null}
                  </div>
                  <label className="field field-full">
                    <span>Notas técnicas</span>
                    <textárea
                      rows="3"
                      value={kravTechniqueNoteDraft}
                      onChange={(event) => setKravTechniqueNoteDraft(event.target.value)}
                      placeholder="Puntos clave, correcciones del coach o recordatorios para el examen..."
                    />
                  </label>
                  <div className="entry-actions">
                    <button className="button button-primary" type="button" onClick={saveKravTechniqueNotes}>
                      Guardar notas
                    </button>
                    <button className="button button-secondary" type="button" onClick={() => handleKravTechniquePractice(selectedKravTechnique.id)}>
                      Practiqué hoy
                    </button>
                    <button className="button button-secondary" type="button" onClick={() => openKravTechniqueDetails(selectedKravTechnique.id)}>
                      Ver técnica
                    </button>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => handleKravTechniqueLevelChange(selectedKravTechnique.id, -1)}
                      disabled={(Number(selectedKravTechnique.level) || 0) <= 0}
                    >
                      Bajar nivel
                    </button>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => handleKravTechniqueLevelChange(selectedKravTechnique.id, 1)}
                      disabled={(Number(selectedKravTechnique.level) || 0) >= 4}
                    >
                      Subir nivel
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="krav-curriculum-groups">
                {kravCurriculumByCategory.map((group) => (
                  (() => {
                    const visibleTechniques = kravCategoryShowAll[group.category] ? group.items : group.items.slice(0, 6);
                    const hasHiddenTechniques = group.items.length > 6;

                    return (
                      <div className="krav-category-group" key={group.category}>
                        <button
                          className="krav-category-toggle"
                          type="button"
                          onClick={() => toggleKravCategory(group.category)}
                          aria-expanded={Boolean(kravExpandedCategories[group.category])}
                          aria-controls={`krav-category-${group.category}`}
                        >
                          <div className="krav-category-head">
                            <div className="krav-heading-copy">
                              <strong>{group.label}</strong>
                              <span className="krav-meta-line">{`${group.label} · ${formatKravTechniqueCount(group.items.length)}`}</span>
                            </div>
                            <div className="krav-chip-row">
                              <span className="metrics-source-chip">
                                {formatKravPercent(
                                  group.items.length > 0
                                    ? group.items.reduce((sum, item) => sum + getKravTechniqueProgress(item.level), 0) / group.items.length
                                    : 0
                                )}
                              </span>
                              <span className="metrics-source-chip">{kravExpandedCategories[group.category] ? 'Ocultar' : 'Expandir'}</span>
                            </div>
                          </div>
                        </button>

                        {kravExpandedCategories[group.category] ? (
                          <>
                            <div className="krav-technique-grid" id={`krav-category-${group.category}`}>
                              {visibleTechniques.map((technique) => {
                                const daysSincePractice = getDaysSincePractice(technique.lastPracticedAt, currentDate);
                                return (
                                  <article className="krav-technique-card" key={technique.id}>
                                    <div className="krav-technique-card-top">
                                      <div className="krav-heading-copy">
                                        <strong>{technique.name}</strong>
                                        <span className="krav-meta-line">
                                          {(kravCategoryLabels[technique.category] || technique.category)} · {kravStageLabels[technique.stage] || technique.stage}
                                        </span>
                                      </div>
                                      <div className="krav-chip-row">
                                        <span className="metrics-source-chip">Nivel {technique.level}/4</span>
                                        <span className="metrics-source-chip">
                                          {daysSincePractice === 0 ? 'Practicada hoy' : formatKravDaysWithoutPractice(daysSincePractice)}
                                        </span>
                                        <span className="metrics-source-chip">
                                          {technique.isExamRelevant ? 'Examen' : 'Apoyo'}
                                        </span>
                                      </div>
                                    </div>
                                    <details className="inline-details krav-technique-inline-details">
                                      <summary>Ver resumen técnico</summary>
                                      {technique.description ? <p className="metrics-notes">{technique.description}</p> : null}
                                      {technique.tips ? <p className="metrics-notes">Tip: {technique.tips}</p> : null}
                                      {technique.notes ? <p className="metrics-notes">Notas: {technique.notes}</p> : null}
                                    </details>
                                    <div className="entry-actions">
                                      <button
                                        className="button button-secondary"
                                        type="button"
                                        onClick={() => handleKravTechniqueLevelChange(technique.id, -1)}
                                        disabled={(Number(technique.level) || 0) <= 0}
                                      >
                                        Bajar nivel
                                      </button>
                                      <button
                                        className="button button-primary"
                                        type="button"
                                        onClick={() => handleKravTechniqueLevelChange(technique.id, 1)}
                                        disabled={(Number(technique.level) || 0) >= 4}
                                      >
                                        Subir nivel
                                      </button>
                                      <button className="button button-secondary" type="button" onClick={() => handleKravTechniquePractice(technique.id)}>
                                        Practiqué hoy
                                      </button>
                                      <button className="button button-secondary" type="button" onClick={() => openKravTechniqueDetails(technique.id)}>
                                        Ver técnica
                                      </button>
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                            {hasHiddenTechniques ? (
                              <div className="krav-category-footer">
                                <small>
                                  {kravCategoryShowAll[group.category]
                                    ? `Mostrando ${formatKravTechniqueCount(group.items.length)}.`
                                    : `Mostrando ${visibleTechniques.length} de ${group.items.length} técnicas.`}
                                </small>
                                <button
                                  className="button button-secondary krav-category-more-button"
                                  type="button"
                                  onClick={() => toggleKravCategoryShowAll(group.category)}
                                >
                                  {kravCategoryShowAll[group.category] ? 'Ver menos' : 'Ver más técnicas'}
                                </button>
                              </div>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    );
                  })()
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Bitácora técnica"
              subtitle="Registra práctica técnica, coach, sparring y puntos a repasar."
              className="card-soft krav-panel krav-panel-log"
            >
              <div className="section-inline-actions section-inline-actions-tight">
                <button className="button button-secondary" type="button" onClick={() => setShowKravPracticeBuilder((current) => !current)}>
                  {showKravPracticeBuilder ? 'Ocultar formulario' : 'Mostrar formulario'}
                </button>
              </div>

              <div className="mini-stat-grid krav-log-summary-grid">
                {kravLogSummaryCards.map((item) => (
                  <article className="mini-stat krav-log-summary-card" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.detail}</small>
                  </article>
                ))}
              </div>

              {showKravPracticeBuilder ? (
                <form className="record-form krav-practice-form" onSubmit={handleKravPracticeSubmit}>
                  <div className="form-title-row">
                    <div>
                      <h3>{editingKravPracticeId ? 'Editar bitácora técnica' : 'Nuevo registro técnico'}</h3>
                      <p>Guarda práctica real del día sin mezclarla con el módulo general de ejercicio.</p>
                    </div>
                  </div>

                  <div className="form-grid">
                    <label className="field">
                      <span>Fecha</span>
                      <input name="date" type="date" value={kravPracticeForm.date} onChange={handleKravPracticeFieldChange} />
                    </label>
                    <label className="field">
                      <span>Coach</span>
                      <select name="coach" value={kravPracticeForm.coach} onChange={handleKravPracticeFieldChange}>
                        {kravCoachOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {kravPracticeForm.coach === 'otro' ? (
                      <label className="field">
                        <span>Nombre del coach</span>
                        <input
                          name="coachCustomName"
                          type="text"
                          value={kravPracticeForm.coachCustomName}
                          onChange={handleKravPracticeFieldChange}
                          placeholder="Escribe el nombre del coach"
                        />
                      </label>
                    ) : null}
                    <label className="field">
                      <span>Sparring</span>
                      <select name="sparring" value={kravPracticeForm.sparring} onChange={handleKravPracticeFieldChange}>
                        <option value="no">No</option>
                        <option value="si">Sí</option>
                      </select>
                    </label>
                    <label className="field field-full">
                      <span>Técnicas practicadas</span>
                      <div className="krav-selector-groups">
                        {kravCurriculumByCategory.map((group) => (
                          <details className="krav-selector-group" key={`selector-${group.category}`}>
                            <summary>
                              <span>{group.label}</span>
                              <small>
                                {group.items.filter((item) => (kravPracticeForm.techniqueIds || []).includes(item.id)).length}/{group.items.length}
                              </small>
                            </summary>
                            <div className="krav-selector-list">
                              {group.items.map((technique) => (
                                <label className="krav-selector-item" key={`check-${technique.id}`}>
                                  <input
                                    type="checkbox"
                                    checked={(kravPracticeForm.techniqueIds || []).includes(technique.id)}
                                    onChange={() => toggleKravTechniqueSelection(technique.id)}
                                  />
                                  <span>{technique.name}</span>
                                </label>
                              ))}
                            </div>
                          </details>
                        ))}
                      </div>
                    </label>
                    <label className="field field-full">
                      <span>Observaciones</span>
                      <textárea
                        name="observations"
                        rows="3"
                        value={kravPracticeForm.observations}
                        onChange={handleKravPracticeFieldChange}
                        placeholder="Qué trabajaste, qué salió bien y qué sensación te dejó la sesión..."
                      />
                    </label>
                    <label className="field field-full">
                      <span>Qué salió mal</span>
                      <textárea
                        name="mistakes"
                        rows="2"
                        value={kravPracticeForm.mistakes}
                        onChange={handleKravPracticeFieldChange}
                        placeholder="Errores técnicos, huecos de timing o puntos donde te atoraste..."
                      />
                    </label>
                    <label className="field field-full">
                      <span>Qué debo repasar</span>
                      <textárea
                        name="reviewNeeded"
                        rows="2"
                        value={kravPracticeForm.reviewNeeded}
                        onChange={handleKravPracticeFieldChange}
                        placeholder="Táreas claras para la próxima sesión o para repasar en casa..."
                      />
                    </label>
                  </div>

                  <div className="form-actions">
                    <button
                      className="button button-primary"
                      type="submit"
                      disabled={
                        (kravPracticeForm.techniqueIds || []).length === 0 ||
                        (kravPracticeForm.coach === 'otro' && !String(kravPracticeForm.coachCustomName || '').trim())
                      }
                    >
                      {editingKravPracticeId ? 'Guardar bitácora' : 'Guardar bitácora'}
                    </button>
                    {editingKravPracticeId ? (
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => {
                          resetKravPracticeForm();
                          setEditingKravPracticeId(null);
                        }}
                      >
                        Cancelar edición
                      </button>
                    ) : null}
                  </div>
                </form>
              ) : (
                <p className="section-helper">Mantenla corta: fecha, coach, técnicas y dos notas claras bastan para que la bitácora se vuelva útil de verdad.</p>
              )}

              <div className="metrics-card-list krav-log-list">
                {kravPracticeLogCards.length === 0 ? (
                  <div className="empty-state-card krav-empty-state-card">
                    <div className="krav-heading-copy">
                      <strong>Sin práctica técnica registrada</strong>
                      <span className="krav-meta-line">Guarda fecha, coach, técnicas y puntos a repasar para arrancar tu bitácora sin fricción.</span>
                    </div>
                    <div className="entry-actions krav-empty-state-actions">
                      <button className="button button-primary" type="button" onClick={() => setShowKravPracticeBuilder(true)}>
                        Registrar práctica técnica
                      </button>
                    </div>
                  </div>
                ) : null}
                {kravPracticeLogCards.slice(0, 6).map((item) => (
                  <article className="metrics-card krav-log-card" key={item.id}>
                    <div className="metrics-card-top">
                      <div>
                        <strong>{formatDate(item.date)}</strong>
                        <span>{item.coachLabel} · {item.sparring === 'si' ? 'Con sparring' : 'Sin sparring'}</span>
                      </div>
                      <span className="metrics-source-chip">{formatKravTechniqueCount(item.techniqueNames.length)}</span>
                    </div>
                    <div className="entry-details">
                      {item.techniqueNames.slice(0, 4).map((name) => (
                        <span key={`${item.id}-${name}`}>{name}</span>
                      ))}
                    </div>
                    {item.observations ? <p className="metrics-notes">{item.observations}</p> : null}
                    {item.mistakes ? <p className="metrics-notes">Qué salió mal: {item.mistakes}</p> : null}
                    {item.reviewNeeded ? <p className="metrics-notes">Repasar: {item.reviewNeeded}</p> : null}
                    <div className="entry-actions">
                      <button className="button button-secondary" type="button" onClick={() => editKravPracticeLog(item.id)}>
                        Editar
                      </button>
                      <button className="button button-danger" type="button" onClick={() => deleteKravPracticeLog(item.id)}>
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Alertas"
              subtitle="Reglas simples para no dejar huecos rumbo al examen."
              className="card-soft krav-panel krav-panel-alerts"
            >
              <div className="private-alert-grid krav-alert-grid">
                {kravAlerts.length === 0 ? (
                  <article className="private-alert-card private-alert-card-success">
                    <strong>Sin alertas relevantes</strong>
                    <small>El tablero no detecta focos rojos inmediatos en tu preparación actual.</small>
                  </article>
                ) : null}
                {kravAlerts.map((alert) => (
                  <article
                    className={`private-alert-card ${alert.tone === 'warning' ? 'private-alert-card-warning' : 'private-alert-card-neutral'}`}
                    key={alert.id}
                  >
                    <strong>{alert.title}</strong>
                    <small>{alert.detail}</small>
                  </article>
                ))}
              </div>
            </SectionCard>
          </div>
          </KravMagaTab>
        ) : null}
        {safeActiveTab === 'metrics' ? (
          <MetricsTab
            metricSummary={metricSummary}
            metricSummarySourceLabels={metricSummarySourceLabels}
            formatMetricValue={formatMetricValue}
            metricBaseComparisonCards={metricBaseComparisonCards}
            metricTrend={metricTrend}
            getMetricTrendPresentation={getMetricTrendPresentation}
            metricComparisonPairs={metricComparisonPairs}
            metricForm={metricForm}
            handleFormChange={handleFormChange}
            setMetricForm={setMetricForm}
            handleMetricSubmit={handleMetricSubmit}
            resetMetricForm={resetMetricForm}
            setEditingMetricId={setEditingMetricId}
            editingMetricId={editingMetricId}
            sortedMetrics={sortedMetrics}
            formatDate={formatDate}
            formatMetricText={formatMetricText}
            duplicateMetric={duplicateMetric}
            startEditing={startEditing}
            deleteRecord={deleteRecord}
          />
        ) : null}
        {safeActiveTab === 'weekly' ? (
          <WeeklyTab
            setWeekReferenceDate={setWeekReferenceDate}
            shiftDateByDays={shiftDateByDays}
            currentDate={currentDate}
            weekReferenceDate={weekReferenceDate}
            weeklySummary={weeklySummary}
            formatDate={formatDate}
            weeklyConsistencyLabel={weeklyConsistencyLabel}
            weeklyProteinStatusLabel={weeklyProteinStatusLabel}
            weeklyFastingHasData={weeklyFastingHasData}
            calorieGoal={calorieGoal}
            proteinGoal={proteinGoal}
          />
        ) : null}
        {safeActiveTab === 'history' ? (
          <HistoryTab
            historyDays={historyDays}
            startEditing={startEditing}
            deleteRecord={deleteRecord}
            setFoodForm={setFoodForm}
            setEditingFoodId={setEditingFoodId}
            resetFoodForm={resetFoodForm}
            setHydrationForm={setHydrationForm}
            setEditingHydrationId={setEditingHydrationId}
            resetHydrationForm={resetHydrationForm}
            setSupplementForm={setSupplementForm}
            setEditingSupplementId={setEditingSupplementId}
            resetSupplementForm={resetSupplementForm}
            setFastingLogForm={setFastingLogForm}
            setEditingFastingLogId={setEditingFastingLogId}
            resetFastingLogForm={resetFastingLogForm}
            setExerciseForm={setExerciseForm}
            setEditingExerciseId={setEditingExerciseId}
            resetExerciseForm={resetExerciseForm}
            setMetricForm={setMetricForm}
            setEditingMetricId={setEditingMetricId}
            resetMetricForm={resetMetricForm}
          />
        ) : null}
        {safeActiveTab === 'private' ? (<HormonalTab>
          <>
            {!privateVault.pin ? (
              <SectionCard
                title="Acceso privado"
                subtitle="Configura un PIN numérico para habilitar este espacio restringido de salud hormonal."
                className="card-soft"
              >
                <div className="private-hero-grid">
                  <div className="objective-progress-panel private-lead-panel">
                    <div className="objective-progress-copy">
                      <strong>PIN inicial de {privatePinLength} dígitos</strong>
                      <span>
                        Esta fase protege visualmente el módulo privado y su respaldo separado. No equivale todavía a
                        cifrado local fuerte.
                      </span>
                    </div>
                    <form className="record-form objective-subform" onSubmit={handlePrivatePinSetup}>
                      <div className="form-grid">
                        <label className="field">
                          <span>Nuevo PIN</span>
                          <input
                            type="password"
                            inputMode="numeric"
                            autoComplete="new-password"
                            maxLength={privatePinLength}
                            value={privateSetupPin}
                            onChange={(event) => setPrivateSetupPin(event.target.value.replace(/\D/g, '').slice(0, privatePinLength))}
                            placeholder={`PIN de ${privatePinLength} dígitos`}
                          />
                        </label>
                        <label className="field">
                          <span>Confirmar PIN</span>
                          <input
                            type="password"
                            inputMode="numeric"
                            autoComplete="new-password"
                            maxLength={privatePinLength}
                            value={privateSetupPinConfirm}
                            onChange={(event) =>
                              setPrivateSetupPinConfirm(event.target.value.replace(/\D/g, '').slice(0, privatePinLength))
                            }
                            placeholder="Repite el PIN"
                          />
                        </label>
                      </div>
                      <div className="form-actions">
                        <button className="button button-primary" type="submit">Guardar PIN inicial</button>
                      </div>
                    </form>
                  </div>
                  <div className="backup-meta-grid private-backup-grid">
                    <div className="backup-meta-card private-secondary-card">
                      <span>Respaldo normal</span>
                      <strong>Excluye esta área sensible</strong>
                    </div>
                    <div className="backup-meta-card private-secondary-card">
                      <span>Respaldo privado</span>
                      <strong>Se exporta por separado</strong>
                    </div>
                  </div>
                </div>
                {privateFeedback.text ? (
                  <p
                    className={`backup-feedback ${
                      privateFeedback.type === 'success'
                        ? 'backup-feedback-success'
                        : privateFeedback.type === 'error'
                          ? 'backup-feedback-error'
                          : 'backup-feedback-info'
                    }`}
                  >
                    {privateFeedback.text}
                  </p>
                ) : null}
              </SectionCard>
            ) : !isPrivateUnlocked ? (
              <SectionCard
                title="Acceso privado"
                subtitle="Ingresa tu PIN para abrir el registro sensible y su respaldo separado."
                className="card-soft"
              >
                <div className="private-hero-grid">
                  <div className="objective-progress-panel private-lead-panel">
                    <div className="objective-progress-copy">
                      <strong>Privacidad visual basica</strong>
                      <span>
                        El PIN protege esta seccion dentro de la app, pero todavía no implementa cifrado local fuerte
                        de los datos.
                      </span>
                    </div>
                    <form className="record-form objective-subform" onSubmit={handlePrivateUnlock}>
                      <div className="form-grid">
                        <label className="field">
                          <span>PIN</span>
                          <input
                            type="password"
                            inputMode="numeric"
                            autoComplete="current-password"
                            maxLength={privatePinLength}
                            value={privateUnlockPin}
                            onChange={(event) => setPrivateUnlockPin(event.target.value.replace(/\D/g, '').slice(0, privatePinLength))}
                            placeholder={`Ingresa tu PIN de ${privatePinLength} dígitos`}
                          />
                        </label>
                      </div>
                      <div className="form-actions">
                        <button className="button button-primary" type="submit">Desbloquear</button>
                      </div>
                    </form>
                  </div>

                  <div className="backup-meta-grid private-backup-grid">
                    <div className="backup-meta-card private-secondary-card">
                      <span>Ultimo respaldo privado exportado</span>
                      <strong>
                        {privateVault.lastPrivateExportAt
                          ? formatPrivateDateTimeHuman(privateVault.lastPrivateExportAt)
                          : 'Aun no exportado'}
                      </strong>
                    </div>
                    <div className="backup-meta-card private-secondary-card">
                      <span>Ultimo respaldo privado importado</span>
                      <strong>
                        {privateVault.lastPrivateImportAt
                          ? formatPrivateDateTimeHuman(privateVault.lastPrivateImportAt)
                          : 'Aun no importado'}
                      </strong>
                    </div>
                  </div>
                </div>
                {privateFeedback.text ? (
                  <p
                    className={`backup-feedback ${
                      privateFeedback.type === 'success'
                        ? 'backup-feedback-success'
                        : privateFeedback.type === 'error'
                          ? 'backup-feedback-error'
                          : 'backup-feedback-info'
                    }`}
                  >
                    {privateFeedback.text}
                  </p>
                ) : null}
              </SectionCard>
            ) : (
              <>
                <SectionCard
                  title="Panel privado"
                  subtitle="Registro sensible con acceso restringido, separado de los resumenes publicos y del respaldo general."
                  className="card-soft"
                >
                  <div className="private-hero-grid">
                    <div className="supplement-summary-grid">
                      <div className="supplement-summary-card">
                        <span>Entradas privadas</span>
                        <strong>{privateEntries.length}</strong>
                        <small>Quedan fuera de Dashboard, Semanal e Historial general.</small>
                      </div>
                      <div className="supplement-summary-card">
                        <span>Auto-bloqueo</span>
                        <strong>{Math.max(Number(privateVault.autoLockMinutes || 5), 1)} min</strong>
                        <small>Se reinicia con actividad dentro del módulo desbloqueado.</small>
                      </div>
                      <div className="supplement-summary-card">
                        <span>Respaldo privado</span>
                        <strong>
                          {privateVault.lastPrivateExportAt
                            ? formatShortDateTimeHuman(privateVault.lastPrivateExportAt)
                            : 'Aun no exportado'}
                        </strong>
                        <small>
                          {privateVault.lastPrivateImportAt
                            ? `Importado: ${formatShortDateTimeHuman(privateVault.lastPrivateImportAt)}`
                            : 'Sin importacion privada todavía'}
                        </small>
                      </div>
                    </div>

                    <div className="objective-progress-panel private-lead-panel">
                      <div className="private-lead-header">
                        <div className="objective-progress-copy">
                          <strong>Seguridad y acceso</strong>
                          <span>Modulo privado con respaldo separado y bloqueo manual o automatico.</span>
                        </div>
                      </div>
                      <div className="backup-actions private-access-actions">
                        <button className="button button-secondary" type="button" onClick={() => lockPrivateModule('Area privada bloqueada manualmente.')}>
                          Bloquear
                        </button>
                        <label className="field private-inline-field">
                          <span>Auto-bloqueo (min)</span>
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={privateVault.autoLockMinutes || '5'}
                            onChange={handlePrivateAutoLockMinutesChange}
                          />
                        </label>
                      </div>
                      <div className="backup-actions private-access-actions">
                        <button className="button button-primary" type="button" onClick={handlePrivateExportBackup}>
                          Exportar respaldo privado
                        </button>
                        <label className="button button-secondary backup-import-button">
                          Importar respaldo privado
                          <input
                            key={privateBackupInputKey}
                            className="backup-file-input"
                            type="file"
                            accept="application/json,.json"
                            onChange={handlePrivateImportBackup}
                          />
                        </label>
                      </div>
                      {canShowPrivateRepair ? (
                        <div className="section-inline-actions section-inline-actions-tight">
                          <button className="button button-secondary" type="button" onClick={handleRepairPrivateCycle2026}>
                            Reparar datos del ciclo 2026
                          </button>
                        </div>
                      ) : null}
                      <div className="section-inline-actions section-inline-actions-tight">
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={() => setPrivateSecurityExpanded((current) => !current)}
                        >
                          {privateSecurityExpanded ? 'Ocultar seguridad y acceso' : 'Mostrar seguridad y acceso'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {privateSecurityExpanded ? (
                    <div className="private-security-drawer">
                      <p className="section-helper">
                        Privacidad visual basica con PIN. El respaldo privado sigue separado del respaldo normal.
                      </p>
                      <form className="record-form objective-subform private-pin-form" onSubmit={handlePrivatePinUpdate}>
                        <div className="form-grid">
                          <label className="field">
                            <span>PIN actual</span>
                            <input
                              type="password"
                              inputMode="numeric"
                              autoComplete="current-password"
                              maxLength={privatePinLength}
                              value={privatePinUpdate.current}
                              onChange={(event) =>
                                setPrivatePinUpdate((current) => ({
                                  ...current,
                                  current: event.target.value.replace(/\D/g, '').slice(0, privatePinLength),
                                }))
                              }
                              placeholder="PIN actual"
                            />
                          </label>
                          <label className="field">
                            <span>Nuevo PIN</span>
                            <input
                              type="password"
                              inputMode="numeric"
                              autoComplete="new-password"
                              maxLength={privatePinLength}
                              value={privatePinUpdate.next}
                              onChange={(event) =>
                                setPrivatePinUpdate((current) => ({
                                  ...current,
                                  next: event.target.value.replace(/\D/g, '').slice(0, privatePinLength),
                                }))
                              }
                              placeholder={`Nuevo PIN de ${privatePinLength} dígitos`}
                            />
                          </label>
                          <label className="field">
                            <span>Confirmar nuevo PIN</span>
                            <input
                              type="password"
                              inputMode="numeric"
                              autoComplete="new-password"
                              maxLength={privatePinLength}
                              value={privatePinUpdate.confirm}
                              onChange={(event) =>
                                setPrivatePinUpdate((current) => ({
                                  ...current,
                                  confirm: event.target.value.replace(/\D/g, '').slice(0, privatePinLength),
                                }))
                              }
                              placeholder="Confirmacion"
                            />
                          </label>
                        </div>
                        <div className="form-actions">
                          <button className="button button-secondary" type="submit">Actualizar PIN</button>
                        </div>
                      </form>
                    </div>
                  ) : null}

                  {privateFeedback.text ? (
                    <p
                      className={`backup-feedback ${
                        privateFeedback.type === 'success'
                          ? 'backup-feedback-success'
                          : privateFeedback.type === 'error'
                            ? 'backup-feedback-error'
                            : 'backup-feedback-info'
                      }`}
                    >
                      {privateFeedback.text}
                    </p>
                  ) : null}
                </SectionCard>

                <div className="private-section-stack">
                  <div ref={privateDailyHormonalSectionRef}>
                  <SectionCard
                    title="Control diario hormonal"
                    subtitle={
                      hasActivePrivateCycle
                        ? 'Panel principal del día para revisar tomas, inventario y alertas de stock en segundos.'
                        : 'Disponible cuando exista un ciclo activo.'
                    }
                    className={`card-soft private-daily-control-panel ${hasActivePrivateCycle ? '' : 'private-empty-compact private-empty-tight'}`.trim()}
                  >
                    {hasActivePrivateCycle ? (
                      <div className="private-medication-stack">
                        <div className="private-medication-summary-grid">
                          {dailyHormonalMedicationCards.length > 0 ? (
                            <>
                              <article className="private-weekly-card">
                                <span>Panel activo</span>
                                <strong>{dailyHormonalMedicationSummary.totalControls} controles</strong>
                                <small>Liver Cleanse, Tamoxifeno, Clomifeno y Oxandrolona en vista rápida.</small>
                              </article>
                              <article className="private-weekly-card">
                                <span>Tomas de hoy</span>
                                <strong>{dailyHormonalMedicationSummary.completedDoses}/{dailyHormonalMedicationSummary.expectedDoses}</strong>
                                <small>{dailyHormonalMedicationSummary.completedControls}/{dailyHormonalMedicationSummary.totalControls} controles completos hoy.</small>
                              </article>
                              <article className="private-weekly-card">
                                <span>Alertas de stock</span>
                                <strong>{dailyHormonalMedicationSummary.lowInventoryControls}</strong>
                                <small>Incluye inventario bajo y agotado dentro del panel diario.</small>
                              </article>
                            </>
                          ) : (
                            <article className="private-weekly-card">
                              <span>Estado</span>
                              <strong>Sin controles diarios visibles</strong>
                              <small>Agrega o vincula los cuatro controles diarios al ciclo activo para usar este panel.</small>
                            </article>
                          )}
                        </div>

                        <div className="private-medication-grid">
                          {dailyHormonalMedicationCards.length === 0 ? (
                            <div className="private-empty-state-panel private-empty-state-panel-inline">
                              <p className="empty-state">
                                Aún no están disponibles los cuatro controles diarios del ciclo activo.
                              </p>
                              <div className="section-inline-actions section-inline-actions-tight">
                                <button className="button button-secondary" type="button" onClick={() => openPrivateForm('medication')}>
                                  Abrir ajustes
                                </button>
                              </div>
                            </div>
                          ) : null}
                          {dailyHormonalMedicationCards.map((item) => (
                            <article className={`private-medication-card private-medication-card-${item.inventoryTone}`.trim()} key={`daily-${item.id}`}>
                              <div className="private-medication-head">
                                <div className="private-medication-title-group">
                                  <strong>{item.displayName}</strong>
                                  <span>
                                    {privateMedicationTypeLabels[item.medicationType] || item.medicationType || 'Control'} ·{' '}
                                    {privateMedicationScheduleLabels[item.scheduleMode] ||
                                      (item.dailyStatus.expectedCount > 1 ? '2 al día' : '1 al día')}
                                  </span>
                                  {item.alias ? <small>{item.alias}</small> : null}
                                </div>
                                <div className="private-medication-badges">
                                  <span className="metrics-source-chip">{item.dailyLabel}</span>
                                  {item.dailyStatus.isOutOfStock ? (
                                    <span className="private-medication-badge private-medication-badge-out">Agotado</span>
                                  ) : null}
                                  {!item.dailyStatus.isOutOfStock && item.dailyStatus.isLowInventory ? (
                                    <span className="private-medication-badge private-medication-badge-low">Inventario bajo</span>
                                  ) : null}
                                </div>
                              </div>

                              <div className="private-medication-body">
                                <div className="private-medication-meta">
                                  <span>Tomas del día</span>
                                  <strong>
                                    {item.dailyStatus.expectedCount > 1
                                      ? `${item.dailyStatus.takenCount}/${item.dailyStatus.expectedCount}`
                                      : item.dailyStatus.hasTakenToday
                                        ? '1/1'
                                        : '0/1'}
                                  </strong>
                                  <small>
                                    {item.dailyStatus.expectedCount > 1
                                      ? item.dailyStatus.isComplete
                                        ? 'Dosis del día completas'
                                        : 'Aún faltan tomas por marcar'
                                      : item.dailyStatus.hasTakenToday
                                        ? 'Tomado hoy'
                                        : 'Pendiente hoy'}
                                  </small>
                                </div>
                                <div className="private-medication-count">
                                  <span>Inventario restante</span>
                                  <strong>{item.dailyStatus.remainingInventory}</strong>
                                  <small>{item.inventoryLabel}</small>
                                </div>
                              </div>

                              {item.notes ? <p className="metrics-notes private-medication-notes">{item.notes}</p> : null}

                              <div className="private-medication-actions">
                                {item.dailyStatus.expectedCount > 1 ? (
                                  <div className="private-medication-slot-row">
                                    <button
                                      className={`button ${item.dailyStatus.takenSlots.includes('manana') ? 'button-secondary' : 'button-primary'}`}
                                      type="button"
                                      onClick={() => {
                                        bumpPrivateActivity();
                                        if (item.dailyStatus.takenSlots.includes('manana')) {
                                          handleUndoPrivateMedicationDose(item.id, 'manana');
                                          return;
                                        }
                                        handlePrivateMedicationDose(item.id, 'manana');
                                      }}
                                      disabled={item.dailyStatus.isOutOfStock && !item.dailyStatus.takenSlots.includes('manana')}
                                    >
                                      {item.dailyStatus.takenSlots.includes('manana') ? 'Deshacer mañana' : 'Mañana'}
                                    </button>
                                    <button
                                      className={`button ${item.dailyStatus.takenSlots.includes('tarde') ? 'button-secondary' : 'button-primary'}`}
                                      type="button"
                                      onClick={() => {
                                        bumpPrivateActivity();
                                        if (item.dailyStatus.takenSlots.includes('tarde')) {
                                          handleUndoPrivateMedicationDose(item.id, 'tarde');
                                          return;
                                        }
                                        handlePrivateMedicationDose(item.id, 'tarde');
                                      }}
                                      disabled={item.dailyStatus.isOutOfStock && !item.dailyStatus.takenSlots.includes('tarde')}
                                    >
                                      {item.dailyStatus.takenSlots.includes('tarde') ? 'Deshacer tarde' : 'Tarde'}
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className={`button ${item.dailyStatus.hasTakenToday ? 'button-secondary' : 'button-primary'}`}
                                    type="button"
                                    onClick={() => {
                                      bumpPrivateActivity();
                                      if (item.dailyStatus.hasTakenToday) {
                                        handleUndoPrivateMedicationDose(item.id, 'single');
                                        return;
                                      }
                                      handlePrivateMedicationDose(item.id, 'single');
                                    }}
                                    disabled={item.dailyStatus.isOutOfStock && !item.dailyStatus.hasTakenToday}
                                  >
                                    {item.dailyStatus.hasTakenToday ? 'Deshacer' : 'Tomar'}
                                  </button>
                                )}

                                <div className="entry-actions">
                                  <button
                                    className="button button-secondary"
                                    type="button"
                                    onClick={() => {
                                      bumpPrivateActivity();
                                      startEditing(
                                        'privateCycleMedications',
                                        item.id,
                                        setPrivateMedicationForm,
                                        setEditingPrivateMedicationId,
                                        'private'
                                      );
                                      openPrivateForm('medication', {
                                        focusSelector:
                                          'input[name="remainingInventory"], input[name="name"], textárea[name="notes"]',
                                      });
                                    }}
                                  >
                                    Ajustar inventario
                                  </button>
                                  <button
                                    className="button button-danger"
                                    type="button"
                                    onClick={() => {
                                      if (!window.confirm(`¿Eliminar ${item.displayName || 'este control'}? Esta acción quita el control y su historial diario.`)) {
                                        return;
                                      }
                                      bumpPrivateActivity();
                                      deleteRecord(
                                        'privateCycleMedications',
                                        item.id,
                                        setEditingPrivateMedicationId,
                                        resetPrivateMedicationForm
                                      );
                                    }}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="private-empty-state-panel">
                        <p className="empty-state">Activa un ciclo para usar el panel diario de control hormonal.</p>
                        <div className="section-inline-actions section-inline-actions-tight">
                          <button className="button button-primary" type="button" onClick={() => openPrivateForm('cycle')}>
                            Crear o activar ciclo
                          </button>
                        </div>
                      </div>
                    )}
                  </SectionCard>
                  </div>

                  <SectionCard
                    title="Resumen operativo"
                    subtitle="Estado actual y actividad reciente."
                    className={`card-soft ${hasActivePrivateCycle ? '' : 'private-empty-mode-card'}`.trim()}
                  >
                    {hasActivePrivateCycle ? (
                      <div className="private-summary-grid">
                        <div className="supplement-summary-card">
                          <span>Ciclo activo</span>
                          <strong>{privateSummary.activeCycle?.name || 'Sin ciclo activo.'}</strong>
                          <small>{privateCycleTypeLabels[privateSummary.activeCycle?.type] || privateSummary.activeCycle?.type}</small>
                        </div>
                        <div className="supplement-summary-card">
                          <span>Estado</span>
                          <strong>{getPrivateCycleStatusPhrase(privateSummary.activeCycle?.status)}</strong>
                          <small>
                            {`${privateSummary.activeCycle?.startDate ? formatPrivateDate(privateSummary.activeCycle.startDate) : 'Sin inicio'} · ${
                              privateSummary.activeCycle?.estimatedEndDate ? formatPrivateDate(privateSummary.activeCycle.estimatedEndDate) : 'Sin fin'
                            }`}
                          </small>
                        </div>
                        <div className="supplement-summary-card">
                          <span>Proximo evento</span>
                          <strong>
                            {privateSummary.nextEvent
                              ? privateSummary.nextEvent.name || privateEventTypeLabels[privateSummary.nextEvent.eventType] || 'Evento'
                              : 'Sin evento proximo.'}
                          </strong>
                          <small>
                            {privateSummary.nextEvent
                              ? `${privateSummary.nextEvent.nextApplication
                                  ? formatPrivateDateTimeHuman(privateSummary.nextEvent.nextApplication)
                                  : privateSummary.nextEvent.date
                                    ? `${formatPrivateDate(privateSummary.nextEvent.date)}${privateSummary.nextEvent.time ? ` · ${privateSummary.nextEvent.time}` : ''}`
                                    : 'Sin fecha'}${nextPrivateEventProduct?.name ? ` · ${nextPrivateEventProduct.name}` : ''}`
                              : 'Sin evento proximo.'}
                          </small>
                        </div>
                        <div className="supplement-summary-card">
                          <span>Ultimo evento</span>
                          <strong>{latestPrivateTimelineItem?.title || 'Aun no hay actividad privada.'}</strong>
                          <small>
                            {latestPrivateTimelineItem
                              ? `${latestPrivateTimelineItem.date ? formatPrivateDate(latestPrivateTimelineItem.date) : 'Sin fecha'}${
                                  latestPrivateTimelineItem.time ? ` · ${latestPrivateTimelineItem.time}` : ''
                                }`
                              : 'Registra un evento para comenzar.'}
                          </small>
                        </div>
                        <div className="supplement-summary-card">
                          <span>Saldo pendiente</span>
                          <strong>{formatCurrencyMx(privateSummary.pendingBalance)}</strong>
                          <small>Calculado con componentes y pagos.</small>
                        </div>
                        <div className="supplement-summary-card">
                          <span>Total pagado</span>
                          <strong>{formatCurrencyMx(privateSummary.totalPaid)}</strong>
                          <small>Pagos confirmados del ciclo activo.</small>
                        </div>
                      </div>
                    ) : (
                      <div className="private-empty-state-panel">
                        <div className="objective-progress-copy">
                          <strong>Sin ciclo activo.</strong>
                          <span>Crea o activa un ciclo para comenzar.</span>
                        </div>
                        <div className="section-inline-actions private-empty-actions">
                          <button className="button button-primary" type="button" onClick={() => openPrivateForm('cycle')}>
                            Crear o activar ciclo
                          </button>
                        </div>
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="Navegacion interna"
                    subtitle="Accesos rapidos a las secciones del módulo."
                    className="card-soft private-nav-band"
                  >
                    <div className="section-inline-actions private-nav-actions">
                      <button className="button button-secondary private-nav-button" type="button" onClick={() => privateDailyHormonalSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                        Control diario
                      </button>
                      <button className="button button-secondary private-nav-button" type="button" onClick={() => scrollToPrivateSection('cycle')}>
                        Ciclos
                      </button>
                      <button className="button button-secondary private-nav-button" type="button" onClick={() => scrollToPrivateSection('event')}>
                        Eventos
                      </button>
                      <button className="button button-secondary private-nav-button" type="button" onClick={() => scrollToPrivateSection('product')}>
                        Productos
                      </button>
                      <button className="button button-secondary private-nav-button" type="button" onClick={() => scrollToPrivateSection('payment')}>
                        Pagos
                      </button>
                      <button className="button button-secondary private-nav-button" type="button" onClick={() => scrollToPrivateSection('financial')}>
                        Resumen financiero
                      </button>
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Agenda del ciclo"
                    subtitle="Agenda operativa del ciclo activo para hoy y los proximos dias."
                    className={`card-soft ${hasActivePrivateCycle ? '' : 'private-empty-compact private-empty-tight'}`.trim()}
                  >
                    {hasActivePrivateCycle ? (
                      <div className="private-agenda-stack">
                        <div className="private-agenda-summary-row">
                          <div className="private-agenda-summary-card">
                            <span>Ciclo activo</span>
                            <strong>{activePrivateCycle?.name || 'Ciclo privado activo'}</strong>
                            <small>{getPrivateCycleStatusPhrase(activePrivateCycle?.status)}</small>
                          </div>
                          <div className="private-agenda-summary-card">
                            <span>Proximo evento relevante</span>
                            {nextUpcomingEvent ? (
                              <div className="private-agenda-next-summary">
                                <strong>
                                  {nextUpcomingEvent.name || privateEventTypeLabels[nextUpcomingEvent.eventType] || 'Evento'}
                                </strong>
                                <small>
                                  {nextUpcomingEvent.scheduledDate ? formatPrivateDate(nextUpcomingEvent.scheduledDate) : 'Sin fecha'}
                                  {nextUpcomingEvent.scheduledAt ? ` · ${formatAgendaTime(nextUpcomingEvent.scheduledAt)}` : ' · Sin hora'}
                                </small>
                                <div className="private-agenda-inline-meta">
                                  <span className={getPrivateAgendaFlagClass(nextUpcomingEventPrimaryState)}>
                                    {nextUpcomingEventPrimaryState}
                                  </span>
                                  <span>
                                    {nextUpcomingEvent.category
                                      ? privateCategoryLabels[nextUpcomingEvent.category] || nextUpcomingEvent.category
                                      : privateEventTypeLabels[nextUpcomingEvent.eventType] || 'Evento'}
                                  </span>
                                  {nextUpcomingEvent.dose ? (
                                    <span>{`${nextUpcomingEvent.dose} ${nextUpcomingEvent.unit || ''}`.trim()}</span>
                                  ) : null}
                                </div>
                              </div>
                            ) : (
                              <>
                                <strong>Aun no hay eventos programados.</strong>
                                <small>Programa un evento para empezar.</small>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="private-agenda-mini-grid">
                          {privateAgendaMicroSummary.map((item) => (
                            <div
                              className={`private-agenda-mini-card ${item.accent ? `private-agenda-mini-card-${item.accent}` : ''}`.trim()}
                              key={item.label}
                            >
                              <span>{item.label}</span>
                              <strong>{item.value}</strong>
                            </div>
                          ))}
                        </div>

                        <div className="private-agenda-toolbar">
                          <div className="section-copy-stack section-copy-stack-tight">
                            <strong>Dia seleccionado: {selectedAgendaDateLabel}</strong>
                            <small>
                              {privateAgendaShowAll
                                ? 'Mostrando proximos eventos del ciclo activo.'
                                : selectedAgendaDate === currentDate
                                  ? privateAgendaTodayEntries.length === 0
                                    ? 'Sin eventos hoy.'
                                    : privateAgendaTodayNextEntry
                                      ? `Siguiente hoy: ${privateAgendaTodayNextEntry.name || 'Evento'}${privateAgendaTodayNextEntry.scheduledAt ? ` · ${formatAgendaTime(privateAgendaTodayNextEntry.scheduledAt)}` : ''}`
                                      : `${privateAgendaTodayEntries.length} evento(s) programado(s) hoy.`
                                  : `${selectedAgendaEvents.length} evento(s) programado(s).`}
                            </small>
                          </div>
                          <div className="section-inline-actions section-inline-actions-tight">
                            <button
                              className="button button-secondary private-filter-button"
                              type="button"
                              onClick={() => {
                                setPrivateAgendaShowAll(true);
                                setPrivateAgendaSelectedDate(currentDate);
                              }}
                            >
                              Ver todos
                            </button>
                            <button
                              className="button button-secondary private-filter-button"
                              type="button"
                              onClick={() => openPrivateEventFormForDate(selectedAgendaDate)}
                            >
                              Ir a registrar evento
                            </button>
                          </div>
                        </div>

                        <div className="private-agenda-week-grid">
                          {agendaDays.map((day) => (
                            <button
                              className={`private-agenda-day ${
                                day.isToday ? 'private-agenda-day-today' : ''
                              } ${day.count > 0 ? 'private-agenda-day-has-events' : ''} ${
                                day.isNextWithEvent ? 'private-agenda-day-next' : ''
                              } ${selectedAgendaDate === day.date && !privateAgendaShowAll ? 'private-agenda-day-selected' : ''}`.trim()}
                              key={day.date}
                              onClick={() => {
                                setPrivateAgendaSelectedDate(day.date);
                                setPrivateAgendaShowAll(false);
                              }}
                              type="button"
                            >
                              <span>{formatAgendaDayLabel(day.date)}</span>
                              <strong>{formatAgendaShortDate(day.date)}</strong>
                              <small>{day.count} evento(s)</small>
                            </button>
                          ))}
                        </div>

                        <div className="private-agenda-upcoming-list">
                          {selectedAgendaEvents.length === 0 ? (
                            <div className="private-agenda-empty">
                              <p className="empty-state">
                                {privateAgendaShowAll ? 'Aun no hay eventos programados.' : 'No hay eventos programados para este día.'}
                              </p>
                            </div>
                          ) : null}
                          {selectedAgendaEvents.slice(0, 5).map((item) => {
                            const linkedProduct = privateProducts.find((product) => product.id === item.productId);
                            const itemFlags = getPrivateAgendaFlags(item, {
                              now: privateAgendaNow,
                              currentDate,
                              nextEventId: nextUpcomingEvent?.id || '',
                            });
                            const detailLine = getPrivateAgendaEventDetail(item, linkedProduct);

                            return (
                              <article className="private-agenda-upcoming-item" key={`agenda-${item.id}`}>
                                <div className="private-agenda-event-row">
                                  <div className="private-agenda-event-time">
                                    <strong>{item.scheduledAt ? formatAgendaTime(item.scheduledAt) : 'Sin hora'}</strong>
                                    <span>{item.scheduledDate ? formatPrivateDate(item.scheduledDate) : 'Sin fecha'}</span>
                                  </div>
                                  <div className="private-agenda-event-main">
                                    <div className="private-agenda-event-head">
                                      <div>
                                        <strong>{item.name || 'Evento privado'}</strong>
                                        {detailLine ? <span>{detailLine}</span> : <span>Evento privado del ciclo activo.</span>}
                                      </div>
                                      <span className={getPrivateEventChipClass(item.eventType)}>
                                        {privateEventTypeLabels[item.eventType] || item.eventType || 'Evento'}
                                      </span>
                                    </div>
                                    {itemFlags.length > 0 ? (
                                      <div className="private-agenda-event-flags">
                                        {itemFlags.map((flag) => (
                                          <span className={getPrivateAgendaFlagClass(flag)} key={`${item.id}-${flag}`}>
                                            {flag}
                                          </span>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="private-empty-state-panel">
                        <p className="empty-state">Activa un ciclo para ver agenda.</p>
                        <div className="section-inline-actions section-inline-actions-tight">
                          <button className="button button-primary" type="button" onClick={() => openPrivateForm('cycle')}>
                            Crear o activar ciclo
                          </button>
                        </div>
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="Estado diario hormonal"
                    subtitle={hasActivePrivateCycle ? 'Chequeo rapido para leer energia, animo, sueño y señales del día.' : 'Disponible cuando exista un ciclo activo.'}
                    className={`card-soft ${hasActivePrivateCycle ? '' : 'private-empty-compact private-empty-tight'}`.trim()}
                  >
                    {hasActivePrivateCycle ? (
                      <div className="private-daily-stack" ref={privateDailyCheckSectionRef}>
                        <div className="private-weekly-grid private-daily-summary-grid">
                          {privateDailySummaryCards.map((item) => (
                            <article className="private-weekly-card" key={item.label}>
                              <span>{item.label}</span>
                              <strong>{item.value}</strong>
                              <small>{item.detail}</small>
                            </article>
                          ))}
                        </div>

                        <RecordForm
                          title={editingPrivateDailyCheckId ? 'Editar chequeo diario' : 'Nuevo chequeo diario'}
                          fields={[
                            {
                              type: 'section',
                              name: 'daily-check-overview',
                              label: 'Registro diario',
                              hint: 'Un registro corto al día permite detectar patrones, efectos secundarios y adherencia sin saturar la bitácora.',
                            },
                            {
                              name: 'date',
                              label: 'Fecha',
                              type: 'date',
                              hint: 'Fecha del chequeo. Mantenerla exacta ayuda a leer patrones semanales.',
                            },
                            {
                              name: 'cycleId',
                              label: 'Ciclo privado',
                              type: 'select',
                              options: privateCycleOptions,
                              hint: 'Asocia el chequeo al ciclo correcto para que el resumen semanal y las alertas salgan bien.',
                            },
                            {
                              type: 'section',
                              name: 'daily-check-metrics',
                              label: 'Parámetros hormonales / físicos',
                              hint: 'Usa una escala simple del 1 al 5. Lo importante es la consistencia diaria, no la precisión clínica absoluta.',
                            },
                            {
                              name: 'energy',
                              label: 'Energía',
                              type: 'select',
                              options: privateDailyScaleFieldOptions,
                              hint: 'Nivel de energía percibido durante el día.',
                            },
                            {
                              name: 'mood',
                              label: 'Estado de ánimo',
                              type: 'select',
                              options: privateDailyScaleFieldOptions,
                              hint: 'Cómo te sentiste hoy a nivel emocional.',
                            },
                            {
                              name: 'libido',
                              label: 'Libido',
                              type: 'select',
                              options: privateDailyScaleFieldOptions,
                              hint: 'Indicador útil del estado hormonal general.',
                            },
                            {
                              name: 'sleep',
                              label: 'Sueño',
                              type: 'select',
                              options: privateDailyScaleFieldOptions,
                              hint: 'Calidad general del sueño de la noche previa.',
                            },
                            {
                              name: 'focus',
                              label: 'Enfoque / claridad mental',
                              type: 'select',
                              options: privateDailyScaleFieldOptions,
                              hint: 'Qué tan claro o concentrado te sentiste hoy.',
                            },
                            {
                              name: 'appetite',
                              label: 'Apetito',
                              type: 'select',
                              options: privateDailyScaleFieldOptions,
                              hint: 'útil para leer hambre, adherencia y tolerancia del protocolo.',
                            },
                            {
                              name: 'retention',
                              label: 'Retención / inflamación',
                              type: 'select',
                              options: Object.entries(privateDailyRetentionLabels).map(([value, label]) => ({ value, label })),
                              hint: 'Marca el nivel percibido de retención, pesadez o inflamación.',
                            },
                            {
                              name: 'sideEffects',
                              label: 'Efectos secundarios',
                              type: 'text',
                              placeholder: 'Ej. acne leve, irritabilidad o dolor post aplicacion',
                              hint: 'Resume cualquier efecto secundario o cambio relevante del día.',
                            },
                            {
                              type: 'section',
                              name: 'daily-check-notes',
                              label: 'Notas / observaciones',
                              hint: 'Añade aquí contexto útil para el coach o para leer el patrón después.',
                            },
                            {
                              name: 'notes',
                              label: 'Observaciones privadas',
                              type: 'textárea',
                              placeholder: 'Ej. me senti con baja energia en la tarde pero mejoro despues de comer',
                              hint: 'Observaciones libres, señales del día o cualquier detalle importante.',
                              rows: 3,
                            },
                          ]}
                          formData={privateDailyCheckForm}
                          onChange={(event) => {
                            bumpPrivateActivity();
                            handleRecordFormChange(event, setPrivateDailyCheckForm);
                          }}
                          onSubmit={handlePrivateDailyCheckSubmit}
                          onCancel={() => {
                            resetPrivateDailyCheckForm();
                            setEditingPrivateDailyCheckId(null);
                          }}
                          isEditing={Boolean(editingPrivateDailyCheckId)}
                          submitLabel={editingPrivateDailyCheckId ? 'Guardar chequeo' : 'Guardar chequeo'}
                        />

                        <div className="metrics-card-list private-card-list">
                          {activeCycleDailyChecks.length === 0 ? (
                            <p className="empty-state">Aun no hay chequeos diarios del ciclo activo.</p>
                          ) : null}
                          {activeCycleDailyChecks.slice(0, 4).map((item) => (
                            <article className="metrics-card private-entry-card" key={item.id}>
                              <div className="metrics-card-top">
                                <div>
                                  <strong>{item.date === currentDate ? 'Chequeo de hoy' : formatPrivateDate(item.date)}</strong>
                                  <span>{item.date === currentDate ? 'Lectura diaria del ciclo activo.' : 'Registro diario del ciclo activo.'}</span>
                                </div>
                                <span className="metrics-source-chip">{item.retention ? privateDailyRetentionLabels[item.retention] || item.retention : 'Sin retencion'}</span>
                              </div>
                              <div className="entry-details">
                                <span>Energía: {formatPrivateScaleValue(item.energy)}</span>
                                <span>ánimo: {formatPrivateScaleValue(item.mood)}</span>
                                <span>Sueño: {formatPrivateScaleValue(item.sleep)}</span>
                                <span>Enfoque: {formatPrivateScaleValue(item.focus)}</span>
                                <span>Libido: {formatPrivateScaleValue(item.libido)}</span>
                                <span>Apetito: {formatPrivateScaleValue(item.appetite)}</span>
                              </div>
                              {item.sideEffects ? <p className="metrics-notes">Efectos secundarios: {item.sideEffects}</p> : null}
                              {item.notes ? <p className="metrics-notes">{item.notes}</p> : null}
                              <div className="entry-actions">
                                <button
                                  className="button button-secondary"
                                  type="button"
                                  onClick={() => {
                                    bumpPrivateActivity();
                                    startEditing('privateDailyChecks', item.id, setPrivateDailyCheckForm, setEditingPrivateDailyCheckId, 'private');
                                    window.setTimeout(() => {
                                      privateDailyCheckSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 60);
                                  }}
                                >
                                  Editar
                                </button>
                                <button
                                  className="button button-danger"
                                  type="button"
                                  onClick={() => {
                                    bumpPrivateActivity();
                                    deleteRecord('privateDailyChecks', item.id, setEditingPrivateDailyCheckId, resetPrivateDailyCheckForm);
                                  }}
                                >
                                  Eliminar
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="private-empty-state-panel">
                        <p className="empty-state">Activa un ciclo para registrar tu chequeo diario.</p>
                        <div className="section-inline-actions section-inline-actions-tight">
                          <button className="button button-primary" type="button" onClick={() => openPrivateForm('cycle')}>
                            Crear o activar ciclo
                          </button>
                        </div>
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="Ajustes avanzados del control hormonal"
                    subtitle={
                      hasActivePrivateCycle
                        ? 'Bloque secundario para altas nuevas, correcciones de inventario y cambios de configuración.'
                        : 'Disponible cuando exista un ciclo activo.'
                    }
                    className={`card-soft private-medication-management-card private-secondary-card ${hasActivePrivateCycle ? '' : 'private-empty-compact private-empty-tight'}`.trim()}
                  >
                    {hasActivePrivateCycle ? (
                      <div className="private-medication-stack" ref={privateMedicationSectionRef}>
                        <p className="section-helper">
                          El panel rápido de uso diario vive arriba. Usa este bloque solo cuando necesites crear un control nuevo o corregir inventario/configuración.
                        </p>
                        <div className="section-inline-actions section-inline-actions-tight">
                          <button className="button button-secondary private-toggle-button" type="button" onClick={() => togglePrivateForm('medication')}>
                            {privateFormVisibility.medication ? 'Ocultar formulario' : 'Mostrar formulario'}
                          </button>
                        </div>

                        {privateFormVisibility.medication ? (
                          <RecordForm
                            title={editingPrivateMedicationId ? 'Editar control diario' : 'Nuevo control diario'}
                            fields={[
                              {
                                type: 'section',
                                name: 'medication-overview',
                                label: 'Registro diario',
                                hint: 'úsalo para ajustar inventario, cambiar la dosis esperada o registrar un nuevo protector/oral ligado al ciclo.',
                              },
                              {
                                name: 'cycleId',
                                label: 'Ciclo privado',
                                type: 'select',
                                options: privateCycleOptions,
                                hint: 'Asocia el control al ciclo correcto para que el tablero operativo muestre inventario y tomas en el lugar correcto.',
                              },
                              {
                                name: 'name',
                                label: 'Nombre visible',
                                type: 'text',
                                placeholder: 'Ej. Liver',
                                hint: 'Nombre corto y claro del producto o protector.',
                              },
                              {
                                name: 'alias',
                                label: 'Alias visible',
                                type: 'text',
                                placeholder: 'Ej. Anavar / Oxandrolona',
                                hint: 'Opcional. Sirve cuando el producto se conoce por más de un nombre.',
                              },
                              {
                                type: 'section',
                                name: 'medication-parameters',
                                label: 'Parámetros hormonales / físicos',
                                hint: 'Define si es protector u oral, cuántas tabletas esperas tomar al día y con cuánto inventario arrancas.',
                              },
                              {
                                name: 'medicationType',
                                label: 'Tipo',
                                type: 'select',
                                options: Object.entries(privateMedicationTypeLabels).map(([value, label]) => ({ value, label })),
                                hint: 'Ayuda a distinguir rápido protectores del ciclo y orales activos.',
                              },
                              {
                                name: 'expectedDailyDose',
                                label: 'Dosis diaria esperada',
                                type: 'number',
                                placeholder: 'Ej. 1 o 2',
                                hint: 'Cantidad esperada para el día. Si es 2, el sistema divide mañana y tarde automáticamente.',
                              },
                              {
                                name: 'unit',
                                label: 'Unidad',
                                type: 'text',
                                placeholder: 'Ej. tableta',
                                hint: 'Unidad base para descontar inventario y mostrar el resto.',
                              },
                              {
                                name: 'initialInventory',
                                label: 'Inventario inicial',
                                type: 'number',
                                placeholder: 'Ej. 94',
                                hint: 'Total con el que arrancó este producto dentro del ciclo.',
                              },
                              {
                                name: 'remainingInventory',
                                label: 'Inventario restante',
                                type: 'number',
                                placeholder: 'Ej. 80',
                                hint: 'Puedes ajustarlo manualmente si compras más o corriges una cuenta previa.',
                              },
                              {
                                type: 'section',
                                name: 'medication-notes',
                                label: 'Notas / observaciones',
                                hint: 'Deja aquí cualquier nota útil del producto, por ejemplo compra nueva, cambio de lote o ajuste manual.',
                              },
                              {
                                name: 'notes',
                                label: 'Notas privadas',
                                type: 'textárea',
                                placeholder: 'Ej. ajuste manual del inventario despues de comprar una caja nueva',
                                hint: 'Contexto operativo privado sobre inventario, tolerancia o cambios del producto.',
                                rows: 3,
                              },
                            ]}
                            formData={privateMedicationForm}
                            onChange={(event) => {
                              bumpPrivateActivity();
                              handleRecordFormChange(event, setPrivateMedicationForm);
                            }}
                            onSubmit={handlePrivateMedicationSubmit}
                            onCancel={() => {
                              resetPrivateMedicationForm();
                              setEditingPrivateMedicationId(null);
                            }}
                            isEditing={Boolean(editingPrivateMedicationId)}
                            submitLabel={editingPrivateMedicationId ? 'Guardar control' : 'Guardar control'}
                          />
                        ) : (
                          <p className="section-helper">
                            El panel diario quedó arriba. Abre este formulario solo cuando necesites crear un control nuevo, corregir inventario o editar su configuración.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="private-empty-state-panel">
                        <p className="empty-state">Activa un ciclo para controlar protectores, orales e inventario diario.</p>
                        <div className="section-inline-actions section-inline-actions-tight">
                          <button className="button button-primary" type="button" onClick={() => openPrivateForm('cycle')}>
                            Crear o activar ciclo
                          </button>
                        </div>
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="Resumen semanal hormonal"
                    subtitle="Lectura ejecutiva del protocolo activo durante la semana actual."
                    className={`card-soft ${hasActivePrivateCycle ? '' : 'private-empty-compact private-empty-tight'}`.trim()}
                  >
                    {hasActivePrivateCycle ? (
                      <div className="private-weekly-grid">
                        <article className="private-weekly-card">
                          <span>Aplicaciones esta semana</span>
                          <strong>{privateHormonalWeeklySummary.weeklyApplicationsCount}</strong>
                          <small>Eventos tipo aplicación registrados entre {formatPrivateDate(currentWeekStart)} y {formatPrivateDate(currentWeekEnd)}.</small>
                        </article>
                        <article className="private-weekly-card">
                          <span>Próxima aplicación</span>
                          <strong>
                            {privateHormonalWeeklySummary.nextApplication
                              ? privateHormonalWeeklySummary.nextApplication.name || 'Aplicación programada'
                              : 'Sin próxima aplicación'}
                          </strong>
                          <small>
                            {privateHormonalWeeklySummary.nextApplication
                              ? privateHormonalWeeklySummary.nextApplication.nextApplication
                                ? formatPrivateDateTimeHuman(privateHormonalWeeklySummary.nextApplication.nextApplication)
                                : `${privateHormonalWeeklySummary.nextApplication.date ? formatPrivateDate(privateHormonalWeeklySummary.nextApplication.date) : 'Sin fecha'}${privateHormonalWeeklySummary.nextApplication.time ? ` · ${privateHormonalWeeklySummary.nextApplication.time}` : ''}`
                              : 'Aún no hay una aplicación futura registrada.'}
                          </small>
                        </article>
                        <article className="private-weekly-card">
                          <span>Compuestos activos</span>
                          <strong>{privateHormonalWeeklySummary.activeCompoundNames.length}</strong>
                          <small>
                            {privateHormonalWeeklySummary.activeCompoundNames.length > 0
                              ? privateHormonalWeeklySummary.activeCompoundNames.slice(0, 4).join(', ')
                              : 'Sin compuestos activos registrados.'}
                          </small>
                        </article>
                        <article className="private-weekly-card">
                          <span>Pagos</span>
                          <strong>{`${privateHormonalWeeklySummary.paidCount} pagado(s)`}</strong>
                          <small>
                            {privateHormonalWeeklySummary.pendingCount > 0
                              ? `${privateHormonalWeeklySummary.pendingCount} pendiente(s) · ${formatCurrencyMx(privateHormonalWeeklySummary.totalPending)}`
                              : `Pendiente: ${formatCurrencyMx(0)}`}
                          </small>
                        </article>
                        <article className="private-weekly-card">
                          <span>Síntomas repetidos</span>
                          <strong>
                            {privateHormonalWeeklySummary.repeatedSymptoms.length > 0
                              ? privateHormonalWeeklySummary.repeatedSymptoms.length
                              : 'Ninguno'}
                          </strong>
                          <small>
                            {privateHormonalWeeklySummary.repeatedSymptoms.length > 0
                              ? privateHormonalWeeklySummary.repeatedSymptoms
                                  .slice(0, 3)
                                  .map((item) => `${item.label} (${item.count})`)
                                  .join(', ')
                              : 'Sin síntomas repetidos esta semana.'}
                          </small>
                        </article>
                        <article className="private-weekly-card">
                          <span>Promedios semanales</span>
                          <strong>
                            {`E ${formatPrivateAverageValue(privateHormonalWeeklySummary.energyAverage)} · S ${formatPrivateAverageValue(privateHormonalWeeklySummary.sleepAverage)}`}
                          </strong>
                          <small>{`ánimo ${formatPrivateAverageValue(privateHormonalWeeklySummary.moodAverage)}`}</small>
                        </article>
                        <article className="private-weekly-card">
                          <span>Adherencia básica</span>
                          <strong>{`${privateHormonalWeeklySummary.adherenceRate}%`}</strong>
                          <small>{`${privateHormonalWeeklySummary.trackedDaysCount}/7 días con seguimiento real.`}</small>
                        </article>
                      </div>
                    ) : (
                      <div className="private-empty-state-panel">
                        <p className="empty-state">Activa un ciclo para ver el resumen semanal.</p>
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="Alertas operativas"
                    subtitle="Atención puntual para sostener el seguimiento sin saturar la vista."
                    className="card-soft"
                  >
                    <div className="private-alert-grid">
                      {privateOperationalAlerts.length === 0 ? (
                        <div className="private-alert-card private-alert-card-success">
                          <strong>Sin alertas operativas.</strong>
                          <small>El seguimiento actual se ve al día.</small>
                        </div>
                      ) : null}
                      {privateOperationalAlerts.map((item) => (
                        <div className={`private-alert-card private-alert-card-${item.tone || 'neutral'}`.trim()} key={item.id}>
                          <strong>{item.title}</strong>
                          <small>{item.body}</small>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Bitacora privada"
                    subtitle={
                      hasActivePrivateCycle
                        ? 'Actividad reciente del ciclo activo.'
                        : 'Actividad privada reciente.'
                    }
                    className={`card-soft private-primary-section ${hasActivePrivateCycle ? '' : 'private-empty-compact private-empty-tight'}`.trim()}
                  >
                    {hasActivePrivateCycle ? (
                      <div className="section-inline-actions section-inline-actions-tight private-timeline-filters">
                        <button
                          className={`button private-filter-button ${privateTimelineFilter === 'all' ? 'button-primary' : 'button-secondary'}`}
                          type="button"
                          onClick={() => setPrivateTimelineFilter('all')}
                        >
                          Todo
                        </button>
                        <button
                          className={`button private-filter-button ${privateTimelineFilter === 'events' ? 'button-primary' : 'button-secondary'}`}
                          type="button"
                          onClick={() => setPrivateTimelineFilter('events')}
                        >
                          Eventos
                        </button>
                        <button
                          className={`button private-filter-button ${privateTimelineFilter === 'products' ? 'button-primary' : 'button-secondary'}`}
                          type="button"
                          onClick={() => setPrivateTimelineFilter('products')}
                        >
                          Compras / componentes
                        </button>
                        <button
                          className={`button private-filter-button ${privateTimelineFilter === 'payments' ? 'button-primary' : 'button-secondary'}`}
                          type="button"
                          onClick={() => setPrivateTimelineFilter('payments')}
                        >
                          Pagos
                        </button>
                      </div>
                    ) : null}
                    <div className="metrics-card-list private-card-list private-timeline-list">
                      {filteredPrivateTimeline.length === 0 ? (
                        <p className="empty-state">{hasActivePrivateCycle ? 'Aun sin actividad.' : 'Aun sin actividad.'}</p>
                      ) : null}
                      {filteredPrivateTimeline.map((item) => {
                        const linkedCycle = privateCycles.find((cycle) => cycle.id === item.cycleId);
                        const linkedProduct = privateProducts.find((product) => product.id === item.productId);
                        const canEdit = item.kind === 'entry' || item.kind === 'product' || item.kind === 'payment';

                        return (
                          <article className="metrics-card private-entry-card private-timeline-card" key={item.id}>
                            <div className="metrics-card-top">
                              <div>
                                <strong>{item.title || 'Registro privado'}</strong>
                                <span>
                                  {item.date ? formatPrivateDate(item.date) : 'Sin fecha'}
                                  {item.time ? ` · ${item.time}` : ''}
                                </span>
                              </div>
                              <span className={getPrivateEventChipClass(item.eventType)}>
                                {privateEventTypeLabels[item.eventType] || item.eventType || 'Evento'}
                              </span>
                            </div>
                            <div className="entry-details">
                              <span>{item.category ? privateCategoryLabels[item.category] || item.category : 'Sin categoria'}</span>
                              <span>{linkedProduct?.name || 'Sin producto asociado'}</span>
                              <span>{item.amountLabel || 'Sin valor asociado'}</span>
                              <span>{item.secondary || 'Sin detalle adicional'}</span>
                              <span>{linkedCycle?.name || 'Sin ciclo asociado'}</span>
                            </div>
                            {item.notes ? <p className="metrics-notes">{item.notes}</p> : null}
                            {canEdit ? (
                              <div className="entry-actions">
                                <button
                                  className="button button-secondary"
                                  type="button"
                                  onClick={() => {
                                    bumpPrivateActivity();
                                    if (item.kind === 'entry') {
                                      duplicatePrivateEntry(item.sourceId);
                                    } else if (item.kind === 'product') {
                                      duplicatePrivateProduct(item.sourceId);
                                    } else if (item.kind === 'payment') {
                                      duplicatePrivatePayment(item.sourceId);
                                    }
                                  }}
                                >
                                  Duplicar
                                </button>
                                <button
                                  className="button button-secondary"
                                  type="button"
                                  onClick={() => {
                                    bumpPrivateActivity();
                                    if (item.kind === 'entry') {
                                      startEditing('privateHormonalEntries', item.sourceId, setPrivateEntryForm, setEditingPrivateEntryId, 'private');
                                      openPrivateForm('event');
                                    } else if (item.kind === 'product') {
                                      startEditing('privateProducts', item.sourceId, setPrivateProductForm, setEditingPrivateProductId, 'private');
                                      openPrivateForm('product');
                                    } else if (item.kind === 'payment') {
                                      startEditing('privatePayments', item.sourceId, setPrivatePaymentForm, setEditingPrivatePaymentId, 'private');
                                      openPrivateForm('payment');
                                    }
                                  }}
                                >
                                  Editar
                                </button>
                                <button
                                  className="button button-danger"
                                  type="button"
                                  onClick={() => {
                                    bumpPrivateActivity();
                                    if (item.kind === 'entry') {
                                      deleteRecord('privateHormonalEntries', item.sourceId, setEditingPrivateEntryId, resetPrivateEntryForm);
                                    } else if (item.kind === 'product') {
                                      deleteRecord('privateProducts', item.sourceId, setEditingPrivateProductId, resetPrivateProductForm);
                                    } else if (item.kind === 'payment') {
                                      deleteRecord('privatePayments', item.sourceId, setEditingPrivatePaymentId, resetPrivatePaymentForm);
                                    }
                                  }}
                                >
                                  Eliminar
                                </button>
                              </div>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>
                    {privateNextStepRecommendation ? (
                      <p className="section-helper private-next-step">{privateNextStepRecommendation}</p>
                    ) : null}
                  </SectionCard>

                  <SectionCard
                    title="Acciones rapidas"
                    subtitle="Atajos para registrar actividad."
                    className={`card-soft private-actions-panel ${hasActivePrivateCycle ? '' : 'private-empty-compact private-empty-tight'}`.trim()}
                  >
                    <div className="section-inline-actions">
                      <button className="button button-primary" type="button" onClick={() => openPrivateForm('event')}>
                        Nuevo evento
                      </button>
                      <button className="button button-secondary" type="button" onClick={() => openPrivateForm('payment')}>
                        Nuevo pago
                      </button>
                      <button className="button button-secondary" type="button" onClick={() => openPrivateForm('product')}>
                        Nuevo componente
                      </button>
                      <button className="button button-secondary" type="button" onClick={handlePrivateExportBackup}>
                        Exportar respaldo privado
                      </button>
                    </div>
                  </SectionCard>

                  <div
                    className={`split-layout private-layout private-block-cycles ${
                      hasActivePrivateCycle ? '' : 'private-primary-focus'
                    }`.trim()}
                    ref={privateCycleSectionRef}
                  >
                    <SectionCard
                      title="Ciclo activo"
                      subtitle={hasActivePrivateCycle ? 'Estado operativo y financiero del ciclo activo.' : 'Resumen actual.'}
                      className={`card-soft private-secondary-pane ${hasActivePrivateCycle ? '' : 'private-empty-compact private-empty-tight'}`.trim()}
                    >
                      {hasActivePrivateCycle ? (
                        <div className="backup-meta-grid">
                          <div className="backup-meta-card">
                            <span>Nombre</span>
                            <strong>{activePrivateCycle?.name || 'Sin ciclo activo'}</strong>
                          </div>
                          <div className="backup-meta-card">
                            <span>Tipo / estado</span>
                            <strong>
                              {`${privateCycleTypeLabels[activePrivateCycle.type] || activePrivateCycle.type} · ${
                                privateCycleStatusLabels[activePrivateCycle.status] || activePrivateCycle.status
                              }`}
                            </strong>
                            <small className="private-status-copy">
                              <span className="metrics-source-chip">{getPrivateCycleStatusPhrase(activePrivateCycle.status)}</span>
                            </small>
                          </div>
                          <div className="backup-meta-card">
                            <span>Inicio / fin estimado</span>
                            <strong>
                              {`${activePrivateCycle.startDate ? formatPrivateDate(activePrivateCycle.startDate) : 'Sin inicio'} · ${
                                activePrivateCycle.estimatedEndDate ? formatPrivateDate(activePrivateCycle.estimatedEndDate) : 'Sin fin'
                              }`}
                            </strong>
                          </div>
                          <div className="backup-meta-card">
                            <span>Objetivo breve</span>
                            <strong>{activePrivateCycle?.objective || 'Sin objetivo definido'}</strong>
                          </div>
                          <div className="backup-meta-card">
                            <span>Componentes asociados</span>
                            <strong>{privateSummary.activeProductsCount}</strong>
                          </div>
                          <div className="backup-meta-card">
                            <span>Pagos asociados</span>
                            <strong>{privateSummary.activePaymentsCount}</strong>
                          </div>
                          <div className="backup-meta-card">
                            <span>Eventos asociados</span>
                            <strong>{privateSummary.activeEntriesCount}</strong>
                          </div>
                          <div className="backup-meta-card">
                            <span>Costo total</span>
                            <strong>{formatCurrencyMx(activeCycleFinancialSummary.totalInvested)}</strong>
                          </div>
                          <div className="backup-meta-card">
                            <span>Pagado</span>
                            <strong>{formatCurrencyMx(activeCycleFinancialSummary.totalPaid)}</strong>
                          </div>
                          <div className="backup-meta-card">
                            <span>Pendiente</span>
                            <strong>{formatCurrencyMx(activeCycleFinancialSummary.pendingBalance)}</strong>
                          </div>
                          <div className="backup-meta-card">
                            <span>Proximo evento</span>
                            <strong>
                              {privateSummary.nextEvent
                                ? privateSummary.nextEvent.name || privateEventTypeLabels[privateSummary.nextEvent.eventType] || 'Evento'
                                : 'Sin evento proximo'}
                            </strong>
                            <small>
                              {privateSummary.nextEvent
                                ? `${privateSummary.nextEvent.nextApplication
                                    ? formatPrivateDateTimeHuman(privateSummary.nextEvent.nextApplication)
                                    : privateSummary.nextEvent.date
                                      ? `${formatPrivateDate(privateSummary.nextEvent.date)}${privateSummary.nextEvent.time ? ` · ${privateSummary.nextEvent.time}` : ''}`
                                      : 'Sin fecha'}${nextPrivateEventProduct?.name ? ` · ${nextPrivateEventProduct.name}` : ''}`
                                : 'Sin evento proximo'}
                            </small>
                          </div>
                        </div>
                      ) : (
                        <div className="private-cycle-empty-card">
                          <div className="objective-progress-copy">
                            <strong>Sin ciclo activo.</strong>
                            <span>Disponible cuando actives un ciclo.</span>
                          </div>
                        </div>
                      )}
                      <div className="metrics-card-list private-card-list">
                        {privateCycles.length === 0 ? <p className="empty-state">Todavia no hay ciclos privados guardados.</p> : null}
                        {privateCycles.map((item) => {
                          const cycleFinancials = privateCycleFinancialMap.get(item.id);

                          return (
                          <article className="metrics-card private-entry-card" key={item.id}>
                            <div className="metrics-card-top">
                              <div>
                                <strong>{item.name || 'Ciclo sin nombre'}</strong>
                                <span>{privateCycleTypeLabels[item.type] || item.type} · {privateCycleStatusLabels[item.status] || item.status}</span>
                              </div>
                              <span className="metrics-source-chip">{privateCycleStatusLabels[item.status] || item.status}</span>
                            </div>
                            <div className="entry-details">
                              <span>{item.startDate ? `Inicio ${formatPrivateDate(item.startDate)}` : 'Inicio sin dato'}</span>
                              <span>{item.estimatedEndDate ? `Fin ${formatPrivateDate(item.estimatedEndDate)}` : 'Fin sin dato'}</span>
                              <span>{item.objective || 'Objetivo sin dato'}</span>
                              {cycleFinancials?.hasOperationalBreakdown ? (
                                <span>{`Protectores ${formatCurrencyMx(cycleFinancials.protectorsSubtotal)} · TRT ${formatCurrencyMx(cycleFinancials.trtConfirmedSubtotal)}`}</span>
                              ) : null}
                              {cycleFinancials ? (
                                <span>{`Confirmado ${formatCurrencyMx(cycleFinancials.confirmedTotal || cycleFinancials.totalInvested)} · Pagado ${formatCurrencyMx(cycleFinancials.totalPaid)} · Pendiente ${formatCurrencyMx(cycleFinancials.confirmedPendingBalance || cycleFinancials.pendingBalance)}`}</span>
                              ) : null}
                            </div>
                            {item.notes ? <p className="metrics-notes">{item.notes}</p> : null}
                            <div className="entry-actions">
                              <button className="button button-primary" type="button" onClick={() => setPrivateCycleAsActive(item.id)}>
                                {item.status === 'activo' ? 'Ciclo activo' : 'Marcar activo'}
                              </button>
                              <button
                                className="button button-secondary"
                                type="button"
                                onClick={() => {
                                  bumpPrivateActivity();
                                  startEditing('privateCycles', item.id, setPrivateCycleForm, setEditingPrivateCycleId, 'private');
                                  openPrivateForm('cycle', {
                                    focusSelector: 'input[name="name"], select[name="type"], input[name="startDate"], textárea[name="notes"]',
                                  });
                                }}
                              >
                                Editar
                              </button>
                              <button
                                className="button button-danger"
                                type="button"
                                onClick={() => {
                                  bumpPrivateActivity();
                                  deleteRecord('privateCycles', item.id, setEditingPrivateCycleId, resetPrivateCycleForm);
                                }}
                              >
                                Eliminar
                              </button>
                            </div>
                          </article>
                        )})}
                      </div>
                    </SectionCard>

                    <SectionCard
                      title="Ciclos privados"
                      subtitle={
                        hasActivePrivateCycle
                          ? 'Gestiona ciclos, estados y ventana operativa.'
                          : 'Empieza creando o activando un ciclo.'
                      }
                      className={`card-soft private-form-pane ${hasActivePrivateCycle ? '' : 'private-cycle-step-card'}`.trim()}
                    >
                      <div className="section-inline-actions section-inline-actions-tight">
                        <button className="button button-secondary private-toggle-button" type="button" onClick={() => togglePrivateForm('cycle')}>
                          {privateFormVisibility.cycle ? 'Ocultar formulario' : 'Mostrar formulario'}
                        </button>
                      </div>
                      {privateFormVisibility.cycle ? (
                        <RecordForm
                          title="Nuevo ciclo privado"
                          fields={[
                            {
                              type: 'section',
                              name: 'cycle-overview',
                              label: 'Registro diario',
                              hint: 'Define el contexto base del ciclo para que el resumen operativo, la agenda y los movimientos financieros queden bien ligados.',
                            },
                            {
                              name: 'name',
                              label: 'Nombre del ciclo',
                              type: 'text',
                              placeholder: 'Ej. Ciclo 2026',
                              hint: 'Usa un nombre corto y reconocible. Te ayudará a identificarlo rápido en la vista operativa.',
                            },
                            {
                              name: 'type',
                              label: 'Tipo',
                              type: 'select',
                              options: Object.entries(privateCycleTypeLabels).map(([value, label]) => ({ value, label })),
                              hint: 'Sirve para clasificar el enfoque general del ciclo, por ejemplo TRT, definido o personalizado.',
                            },
                            {
                              name: 'startDate',
                              label: 'Fecha de inicio',
                              type: 'date',
                              hint: 'Fecha real en que comenzó el ciclo. Se usa para ordenar y resumir el seguimiento.',
                            },
                            {
                              name: 'estimatedEndDate',
                              label: 'Fecha estimada de fin',
                              type: 'date',
                              hint: 'Fecha prevista de cierre. Puedes ajustarla después si el plan cambia.',
                            },
                            {
                              name: 'status',
                              label: 'Estado',
                              type: 'select',
                              options: Object.entries(privateCycleStatusLabels).map(([value, label]) => ({ value, label })),
                              hint: 'Indica si el ciclo está planeado, activo, pausado o finalizado.',
                            },
                            {
                              type: 'section',
                              name: 'cycle-parameters',
                              label: 'Parámetros hormonales / físicos',
                              hint: 'Aqué defines el propósito general del ciclo y el resultado esperado, sin entrar todavía al detalle de productos o eventos.',
                            },
                            {
                              name: 'objective',
                              label: 'Objetivo breve',
                              type: 'text',
                              placeholder: 'Ej. Definir másculo',
                              hint: 'Resume el propósito principal. Ayuda a leer el ciclo sin tener que abrir notas largas.',
                            },
                            {
                              type: 'section',
                              name: 'cycle-notes-section',
                              label: 'Notas / observaciones',
                              hint: 'Usa este espacio para contexto privado, límites, instrucciones o cualquier observación sensible.',
                            },
                            {
                              name: 'notes',
                              label: 'Notas privadas',
                              type: 'textárea',
                              placeholder: 'Ej. seguimiento privado de compuestos, aplicaciones, pagos y observaciones relevantes...',
                              hint: 'Cualquier criterio privado, ajuste o comentario importante del ciclo.',
                              rows: 4,
                            },
                          ]}
                          formData={privateCycleForm}
                          onChange={(event) => {
                            bumpPrivateActivity();
                            handleRecordFormChange(event, setPrivateCycleForm);
                          }}
                          onSubmit={handlePrivateCycleSubmit}
                          onCancel={() => {
                            resetPrivateCycleForm();
                            setEditingPrivateCycleId(null);
                          }}
                          isEditing={Boolean(editingPrivateCycleId)}
                          submitLabel={editingPrivateCycleId ? 'Guardar ciclo' : 'Crear ciclo'}
                        />
                      ) : (
                        <p className="section-helper">Abre el formulario cuando necesites crear, editar o activar un ciclo.</p>
                      )}
                    </SectionCard>
                  </div>

                  <div className="split-layout private-layout private-block-components" ref={privateProductSectionRef}>
                    <SectionCard
                      title="Componentes del ciclo"
                      subtitle={hasActivePrivateCycle ? 'Asocia productos y soporte al ciclo activo.' : 'Bloqueado hasta activar un ciclo.'}
                      className={`card-soft private-form-pane ${hasActivePrivateCycle ? '' : 'private-compact-card private-empty-tight private-blocked-card'}`.trim()}
                    >
                      <div className="section-inline-actions section-inline-actions-tight">
                        <button className="button button-secondary private-toggle-button" type="button" onClick={() => togglePrivateForm('product')}>
                          {privateFormVisibility.product ? 'Ocultar formulario' : 'Mostrar formulario'}
                        </button>
                      </div>
                      {!hasActivePrivateCycle && privateFormVisibility.product ? (
                        <div className={`private-inline-alert ${privateBlockedTarget === 'product' ? 'private-inline-alert-focus' : ''}`.trim()}>
                          <p>{getPrivateBlockedCopy('product')}</p>
                          <button className="button button-secondary private-blocked-cta" type="button" onClick={() => openPrivateForm('cycle')}>
                            Crear o activar ciclo
                          </button>
                        </div>
                      ) : privateFormVisibility.product ? (
                        <>
                          <RecordForm
                            title="Nuevo componente del ciclo"
                            fields={[
                              {
                                type: 'section',
                                name: 'product-cycle-link',
                                label: 'Suplementación / intervención',
                                hint: 'Asocia cada producto, soporte o intervención al ciclo correcto para mantener el costo y el inventario bien conectados.',
                              },
                              {
                                name: 'cycleId',
                                label: 'Ciclo privado',
                                type: 'select',
                                options: [{ value: '', label: 'Sin ciclo' }, ...privateCycleOptions],
                                hint: 'Selecciona el ciclo al que pertenece esta compra o componente.',
                              },
                              {
                                name: 'name',
                                label: 'Nombre',
                                type: 'text',
                                placeholder: 'Ej. Masteron, Testosterona, Primo, soporte...',
                                hint: 'Nombre del producto o apoyo usado dentro del ciclo.',
                              },
                              {
                                name: 'category',
                                label: 'Categoria',
                                type: 'select',
                                options: Object.entries(privateCategoryLabels).map(([value, label]) => ({ value, label })),
                                hint: 'Clasifica el componente para que la bitácora y el resumen sean más claros.',
                              },
                              {
                                name: 'presentation',
                                label: 'Presentacion',
                                type: 'text',
                                placeholder: 'Ej. vial 10 ml, blister, caja o estudio...',
                                hint: 'Describe la forma del producto para reconocerlo rápido.',
                              },
                              {
                                name: 'purchasedQuantity',
                                label: 'Cantidad comprada',
                                type: 'text',
                                placeholder: 'Ej. 2',
                                hint: 'Cantidad total adquirida para el ciclo.',
                              },
                              {
                                name: 'unit',
                                label: 'Unidad',
                                type: 'text',
                                placeholder: 'Ej. viales, cajas, ml o tabs',
                                hint: 'Unidad de referencia de la compra o inventario.',
                              },
                              {
                                name: 'totalCost',
                                label: 'Costo total',
                                type: 'number',
                                min: '0',
                                step: '0.01',
                                placeholder: 'Ej. 2800',
                                hint: 'Costo total conocido del componente. Si aún no lo confirmas, déjalo vacío.',
                              },
                              {
                                name: 'supplier',
                                label: 'Proveedor o fuente',
                                type: 'text',
                                placeholder: 'Ej. coach, farmacia, proveedor privado...',
                                hint: 'Origen o referencia privada de la compra.',
                              },
                              {
                                name: 'purchaseDate',
                                label: 'Fecha de compra',
                                type: 'date',
                                hint: 'Fecha en que se adquirió el producto o servicio.',
                              },
                              {
                                name: 'status',
                                label: 'Estatus',
                                type: 'select',
                                options: Object.entries(privateProductStatusLabels).map(([value, label]) => ({ value, label })),
                                hint: 'útil para saber si está pendiente, comprado, en uso, terminado o descartado.',
                              },
                              {
                                type: 'section',
                                name: 'product-notes-section',
                                label: 'Notas / observaciones',
                                hint: 'Registra detalles de calidad, seguimiento, lote o cualquier contexto útil del componente.',
                              },
                              {
                                name: 'notes',
                                label: 'Notas privadas',
                                type: 'textárea',
                                placeholder: 'Ej. compra inicial, calidad observada, costo pendiente de confirmar...',
                                hint: 'Cualquier comentario relevante del producto o compra.',
                                rows: 4,
                              },
                            ]}
                            formData={privateProductForm}
                            onChange={(event) => {
                              bumpPrivateActivity();
                              handleRecordFormChange(event, setPrivateProductForm);
                            }}
                            onSubmit={handlePrivateProductSubmit}
                            onCancel={() => {
                              resetPrivateProductForm();
                              setEditingPrivateProductId(null);
                            }}
                            isEditing={Boolean(editingPrivateProductId)}
                            submitDisabled={privateProductSubmitDisabled}
                            submitLabel={editingPrivateProductId ? 'Guardar componente' : 'Guardar componente'}
                          />
                        </>
                      ) : (
                        <p className="section-helper">
                          {hasActivePrivateCycle
                            ? 'Muestra el formulario cuando necesites agregar un componente.'
                            : 'Se habilita con un ciclo activo.'}
                        </p>
                      )}
                    </SectionCard>

                    {hasActivePrivateCycle ? (
                      <SectionCard
                        title="Productos del ciclo"
                        subtitle="Inventario operativo y compras del ciclo activo."
                        className="card-soft private-secondary-pane"
                      >
                        <div className="metrics-card-list private-card-list">
                          {activeCycleProducts.length === 0 ? <p className="empty-state">Aun sin productos.</p> : null}
                          {activeCycleProducts.map((item) => {
                            const linkedCycle = privateCycles.find((cycle) => cycle.id === item.cycleId);
                            return (
                              <article className="metrics-card private-entry-card" key={item.id}>
                                <div className="metrics-card-top">
                                  <div>
                                    <strong>{item.name || 'Componente sin nombre'}</strong>
                                    <span>{linkedCycle?.name || 'Sin ciclo'} · {privateProductStatusLabels[item.status] || item.status}</span>
                                  </div>
                                  <span className="metrics-source-chip">{privateCategoryLabels[item.category] || item.category}</span>
                                </div>
                                <div className="entry-details">
                                  <span>{item.presentation || 'Presentacion sin dato'}</span>
                                  <span>{item.purchasedQuantity || '0'} {item.unit || ''}</span>
                                  <span>{formatCurrencyMx(item.totalCost)}</span>
                                  <span>{item.supplier || 'Proveedor sin dato'}</span>
                                  <span>{item.purchaseDate ? formatPrivateDate(item.purchaseDate) : 'Compra sin fecha'}</span>
                                </div>
                                {item.notes ? <p className="metrics-notes">{item.notes}</p> : null}
                                <div className="entry-actions">
                                  <button
                                    className="button button-secondary"
                                    type="button"
                                    onClick={() => {
                                      bumpPrivateActivity();
                                      duplicatePrivateProduct(item.id);
                                    }}
                                  >
                                    Duplicar
                                  </button>
                                  <button
                                    className="button button-secondary"
                                    type="button"
                                  onClick={() => {
                                      bumpPrivateActivity();
                                      startEditing('privateProducts', item.id, setPrivateProductForm, setEditingPrivateProductId, 'private');
                                      openPrivateForm('product', {
                                        focusSelector: 'input[name="name"], select[name="category"], input[name="purchaseDate"], textárea[name="notes"]',
                                      });
                                    }}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    className="button button-danger"
                                    type="button"
                                    onClick={() => {
                                      bumpPrivateActivity();
                                      deleteRecord('privateProducts', item.id, setEditingPrivateProductId, resetPrivateProductForm);
                                    }}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </SectionCard>
                    ) : null}
                  </div>

                  <div className="split-layout private-layout private-block-payments" ref={privatePaymentSectionRef}>
                    <SectionCard
                      title="Pagos del ciclo"
                      subtitle={hasActivePrivateCycle ? 'Registra pagos y avance financiero del ciclo activo.' : 'Bloqueado hasta activar un ciclo.'}
                      className={`card-soft private-form-pane ${hasActivePrivateCycle ? '' : 'private-compact-card private-empty-tight private-blocked-card'}`.trim()}
                    >
                      <div className="section-inline-actions section-inline-actions-tight">
                        <button className="button button-secondary private-toggle-button" type="button" onClick={() => togglePrivateForm('payment')}>
                          {privateFormVisibility.payment ? 'Ocultar formulario' : 'Mostrar formulario'}
                        </button>
                      </div>
                      {!hasActivePrivateCycle && privateFormVisibility.payment ? (
                        <div className={`private-inline-alert ${privateBlockedTarget === 'payment' ? 'private-inline-alert-focus' : ''}`.trim()}>
                          <p>{getPrivateBlockedCopy('payment')}</p>
                          <button className="button button-secondary private-blocked-cta" type="button" onClick={() => openPrivateForm('cycle')}>
                            Crear o activar ciclo
                          </button>
                        </div>
                      ) : privateFormVisibility.payment ? (
                        <>
                          <RecordForm
                            title="Nuevo pago privado"
                            fields={[
                              {
                                type: 'section',
                                name: 'payment-cycle-link',
                                label: 'Registro diario',
                                hint: 'Cada pago queda ligado al ciclo para que el resumen financiero y el saldo pendiente sean confiables.',
                              },
                              {
                                name: 'cycleId',
                                label: 'Ciclo privado',
                                type: 'select',
                                options: [{ value: '', label: 'Sin ciclo' }, ...privateCycleOptions],
                                hint: 'Selecciona el ciclo al que corresponde este movimiento.',
                              },
                              {
                                name: 'concept',
                                label: 'Concepto',
                                type: 'text',
                                placeholder: 'Ej. Pago vial, analítica, soporte o envío...',
                                hint: 'Describe brevemente qué estás pagando.',
                              },
                              {
                                name: 'date',
                                label: 'Fecha',
                                type: 'date',
                                hint: 'Fecha real del movimiento.',
                              },
                              {
                                name: 'amount',
                                label: 'Monto',
                                type: 'number',
                                min: '0',
                                step: '0.01',
                                placeholder: 'Ej. 1450',
                                hint: 'Monto pagado o confirmado para este movimiento.',
                              },
                              {
                                name: 'method',
                                label: 'Metodo',
                                type: 'text',
                                placeholder: 'Ej. transferencia, efectivo o tarjeta',
                                hint: 'Método usado para el pago.',
                              },
                              {
                                name: 'status',
                                label: 'Estado',
                                type: 'select',
                                options: Object.entries(privatePaymentStatusLabels).map(([value, label]) => ({ value, label })),
                                hint: 'Permite distinguir si el pago ya quedó cubierto, pendiente o en validación.',
                              },
                              {
                                type: 'section',
                                name: 'payment-notes-section',
                                label: 'Notas / observaciones',
                                hint: 'úsalo para saldo restante, referencia bancaria, acuerdo de pago o cualquier aclaración.',
                              },
                              {
                                name: 'notes',
                                label: 'Notas',
                                type: 'textárea',
                                placeholder: 'Ej. pago parcial, saldo pendiente o referencia de transferencia...',
                                hint: 'Cualquier detalle útil para conciliar después.',
                                rows: 4,
                              },
                            ]}
                            formData={privatePaymentForm}
                            onChange={(event) => {
                              bumpPrivateActivity();
                              handleRecordFormChange(event, setPrivatePaymentForm);
                            }}
                            onSubmit={handlePrivatePaymentSubmit}
                            onCancel={() => {
                              resetPrivatePaymentForm();
                              setEditingPrivatePaymentId(null);
                            }}
                            isEditing={Boolean(editingPrivatePaymentId)}
                            submitDisabled={privatePaymentSubmitDisabled}
                            submitLabel={editingPrivatePaymentId ? 'Guardar pago' : 'Guardar pago'}
                          />
                        </>
                      ) : (
                        <p className="section-helper">
                          {hasActivePrivateCycle
                            ? 'Muestra el formulario cuando necesites registrar un pago.'
                            : 'Se habilita con un ciclo activo.'}
                        </p>
                      )}
                    </SectionCard>

                    {hasActivePrivateCycle ? (
                      <div ref={privateFinancialSummaryRef}>
                        <SectionCard
                          title="Resumen financiero"
                          subtitle="Protectores, TRT confirmado y pagos reales del ciclo activo."
                          className="card-soft private-secondary-pane"
                        >
                        <div className="backup-meta-grid private-financial-summary-grid">
                          {activeCycleFinancialSummary.hasOperationalBreakdown ? (
                            <>
                              <div className="backup-meta-card">
                                <span>Subtotal protectores</span>
                                <strong>{formatCurrencyMx(activeCycleFinancialSummary.protectorsSubtotal)}</strong>
                              </div>
                              <div className="backup-meta-card">
                                <span>Subtotal TRT confirmado</span>
                                <strong>{formatCurrencyMx(activeCycleFinancialSummary.trtConfirmedSubtotal)}</strong>
                              </div>
                              <div className="backup-meta-card">
                                <span>Total parcial confirmado</span>
                                <strong>{formatCurrencyMx(activeCycleFinancialSummary.confirmedTotal)}</strong>
                              </div>
                              <div className="backup-meta-card private-financial-card-emphasis">
                                <span>Total pagado</span>
                                <strong>{formatCurrencyMx(activeCycleFinancialSummary.totalPaid)}</strong>
                              </div>
                              <div className="backup-meta-card private-financial-card-alert">
                                <span>Saldo pendiente real</span>
                                <strong>{formatCurrencyMx(activeCycleFinancialSummary.confirmedPendingBalance)}</strong>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="backup-meta-card">
                                <span>Costo total acumulado</span>
                                <strong>{formatCurrencyMx(activeCycleFinancialSummary.totalInvested)}</strong>
                              </div>
                              <div className="backup-meta-card private-financial-card-emphasis">
                                <span>Total pagado</span>
                                <strong>{formatCurrencyMx(activeCycleFinancialSummary.totalPaid)}</strong>
                              </div>
                              <div className="backup-meta-card private-financial-card-alert">
                                <span>Saldo pendiente</span>
                                <strong>{formatCurrencyMx(activeCycleFinancialSummary.pendingBalance)}</strong>
                              </div>
                            </>
                          )}
                        </div>
                        <p className="section-helper">
                          {activeCycleFinancialSummary.hasOperationalBreakdown
                            ? `${activeCyclePayments.length} pagos registrados. Confirmado = protectores + TRT con precio real.`
                            : `${activeCyclePayments.length} pagos registrados para el ciclo activo.`}
                        </p>
                        {activeCycleFinancialSummary.unresolvedProducts?.length > 0 ? (
                          <p className="section-helper">
                            Pendientes de confirmar: {activeCycleFinancialSummary.unresolvedProducts.join(', ')}. No se suman al total confirmado hasta tener costo real.
                          </p>
                        ) : null}
                        <div className="metrics-card-list private-card-list">
                          {activeCyclePayments.length === 0 ? <p className="empty-state">Aun sin pagos.</p> : null}
                          {activeCyclePayments.map((item) => {
                            const linkedCycle = privateCycles.find((cycle) => cycle.id === item.cycleId);
                            return (
                              <article className="metrics-card private-entry-card" key={item.id}>
                                <div className="metrics-card-top">
                                  <div>
                                    <strong>{item.concept || 'Pago sin concepto'}</strong>
                                    <span>{linkedCycle?.name || 'Sin ciclo'} · {item.date ? formatPrivateDate(item.date) : 'Sin fecha'}</span>
                                  </div>
                                  <span className="metrics-source-chip">{privatePaymentStatusLabels[item.status] || item.status}</span>
                                </div>
                                <div className="entry-details">
                                  <span>{formatCurrencyMx(item.amount)}</span>
                                  <span>{item.method || 'Metodo sin dato'}</span>
                                  <span>{privatePaymentStatusLabels[item.status] || item.status}</span>
                                </div>
                                {item.notes ? <p className="metrics-notes">{item.notes}</p> : null}
                                <div className="entry-actions">
                                  <button
                                    className="button button-secondary"
                                    type="button"
                                    onClick={() => {
                                      bumpPrivateActivity();
                                      duplicatePrivatePayment(item.id);
                                    }}
                                  >
                                    Duplicar
                                  </button>
                                  <button
                                    className="button button-secondary"
                                    type="button"
                                    onClick={() => {
                                      bumpPrivateActivity();
                                      startEditing('privatePayments', item.id, setPrivatePaymentForm, setEditingPrivatePaymentId, 'private');
                                      openPrivateForm('payment', {
                                        focusSelector: 'input[name="concept"], input[name="date"], input[name="amount"], textárea[name="notes"]',
                                      });
                                    }}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    className="button button-danger"
                                    type="button"
                                    onClick={() => {
                                      bumpPrivateActivity();
                                      deleteRecord('privatePayments', item.id, setEditingPrivatePaymentId, resetPrivatePaymentForm);
                                    }}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                        </SectionCard>
                      </div>
                    ) : null}
                  </div>

                  <div className="split-layout private-layout private-block-events" ref={privateEventSectionRef}>
                    <SectionCard
                      title="Eventos privados"
                      subtitle={hasActivePrivateCycle ? 'Captura aplicaciones, controles, incidencias o seguimiento del ciclo.' : 'Bloqueado hasta activar un ciclo.'}
                      className={`card-soft private-form-pane ${hasActivePrivateCycle ? '' : 'private-compact-card private-empty-tight private-blocked-card'}`.trim()}
                    >
                      <div className="section-inline-actions section-inline-actions-tight">
                        <button className="button button-secondary private-toggle-button" type="button" onClick={() => togglePrivateForm('event')}>
                          {privateFormVisibility.event ? 'Ocultar formulario' : 'Mostrar formulario'}
                        </button>
                      </div>
                      {!hasActivePrivateCycle && privateFormVisibility.event ? (
                        <div className={`private-inline-alert ${privateBlockedTarget === 'event' ? 'private-inline-alert-focus' : ''}`.trim()}>
                          <p>{getPrivateBlockedCopy('event')}</p>
                          <button className="button button-secondary private-blocked-cta" type="button" onClick={() => openPrivateForm('cycle')}>
                            Crear o activar ciclo
                          </button>
                        </div>
                      ) : privateFormVisibility.event ? (
                        <>
                          <RecordForm
                            title="Registro privado"
                            fields={[
                              {
                                type: 'section',
                                name: 'event-daily-section',
                                label: 'Registro diario',
                                hint: 'Captura aquí la actividad real del día: aplicaciones, controles, síntomas o incidencias del ciclo.',
                              },
                              {
                                name: 'date',
                                label: 'Fecha',
                                type: 'date',
                                hint: 'Fecha real del evento. Mantenerla correcta mejora agenda, bitácora y cronología.',
                              },
                              {
                                name: 'time',
                                label: 'Hora',
                                type: 'time',
                                hint: 'Hora exacta si la conoces. Si no, puedes dejarla vacía y el sistema lo tratará como evento sin hora.',
                              },
                              {
                                name: 'cycleId',
                                label: 'Ciclo privado',
                                type: 'select',
                                options: [{ value: '', label: 'Sin ciclo' }, ...privateCycleOptions],
                                hint: 'Asocia el evento al ciclo correcto para que aparezca en agenda y resumen.',
                              },
                              {
                                name: 'productId',
                                label: 'Producto asociado',
                                type: 'select',
                                options: [{ value: '', label: 'Sin producto' }, ...privateProductOptions],
                                hint: 'Si el evento está ligado a un producto o componente concreto, selecciónalo aquí.',
                              },
                              {
                                name: 'eventType',
                                label: 'Tipo de evento',
                                type: 'select',
                                options: Object.entries(privateEventTypeLabels).map(([value, label]) => ({ value, label })),
                                hint: 'Distingue si fue una aplicación, toma oral, analítica, compra, síntoma o control.',
                              },
                              {
                                name: 'name',
                                label: 'Nombre',
                                type: 'text',
                                placeholder: 'Ej. Aplicación Masteron, control, síntoma o incidencia...',
                                hint: 'Nombre corto y claro para reconocer el evento en la bitácora.',
                              },
                              {
                                type: 'section',
                                name: 'event-parameters-section',
                                label: 'Parámetros hormonales / físicos',
                                hint: 'Registra aquí lo que define la intervención: categoría, dosis, vía y frecuencia. Si no aplica, puedes dejarlo vacío.',
                              },
                              {
                                name: 'category',
                                label: 'Categoria',
                                type: 'select',
                                options: Object.entries(privateCategoryLabels).map(([value, label]) => ({ value, label })),
                                hint: 'Categoría clínica u operativa del evento. Ej: Masteron, Testosterona, analítica o soporte.',
                              },
                              {
                                name: 'dose',
                                label: 'Dosis',
                                type: 'text',
                                placeholder: 'Ej. 250 mg o 1 ml',
                                hint: 'Cantidad aplicada o ingerida. Si es un evento sin dosis, déjalo vacío.',
                              },
                              {
                                name: 'unit',
                                label: 'Unidad',
                                type: 'text',
                                placeholder: 'Ej. mg, ml, UI o cápsulas',
                                hint: 'Unidad de la dosis o medida usada en el evento.',
                              },
                              {
                                name: 'route',
                                label: 'Via',
                                type: 'text',
                                placeholder: 'Ej. IM, SC u oral',
                                hint: 'Forma de administración o vía relevante para el evento.',
                              },
                              {
                                name: 'frequency',
                                label: 'Frecuencia',
                                type: 'text',
                                placeholder: 'Ej. semanal, ED, EOD o 3 veces por semana',
                                hint: 'Cada cuánto se usa o se repite esta intervención.',
                              },
                              {
                                type: 'section',
                                name: 'event-follow-up-section',
                                label: 'Notas / observaciones',
                                hint: 'Usa esta parte para el seguimiento: próxima aplicación, síntomas, respuesta, incidencias o cualquier observación relevante.',
                              },
                              {
                                name: 'nextApplication',
                                label: 'Proximo evento / aplicacion',
                                type: 'datetime-local',
                                hint: 'Si ya sabes cuándo toca de nuevo, déjalo programado para alimentar la agenda.',
                              },
                              {
                                name: 'notes',
                                label: 'Notas privadas',
                                type: 'textárea',
                                placeholder: 'Ej. me sentí con baja energía en la tarde, leve molestia local o respuesta estable...',
                                hint: 'Cualquier síntoma, efecto secundario o cambio relevante del día.',
                                rows: 4,
                              },
                            ]}
                            formData={privateEntryForm}
                            onChange={(event) => {
                              bumpPrivateActivity();
                              const { name, value } = event.target;
                              setPrivateEntryForm((current) => {
                                if (name === 'cycleId') {
                                  return { ...current, cycleId: value, productId: '' };
                                }
                                return { ...current, [name]: value };
                              });
                            }}
                            onSubmit={handlePrivateEntrySubmit}
                            onCancel={() => {
                              resetPrivateEntryForm();
                              setEditingPrivateEntryId(null);
                            }}
                            isEditing={Boolean(editingPrivateEntryId)}
                            submitDisabled={privateEventSubmitDisabled}
                            submitLabel={editingPrivateEntryId ? 'Guardar evento' : 'Guardar evento'}
                          />
                        </>
                      ) : (
                        <p className="section-helper">
                          {hasActivePrivateCycle
                            ? 'Abre el formulario para registrar actividad privada.'
                            : 'Se habilita con un ciclo activo.'}
                        </p>
                      )}
                    </SectionCard>
                  </div>
                </div>
              </>
            )}
          </>
          </HormonalTab>
        ) : null}
      </main>
    </div>
  );
}

export default App;




