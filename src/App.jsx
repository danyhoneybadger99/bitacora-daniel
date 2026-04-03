
import { useEffect, useMemo, useRef, useState } from 'react';
import EntryList from './components/EntryList';
import GoalForm from './components/GoalForm';
import HistoryView from './components/HistoryView';
import ProgressCard from './components/ProgressCard';
import RecordForm from './components/RecordForm';
import SectionCard from './components/SectionCard';
import { defaultState } from './data/defaultState';
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
];

function App() {
  const currentDate = getToday();
  const isDevMode = import.meta.env.DEV;
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
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [editingHydrationId, setEditingHydrationId] = useState(null);
  const [editingFoodTemplateId, setEditingFoodTemplateId] = useState(null);
  const [editingFastingProtocolId, setEditingFastingProtocolId] = useState(null);
  const [editingFastingLogId, setEditingFastingLogId] = useState(null);
  const [editingSupplementId, setEditingSupplementId] = useState(null);
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [editingMetricId, setEditingMetricId] = useState(null);
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
  const [debugLastLoadAt, setDebugLastLoadAt] = useState('');
  const [debugLastSaveAt, setDebugLastSaveAt] = useState('');
  const persistReasonRef = useRef('inicio');

  function markPersistenceReason(reason) {
    persistReasonRef.current = reason;
    if (isDevMode) {
      console.info('[Mi Diario][debug] persist:queued', { reason });
    }
  }

  useEffect(() => {
    const loadedData = loadAppData();
    setDiaryData(loadedData);
    setGoalForm(loadedData.goals || defaultState.goals);
    setObjectiveForm((loadedData.objectives && loadedData.objectives[0]) || defaultState.objectives?.[0] || createEmptyObjective());
    const loadTimestamp = getCurrentDateTimeValue();
    setDebugLastLoadAt(loadTimestamp);
    if (isDevMode) {
      console.info('[Mi Diario][debug] load:applied', {
        at: loadTimestamp,
        collectionCounts: getPersistenceCollectionCounts(loadedData),
      });
    }
    setHasLoadedData(true);
  }, [isDevMode]);

  useEffect(() => {
    if (!hasLoadedData) return;
    const saveTimestamp = getCurrentDateTimeValue();
    saveAppData(diaryData);
    setDebugLastSaveAt(saveTimestamp);
    if (isDevMode) {
      console.info('[Mi Diario][debug] save:applied', {
        at: saveTimestamp,
        reason: persistReasonRef.current,
        collectionCounts: getPersistenceCollectionCounts(diaryData),
      });
    }
  }, [diaryData, hasLoadedData, isDevMode]);

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

  const currentFastingLog = useMemo(
    () => sortedFastingLogs.find((item) => item.actualStartDateTime && !item.actualBreakDateTime) || null,
    [sortedFastingLogs]
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
  const activeFastingLog = currentFastingLog || null;
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
  const persistenceDebugCounts = useMemo(() => getPersistenceCollectionCounts(diaryData), [diaryData]);

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
    setEditingFoodId(null);
    setEditingHydrationId(null);
    setEditingFoodTemplateId(null);
    setEditingFastingProtocolId(null);
    setEditingFastingLogId(null);
    setEditingSupplementId(null);
    setEditingExerciseId(null);
    setEditingMetricId(null);
    setBackupInputKey((current) => current + 1);
    setBackupFeedback({
      type: 'success',
      text: 'Todos los datos locales fueron reseteados y la app volvio a su estado inicial.',
    });
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

      {isDevMode ? (
        <SectionCard
          title="Diagnostico de persistencia"
          subtitle="Visible solo en desarrollo para revisar guardado local, respaldo y conteo de colecciones."
          className="card-soft dev-storage-card"
        >
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
        </SectionCard>
      ) : null}

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
                  El respaldo usa la misma persistencia local de la app y guarda todo el contenido actual bajo la key
                  <strong> mi-diario-data</strong>.
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
      </main>
    </div>
  );
}

export default App;
