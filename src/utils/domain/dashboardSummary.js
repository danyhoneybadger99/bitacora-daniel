import { getHydrationMl } from './records';
import { sumBy } from './shared';

export function buildTodaySummary({
  todaysFoods,
  todaysHydrationEntries,
  todaysSupplements,
  todaysExercises,
  todaysMetrics,
  todaysFastingLogs,
  metricFieldSnapshots,
  activeFastingStatus,
  activeFastingProtocol,
}) {
  const supplementsTakenToday = todaysSupplements.filter((item) => item.taken === 'si').length;
  const supplementsPendingToday = todaysSupplements.filter((item) => item.taken !== 'si').length;
  const medicationsToday = todaysSupplements.filter((item) => item.category === 'medicamento').length;

  return {
    calories: sumBy(todaysFoods, 'calories'),
    protein: sumBy(todaysFoods, 'protein'),
    carbs: sumBy(todaysFoods, 'carbs'),
    fat: sumBy(todaysFoods, 'fat'),
    hydrationMl: todaysHydrationEntries.reduce((total, item) => total + getHydrationMl(item), 0),
    exerciseCalories: sumBy(todaysExercises, 'caloriesBurned'),
    exerciseMinutes: sumBy(todaysExercises, 'duration'),
    weight: metricFieldSnapshots.weight.rawValue ?? '--',
    bodyFat: metricFieldSnapshots.bodyFat.rawValue ?? '--',
    skeletalMuscleMass: metricFieldSnapshots.skeletalMuscleMass.rawValue ?? '--',
    foodEntries: todaysFoods.length,
    hydrationEntries: todaysHydrationEntries.length,
    supplementEntries: todaysSupplements.length,
    supplementsTakenToday,
    supplementsPendingToday,
    medicationsToday,
    exerciseEntries: todaysExercises.length,
    metricEntries: todaysMetrics.length,
    fastingEntries: todaysFastingLogs.length,
    fastingStatus: activeFastingStatus,
    todaysFastingProtocol: activeFastingProtocol,
  };
}
