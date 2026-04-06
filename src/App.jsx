
import { useEffect, useMemo, useRef, useState } from 'react';
import EntryList from './components/EntryList';
import GoalForm from './components/GoalForm';
import HistoryView from './components/HistoryView';
import ProgressCard from './components/ProgressCard';
import RecordForm from './components/RecordForm';
import SectionCard from './components/SectionCard';
import { defaultState } from './data/defaultState';
import { isSupabaseConfigured } from './lib/supabase';
import { buildTodaySummary } from './utils/domain/dashboardSummary';
import {
  getActiveFastingLog,
  calculateFastingDurationHours,
  calculateLiveElapsedHours,
  createEmptyFastingLog,
  createEmptyFastingProtocol,
  doesFastingOverlapWeek,
  fastingDayLabels,
  fastingDayOrder,
  fastingFeelingLabels,
  fastingTypeLabels,
  findFastingProtocolForDate,
  formatHoursLabel,
  formatProtocolLabel,
  getCurrentDateTimeValue,
  getDayOfWeekKey,
  getFastingDatesInsideRange,
  getFastingDisplayText,
  getFastingElapsedHours,
  getFastingHoursInsideRange,
  getFastingRecordDate,
  getFastingStatusClass,
  getFastingStatusLabel,
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
  buildPrivateSummary,
  buildPrivateTimeline,
  createEmptyPrivateCycle,
  createEmptyPrivateEntry,
  createEmptyPrivatePayment,
  createEmptyPrivateProduct,
  getPrivateActiveCycle,
  getPrivateCycleFinancialSummary,
  getPrivatePinLength,
  isValidPrivatePin,
  privateCategoryLabels,
  privateCycleStatusLabels,
  privateCycleTypeLabels,
  privateEventTypeLabels,
  privatePaymentStatusLabels,
  privateProductStatusLabels,
} from './utils/domain/private';
import {
  compareSnapshotRecency,
  createDeviceId,
  ensureSyncMeta,
  fetchRemoteSnapshot,
  getSupabaseSession,
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
  sortExercises,
  sortFoods,
  sortHydrationEntries,
  sortSupplements,
  supplementCategoryLabels,
  supplementFilterOptions,
} from './utils/domain/records';
import { average, createId, getLatestEntry, shiftDateByDays, sumBy } from './utils/domain/shared';
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
import { clearAppData, loadAppData, migrateAppData, saveAppData } from './utils/storage';

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'objectives', label: 'Objetivos' },
  { id: 'foods', label: 'Alimentos' },
  { id: 'supplements', label: 'Suplementos' },
  { id: 'fasting', label: 'Ayuno' },
  { id: 'exercises', label: 'Ejercicio' },
  { id: 'metrics', label: 'Metricas' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'history', label: 'Historial' },
  { id: 'private', label: 'Salud hormonal' },
  { id: 'settings', label: 'Ajustes' },
];

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

  return detailParts.join(' • ');
}

