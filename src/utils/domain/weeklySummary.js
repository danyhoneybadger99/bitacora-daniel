import { getEndOfWeek, getStartOfWeek, isDateInRange, sortByDateDesc } from '../date';
import {
  doesFastingOverlapWeek,
  findFastingProtocolForDate,
  formatProtocolLabel,
  getFastingDatesInsideRange,
  getFastingHoursInsideRange,
  getFastingRecordDate,
  isFastingFreeDay,
  getWeeklyFastingStatus,
} from './fasting';
import { getHydrationMl } from './records';
import { average, sumBy, uniqueDates } from './shared';

export function buildWeeklySummary({
  diaryData,
  fastingNow,
  hydrationBaseGoal,
  proteinGoal,
  weekReferenceDate,
  fastingFreeDays = [],
}) {
  const start = getStartOfWeek(weekReferenceDate);
  const end = getEndOfWeek(weekReferenceDate);
  const foods = diaryData.foods.filter((item) => item.date && isDateInRange(item.date, start, end));
  const hydrationEntries = (diaryData.hydrationEntries || []).filter((item) => item.date && isDateInRange(item.date, start, end));
  const exercises = diaryData.exercises.filter((item) => item.date && isDateInRange(item.date, start, end));
  const supplements = diaryData.supplements.filter((item) => item.date && isDateInRange(item.date, start, end));
  const fastingLogs = diaryData.fastingLogs.filter((item) => doesFastingOverlapWeek(item, start, end, fastingNow));
  const weeklyFastingFreeDays = [...new Set((fastingFreeDays || []).filter((item) => item && isDateInRange(item, start, end)))];
  const bodyMetrics = sortByDateDesc(
    diaryData.bodyMetrics.filter((item) => item.date && isDateInRange(item.date, start, end))
  );
  const weightValues = bodyMetrics.map((item) => Number(item.weight)).filter((value) => !Number.isNaN(value) && value > 0);
  const oldest = bodyMetrics[bodyMetrics.length - 1];
  const newest = bodyMetrics[0];
  const proteinByDate = foods.reduce((result, item) => {
    const safeDate = item.date;
    if (!safeDate) return result;

    result[safeDate] = (result[safeDate] || 0) + Number(item.protein || 0);
    return result;
  }, {});
  const caloriesByDate = foods.reduce((result, item) => {
    const safeDate = item.date;
    if (!safeDate) return result;

    result[safeDate] = (result[safeDate] || 0) + Number(item.calories || 0);
    return result;
  }, {});
  const hydrationByDate = hydrationEntries.reduce((result, item) => {
    const safeDate = item.date;
    if (!safeDate) return result;

    result[safeDate] = (result[safeDate] || 0) + getHydrationMl(item);
    return result;
  }, {});
  const bestProteinEntry = Object.entries(proteinByDate).sort((a, b) => b[1] - a[1])[0];
  const bestCaloriesEntry = Object.entries(caloriesByDate).sort((a, b) => b[1] - a[1])[0];
  const bestHydrationEntry = Object.entries(hydrationByDate).sort((a, b) => b[1] - a[1])[0];
  const fastingDates = [
    ...new Set(
      fastingLogs.flatMap((item) => getFastingDatesInsideRange(item, start, end, fastingNow))
    ),
  ];
  const trackedDates = [
    ...new Set([
      ...uniqueDates(foods),
      ...uniqueDates(hydrationEntries),
      ...uniqueDates(exercises),
      ...uniqueDates(bodyMetrics),
      ...uniqueDates(supplements),
      ...fastingDates,
    ]),
  ];
  const foodDates = Object.keys(proteinByDate);
  const hydrationDates = Object.keys(hydrationByDate);
  const supplementsTaken = supplements.filter((item) => item.taken === 'si').length;
  const supplementsPending = supplements.filter((item) => item.taken !== 'si').length;
  const supplementTotal = supplementsTaken + supplementsPending;
  const exerciseCardioSessions = exercises.filter(
    (item) => item.modality === 'cardio' || item.modality === 'caminata'
  ).length;
  const exerciseStrengthSessions = exercises.filter((item) => item.modality === 'pesas').length;
  const daysMetProteinGoal =
    proteinGoal > 0 ? Object.values(proteinByDate).filter((value) => value >= proteinGoal).length : 0;
  const averageCaloriesTracked = foodDates.length ? sumBy(foods, 'calories') / foodDates.length : 0;
  const averageProteinTracked = foodDates.length ? sumBy(foods, 'protein') / foodDates.length : 0;
  const averageCarbsTracked = foodDates.length ? sumBy(foods, 'carbs') / foodDates.length : 0;
  const averageFatTracked = foodDates.length ? sumBy(foods, 'fat') / foodDates.length : 0;
  const weightChange =
    oldest && newest && oldest.weight && newest.weight ? Number(newest.weight) - Number(oldest.weight) : 0;
  const supplementAdherence = supplementTotal > 0 ? (supplementsTaken / supplementTotal) * 100 : null;
  const weeklyFastingEntries = fastingLogs.map((item) => {
    const recordDate = getFastingRecordDate(item);
    const protocol = findFastingProtocolForDate(diaryData.fastingProtocols || [], recordDate || start);
    const status = isFastingFreeDay(weeklyFastingFreeDays, recordDate)
      ? 'libre'
      : getWeeklyFastingStatus(item, protocol, fastingNow);

    return {
      item,
      recordDate,
      protocol,
      status,
      overlapHours: getFastingHoursInsideRange(item, start, end, fastingNow),
    };
  });
  const fastingCompleted = weeklyFastingEntries.filter((entry) => entry.status === 'cumplido').length;
  const fastingInProgress = weeklyFastingEntries.filter((entry) => entry.status === 'en curso').length;
  const fastingDeviations = weeklyFastingEntries.filter((entry) => entry.status === 'roto').length;
  const fastingFreeDaysCount = weeklyFastingFreeDays.length;
  const fastingHours = weeklyFastingEntries.reduce((total, entry) => total + entry.overlapHours, 0);
  const omadCompleted = weeklyFastingEntries.filter((entry) => {
    const expectedProtocolText = String(entry.item.expectedProtocol || formatProtocolLabel(entry.protocol) || '').toLowerCase();
    return entry.status === 'cumplido' && expectedProtocolText.includes('omad');
  }).length;
  const settledFastingLogs = weeklyFastingEntries.filter((entry) => entry.status === 'cumplido' || entry.status === 'roto').length;
  const fastingAdherence = settledFastingLogs > 0 ? (fastingCompleted / settledFastingLogs) * 100 : null;
  const hydrationTotal = hydrationEntries.reduce((total, item) => total + getHydrationMl(item), 0);
  const hydrationAverage = hydrationDates.length ? hydrationTotal / hydrationDates.length : 0;
  const hydrationDaysMetGoal =
    hydrationBaseGoal > 0 ? Object.values(hydrationByDate).filter((value) => value >= hydrationBaseGoal).length : 0;

  return {
    start,
    end,
    totalCalories: sumBy(foods, 'calories'),
    totalProtein: sumBy(foods, 'protein'),
    totalCarbs: sumBy(foods, 'carbs'),
    totalFat: sumBy(foods, 'fat'),
    hydrationTotal,
    hydrationAverage,
    hydrationDaysMetGoal,
    totalBurned: sumBy(exercises, 'caloriesBurned'),
    totalExerciseMinutes: sumBy(exercises, 'duration'),
    averageWeight: average(weightValues),
    weightChange,
    trackedDays: trackedDates.length,
    foodDays: foodDates.length,
    trainingSessions: exercises.length,
    supplementsTaken,
    supplementsPending,
    supplementAdherence,
    fastingCompleted,
    fastingInProgress,
    fastingDeviations,
    fastingFreeDays: fastingFreeDaysCount,
    fastingHours,
    fastingLogsCount: fastingLogs.length,
    fastingDays: fastingDates.length,
    omadCompleted,
    fastingAdherence,
    exerciseCardioSessions,
    exerciseStrengthSessions,
    averageCaloriesTracked,
    averageProteinTracked,
    averageCarbsTracked,
    averageFatTracked,
    daysMetProteinGoal,
    bestProteinDay: bestProteinEntry
      ? { date: bestProteinEntry[0], total: bestProteinEntry[1] }
      : null,
    bestCaloriesDay: bestCaloriesEntry
      ? { date: bestCaloriesEntry[0], total: bestCaloriesEntry[1] }
      : null,
    bestHydrationDay: bestHydrationEntry
      ? { date: bestHydrationEntry[0], total: bestHydrationEntry[1] }
      : null,
    latestWeight: newest?.weight || '--',
    metricsStart: {
      weight: oldest?.weight || null,
      bodyFat: oldest?.bodyFat || null,
      waist: oldest?.waist || null,
    },
    metricsEnd: {
      weight: newest?.weight || null,
      bodyFat: newest?.bodyFat || null,
      waist: newest?.waist || null,
    },
  };
}