function App() {
  const currentDate = getToday();
  const isDevMode = import.meta.env.DEV;
  const appBuildLabel = __APP_BUILD_LABEL__;
  const remoteSyncEnabled = isSupabaseConfigured;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [diaryData, setDiaryData] = useState(defaultState);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [goalForm, setGoalForm] = useState(defaultState.goals);
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
  const [metricForm, setMetricForm] = useState(createEmptyMetric);
  const [privateEntryForm, setPrivateEntryForm] = useState(createEmptyPrivateEntry);
  const [privateCycleForm, setPrivateCycleForm] = useState(createEmptyPrivateCycle);
  const [privateProductForm, setPrivateProductForm] = useState(createEmptyPrivateProduct);
  const [privatePaymentForm, setPrivatePaymentForm] = useState(createEmptyPrivatePayment);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [editingHydrationId, setEditingHydrationId] = useState(null);
  const [editingFoodTemplateId, setEditingFoodTemplateId] = useState(null);
  const [editingFastingProtocolId, setEditingFastingProtocolId] = useState(null);
  const [editingFastingLogId, setEditingFastingLogId] = useState(null);
  const [editingSupplementId, setEditingSupplementId] = useState(null);
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [editingMetricId, setEditingMetricId] = useState(null);
  const [editingPrivateEntryId, setEditingPrivateEntryId] = useState(null);
  const [editingPrivateCycleId, setEditingPrivateCycleId] = useState(null);
  const [editingPrivateProductId, setEditingPrivateProductId] = useState(null);
  const [editingPrivatePaymentId, setEditingPrivatePaymentId] = useState(null);
  const [weekReferenceDate, setWeekReferenceDate] = useState(currentDate);
  const [showAllRecentFoods, setShowAllRecentFoods] = useState(false);
  const [showFoodTemplateBuilder, setShowFoodTemplateBuilder] = useState(true);
  const [showRoutineBuilder, setShowRoutineBuilder] = useState(true);
  const [showFastingProtocolBuilder, setShowFastingProtocolBuilder] = useState(true);
  const [supplementFilter, setSupplementFilter] = useState('todos');
  const [exerciseFilter, setExerciseFilter] = useState('todos');
  const [fastingNow, setFastingNow] = useState(() => Date.now());
  const [backupInputKey, setBackupInputKey] = useState(0);
  const [backupFeedback, setBackupFeedback] = useState({ type: '', text: '' });
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
  const syncDebounceTimeoutRef = useRef(null);
  const skipNextRemoteSyncRef = useRef(false);
  const privateAutoLockTimeoutRef = useRef(null);
  const privateCycleSectionRef = useRef(null);
  const privateProductSectionRef = useRef(null);
  const privatePaymentSectionRef = useRef(null);
  const privateEventSectionRef = useRef(null);

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
    } else if (!activePrivateCycle && ['product', 'event', 'payment'].includes(formKey)) {
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
      product: privateProductSectionRef,
      event: privateEventSectionRef,
      payment: privatePaymentSectionRef,
    };

    window.setTimeout(() => {
      const targetNode = targetMap[nextFormKey]?.current;
      targetNode?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const focusSelector = options.focusSelector || 'input, select, textarea';
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
      focusSelector: 'input[name="time"], input[name="name"], select[name="eventType"], textarea[name="notes"]',
    });
  }

  function getPrivateBlockedCopy(formKey) {
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

  useEffect(() => {
    const loadedData = loadAppData();
    const preparedData = ensureSyncMeta(
      loadedData,
      loadedData?.syncMeta?.deviceId || createDeviceId()
    );
    syncDeviceIdRef.current = preparedData.syncMeta.deviceId;
    latestPersistedDataRef.current = preparedData;
    setDiaryData(preparedData);
    setGoalForm(preparedData.goals || defaultState.goals);
    setObjectiveForm((preparedData.objectives && preparedData.objectives[0]) || defaultState.objectives?.[0] || createEmptyObjective());
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
    const saveTimestamp = getCurrentDateTimeValue();
    const dataToPersist = markDataUpdated(diaryData, {
      updatedAt: saveTimestamp,
      deviceId: syncDeviceIdRef.current || diaryData.syncMeta?.deviceId || createDeviceId(),
    });
    latestPersistedDataRef.current = dataToPersist;
    saveAppData(dataToPersist);
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

    fetchRemoteSnapshot(syncUser.id)
      .then((remoteSnapshot) => {
        if (cancelled) return;

        const localSnapshot = latestPersistedDataRef.current;

        if (!remoteSnapshot?.data) {
          setHasResolvedRemoteSnapshot(true);
          setSyncStatus(localSnapshot.syncMeta?.updatedAt ? 'pending' : 'synced');
          return;
        }

        const mergedRemoteData = mergeRemoteSnapshot({
          remoteData: migrateAppData(remoteSnapshot.data),
          localData: localSnapshot,
          deviceId: syncDeviceIdRef.current || localSnapshot.syncMeta?.deviceId || createDeviceId(),
          lastSyncedAt: remoteSnapshot.last_synced_at || remoteSnapshot.updated_at || getCurrentDateTimeValue(),
        });

        const winner = compareSnapshotRecency(localSnapshot, mergedRemoteData);

        if (winner === 'remote') {
          skipNextRemoteSyncRef.current = true;
          latestPersistedDataRef.current = mergedRemoteData;
          saveAppData(mergedRemoteData);
          setDiaryData(mergedRemoteData);
          setGoalForm(mergedRemoteData.goals || defaultState.goals);
          setObjectiveForm(
            (mergedRemoteData.objectives && mergedRemoteData.objectives[0]) ||
              defaultState.objectives?.[0] ||
              createEmptyObjective()
          );
          setSyncLastSyncedAt(mergedRemoteData.syncMeta?.lastSyncedAt || '');
          setSyncStatus('synced');
        } else if (winner === 'equal') {
          setSyncLastSyncedAt(mergedRemoteData.syncMeta?.lastSyncedAt || '');
          setSyncStatus('synced');
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
        const syncResult = await pushRemoteSnapshot({
          userId: syncUser.id,
          data: currentSnapshot,
        });
        const syncedSnapshot = markDataSynced(currentSnapshot, {
          deviceId: syncDeviceIdRef.current || currentSnapshot.syncMeta?.deviceId || createDeviceId(),
          lastSyncedAt: syncResult.lastSyncedAt || getCurrentDateTimeValue(),
        });
        latestPersistedDataRef.current = syncedSnapshot;
        saveAppData(syncedSnapshot);
        setSyncLastSyncedAt(syncedSnapshot.syncMeta?.lastSyncedAt || '');
        setSyncStatus('synced');
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
        return isSameDate(recordDate, currentDate) || (!!breakDate && isSameDate(breakDate, currentDate));
      }),
    [currentDate, sortedFastingLogs]
  );

  const activeFastEntry = useMemo(
    () => getActiveFastingLog(sortedFastingLogs, fastingNow),
    [fastingNow, sortedFastingLogs]
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
  const todaysFastingProtocol = useMemo(
    () => findFastingProtocolForDate(diaryData.fastingProtocols || [], currentDate) || null,
    [currentDate, diaryData.fastingProtocols]
  );
  const activeFastingLog = activeFastEntry || null;
  const activeFastingReferenceDate = activeFastingLog
    ? getFastingRecordDate(activeFastingLog, currentDate)
    : currentDate;
  const activeFastingProtocol = useMemo(() => {
    if (activeFastingLog) {
      return findFastingProtocolForDate(diaryData.fastingProtocols || [], activeFastingReferenceDate) || todaysFastingProtocol || null;
    }

    return todaysFastingProtocol || null;
  }, [activeFastingLog, activeFastingReferenceDate, diaryData.fastingProtocols, todaysFastingProtocol]);
  const activeFastingProtocolLabel =
    activeFastingProtocol ? formatProtocolLabel(activeFastingProtocol) : activeFastingLog?.expectedProtocol || 'Sin protocolo';
  const activeFastingGoalHours = Number(activeFastingProtocol?.expectedDuration || 0) || null;
  const activeFastingElapsedHours = useMemo(
    () => getFastingElapsedHours(activeFastingLog, fastingNow),
    [activeFastingLog, fastingNow]
  );
  const activeFastingReachedGoal = useMemo(() => {
    if (!activeFastingGoalHours || activeFastingGoalHours <= 0) return false;
    return activeFastingElapsedHours >= activeFastingGoalHours;
  }, [activeFastingElapsedHours, activeFastingGoalHours]);
  const activeFastingStatus = useMemo(
    () => getFastingStatusLabel(activeFastingLog, activeFastingProtocol, fastingNow),
    [activeFastingLog, activeFastingProtocol, fastingNow]
  );
  const activeFastingDisplay = getFastingDisplayText(activeFastingProtocol || null, activeFastingLog || null);
  const activeFastingRemainingHours = useMemo(() => {
    if (!activeFastingGoalHours || activeFastingGoalHours <= 0 || activeFastingReachedGoal) return null;
    return Math.max(activeFastingGoalHours - activeFastingElapsedHours, 0);
  }, [activeFastingElapsedHours, activeFastingGoalHours, activeFastingReachedGoal]);
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
    if (activeFastingDifferenceHours >= 0) return `Meta alcanzada • superaste ${formatHoursLabel(activeFastingDifferenceHours)}`;
    return `Faltaron ${formatHoursLabel(Math.abs(activeFastingDifferenceHours))}`;
  }, [activeFastingDifferenceHours]);
  const activeFastingAutophagy = activeFastingStatus === 'en curso' && activeFastingElapsedHours >= 16;
  const fastingFormProtocol = useMemo(
    () => findFastingProtocolForDate(diaryData.fastingProtocols || [], fastingLogForm.date || currentDate) || null,
    [currentDate, diaryData.fastingProtocols, fastingLogForm.date]
  );
  const fastingFormStatus = getFastingStatusLabel(fastingLogForm, fastingFormProtocol);
  const fastingFormGoalHours = Number(fastingFormProtocol?.expectedDuration || 0) || null;
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
  const backupMeta = diaryData.backupMeta || defaultState.backupMeta;
  const syncMeta = diaryData.syncMeta || defaultState.syncMeta;
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
      : formatDate(selectedAgendaDate);
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
    return '';
  }, [activePrivateCycle, activeCycleEntries.length, activeCyclePayments.length, activeCycleProducts.length]);
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
  setPrivateFormVisibility({ cycle: false, product: false, event: false, payment: false });
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
      expectedProtocol: current.expectedProtocol || (todaysFastingProtocol ? formatProtocolLabel(todaysFastingProtocol) : ''),
    }));
  }, [currentDate, editingFastingLogId, todaysFastingProtocol]);

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
    if (editingPrivateEntryId || editingPrivateProductId || editingPrivatePaymentId) return;

    const activeCycleId = activePrivateCycle?.id || '';
    setPrivateEntryForm((current) => (current.cycleId === activeCycleId ? current : { ...current, cycleId: activeCycleId, productId: '' }));
    setPrivateProductForm((current) => (current.cycleId === activeCycleId ? current : { ...current, cycleId: activeCycleId }));
    setPrivatePaymentForm((current) => (current.cycleId === activeCycleId ? current : { ...current, cycleId: activeCycleId }));
  }, [activePrivateCycle, editingPrivateEntryId, editingPrivatePaymentId, editingPrivateProductId]);

  useEffect(() => {
    if (!isPrivateUnlocked) return;
    if (editingPrivateCycleId || editingPrivateProductId || editingPrivatePaymentId || editingPrivateEntryId) return;

    setPrivateFormVisibility((current) => {
      const hasAnyOpen = Object.values(current).some(Boolean);
      if (hasAnyOpen) return current;

      return activePrivateCycle
        ? { cycle: false, product: false, event: false, payment: false }
        : { cycle: true, product: false, event: false, payment: false };
    });
  }, [isPrivateUnlocked, activePrivateCycle, editingPrivateCycleId, editingPrivateProductId, editingPrivatePaymentId, editingPrivateEntryId]);

  const calorieGoal = Number(diaryData.goals?.calories || 0);
  const proteinGoal = Number(diaryData.goals?.protein || 0);
  const weightGoal = Number(diaryData.goals?.weight || 0);
  const hydrationBaseGoal = Number(diaryData.goals?.hydrationBase || 0);
  const hydrationHighActivityGoal = Number(diaryData.goals?.hydrationHighActivity || 0);

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
        activeFastingStatus,
        activeFastingProtocol,
      }),
    [
      activeFastingProtocol,
      activeFastingStatus,
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
        hydrationBaseGoal,
        proteinGoal,
        weekReferenceDate,
      }),
    [diaryData, fastingNow, hydrationBaseGoal, proteinGoal, weekReferenceDate]
  );

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
        fastingLogs: sortByDateDesc(day.fastingLogs).map((item) => {
          const protocol = findFastingProtocolForDate(diaryData.fastingProtocols || [], getFastingRecordDate(item, day.date));
          return {
            ...item,
            derivedStatus: getFastingStatusLabel(item, protocol),
          };
        }),
        exercises: sortByDateDesc(day.exercises),
        bodyMetrics: sortByDateDesc(day.bodyMetrics),
        summary: {
          calories: sumBy(day.foods, 'calories'),
          protein: sumBy(day.foods, 'protein'),
          hydrationMl: day.hydrationEntries.reduce((total, item) => total + getHydrationMl(item), 0),
          supplementsTaken: day.supplements.filter((item) => item.taken === 'si').length,
          fastingCompleted: day.fastingLogs.filter((item) => {
            const protocol = findFastingProtocolForDate(diaryData.fastingProtocols || [], getFastingRecordDate(item, day.date));
            return getFastingStatusLabel(item, protocol) === 'cumplido';
          }).length,
          exerciseMinutes: sumBy(day.exercises, 'duration'),
          weight: sortByDateDesc(day.bodyMetrics)[0]?.weight || null,
        },
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [diaryData]);

  const proteinAlert = proteinGoal > 0 && todaySummary.protein < proteinGoal;
  const calorieProgress = calorieGoal > 0 ? (todaySummary.calories / calorieGoal) * 100 : 0;
  const proteinProgress = proteinGoal > 0 ? (todaySummary.protein / proteinGoal) * 100 : 0;
  const hydrationProgress = hydrationBaseGoal > 0 ? (todaySummary.hydrationMl / hydrationBaseGoal) * 100 : 0;
  const hydrationTone = hydrationProgress < 70 ? 'alert' : hydrationProgress < 100 ? 'energy' : 'success';
  const weightProgress =
    weightGoal > 0 && Number(todaySummary.weight) > 0
      ? Math.max(0, 100 - (Math.abs(Number(todaySummary.weight) - weightGoal) / weightGoal) * 100)
      : 0;
  const recentFoods = useMemo(() => sortFoods(diaryData.foods), [diaryData.foods]);
  const visibleRecentFoods = useMemo(
    () => (showAllRecentFoods ? recentFoods : recentFoods.slice(0, 5)),
    [recentFoods, showAllRecentFoods]
  );

  const visibleSupplements = useMemo(() => {
    const sorted = sortSupplements(diaryData.supplements);
    if (supplementFilter === 'todos') return sorted;
    return sorted.filter((item) => item.category === supplementFilter);
  }, [diaryData.supplements, supplementFilter]);

  const pendingSupplements = useMemo(
    () => visibleSupplements.filter((item) => item.taken !== 'si'),
    [visibleSupplements]
  );

  const takenSupplements = useMemo(
    () => visibleSupplements.filter((item) => item.taken === 'si'),
    [visibleSupplements]
  );

  const visibleSupplementSummary = useMemo(() => {
    const total = visibleSupplements.length;
    const taken = takenSupplements.length;
    const pending = pendingSupplements.length;
    const medications = visibleSupplements.filter((item) => item.category === 'medicamento').length;

    return { total, taken, pending, medications };
  }, [pendingSupplements.length, takenSupplements.length, visibleSupplements]);

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

  function handleFormChange(setter) {
    return (event) => {
      const { name, value } = event.target;
      setter((current) => ({ ...current, [name]: value }));
    };
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
    const expected = todaysFastingProtocol ? formatProtocolLabel(todaysFastingProtocol) : '';
    setFastingLogForm({
      ...createEmptyFastingLog(),
      expectedProtocol: expected,
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

  function handleGoalSubmit(event) {
    event.preventDefault();
    markPersistenceReason('guardar:goals');
    setDiaryData((current) => ({
      ...current,
      goals: {
        ...goalForm,
      },
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
          privateVault: diaryData.privateVault || defaultState.privateVault,
          backupMeta: {
            ...(migratedData.backupMeta || defaultState.backupMeta),
            lastImportAt: getCurrentDateTimeValue(),
          },
        };

        markPersistenceReason('importar:backup');
        setDiaryData(importedData);
        setGoalForm(importedData.goals || defaultState.goals);
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
      'Esto reseteara todos los datos guardados localmente en este navegador. Esta accion no se puede deshacer. ¿Deseas continuar?'
    );

    if (!confirmed) return;

    markPersistenceReason('reset:app');
    clearAppData();
    setDiaryData(defaultState);
    setGoalForm(defaultState.goals);
    setObjectiveForm(defaultState.objectives?.[0] || createEmptyObjective());
    resetFoodForm();
    resetHydrationForm();
    resetFoodTemplateForm();
    resetFastingProtocolForm();
    resetFastingLogForm();
    resetSupplementForm();
    resetRoutineBuilder();
    resetExerciseForm();
    resetMetricForm();
    resetPrivateEntryForm();
    resetPrivateCycleForm();
    resetPrivateProductForm();
    resetPrivatePaymentForm();
    setEditingFoodId(null);
    setEditingHydrationId(null);
    setEditingFoodTemplateId(null);
    setEditingFastingProtocolId(null);
    setEditingFastingLogId(null);
    setEditingSupplementId(null);
    setEditingExerciseId(null);
    setEditingMetricId(null);
    setEditingPrivateEntryId(null);
    setEditingPrivateCycleId(null);
    setEditingPrivateProductId(null);
    setEditingPrivatePaymentId(null);
    setBackupInputKey((current) => current + 1);
    setPrivateBackupInputKey((current) => current + 1);
    setPrivateSetupPin('');
    setPrivateSetupPinConfirm('');
    setPrivatePinUpdate({ current: '', next: '', confirm: '' });
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
      const currentSnapshot = latestPersistedDataRef.current;
      const syncResult = await pushRemoteSnapshot({
        userId: syncUser.id,
        data: currentSnapshot,
      });
      const syncedSnapshot = markDataSynced(currentSnapshot, {
        deviceId: syncDeviceIdRef.current || currentSnapshot.syncMeta?.deviceId || createDeviceId(),
        lastSyncedAt: syncResult.lastSyncedAt || getCurrentDateTimeValue(),
      });
      latestPersistedDataRef.current = syncedSnapshot;
      saveAppData(syncedSnapshot);
      setSyncLastSyncedAt(syncedSnapshot.syncMeta?.lastSyncedAt || '');
      setSyncStatus('synced');
      setSyncFeedback({ type: 'success', text: 'Snapshot sincronizado con Supabase.' });
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
        text: `El PIN debe tener exactamente ${privatePinLength} digitos numericos.`,
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
        text: `El nuevo PIN debe tener exactamente ${privatePinLength} digitos numericos.`,
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

  function handlePrivateExportBackup() {
    const exportTimestamp = getCurrentDateTimeValue();
    const payload = {
      privateCycles: diaryData.privateCycles || [],
      privateProducts: diaryData.privateProducts || [],
      privatePayments: diaryData.privatePayments || [],
      privateHormonalEntries: diaryData.privateHormonalEntries || [],
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
          privateVault: {
            ...(migratedPrivate.privateVault || defaultState.privateVault),
            lastPrivateImportAt: importTimestamp,
          },
        }));
        setEditingPrivateCycleId(null);
        setEditingPrivateProductId(null);
        setEditingPrivatePaymentId(null);
        setEditingPrivateEntryId(null);
        resetPrivateCycleForm();
        resetPrivateProductForm();
        resetPrivatePaymentForm();
        resetPrivateEntryForm();
        lockPrivateModule();
        setPrivateFeedback({
          type: 'success',
          text: 'Respaldo privado importado. Vuelve a desbloquear el area privada para revisar los datos.',
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
    upsertRecord('fastingLogs', fastingLogForm, editingFastingLogId, resetFastingLogForm, setEditingFastingLogId);
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
      const protocolForDate = findFastingProtocolForDate(diaryData.fastingProtocols || [], next.date || currentDate);

      if (name === 'date') {
        const protocol = findFastingProtocolForDate(diaryData.fastingProtocols || [], value);
        next.expectedProtocol = protocol ? formatProtocolLabel(protocol) : '';
      }

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
        name === 'actualDuration' ||
        name === 'actualStartDateTime' ||
        name === 'actualBreakDateTime' ||
        name === 'date'
      ) {
        const derivedStatus = getFastingStatusLabel(next, protocolForDate);
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
        expectedProtocol:
          current.expectedProtocol || (todaysFastingProtocol ? formatProtocolLabel(todaysFastingProtocol) : ''),
      };
      const next = updater(base);
      const protocolForDate = findFastingProtocolForDate(diaryData.fastingProtocols || [], next.date || currentDate);
      const calculatedDuration =
        next.actualStartDateTime && next.actualBreakDateTime
          ? calculateFastingDurationHours(next.actualStartDateTime, next.actualBreakDateTime)
          : '';
      const withDuration = {
        ...next,
        actualDuration: calculatedDuration || next.actualDuration || '',
      };
      const derivedStatus = getFastingStatusLabel(withDuration, protocolForDate);

      return {
        ...withDuration,
        completed: derivedStatus === 'cumplido' ? 'si' : 'no',
      };
    });
  }

  function startFastingNow() {
    applyQuickFastingUpdate((current) => ({
      ...current,
      date: currentDate,
      actualStartDateTime: getCurrentDateTimeValue(),
      actualBreakDateTime: '',
      actualDuration: '',
    }));
  }

  function breakFastingNow() {
    applyQuickFastingUpdate((current) => ({
      ...current,
      actualBreakDateTime: getCurrentDateTimeValue(),
    }));
  }

  function markFastingAsCompleted() {
    applyQuickFastingUpdate((current) => ({
      ...current,
      actualBreakDateTime: current.actualBreakDateTime || getCurrentDateTimeValue(),
      completed: 'si',
    }));
  }

  function clearFastingTimes() {
    applyQuickFastingUpdate((current) => ({
      ...current,
      actualStartDateTime: '',
      actualBreakDateTime: '',
      actualDuration: '',
      completed: 'no',
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
          <p className="eyebrow">SEGUIMIENTO PERSONAL</p>
          <h1>Bitacora Daniel</h1>
          <p className="hero-text">
            Sistema personal para registrar nutricion, hidratacion, suplementacion, entrenamiento, ayuno y progreso fisico.
          </p>
          <p className="hero-build-label">Build: {appBuildLabel}</p>
          <p className="hero-build-label">Sync: {syncStatusLabel}</p>
        </div>

        <div className="hero-panel">
          <span>Hoy</span>
          <strong>{formatDate(currentDate)}</strong>
          <p>{todaySummary.foodEntries + todaySummary.hydrationEntries + todaySummary.exerciseEntries + todaySummary.metricEntries + todaySummary.supplementEntries + todaySummary.fastingEntries} registros hoy</p>
        </div>
      </header>

      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'tab-button-active' : ''}`}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {activeTab === 'dashboard' ? (
          <>
            <div className="progress-card-grid">
              <ProgressCard
                title="Calorias"
                value={`${todaySummary.calories} kcal`}
                subtitle={calorieGoal > 0 ? `Meta diaria: ${calorieGoal} kcal` : 'Define una meta para ver progreso.'}
                progress={calorieProgress}
                tone="energy"
                helper={
                  calorieGoal > 0
                    ? `${Math.max(calorieGoal - todaySummary.calories, 0)} kcal restantes`
                    : 'Sin meta configurada'
                }
              />

              <ProgressCard
                title="Proteina"
                value={`${todaySummary.protein} g`}
                subtitle={proteinGoal > 0 ? `Minimo diario: ${proteinGoal} g` : 'Define un minimo de proteina.'}
                progress={proteinProgress}
                tone={proteinAlert ? 'alert' : 'success'}
                helper={
                  proteinGoal > 0
                    ? proteinAlert
                      ? `Te faltan ${(proteinGoal - todaySummary.protein).toFixed(1)} g`
                      : 'Meta de proteina cumplida'
                    : 'Sin meta configurada'
                }
              />

              <ProgressCard
                title="Peso actual"
                value={formatMetricValue(todaySummary.weight, todaySummary.weight === '--' ? '' : ' kg')}
                subtitle={weightGoal > 0 ? `Objetivo: ${weightGoal} kg` : 'Configura un peso objetivo.'}
                progress={weightProgress}
                tone="weight"
                helper={
                  todaySummary.bodyFat !== '--' || todaySummary.skeletalMuscleMass !== '--'
                    ? `Grasa: ${formatMetricText(todaySummary.bodyFat, todaySummary.bodyFat === '--' ? '' : '%')} • Musculo: ${formatMetricText(
                        todaySummary.skeletalMuscleMass,
                        todaySummary.skeletalMuscleMass === '--' ? '' : ' kg'
                      )}`
                    : getWeightMessage(todaySummary.weight === '--' ? null : Number(todaySummary.weight), weightGoal)
                }
              />

              <ProgressCard
                title="Actividad"
                value={`${todaySummary.exerciseCalories} kcal`}
                subtitle={`${todaySummary.exerciseMinutes} min de ejercicio hoy`}
                progress={Math.min((todaySummary.exerciseMinutes / 60) * 100, 100)}
                tone="movement"
                helper={`${todaySummary.exerciseEntries} sesiones registradas`}
              />

              <ProgressCard
                title="Ayuno"
                value={activeFastingProtocolLabel}
                subtitle={todaySummary.fastingStatus === 'pendiente' ? 'Aun no iniciado' : `Estado real: ${todaySummary.fastingStatus}`}
                progress={
                  todaySummary.fastingStatus === 'cumplido'
                    ? 100
                    : todaySummary.fastingStatus === 'en curso'
                      ? activeFastingProgressPercent
                      : todaySummary.fastingStatus === 'roto'
                        ? Math.min(activeFastingProgressPercent, 100)
                        : 0
                }
                tone={todaySummary.fastingStatus === 'roto' ? 'alert' : todaySummary.fastingStatus === 'en curso' ? 'energy' : 'success'}
                helper={`${
                  todaySummary.fastingStatus === 'pendiente' ? 'Aun no iniciado' : `${formatHoursLabel(activeFastingElapsedHours)} acumuladas`
                }${
                  activeFastingRemainingHours !== null && todaySummary.fastingStatus === 'en curso'
                    ? ` • ${formatHoursLabel(activeFastingRemainingHours)} restantes`
                    : todaySummary.fastingStatus === 'cumplido'
                      ? ' • Meta alcanzada'
                      : ''
                }`}
              />

              <ProgressCard
                title="Hidratacion"
                value={`${todaySummary.hydrationMl.toFixed(0)} ml`}
                subtitle={`Meta diaria: ${hydrationBaseGoal || 0} ml`}
                progress={hydrationProgress}
                tone={hydrationTone}
                helper={
                  todaysExercises.length > 0 && hydrationHighActivityGoal > 0
                    ? `Alta actividad: ${hydrationHighActivityGoal} ml`
                    : `${Math.max((hydrationBaseGoal || 0) - todaySummary.hydrationMl, 0).toFixed(0)} ml restantes`
                }
              />
            </div>

            {proteinAlert ? (
              <div className="alert-banner">
                <strong>Alerta de proteina:</strong> hoy llevas {todaySummary.protein} g y tu minimo configurado es {proteinGoal} g.
              </div>
            ) : null}

            <div className="dashboard-main-grid">
              <SectionCard
                title="Metas diarias"
                subtitle="Estas metas se guardan localmente y se usan en el dashboard y el resumen semanal."
                className="card-soft"
              >
                <GoalForm
                  formData={goalForm}
                  onChange={handleFormChange(setGoalForm)}
                  onSubmit={handleGoalSubmit}
                />
              </SectionCard>

              <SectionCard title="Pulso del dia" subtitle="Lectura rapida de lo que ya registraste." className="card-soft">
                <div className="mini-stat-grid">
                  <div className="mini-stat">
                    <span>Comida</span>
                    <strong>{todaySummary.foodEntries} registros</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Macros extra</span>
                    <strong>{todaySummary.carbs} g carbos • {todaySummary.fat} g grasa</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Suplementos</span>
                    <strong>{todaySummary.supplementsTakenToday} tomados / {todaySummary.supplementsPendingToday} pendientes</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Ayuno</span>
                    <strong>{todaySummary.fastingStatus}</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Metricas de hoy / ultimo dato</span>
                    <strong>
                      {todaySummary.metricEntries} hoy
                      {latestMetric ? ` • peso ${formatMetricText(latestMetric.weight, ' kg')}` : ' • sin dato'}
                    </strong>
                    <small className="helper-text">
                      El dashboard resume comida, suplementos y ejercicio de hoy, pero usa la ultima metrica disponible aunque no sea de hoy.
                    </small>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="dashboard-grid dashboard-compact-grid">
              <SectionCard title="Alimentos" subtitle="Resumen de hoy" className="card-soft dashboard-compact-card">
                <div className="dashboard-snapshot">
                  <strong>{todaysFoods.length === 0 ? 'Sin registros' : `${todaySummary.calories} kcal`}</strong>
                  <p>{todaysFoods.length === 0 ? 'Sin alimentos registrados hoy.' : `${todaySummary.foodEntries} registros • ${todaySummary.protein} g proteina`}</p>
                </div>
              </SectionCard>

              <SectionCard title="Hidratacion" subtitle="Resumen de hoy" className="card-soft dashboard-compact-card">
                <div className="dashboard-snapshot">
                  <strong>{`${todaySummary.hydrationMl.toFixed(0)} ml`}</strong>
                  <p>{`Meta ${hydrationBaseGoal || 0} ml${todaysExercises.length > 0 && hydrationHighActivityGoal > 0 ? ` • alta ${hydrationHighActivityGoal} ml` : ''}`}</p>
                </div>
              </SectionCard>

              <SectionCard title="Suplementos" subtitle="Resumen de hoy" className="card-soft dashboard-compact-card">
                <div className="dashboard-snapshot">
                  <strong>{todaysSupplements.length === 0 ? 'Sin registros' : `${todaySummary.supplementsTakenToday} tomados`}</strong>
                  <p>{todaysSupplements.length === 0 ? 'Sin suplementos registrados hoy.' : `${todaySummary.supplementsPendingToday} pendientes • ${todaySummary.medicationsToday} medicamentos`}</p>
                </div>
              </SectionCard>

              <SectionCard title="Ejercicio" subtitle="Resumen de hoy" className="card-soft dashboard-compact-card">
                <div className="dashboard-snapshot">
                  <strong>{todaysExercises.length === 0 ? 'Sin registros' : `${todaySummary.exerciseMinutes} min`}</strong>
                  <p>{todaysExercises.length === 0 ? 'Sin ejercicio registrado hoy.' : `${todaySummary.exerciseCalories} kcal • ${todaySummary.exerciseEntries} sesiones`}</p>
                </div>
              </SectionCard>

              <SectionCard title="Ayuno" subtitle={activeFastingProtocolLabel} className="card-soft dashboard-compact-card">
                <div className="dashboard-snapshot">
                  <strong>{todaySummary.fastingStatus}</strong>
                  {activeFastingAutophagy ? <span className="fasting-autophagy-badge fasting-autophagy-badge-compact">En autofagia</span> : null}
                  {activeFastingAutophagy ? <small className="dashboard-hint">Hito visual activado desde 16 h de ayuno activo.</small> : null}
                  <p>
                    {todaySummary.fastingStatus === 'pendiente'
                      ? 'Aun no iniciado.'
                      : `${formatHoursLabel(activeFastingElapsedHours)} acumuladas${
                          activeFastingRemainingHours !== null ? ` • ${formatHoursLabel(activeFastingRemainingHours)} restantes` : ' • Meta alcanzada'
                        }`}
                  </p>
                </div>
              </SectionCard>

              <SectionCard title="Objetivo actual" subtitle={activeObjective ? activeObjective.title : 'Sin objetivo activo'} className="card-soft dashboard-compact-card">
                <div className="dashboard-snapshot">
                  <strong>
                    {activeObjective?.targetWeight ? `${activeObjective.targetWeight} kg meta` : 'Sin dato'}
                  </strong>
                  <p>
                    {activeObjective
                      ? `${activeObjective.averageCaloriesTarget || '--'} kcal prom • tope ${activeObjective.averageUpperLimit || '--'}`
                      : 'Todavia no has definido una meta activa.'}
                  </p>
                  {activeObjective ? (
                    <small>{`Min habitual ${activeObjective.minimumUsual || '--'} • Prot minima ${activeObjective.proteinMinimum || '--'} g`}</small>
                  ) : null}
                </div>
              </SectionCard>

              <SectionCard title="Metricas" subtitle={latestMetric ? 'Ultimo dato disponible' : 'Sin metricas'} className="card-soft dashboard-compact-card">
                <div className="dashboard-snapshot">
                  <strong>{metricFieldSnapshots.weight.date ? formatMetricText(metricFieldSnapshots.weight.rawValue, ' kg') : 'Sin dato'}</strong>
                  <p>
                    {metricFieldSnapshots.weight.date
                      ? `${formatMetricText(metricFieldSnapshots.bodyFat.rawValue, '%')} grasa • ${formatMetricText(metricFieldSnapshots.skeletalMuscleMass.rawValue, ' kg')} musculo`
                      : 'Aun no has registrado metricas.'}
                  </p>
                </div>
              </SectionCard>
            </div>
          </>
        ) : null}

        {activeTab === 'objectives' ? (
          <>
            <div className="metrics-summary-grid objective-summary-grid">
              <div className="metrics-summary-card">
                <span>Meta activa</span>
                <strong>{activeObjective?.title || 'Sin objetivo activo'}</strong>
                <small>{activeObjective ? objectiveTypeLabels[activeObjective.goalType] || activeObjective.goalType : 'Sin dato'}</small>
              </div>
              <div className="metrics-summary-card">
                <span>Peso actual / meta</span>
                <strong>
                  {activeObjective
                    ? `${formatMetricText(activeObjective.currentWeight, ' kg')} / ${formatMetricText(activeObjective.targetWeight, ' kg')}`
                    : 'Sin suficientes datos'}
                </strong>
                <small>{activeObjective ? `Inicio ${formatMetricText(activeObjective.startWeight, ' kg')}` : 'Sin dato'}</small>
              </div>
              <div className="metrics-summary-card">
                <span>Progreso estimado</span>
                <strong>{activeObjectiveProgress === null ? 'Sin suficientes datos' : `${activeObjectiveProgress.toFixed(0)}%`}</strong>
                <small>{activeObjective ? objectiveStatusLabels[activeObjective.status] || activeObjective.status : 'Sin dato'}</small>
              </div>
              <div className="metrics-summary-card">
                <span>Guardrail central</span>
                <strong>{activeObjective ? `${activeObjective.averageCaloriesTarget || '--'} kcal` : 'Sin dato'}</strong>
                <small>{activeObjective ? `Proteina minima ${activeObjective.proteinMinimum || '--'} g` : 'Sin dato'}</small>
              </div>
            </div>

            <SectionCard title="Meta activa" subtitle="Direccion estrategica de semanas o meses, separada de tus metas diarias." className="card-soft">
              <form className="record-form" onSubmit={handleObjectiveSubmit}>
                <div className="form-grid">
                  <label className="field">
                    <span>Titulo de la meta</span>
                    <input name="title" type="text" value={objectiveForm.title} onChange={handleFormChange(setObjectiveForm)} placeholder="Ej. Corte mayo 2026" />
                  </label>
                  <label className="field">
                    <span>Tipo de meta</span>
                    <select name="goalType" value={objectiveForm.goalType} onChange={handleFormChange(setObjectiveForm)}>
                      {Object.entries(objectiveTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Fecha de inicio</span>
                    <input name="startDate" type="date" value={objectiveForm.startDate} onChange={handleFormChange(setObjectiveForm)} />
                  </label>
                  <label className="field">
                    <span>Fecha limite</span>
                    <input name="deadlineDate" type="date" value={objectiveForm.deadlineDate} onChange={handleFormChange(setObjectiveForm)} />
                  </label>
                  <label className="field">
                    <span>Peso inicial</span>
                    <input name="startWeight" type="number" min="0" step="0.1" value={objectiveForm.startWeight} onChange={handleFormChange(setObjectiveForm)} />
                  </label>
                  <label className="field">
                    <span>Peso actual</span>
                    <input name="currentWeight" type="number" min="0" step="0.1" value={objectiveForm.currentWeight} onChange={handleFormChange(setObjectiveForm)} />
                  </label>
                  <label className="field">
                    <span>Peso objetivo</span>
                    <input name="targetWeight" type="number" min="0" step="0.1" value={objectiveForm.targetWeight} onChange={handleFormChange(setObjectiveForm)} />
                  </label>
                  <label className="field">
                    <span>Estado de la meta</span>
                    <select name="status" value={objectiveForm.status} onChange={handleFormChange(setObjectiveForm)}>
                      {Object.entries(objectiveStatusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field field-full">
                    <span>Notas</span>
                    <textarea name="notes" rows="3" value={objectiveForm.notes} onChange={handleFormChange(setObjectiveForm)} placeholder="Contexto, estrategia y enfoque de esta meta..." />
                  </label>
                </div>

                <div className="objective-progress-panel">
                  <div className="objective-progress-copy">
                    <strong>{objectiveFormProgress === null ? 'Sin suficientes datos' : `${objectiveFormProgress.toFixed(0)}% de avance estimado`}</strong>
                    <span>
                      {objectiveForm.startWeight && objectiveForm.currentWeight && objectiveForm.targetWeight
                        ? `De ${objectiveForm.startWeight} kg hacia ${objectiveForm.targetWeight} kg, con actual ${objectiveForm.currentWeight} kg`
                        : 'Completa pesos inicial, actual y objetivo para estimar el progreso.'}
                    </span>
                  </div>
                  <div className="progress-track" aria-hidden="true">
                    <div className="progress-fill" style={{ width: `${objectiveFormProgress || 0}%` }} />
                  </div>
                </div>

                <div className="form-actions">
                  <button className="button button-primary" type="submit">Guardar objetivo</button>
                </div>
              </form>
            </SectionCard>

            <div className="split-layout objective-layout">
              <SectionCard title="Guardrails nutricionales" subtitle="Limites simples para sostener la ejecucion semanal." className="card-soft">
                <form className="record-form objective-subform" onSubmit={handleObjectiveSubmit}>
                  <div className="form-grid">
                    <label className="field">
                      <span>Calorias promedio objetivo</span>
                      <input name="averageCaloriesTarget" type="number" min="0" step="1" value={objectiveForm.averageCaloriesTarget} onChange={handleFormChange(setObjectiveForm)} />
                    </label>
                    <label className="field">
                      <span>Limite superior promedio</span>
                      <input name="averageUpperLimit" type="number" min="0" step="1" value={objectiveForm.averageUpperLimit} onChange={handleFormChange(setObjectiveForm)} />
                    </label>
                    <label className="field">
                      <span>Minimo habitual</span>
                      <input name="minimumUsual" type="number" min="0" step="1" value={objectiveForm.minimumUsual} onChange={handleFormChange(setObjectiveForm)} />
                    </label>
                    <label className="field">
                      <span>Proteina minima</span>
                      <input name="proteinMinimum" type="number" min="0" step="1" value={objectiveForm.proteinMinimum} onChange={handleFormChange(setObjectiveForm)} />
                    </label>
                    <label className="field">
                      <span>Hidratacion base</span>
                      <input name="hydrationBase" type="number" min="0" step="50" value={objectiveForm.hydrationBase} onChange={handleFormChange(setObjectiveForm)} />
                    </label>
                    <label className="field">
                      <span>Hidratacion alta actividad</span>
                      <input name="hydrationHighActivity" type="number" min="0" step="50" value={objectiveForm.hydrationHighActivity} onChange={handleFormChange(setObjectiveForm)} />
                    </label>
                  </div>
                  <div className="form-actions">
                    <button className="button button-primary" type="submit">Guardar guardrails</button>
                  </div>
                </form>
              </SectionCard>

              <SectionCard title="Recordatorios estrategicos" subtitle="Reglas simples para ejecutar la meta con consistencia." className="card-soft">
                <form className="record-form objective-subform" onSubmit={handleObjectiveSubmit}>
                  <label className="field field-full">
                    <span>Checklist o recordatorios</span>
                    <textarea
                      name="strategicReminders"
                      rows="8"
                      value={objectiveForm.strategicReminders}
                      onChange={handleFormChange(setObjectiveForm)}
                      placeholder="- Priorizar promedio semanal&#10;- Proteger masa muscular"
                    />
                  </label>
                  <div className="form-actions">
                    <button className="button button-primary" type="submit">Guardar recordatorios</button>
                  </div>
                </form>
              </SectionCard>
            </div>

          </>
        ) : null}

        {activeTab === 'settings' ? (
          <>
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
                  El snapshot remoto excluye <strong>privateVault</strong>, incluido el PIN del modulo privado. La
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

        {activeTab === 'foods' ? (
          <>
            <div className="split-layout foods-layout">
              <SectionCard title="Registro de alimentos" subtitle="Guarda comida, macros y notas del dia.">
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
                    { name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Como te sentiste, porcion, contexto...' },
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
                  emptyMessage="No hay alimentos registrados todavia."
                  className="entry-list-compact foods-recent-list"
                  items={visibleRecentFoods.map((item) => ({
                    ...item,
                    primaryLabel: item.name || 'Sin nombre',
                    secondaryLabel: `${formatDate(item.date)}${item.time ? ` • ${item.time}` : ''}${item.mealType ? ` • ${mealTypeLabels[item.mealType] || item.mealType}` : ''}`,
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
                        { name: 'notes', label: 'Notas opcionales', type: 'textarea', placeholder: 'Preparacion, marca o contexto...' },
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
              <SectionCard title="Hidratacion" subtitle="Registra agua, cafe, te y otras bebidas del dia.">
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
                    { name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Marca, sensacion o contexto...' },
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
                subtitle={`Meta base ${hydrationBaseGoal || 0} ml${todaysExercises.length > 0 && hydrationHighActivityGoal > 0 ? ` • Alta actividad ${hydrationHighActivityGoal} ml` : ''}`}
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
                    secondaryLabel: `${formatDate(item.date)}${item.time ? ` • ${item.time}` : ''}${item.drinkType ? ` • ${drinkTypeLabels[item.drinkType] || item.drinkType}` : ''}`,
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
        {activeTab === 'fasting' ? (
          <div className="fasting-tab-stack">
            <SectionCard title="Resumen de hoy" subtitle="Vista rapida del protocolo activo y su progreso real." className="card-soft">
              <div className="supplement-summary-grid">
                <div className="supplement-summary-card">
                  <span>Protocolo de hoy</span>
                  <strong>{activeFastingProtocolLabel}</strong>
                  {activeFastingAutophagy ? <small className="fasting-summary-note">Hito visual activado desde 16 h de ayuno activo.</small> : null}
                </div>
                <div className="supplement-summary-card">
                  <span>Estado real</span>
                  <strong>{activeFastingStatus}</strong>
                </div>
                <div className="supplement-summary-card">
                  <span>Horas acumuladas</span>
                  <strong>{activeFastingStatus === 'pendiente' ? 'Aun no iniciado' : formatHoursLabel(activeFastingElapsedHours)}</strong>
                </div>
                <div className="supplement-summary-card">
                  <span>Meta esperada</span>
                  <strong>{activeFastingGoalHours ? formatHoursLabel(activeFastingGoalHours) : 'Sin meta definida'}</strong>
                </div>
                <div className="supplement-summary-card">
                  <span>Progreso</span>
                  <strong>{activeFastingGoalHours ? `${activeFastingProgressPercent.toFixed(0)}%` : 'Sin meta'}</strong>
                </div>
              </div>
              <div className="fasting-live-card">
                <div className="fasting-live-header">
                  <div>
                    <strong>{activeFastingDisplay}</strong>
                    <span>
                      {activeFastingStatus === 'pendiente'
                        ? 'Aun no iniciado'
                        : activeFastingStatus === 'en curso'
                          ? `Tiempo transcurrido ${formatHoursLabel(activeFastingElapsedHours)}`
                          : activeFastingStatus === 'cumplido' && !activeFastingLog?.actualBreakDateTime
                            ? `Meta alcanzada con ${formatHoursLabel(activeFastingElapsedHours)}`
                            : `Duracion final ${formatHoursLabel(activeFastingElapsedHours)}`}
                    </span>
                    {activeFastingAutophagy ? <small className="fasting-summary-note">Hito visual activado desde 16 h de ayuno activo.</small> : null}
                  </div>
                  <div className="fasting-live-badges">
                    {activeFastingAutophagy ? <span className="fasting-autophagy-badge">En autofagia</span> : null}
                    <span className={`metrics-source-chip ${getFastingStatusClass(activeFastingStatus)}`}>
                      {activeFastingStatus}
                    </span>
                  </div>
                </div>
                <div className="progress-track" aria-hidden="true">
                  <div className="progress-fill" style={{ width: `${activeFastingStatus === 'pendiente' ? 0 : Math.min(activeFastingProgressPercent, 100)}%` }} />
                </div>
                <div className="fasting-live-metrics">
                  <div className="fasting-live-metric">
                    <span>Estado</span>
                    <strong>{activeFastingStatus}</strong>
                  </div>
                  <div className="fasting-live-metric">
                    <span>Acumulado</span>
                    <strong>{activeFastingStatus === 'pendiente' ? 'Aun no iniciado' : formatHoursLabel(activeFastingElapsedHours)}</strong>
                  </div>
                  <div className="fasting-live-metric">
                    <span>Objetivo</span>
                    <strong>{activeFastingGoalHours ? formatHoursLabel(activeFastingGoalHours) : 'Sin meta'}</strong>
                  </div>
                  <div className="fasting-live-metric">
                    <span>Progreso</span>
                    <strong>{activeFastingGoalHours ? `${activeFastingProgressPercent.toFixed(0)}%` : 'Sin meta'}</strong>
                  </div>
                </div>
                <div className="entry-details">
                  <span>{activeFastingLog?.actualStartDateTime ? `Inicio real ${formatDateTimeHuman(activeFastingLog.actualStartDateTime)}` : 'Inicio real sin dato'}</span>
                  <span>
                    {activeFastingRemainingHours !== null && activeFastingStatus === 'en curso'
                      ? `${formatHoursLabel(activeFastingRemainingHours)} restantes`
                      : activeFastingStatus === 'cumplido'
                        ? 'Meta alcanzada'
                        : activeFastingLog?.actualBreakDateTime
                          ? `Ruptura real ${formatDateTimeHuman(activeFastingLog.actualBreakDateTime)}`
                          : 'Registro editable manualmente'}
                  </span>
                  {activeFastingStatus === 'roto' && activeFastingDifferenceHours !== null ? <span>{activeFastingDifferenceText}</span> : null}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Protocolo semanal" subtitle="Configura y revisa el plan base de ayuno para cada dia." className="card-soft fasting-section-card">
              <div className="fasting-columns">
                <div className="fasting-column">
                  <div className="section-inline-actions section-inline-actions-tight">
                    <button className="button button-secondary" type="button" onClick={() => setShowFastingProtocolBuilder((current) => !current)}>
                      {showFastingProtocolBuilder ? 'Ocultar formulario' : 'Nuevo protocolo semanal'}
                    </button>
                  </div>
                  {showFastingProtocolBuilder ? (
                    <RecordForm
                      title="Nuevo protocolo semanal"
                      fields={[
                        {
                          name: 'dayOfWeek',
                          label: 'Dia de la semana',
                          type: 'select',
                          options: Object.entries(fastingDayLabels).map(([value, label]) => ({ value, label })),
                        },
                        {
                          name: 'fastingType',
                          label: 'Tipo de ayuno',
                          type: 'select',
                          options: Object.entries(fastingTypeLabels).map(([value, label]) => ({ value, label })),
                        },
                        { name: 'startTime', label: 'Hora de inicio', type: 'time' },
                        { name: 'eatingWindow', label: 'Hora de fin o ventana de comida', type: 'text', placeholder: 'Ej. 07:00 a 08:00 o protocolo esperado' },
                        { name: 'expectedDuration', label: 'Duracion esperada (horas)', type: 'number', min: '0', step: '0.1' },
                        { name: 'notes', label: 'Notas opcionales', type: 'textarea', placeholder: 'Contexto, flexibilidad o recordatorios...' },
                      ]}
                      formData={fastingProtocolForm}
                      onChange={handleFastingProtocolChange}
                      onSubmit={handleFastingProtocolSubmit}
                      onCancel={() => {
                        resetFastingProtocolForm();
                        setEditingFastingProtocolId(null);
                      }}
                      isEditing={Boolean(editingFastingProtocolId)}
                    />
                  ) : (
                    <p className="section-helper">El protocolo semanal queda guardado y listo para autocompletar el registro real del dia.</p>
                  )}
                </div>

                <div className="fasting-column">
                  <div className="fasting-protocol-list">
                    {sortedFastingProtocols.length === 0 ? <p className="empty-state">Aun no tienes dias configurados en el protocolo semanal.</p> : null}
                    {sortedFastingProtocols.map((item) => (
                      <article className="fasting-protocol-item" key={item.id}>
                        <div className="fasting-protocol-content">
                          <div className="fasting-protocol-main">
                            <strong className="fasting-protocol-day">{fastingDayLabels[item.dayOfWeek] || item.dayOfWeek}</strong>
                            <span className="fasting-protocol-type">{`Protocolo: ${formatProtocolLabel(item)}`}</span>
                          </div>
                          <div className="fasting-protocol-meta">
                            <span className="fasting-protocol-goal">{item.expectedDuration ? `Objetivo ${item.expectedDuration} h` : 'Sin duracion'}</span>
                            <span className="fasting-protocol-window">{item.eatingWindow || 'Sin ventana definida'}</span>
                            {item.notes ? <span className="fasting-protocol-window">{item.notes}</span> : null}
                          </div>
                        </div>
                        <div className="entry-actions fasting-protocol-actions">
                          <button
                            className="button button-secondary"
                            type="button"
                            onClick={() => startEditing('fastingProtocols', item.id, setFastingProtocolForm, setEditingFastingProtocolId, 'fasting')}
                          >
                            Editar
                          </button>
                          <button
                            className="button button-danger"
                            type="button"
                            onClick={() => deleteRecord('fastingProtocols', item.id, setEditingFastingProtocolId, resetFastingProtocolForm)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Registro real del dia" subtitle="Captura inicio, ruptura y sensaciones con acciones rapidas." className="card-soft fasting-section-card">
              <div className="fasting-columns">
                <div className="fasting-column">
                  <RecordForm
                    title="Nuevo registro de ayuno"
                    fields={[
                      { name: 'date', label: 'Fecha', type: 'date' },
                      { name: 'expectedProtocol', label: 'Protocolo esperado', type: 'text', placeholder: 'Se llena segun el dia, pero puedes ajustarlo' },
                      { name: 'actualStartDateTime', label: 'Fecha y hora real de inicio', type: 'datetime-local' },
                      { name: 'actualBreakDateTime', label: 'Fecha y hora real de ruptura', type: 'datetime-local' },
                      { name: 'actualDuration', label: 'Duracion real (horas)', type: 'number', min: '0', step: '0.1' },
                      {
                        name: 'completed',
                        label: 'Cumplido',
                        type: 'select',
                        options: [
                          { value: 'si', label: 'Si' },
                          { value: 'no', label: 'No' },
                        ],
                      },
                      {
                        name: 'hunger',
                        label: 'Hambre',
                        type: 'select',
                        options: Object.entries(fastingFeelingLabels).map(([value, label]) => ({ value, label })),
                      },
                      {
                        name: 'energy',
                        label: 'Energia',
                        type: 'select',
                        options: Object.entries(fastingFeelingLabels).map(([value, label]) => ({ value, label })),
                      },
                      {
                        name: 'cravings',
                        label: 'Antojos',
                        type: 'select',
                        options: Object.entries(fastingFeelingLabels).map(([value, label]) => ({ value, label })),
                      },
                      { name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Como te sentiste, desviaciones o contexto...' },
                    ]}
                    formData={fastingLogForm}
                    onChange={handleFastingLogChange}
                    onSubmit={handleFastingLogSubmit}
                    onCancel={() => {
                      resetFastingLogForm();
                      setEditingFastingLogId(null);
                    }}
                    isEditing={Boolean(editingFastingLogId)}
                  />
                  <div className="entry-actions fasting-quick-actions">
                    <button className="button button-primary" type="button" onClick={startFastingNow}>
                      Iniciar ahora
                    </button>
                    <button className="button button-secondary" type="button" onClick={breakFastingNow}>
                      Romper ayuno ahora
                    </button>
                    <button className="button button-secondary" type="button" onClick={markFastingAsCompleted}>
                      Marcar como cumplido
                    </button>
                    <button className="button button-danger" type="button" onClick={clearFastingTimes}>
                      Limpiar horas
                    </button>
                  </div>
                </div>

                <div className="fasting-column">
                  <div className="fasting-live-card">
                    <div className="fasting-live-header">
                      <div>
                        <strong>{activeFastingProtocolLabel || 'Sin protocolo esperado'}</strong>
                        <span>Resumen del ayuno activo: {activeFastingStatus}</span>
                      </div>
                      <span className={`metrics-source-chip ${getFastingStatusClass(activeFastingStatus)}`}>
                        {activeFastingGoalHours ? `${activeFastingProgressPercent.toFixed(0)}%` : 'Sin meta'}
                      </span>
                    </div>
                    <div className="fasting-live-metrics">
                      <div className="fasting-live-metric">
                        <span>Transcurrido</span>
                        <strong>{activeFastingStatus === 'pendiente' ? 'Aun no iniciado' : formatHoursLabel(activeFastingElapsedHours)}</strong>
                      </div>
                      <div className="fasting-live-metric">
                        <span>Objetivo</span>
                        <strong>{activeFastingGoalHours ? formatHoursLabel(activeFastingGoalHours) : 'Sin meta'}</strong>
                      </div>
                      <div className="fasting-live-metric">
                        <span>Estado</span>
                        <strong>{activeFastingStatus}</strong>
                      </div>
                      <div className="fasting-live-metric">
                        <span>Progreso</span>
                        <strong>{activeFastingGoalHours ? `${activeFastingProgressPercent.toFixed(0)}%` : 'Sin meta'}</strong>
                      </div>
                    </div>
                    <div className="entry-details">
                      <span>{activeFastingLog?.actualStartDateTime ? `Inicio real ${formatDateTimeHuman(activeFastingLog.actualStartDateTime)}` : 'Inicio real sin dato'}</span>
                      <span>
                        {activeFastingLog?.actualBreakDateTime
                          ? `Ruptura real ${formatDateTimeHuman(activeFastingLog.actualBreakDateTime)}`
                          : activeFastingRemainingHours !== null && activeFastingStatus === 'en curso'
                            ? `${formatHoursLabel(activeFastingRemainingHours)} restantes`
                            : activeFastingStatus === 'cumplido'
                              ? 'Meta alcanzada'
                              : 'Ruptura real sin dato'}
                      </span>
                      {activeFastingStatus === 'roto' ? <span>{activeFastingDifferenceText}</span> : null}
                    </div>
                  </div>

                  <div className="metrics-card-list">
                    {sortedFastingLogs.length === 0 ? <p className="empty-state">Todavia no has registrado ayunos.</p> : null}
                    {sortedFastingLogs.map((item) => {
                      const protocol = findFastingProtocolForDate(
                        diaryData.fastingProtocols || [],
                        getFastingRecordDate(item, item.date)
                      );
                      const status = getFastingStatusLabel(item, protocol);
                      const duration = Number(item.actualDuration || 0);
                      const expected = Number(protocol?.expectedDuration || 0);

                      return (
                        <article className="metrics-card" key={item.id}>
                          <div className="metrics-card-top">
                            <div>
                              <strong>{item.expectedProtocol || 'Sin protocolo esperado'}</strong>
                              <span>{formatDate(item.date)}</span>
                            </div>
                            <span className={`metrics-source-chip ${getFastingStatusClass(status)}`}>
                              {status}
                            </span>
                          </div>
                          <div className="entry-details">
                            <span>Inicio {formatDateTimeHuman(item.actualStartDateTime)}</span>
                            <span>Ruptura {formatDateTimeHuman(item.actualBreakDateTime)}</span>
                            <span>{item.actualDuration ? `${item.actualDuration} h` : 'Sin duracion'}</span>
                            {expected > 0 && status === 'roto' ? <span>Faltaron {formatHoursLabel(Math.max(expected - duration, 0))}</span> : null}
                            <span>Hambre {fastingFeelingLabels[item.hunger] || item.hunger}</span>
                            <span>Energia {fastingFeelingLabels[item.energy] || item.energy}</span>
                          </div>
                          {item.notes ? <p className="metrics-notes">{item.notes}</p> : null}
                          <div className="entry-actions">
                            <button
                              className="button button-secondary"
                              type="button"
                              onClick={() => startEditing('fastingLogs', item.id, setFastingLogForm, setEditingFastingLogId, 'fasting')}
                            >
                              Editar
                            </button>
                            <button
                              className="button button-danger"
                              type="button"
                              onClick={() => deleteRecord('fastingLogs', item.id, setEditingFastingLogId, resetFastingLogForm)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        ) : null}
        {activeTab === 'supplements' ? (
          <>
            <div className="supplement-summary-grid">
              <div className="supplement-summary-card">
                <span>Total visible</span>
                <strong>{visibleSupplementSummary.total}</strong>
              </div>
              <div className="supplement-summary-card">
                <span>Tomados visibles</span>
                <strong>{visibleSupplementSummary.taken}</strong>
              </div>
              <div className="supplement-summary-card">
                <span>Pendientes visibles</span>
                <strong>{visibleSupplementSummary.pending}</strong>
              </div>
              <div className="supplement-summary-card">
                <span>Medicamentos visibles</span>
                <strong>{visibleSupplementSummary.medications}</strong>
              </div>
            </div>

            {todaySummary.supplementsPendingToday > 0 ? (
              <div className="alert-banner">
                <strong>Pendientes del dia:</strong> tienes {todaySummary.supplementsPendingToday} suplemento(s) o medicamento(s) aun sin marcar como tomados.
              </div>
            ) : null}

            <div className="supplement-routines-grid">
              <SectionCard title="Rutinas de suplementos" subtitle="Plantillas base para aplicar rapido durante el dia." className="supplement-section-card">
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
                          <textarea
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
                            <span>{`${supplementCategoryLabels[item.category] || item.category} • ${item.dose || '--'} ${item.unit || ''}`.trim()}</span>
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
                    { name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Efecto, observaciones o recordatorios...' },
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
                    <p className="empty-state">No hay suplementos o medicamentos registrados todavia.</p>
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
                                {item.time ? ` • ${item.time}` : ''}
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
                                {item.time ? ` • ${item.time}` : ''}
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
        ) : null}

        {activeTab === 'exercises' ? (
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
                    { name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Sensaciones, serie, ritmo, observaciones...' },
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
                  {visibleExercises.length === 0 ? <p className="empty-state">No hay ejercicios registrados todavia.</p> : null}

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
                                {item.time ? ` • ${item.time}` : ''}
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
                                {item.time ? ` • ${item.time}` : ''}
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

        {activeTab === 'metrics' ? (
          <>
            <div className="metrics-summary-grid">
              <div className="metrics-summary-card">
                <span>Peso actual</span>
                <strong>{formatMetricValue(metricSummary.weight, metricSummary.weight === '--' ? '' : ' kg')}</strong>
                <small>{metricSummarySourceLabels.weight}</small>
              </div>
              <div className="metrics-summary-card">
                <span>Grasa corporal actual</span>
                <strong>{formatMetricValue(metricSummary.bodyFat, metricSummary.bodyFat === '--' ? '' : '%')}</strong>
                <small>{metricSummarySourceLabels.bodyFat}</small>
              </div>
              <div className="metrics-summary-card">
                <span>Musculo esqueletico actual</span>
                <strong>
                  {formatMetricValue(
                    metricSummary.skeletalMuscleMass,
                    metricSummary.skeletalMuscleMass === '--' ? '' : ' kg'
                  )}
                </strong>
                <small>{metricSummarySourceLabels.skeletalMuscleMass}</small>
              </div>
              <div className="metrics-summary-card">
                <span>Masa grasa actual</span>
                <strong>
                  {formatMetricValue(metricSummary.bodyFatMass, metricSummary.bodyFatMass === '--' ? '' : ' kg')}
                </strong>
                <small>{metricSummarySourceLabels.bodyFatMass}</small>
              </div>
            </div>

            <SectionCard
              title="Tendencia reciente"
              subtitle="Compara tu ultimo registro contra el inmediatamente anterior."
              className="card-soft"
            >
              <div className="metrics-trend-grid">
                <div className="metrics-trend-card">
                  <span>Peso</span>
                  <strong>{metricTrend.weight}</strong>
                  <p>
                    {metricTrend.weight === 'sin referencia'
                      ? 'Dato insuficiente para comparar.'
                      : `Actual ${formatMetricValue(metricComparisonPairs.weight.current?.rawValue ?? '--', metricComparisonPairs.weight.current?.rawValue ? ' kg' : '')} frente a ${formatMetricValue(
                          metricComparisonPairs.weight.previous?.rawValue ?? '--',
                          metricComparisonPairs.weight.previous?.rawValue ? ' kg' : ''
                        )}`}
                  </p>
                </div>
                <div className="metrics-trend-card">
                  <span>Grasa corporal</span>
                  <strong>{metricTrend.bodyFat}</strong>
                  <p>
                    {metricTrend.bodyFat === 'sin referencia'
                      ? 'Dato insuficiente para comparar.'
                      : `Actual ${formatMetricValue(metricComparisonPairs.bodyFat.current?.rawValue ?? '--', metricComparisonPairs.bodyFat.current?.rawValue ? '%' : '')} frente a ${formatMetricValue(
                          metricComparisonPairs.bodyFat.previous?.rawValue ?? '--',
                          metricComparisonPairs.bodyFat.previous?.rawValue ? '%' : ''
                        )}`}
                  </p>
                </div>
                <div className="metrics-trend-card">
                  <span>Musculo esqueletico</span>
                  <strong>{metricTrend.skeletalMuscleMass}</strong>
                  <p>
                    {metricTrend.skeletalMuscleMass === 'sin referencia'
                      ? 'Dato insuficiente para comparar.'
                      : `Actual ${formatMetricValue(
                          metricComparisonPairs.skeletalMuscleMass.current?.rawValue ?? '--',
                          metricComparisonPairs.skeletalMuscleMass.current?.rawValue ? ' kg' : ''
                        )} frente a ${formatMetricValue(
                          metricComparisonPairs.skeletalMuscleMass.previous?.rawValue ?? '--',
                          metricComparisonPairs.skeletalMuscleMass.previous?.rawValue ? ' kg' : ''
                        )}`}
                  </p>
                </div>
                <div className="metrics-trend-card">
                  <span>Masa grasa</span>
                  <strong>{metricTrend.bodyFatMass}</strong>
                  <p>
                    {metricTrend.bodyFatMass === 'sin referencia'
                      ? 'Dato insuficiente para comparar.'
                      : `Actual ${formatMetricValue(
                          metricComparisonPairs.bodyFatMass.current?.rawValue ?? '--',
                          metricComparisonPairs.bodyFatMass.current?.rawValue ? ' kg' : ''
                        )} frente a ${formatMetricValue(
                          metricComparisonPairs.bodyFatMass.previous?.rawValue ?? '--',
                          metricComparisonPairs.bodyFatMass.previous?.rawValue ? ' kg' : ''
                        )}`}
                  </p>
                </div>
              </div>
            </SectionCard>

            <div className="split-layout metrics-layout">
              <div className="metrics-form-stack">
                <SectionCard title="Medidas manuales" subtitle="Tu bloque base para registrar peso, medidas y observaciones.">
                  <RecordForm
                    title="Nueva medicion"
                    fields={[
                      { name: 'date', label: 'Fecha', type: 'date' },
                      { name: 'weight', label: 'Peso (kg)', type: 'number', min: '0', step: '0.1' },
                      { name: 'waist', label: 'Cintura (cm)', type: 'number', min: '0', step: '0.1' },
                      { name: 'chest', label: 'Pecho (cm)', type: 'number', min: '0', step: '0.1' },
                      { name: 'arm', label: 'Brazo (cm)', type: 'number', min: '0', step: '0.1' },
                      { name: 'leg', label: 'Pierna (cm)', type: 'number', min: '0', step: '0.1' },
                      { name: 'calf', label: 'Pantorrilla (cm)', type: 'number', min: '0', step: '0.1' },
                      { name: 'forearm', label: 'Antebrazo (cm)', type: 'number', min: '0', step: '0.1' },
                      { name: 'upperBackTorso', label: 'Dorsal / torso superior (cm)', type: 'number', min: '0', step: '0.1' },
                      { name: 'hips', label: 'Cadera (cm)', type: 'number', min: '0', step: '0.1' },
                      { name: 'neck', label: 'Cuello (cm)', type: 'number', min: '0', step: '0.1' },
                      { name: 'bodyFat', label: 'Grasa corporal estimada (%)', type: 'number', min: '0', step: '0.1' },
                      {
                        name: 'observations',
                        label: 'Observaciones',
                        type: 'textarea',
                        placeholder: 'Cambios visibles, retencion, sensaciones o contexto...',
                      },
                    ]}
                    formData={metricForm}
                    onChange={handleFormChange(setMetricForm)}
                    onSubmit={handleMetricSubmit}
                    onCancel={() => {
                      resetMetricForm();
                      setEditingMetricId(null);
                    }}
                    isEditing={Boolean(editingMetricId)}
                  />
                </SectionCard>

                <SectionCard
                  title="Composicion corporal avanzada"
                  subtitle="Campos tipo InBody para registrar composicion corporal mas detallada."
                  className="metrics-advanced-card"
                >
                  <RecordForm
                    title="Datos avanzados"
                    fields={[
                      { name: 'height', label: 'Altura (cm)', type: 'number', min: '0', step: '0.1' },
                      {
                        name: 'skeletalMuscleMass',
                        label: 'Masa musculo esqueletico (kg)',
                        type: 'number',
                        min: '0',
                        step: '0.1',
                      },
                      { name: 'bodyFatMass', label: 'Masa grasa corporal (kg)', type: 'number', min: '0', step: '0.1' },
                      { name: 'fatFreeMass', label: 'Masa libre de grasa (kg)', type: 'number', min: '0', step: '0.1' },
                      { name: 'totalBodyWater', label: 'Agua corporal total (L)', type: 'number', min: '0', step: '0.1' },
                      { name: 'proteinsMass', label: 'Proteinas (kg)', type: 'number', min: '0', step: '0.1' },
                      { name: 'mineralsMass', label: 'Minerales (kg)', type: 'number', min: '0', step: '0.1' },
                      { name: 'bmi', label: 'IMC', type: 'number', min: '0', step: '0.1' },
                      { name: 'basalMetabolicRate', label: 'Tasa metabolica basal (kcal)', type: 'number', min: '0', step: '1' },
                      { name: 'waistHipRatio', label: 'Relacion cintura-cadera', type: 'number', min: '0', step: '0.01' },
                      { name: 'visceralFatLevel', label: 'Nivel de grasa visceral', type: 'number', min: '0', step: '1' },
                      {
                        name: 'recommendedCalorieIntake',
                        label: 'Ingesta calorica recomendada (kcal)',
                        type: 'number',
                        min: '0',
                        step: '1',
                      },
                      {
                        name: 'dataSource',
                        label: 'Origen del dato',
                        type: 'select',
                        options: [
                          { value: 'manual', label: 'Manual' },
                          { value: 'inbody', label: 'InBody' },
                        ],
                      },
                    ]}
                    formData={metricForm}
                    onChange={handleFormChange(setMetricForm)}
                    onSubmit={handleMetricSubmit}
                    onCancel={() => {
                      resetMetricForm();
                      setEditingMetricId(null);
                    }}
                    isEditing={Boolean(editingMetricId)}
                  />
                </SectionCard>
              </div>

              <SectionCard title="Registros recientes" subtitle="Revisa tus ultimas mediciones con una vista mas compacta.">
                <div className="metrics-card-list">
                  {sortedMetrics.length === 0 ? <p className="empty-state">No hay metricas corporales registradas todavia.</p> : null}

                  {sortedMetrics.map((item) => (
                    <article className="metrics-card" key={item.id}>
                      <div className="metrics-card-top">
                        <div>
                          <strong>{formatDate(item.date)}</strong>
                          <span>
                            {`Peso ${formatMetricText(item.weight, item.weight ? ' kg' : '')}`}
                            {` • Grasa ${formatMetricText(item.bodyFat, item.bodyFat ? '%' : '')}`}
                            {` • Musculo ${formatMetricText(
                              item.skeletalMuscleMass,
                              item.skeletalMuscleMass ? ' kg' : ''
                            )}`}
                            {` • Masa grasa ${formatMetricText(item.bodyFatMass, item.bodyFatMass ? ' kg' : '')}`}
                          </span>
                        </div>
                        <span className={`metrics-source-chip ${item.dataSource === 'inbody' ? 'metrics-source-chip-inbody' : ''}`}>
                          {item.dataSource === 'inbody' ? 'InBody' : 'Manual'}
                        </span>
                      </div>

                      <div className="entry-details metrics-details">
                        <span>Cintura: {formatMetricText(item.waist, item.waist ? ' cm' : '')}</span>
                        {item.calf ? <span>Pantorrilla: {formatMetricText(item.calf, ' cm')}</span> : null}
                        {item.forearm ? <span>Antebrazo: {formatMetricText(item.forearm, ' cm')}</span> : null}
                        {item.upperBackTorso ? <span>Dorsal / torso superior: {formatMetricText(item.upperBackTorso, ' cm')}</span> : null}
                        <span>IMC: {formatMetricText(item.bmi)}</span>
                        <span>Agua: {formatMetricText(item.totalBodyWater, item.totalBodyWater ? ' L' : '')}</span>
                        <span>Masa libre: {formatMetricText(item.fatFreeMass, item.fatFreeMass ? ' kg' : '')}</span>
                      </div>

                      {item.observations ? <p className="metrics-notes">{item.observations}</p> : null}

                      <div className="entry-actions">
                        <button className="button button-secondary" type="button" onClick={() => duplicateMetric(item.id)}>
                          Duplicar
                        </button>
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={() => startEditing('bodyMetrics', item.id, setMetricForm, setEditingMetricId, 'metrics')}
                        >
                          Editar
                        </button>
                        <button
                          className="button button-danger"
                          type="button"
                          onClick={() => deleteRecord('bodyMetrics', item.id, setEditingMetricId, resetMetricForm)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </SectionCard>
            </div>
          </>
        ) : null}
        {activeTab === 'weekly' ? (
          <>
            <SectionCard
              title="Resumen semanal"
              subtitle="Lectura ejecutiva de la semana seleccionada usando alimentos, suplementos, ejercicio y metricas."
              actions={
                <div className="week-controls">
                  <button className="button button-secondary" type="button" onClick={() => setWeekReferenceDate((current) => shiftDateByDays(current, -7))}>
                    Semana anterior
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => setWeekReferenceDate(currentDate)}>
                    Ir a semana actual
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => setWeekReferenceDate((current) => shiftDateByDays(current, 7))}>
                    Semana siguiente
                  </button>
                  <label className="inline-field">
                    <span>Semana de referencia</span>
                    <input type="date" value={weekReferenceDate} onChange={(event) => setWeekReferenceDate(event.target.value)} />
                  </label>
                </div>
              }
            >
              <div className="week-range">
                <span>
                  Semana: <strong>{formatDate(weeklySummary.start)}</strong> a <strong>{formatDate(weeklySummary.end)}</strong>
                </span>
                <p>Estas viendo el resumen completo de la semana seleccionada.</p>
              </div>

              <div className="weekly-hero-grid">
                <div className="weekly-hero-card">
                  <span>Dias con registros</span>
                  <strong>{weeklySummary.trackedDays}</strong>
                  <small>Se cuentan todas las categorias registradas en la semana.</small>
                </div>
                <div className="weekly-hero-card">
                  <span>Comida registrada</span>
                  <strong>{weeklySummary.foodDays}</strong>
                  <small>Dias con al menos un alimento cargado.</small>
                </div>
                <div className="weekly-hero-card">
                  <span>Proteina total</span>
                  <strong>{weeklySummary.totalProtein.toFixed(1)} g</strong>
                  <small>Total acumulado de proteina en la semana.</small>
                </div>
                <div className="weekly-hero-card">
                  <span>Entrenamientos</span>
                  <strong>{weeklySummary.trainingSessions}</strong>
                  <small>Sesiones de ejercicio registradas en la semana.</small>
                </div>
                <div className="weekly-hero-card">
                  <span>Cambio de peso</span>
                  <strong>
                    {weeklySummary.metricsStart.weight && weeklySummary.metricsEnd.weight
                      ? `${weeklySummary.weightChange.toFixed(1)} kg`
                      : 'Sin suficientes datos'}
                  </strong>
                  <small>Comparacion entre el primer y el ultimo registro de metricas.</small>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Resumen automatico" subtitle="Lectura ejecutiva de la semana seleccionada." className="card-soft">
              <div className="weekly-note-stack">
                <div className="weekly-note">
                  <span>Comida</span>
                  <strong>
                    {weeklySummary.foodDays > 0
                      ? `Registraste comida en ${weeklySummary.foodDays} dia(s) con alimentos cargados`
                      : 'Sin registros esta semana'}
                  </strong>
                </div>
                <div className="weekly-note">
                  <span>Proteina</span>
                  <strong>
                    {weeklySummary.foodDays > 0
                      ? `Consumiste ${weeklySummary.totalProtein.toFixed(1)} g de proteina en total`
                      : 'Sin registros esta semana'}
                  </strong>
                </div>
                <div className="weekly-note">
                  <span>Mejor dia de proteina</span>
                  <strong>
                    {weeklySummary.bestProteinDay
                      ? `Tu mejor dia de proteina fue ${formatDate(weeklySummary.bestProteinDay.date)} con ${weeklySummary.bestProteinDay.total.toFixed(1)} g`
                      : 'Sin suficientes datos esta semana'}
                  </strong>
                </div>
                <div className="weekly-note">
                  <span>Ejercicio</span>
                  <strong>
                    {weeklySummary.trainingSessions > 0
                      ? `Acumulaste ${weeklySummary.totalExerciseMinutes} min de ejercicio en la semana`
                      : 'Sin suficientes datos esta semana'}
                  </strong>
                </div>
                <div className="weekly-note">
                  <span>Ayuno</span>
                  <strong>
                    {weeklySummary.fastingLogsCount > 0
                      ? `${weeklySummary.fastingLogsCount} ayuno(s) registrados • ${weeklySummary.fastingCompleted} cumplidos • ${weeklySummary.fastingInProgress} en curso`
                      : 'Sin suficientes datos'}
                  </strong>
                </div>
                <div className="weekly-note">
                  <span>Ayuno semanal</span>
                  <strong>
                    {weeklySummary.fastingLogsCount > 0
                      ? `Horas totales ayunadas: ${weeklySummary.fastingHours.toFixed(1)} h • OMAD cumplidos: ${weeklySummary.omadCompleted} • Desviaciones: ${weeklySummary.fastingDeviations}`
                      : 'Sin suficientes datos esta semana'}
                  </strong>
                </div>
              </div>
            </SectionCard>

            <div className="weekly-executive-grid">
              <SectionCard title="Nutricion" subtitle="Promedios calculados solo con dias que si tienen alimentos registrados." className="card-soft weekly-module-card">
                {weeklySummary.foodDays > 0 ? (
                  <div className="mini-stat-grid">
                    <div className="mini-stat">
                      <span>Calorias totales de la semana</span>
                      <strong>{weeklySummary.totalCalories} kcal</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Proteina total de la semana</span>
                      <strong>{weeklySummary.totalProtein.toFixed(1)} g</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Calorias promedio por dia</span>
                      <strong>{weeklySummary.averageCaloriesTracked.toFixed(0)} kcal</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Proteina promedio por dia</span>
                      <strong>{weeklySummary.averageProteinTracked.toFixed(1)} g</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Carbohidratos promedio por dia</span>
                      <strong>{weeklySummary.averageCarbsTracked.toFixed(1)} g</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Grasa promedio por dia</span>
                      <strong>{weeklySummary.averageFatTracked.toFixed(1)} g</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Dias con alimentos registrados</span>
                      <strong>{weeklySummary.foodDays}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Mejor dia de proteina</span>
                      <strong>
                        {weeklySummary.bestProteinDay
                          ? `${formatDate(weeklySummary.bestProteinDay.date)} • ${weeklySummary.bestProteinDay.total.toFixed(1)} g`
                          : 'Sin suficientes datos'}
                      </strong>
                    </div>
                    <div className="mini-stat">
                      <span>Mejor dia de calorias</span>
                      <strong>
                        {weeklySummary.bestCaloriesDay
                          ? `${formatDate(weeklySummary.bestCaloriesDay.date)} • ${weeklySummary.bestCaloriesDay.total.toFixed(0)} kcal`
                          : 'Sin suficientes datos'}
                      </strong>
                    </div>
                    <div className="mini-stat">
                      <span>Promedio diario de calorias vs meta</span>
                      <strong>
                        {calorieGoal > 0
                          ? `${weeklySummary.averageCaloriesTracked.toFixed(0)} kcal / ${calorieGoal} kcal`
                          : 'Sin meta configurada'}
                      </strong>
                    </div>
                    <div className="mini-stat">
                      <span>Promedio diario de proteina vs meta</span>
                      <strong>
                        {proteinGoal > 0
                          ? `${weeklySummary.averageProteinTracked.toFixed(1)} g / ${proteinGoal} g`
                          : 'Sin meta configurada'}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="empty-state">Sin registros esta semana</p>
                )}
              </SectionCard>

              <SectionCard title="Hidratacion" subtitle="Promedios calculados solo con dias que si tienen bebidas registradas." className="card-soft weekly-module-card">
                {weeklySummary.hydrationTotal > 0 ? (
                  <div className="mini-stat-grid">
                    <div className="mini-stat">
                      <span>Total semanal</span>
                      <strong>{weeklySummary.hydrationTotal.toFixed(0)} ml</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Promedio diario</span>
                      <strong>{weeklySummary.hydrationAverage.toFixed(0)} ml</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Dias cumplidos</span>
                      <strong>{weeklySummary.hydrationDaysMetGoal}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Mejor dia</span>
                      <strong>
                        {weeklySummary.bestHydrationDay
                          ? `${formatDate(weeklySummary.bestHydrationDay.date)} • ${weeklySummary.bestHydrationDay.total.toFixed(0)} ml`
                          : 'Sin suficientes datos'}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="empty-state">Sin suficientes datos esta semana</p>
                )}
              </SectionCard>

              <SectionCard title="Suplementos" subtitle="Seguimiento de tomados, pendientes y adherencia." className="card-soft weekly-module-card">
                {weeklySummary.supplementsTaken > 0 || weeklySummary.supplementsPending > 0 ? (
                  <div className="mini-stat-grid">
                    <div className="mini-stat">
                      <span>Total tomados en la semana</span>
                      <strong>{weeklySummary.supplementsTaken}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Total pendientes en la semana</span>
                      <strong>{weeklySummary.supplementsPending}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Adherencia semanal</span>
                      <strong>
                        {weeklySummary.supplementAdherence !== null
                          ? `${weeklySummary.supplementAdherence.toFixed(0)}%`
                          : 'Sin suficientes datos'}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="empty-state">Sin suficientes datos esta semana</p>
                )}
              </SectionCard>

              <SectionCard title="Ayuno" subtitle="Registro semanal con cumplimiento, en curso y horas acumuladas." className="card-soft weekly-module-card">
                {weeklySummary.fastingLogsCount > 0 ? (
                  <div className="mini-stat-grid">
                    <div className="mini-stat">
                      <span>Dias con ayuno registrado</span>
                      <strong>{weeklySummary.fastingDays}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Dias de ayuno cumplidos</span>
                      <strong>{weeklySummary.fastingCompleted}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Ayunos en curso</span>
                      <strong>{weeklySummary.fastingInProgress}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Adherencia semanal</span>
                      <strong>
                        {weeklySummary.fastingAdherence !== null
                          ? `${weeklySummary.fastingAdherence.toFixed(0)}%`
                          : 'Sin suficientes datos'}
                      </strong>
                    </div>
                    <div className="mini-stat">
                      <span>Horas totales ayunadas</span>
                      <strong>{weeklySummary.fastingHours.toFixed(1)} h</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Desviaciones</span>
                      <strong>{weeklySummary.fastingDeviations}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Dias OMAD cumplidos</span>
                      <strong>{weeklySummary.omadCompleted}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="empty-state">Sin suficientes datos esta semana</p>
                )}
              </SectionCard>

              <SectionCard title="Ejercicio" subtitle="Carga total y distribucion basica del entrenamiento." className="card-soft weekly-module-card">
                {weeklySummary.trainingSessions > 0 ? (
                  <div className="mini-stat-grid">
                    <div className="mini-stat">
                      <span>Sesiones totales</span>
                      <strong>{weeklySummary.trainingSessions}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Minutos totales</span>
                      <strong>{weeklySummary.totalExerciseMinutes} min</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Calorias quemadas</span>
                      <strong>{weeklySummary.totalBurned} kcal</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Sesiones cardio</span>
                      <strong>{weeklySummary.exerciseCardioSessions}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Sesiones fuerza</span>
                      <strong>{weeklySummary.exerciseStrengthSessions}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="empty-state">Sin suficientes datos esta semana</p>
                )}
              </SectionCard>

              <SectionCard title="Metricas" subtitle="Comparacion entre el inicio y el final de la semana." className="card-soft weekly-module-card">
                {weeklySummary.metricsStart.weight || weeklySummary.metricsEnd.weight ? (
                  <div className="mini-stat-grid">
                    <div className="mini-stat">
                      <span>Peso inicial</span>
                      <strong>{weeklySummary.metricsStart.weight ? `${weeklySummary.metricsStart.weight} kg` : 'Sin dato'}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Peso final</span>
                      <strong>{weeklySummary.metricsEnd.weight ? `${weeklySummary.metricsEnd.weight} kg` : 'Sin dato'}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Cambio neto de peso</span>
                      <strong>
                        {weeklySummary.metricsStart.weight && weeklySummary.metricsEnd.weight
                          ? `${weeklySummary.weightChange.toFixed(1)} kg`
                          : 'Sin suficientes datos'}
                      </strong>
                    </div>
                    <div className="mini-stat">
                      <span>Grasa corporal inicial / final</span>
                      <strong>
                        {weeklySummary.metricsStart.bodyFat || weeklySummary.metricsEnd.bodyFat
                          ? `${weeklySummary.metricsStart.bodyFat || 'Sin dato'}% / ${weeklySummary.metricsEnd.bodyFat || 'Sin dato'}%`
                          : 'Sin suficientes datos'}
                      </strong>
                    </div>
                    <div className="mini-stat">
                      <span>Cintura inicial / final</span>
                      <strong>
                        {weeklySummary.metricsStart.waist || weeklySummary.metricsEnd.waist
                          ? `${weeklySummary.metricsStart.waist || 'Sin dato'} cm / ${weeklySummary.metricsEnd.waist || 'Sin dato'} cm`
                          : 'Sin suficientes datos'}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="empty-state">Sin suficientes datos esta semana</p>
                )}
              </SectionCard>
            </div>
          </>
        ) : null}

        {activeTab === 'history' ? (
          <SectionCard title="Historial por dia" subtitle="Todos los registros agrupados por fecha.">
            <HistoryView
              days={historyDays}
              onEditFood={(id) => startEditing('foods', id, setFoodForm, setEditingFoodId, 'foods')}
              onDeleteFood={(id) => deleteRecord('foods', id, setEditingFoodId, resetFoodForm)}
              onEditHydration={(id) => startEditing('hydrationEntries', id, setHydrationForm, setEditingHydrationId, 'foods')}
              onDeleteHydration={(id) => deleteRecord('hydrationEntries', id, setEditingHydrationId, resetHydrationForm)}
              onEditSupplement={(id) => startEditing('supplements', id, setSupplementForm, setEditingSupplementId, 'supplements')}
              onDeleteSupplement={(id) => deleteRecord('supplements', id, setEditingSupplementId, resetSupplementForm)}
              onEditFasting={(id) => startEditing('fastingLogs', id, setFastingLogForm, setEditingFastingLogId, 'fasting')}
              onDeleteFasting={(id) => deleteRecord('fastingLogs', id, setEditingFastingLogId, resetFastingLogForm)}
              onEditExercise={(id) => startEditing('exercises', id, setExerciseForm, setEditingExerciseId, 'exercises')}
              onDeleteExercise={(id) => deleteRecord('exercises', id, setEditingExerciseId, resetExerciseForm)}
              onEditMetric={(id) => startEditing('bodyMetrics', id, setMetricForm, setEditingMetricId, 'metrics')}
              onDeleteMetric={(id) => deleteRecord('bodyMetrics', id, setEditingMetricId, resetMetricForm)}
            />
          </SectionCard>
        ) : null}

        {activeTab === 'private' ? (
          <>
            {!privateVault.pin ? (
              <SectionCard
                title="Acceso privado"
                subtitle="Configura un PIN numerico para habilitar este espacio restringido de salud hormonal."
                className="card-soft"
              >
                <div className="private-hero-grid">
                  <div className="objective-progress-panel private-lead-panel">
                    <div className="objective-progress-copy">
                      <strong>PIN inicial de {privatePinLength} digitos</strong>
                      <span>
                        Esta fase protege visualmente el modulo privado y su respaldo separado. No equivale todavia a
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
                            placeholder={`PIN de ${privatePinLength} digitos`}
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
                      <strong>Excluye esta area sensible</strong>
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
                        El PIN protege esta seccion dentro de la app, pero todavia no implementa cifrado local fuerte
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
                            placeholder={`Ingresa tu PIN de ${privatePinLength} digitos`}
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
                          ? formatDateTimeHuman(privateVault.lastPrivateExportAt)
                          : 'Aun no exportado'}
                      </strong>
                    </div>
                    <div className="backup-meta-card private-secondary-card">
                      <span>Ultimo respaldo privado importado</span>
                      <strong>
                        {privateVault.lastPrivateImportAt
                          ? formatDateTimeHuman(privateVault.lastPrivateImportAt)
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
                        <small>Se reinicia con actividad dentro del modulo desbloqueado.</small>
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
                            : 'Sin importacion privada todavia'}
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
                              placeholder={`Nuevo PIN de ${privatePinLength} digitos`}
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
                            {`${privateSummary.activeCycle?.startDate ? formatDate(privateSummary.activeCycle.startDate) : 'Sin inicio'} • ${
                              privateSummary.activeCycle?.estimatedEndDate ? formatDate(privateSummary.activeCycle.estimatedEndDate) : 'Sin fin'
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
                                  ? formatDateTimeHuman(privateSummary.nextEvent.nextApplication)
                                  : privateSummary.nextEvent.date
                                    ? `${formatDate(privateSummary.nextEvent.date)}${privateSummary.nextEvent.time ? ` • ${privateSummary.nextEvent.time}` : ''}`
                                    : 'Sin fecha'}${nextPrivateEventProduct?.name ? ` • ${nextPrivateEventProduct.name}` : ''}`
                              : 'Sin evento proximo.'}
                          </small>
                        </div>
                        <div className="supplement-summary-card">
                          <span>Ultimo evento</span>
                          <strong>{latestPrivateTimelineItem?.title || 'Aun no hay actividad privada.'}</strong>
                          <small>
                            {latestPrivateTimelineItem
                              ? `${latestPrivateTimelineItem.date ? formatDate(latestPrivateTimelineItem.date) : 'Sin fecha'}${
                                  latestPrivateTimelineItem.time ? ` • ${latestPrivateTimelineItem.time}` : ''
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
                                  {nextUpcomingEvent.scheduledDate ? formatDate(nextUpcomingEvent.scheduledDate) : 'Sin fecha'}
                                  {nextUpcomingEvent.scheduledAt ? ` • ${formatAgendaTime(nextUpcomingEvent.scheduledAt)}` : ' • Sin hora'}
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
                                      ? `Siguiente hoy: ${privateAgendaTodayNextEntry.name || 'Evento'}${privateAgendaTodayNextEntry.scheduledAt ? ` • ${formatAgendaTime(privateAgendaTodayNextEntry.scheduledAt)}` : ''}`
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
                                    <span>{item.scheduledDate ? formatDate(item.scheduledDate) : 'Sin fecha'}</span>
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
                                  {item.date ? formatDate(item.date) : 'Sin fecha'}
                                  {item.time ? ` • ${item.time}` : ''}
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
                      title="Ciclos privados"
                      subtitle={
                        hasActivePrivateCycle
                          ? 'Gestiona ciclos, estados y ventana operativa.'
                          : 'Empieza creando o activando un ciclo.'
                      }
                      className={`card-soft ${hasActivePrivateCycle ? '' : 'private-cycle-step-card'}`.trim()}
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
                            { name: 'name', label: 'Nombre del ciclo', type: 'text', placeholder: 'Ej. TRT primavera, seguimiento o soporte...' },
                            {
                              name: 'type',
                              label: 'Tipo',
                              type: 'select',
                              options: Object.entries(privateCycleTypeLabels).map(([value, label]) => ({ value, label })),
                            },
                            { name: 'startDate', label: 'Fecha de inicio', type: 'date' },
                            { name: 'estimatedEndDate', label: 'Fecha estimada de fin', type: 'date' },
                            {
                              name: 'status',
                              label: 'Estado',
                              type: 'select',
                              options: Object.entries(privateCycleStatusLabels).map(([value, label]) => ({ value, label })),
                            },
                            { name: 'objective', label: 'Objetivo breve', type: 'text', placeholder: 'Objetivo principal del ciclo' },
                            { name: 'notes', label: 'Notas privadas', type: 'textarea', placeholder: 'Contexto, criterios o limites privados...' },
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
                        />
                      ) : (
                        <p className="section-helper">Abre el formulario cuando necesites crear, editar o activar un ciclo.</p>
                      )}
                    </SectionCard>

                    <SectionCard
                      title="Ciclo activo"
                      subtitle={hasActivePrivateCycle ? 'Estado operativo y financiero del ciclo activo.' : 'Resumen actual.'}
                      className={`card-soft ${hasActivePrivateCycle ? '' : 'private-empty-compact private-empty-tight'}`.trim()}
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
                              {`${privateCycleTypeLabels[activePrivateCycle.type] || activePrivateCycle.type} • ${
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
                              {`${activePrivateCycle.startDate ? formatDate(activePrivateCycle.startDate) : 'Sin inicio'} • ${
                                activePrivateCycle.estimatedEndDate ? formatDate(activePrivateCycle.estimatedEndDate) : 'Sin fin'
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
                                    ? formatDateTimeHuman(privateSummary.nextEvent.nextApplication)
                                    : privateSummary.nextEvent.date
                                      ? `${formatDate(privateSummary.nextEvent.date)}${privateSummary.nextEvent.time ? ` • ${privateSummary.nextEvent.time}` : ''}`
                                      : 'Sin fecha'}${nextPrivateEventProduct?.name ? ` • ${nextPrivateEventProduct.name}` : ''}`
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
                        {privateCycles.map((item) => (
                          <article className="metrics-card private-entry-card" key={item.id}>
                            <div className="metrics-card-top">
                              <div>
                                <strong>{item.name || 'Ciclo sin nombre'}</strong>
                                <span>{privateCycleTypeLabels[item.type] || item.type} • {privateCycleStatusLabels[item.status] || item.status}</span>
                              </div>
                              <span className="metrics-source-chip">{privateCycleStatusLabels[item.status] || item.status}</span>
                            </div>
                            <div className="entry-details">
                              <span>{item.startDate ? `Inicio ${formatDate(item.startDate)}` : 'Inicio sin dato'}</span>
                              <span>{item.estimatedEndDate ? `Fin ${formatDate(item.estimatedEndDate)}` : 'Fin sin dato'}</span>
                              <span>{item.objective || 'Objetivo sin dato'}</span>
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
                        ))}
                      </div>
                    </SectionCard>
                  </div>

                  <div className="split-layout private-layout private-block-components" ref={privateProductSectionRef}>
                    <SectionCard
                      title="Componentes del ciclo"
                      subtitle={hasActivePrivateCycle ? 'Asocia productos, soporte o compras al ciclo privado.' : 'Bloqueado hasta activar un ciclo.'}
                      className={`card-soft ${hasActivePrivateCycle ? '' : 'private-compact-card private-empty-tight private-blocked-card'}`.trim()}
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
                            title="Nuevo componente"
                            fields={[
                              {
                                name: 'cycleId',
                                label: 'Ciclo privado',
                                type: 'select',
                                options: [{ value: '', label: 'Sin ciclo' }, ...privateCycleOptions],
                              },
                              { name: 'name', label: 'Nombre', type: 'text', placeholder: 'Ej. Testosterona, oxandrolona, soporte hepatica...' },
                              {
                                name: 'category',
                                label: 'Categoria',
                                type: 'select',
                                options: Object.entries(privateCategoryLabels).map(([value, label]) => ({ value, label })),
                              },
                              { name: 'presentation', label: 'Presentacion', type: 'text', placeholder: 'Vial 10 ml, blister, estudio...' },
                              { name: 'purchasedQuantity', label: 'Cantidad comprada', type: 'text', placeholder: 'Ej. 2' },
                              { name: 'unit', label: 'Unidad', type: 'text', placeholder: 'viales, cajas, ml, tabs...' },
                              { name: 'totalCost', label: 'Costo total', type: 'number', min: '0', step: '0.01' },
                              { name: 'supplier', label: 'Proveedor o fuente', type: 'text', placeholder: 'Origen o referencia privada' },
                              { name: 'purchaseDate', label: 'Fecha de compra', type: 'date' },
                              {
                                name: 'status',
                                label: 'Estatus',
                                type: 'select',
                                options: Object.entries(privateProductStatusLabels).map(([value, label]) => ({ value, label })),
                              },
                              { name: 'notes', label: 'Notas privadas', type: 'textarea', placeholder: 'Detalles de calidad, seguimiento o contexto...' },
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
                        subtitle="Inventario operativo del ciclo activo."
                        className="card-soft"
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
                                    <span>{linkedCycle?.name || 'Sin ciclo'} • {privateProductStatusLabels[item.status] || item.status}</span>
                                  </div>
                                  <span className="metrics-source-chip">{privateCategoryLabels[item.category] || item.category}</span>
                                </div>
                                <div className="entry-details">
                                  <span>{item.presentation || 'Presentacion sin dato'}</span>
                                  <span>{item.purchasedQuantity || '0'} {item.unit || ''}</span>
                                  <span>{formatCurrencyMx(item.totalCost)}</span>
                                  <span>{item.supplier || 'Proveedor sin dato'}</span>
                                  <span>{item.purchaseDate ? formatDate(item.purchaseDate) : 'Compra sin fecha'}</span>
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
                      subtitle={hasActivePrivateCycle ? 'Registra pagos del ciclo activo.' : 'Bloqueado hasta activar un ciclo.'}
                      className={`card-soft ${hasActivePrivateCycle ? '' : 'private-compact-card private-empty-tight private-blocked-card'}`.trim()}
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
                                name: 'cycleId',
                                label: 'Ciclo privado',
                                type: 'select',
                                options: [{ value: '', label: 'Sin ciclo' }, ...privateCycleOptions],
                              },
                              { name: 'concept', label: 'Concepto', type: 'text', placeholder: 'Ej. Pago vial, analitica, soporte...' },
                              { name: 'date', label: 'Fecha', type: 'date' },
                              { name: 'amount', label: 'Monto', type: 'number', min: '0', step: '0.01' },
                              { name: 'method', label: 'Metodo', type: 'text', placeholder: 'Transferencia, efectivo, tarjeta...' },
                              {
                                name: 'status',
                                label: 'Estado',
                                type: 'select',
                                options: Object.entries(privatePaymentStatusLabels).map(([value, label]) => ({ value, label })),
                              },
                              { name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Observaciones del pago o saldo...' },
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
                      <SectionCard
                        title="Resumen de pagos"
                        subtitle="Estado financiero del ciclo activo."
                        className="card-soft"
                      >
                        <div className="backup-meta-grid">
                          <div className="backup-meta-card">
                            <span>Costo total acumulado</span>
                            <strong>{formatCurrencyMx(privateSummary.totalInvested)}</strong>
                          </div>
                          <div className="backup-meta-card">
                            <span>Total pagado</span>
                            <strong>{formatCurrencyMx(privateSummary.totalPaid)}</strong>
                          </div>
                          <div className="backup-meta-card">
                            <span>Saldo pendiente</span>
                            <strong>{formatCurrencyMx(privateSummary.pendingBalance)}</strong>
                          </div>
                          <div className="backup-meta-card">
                            <span>Pagos registrados</span>
                            <strong>{privateSummary.activePaymentsCount}</strong>
                          </div>
                        </div>
                        <div className="metrics-card-list private-card-list">
                          {activeCyclePayments.length === 0 ? <p className="empty-state">Aun sin pagos.</p> : null}
                          {activeCyclePayments.map((item) => {
                            const linkedCycle = privateCycles.find((cycle) => cycle.id === item.cycleId);
                            return (
                              <article className="metrics-card private-entry-card" key={item.id}>
                                <div className="metrics-card-top">
                                  <div>
                                    <strong>{item.concept || 'Pago sin concepto'}</strong>
                                    <span>{linkedCycle?.name || 'Sin ciclo'} • {item.date ? formatDate(item.date) : 'Sin fecha'}</span>
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
                    ) : null}
                  </div>

                  <div className="split-layout private-layout private-block-events" ref={privateEventSectionRef}>
                    <SectionCard
                      title="Eventos privados"
                      subtitle={hasActivePrivateCycle ? 'Captura eventos, aplicaciones o controles.' : 'Bloqueado hasta activar un ciclo.'}
                      className={`card-soft ${hasActivePrivateCycle ? '' : 'private-compact-card private-empty-tight private-blocked-card'}`.trim()}
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
                              { name: 'date', label: 'Fecha', type: 'date' },
                              { name: 'time', label: 'Hora', type: 'time' },
                              {
                                name: 'cycleId',
                                label: 'Ciclo privado',
                                type: 'select',
                                options: [{ value: '', label: 'Sin ciclo' }, ...privateCycleOptions],
                              },
                              {
                                name: 'productId',
                                label: 'Producto asociado',
                                type: 'select',
                                options: [{ value: '', label: 'Sin producto' }, ...privateProductOptions],
                              },
                              {
                                name: 'eventType',
                                label: 'Tipo de evento',
                                type: 'select',
                                options: Object.entries(privateEventTypeLabels).map(([value, label]) => ({ value, label })),
                              },
                              { name: 'name', label: 'Nombre', type: 'text', placeholder: 'Ej. Aplicacion TRT, toma, sintoma, analitica...' },
                              {
                                name: 'category',
                                label: 'Categoria',
                                type: 'select',
                                options: Object.entries(privateCategoryLabels).map(([value, label]) => ({ value, label })),
                              },
                              { name: 'dose', label: 'Dosis', type: 'text', placeholder: 'Ej. 125' },
                              { name: 'unit', label: 'Unidad', type: 'text', placeholder: 'mg, ml, caps, UI...' },
                              { name: 'route', label: 'Via', type: 'text', placeholder: 'IM, SC, oral...' },
                              { name: 'frequency', label: 'Frecuencia', type: 'text', placeholder: 'Semanal, ED, EOD...' },
                              { name: 'nextApplication', label: 'Proximo evento / aplicacion', type: 'datetime-local' },
                              { name: 'notes', label: 'Notas privadas', type: 'textarea', placeholder: 'Observaciones sensibles solo para este modulo...' },
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
        ) : null}
      </main>
    </div>
  );
}

export default App;
