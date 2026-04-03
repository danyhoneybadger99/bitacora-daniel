import { getToday } from '../date';
import { getNumericMetric } from './shared';

export function createEmptyMetric() {
  return {
    date: getToday(),
    weight: '',
    waist: '',
    chest: '',
    arm: '',
    leg: '',
    hips: '',
    neck: '',
    bodyFat: '',
    height: '',
    skeletalMuscleMass: '',
    bodyFatMass: '',
    fatFreeMass: '',
    totalBodyWater: '',
    proteinsMass: '',
    mineralsMass: '',
    bmi: '',
    basalMetabolicRate: '',
    waistHipRatio: '',
    visceralFatLevel: '',
    recommendedCalorieIntake: '',
    dataSource: 'manual',
    observations: '',
  };
}

export function formatMetricValue(value, unit = '') {
  if (value === '--' || value === '' || value === null || value === undefined) return '--';
  return `${value}${unit}`;
}

export function formatMetricText(value, unit = '') {
  if (value === '--' || value === '' || value === null || value === undefined) return 'sin dato';
  return `${value}${unit}`;
}

export function getMetricDeltaLabel(currentValue, previousValue, unit = '') {
  const current = getNumericMetric(currentValue);
  const previous = getNumericMetric(previousValue);

  if (current === null || previous === null) return 'sin referencia';

  const delta = current - previous;
  const formattedUnit = unit ? ` ${unit}` : '';

  if (delta === 0) return `Sin cambio${formattedUnit}`.trim();
  if (delta > 0) return `+${delta.toFixed(1)}${formattedUnit}`.trim();
  return `${delta.toFixed(1)}${formattedUnit}`.trim();
}

export function getMetricTrend(currentValue, previousValue) {
  const current = getNumericMetric(currentValue);
  const previous = getNumericMetric(previousValue);

  if (current === null || previous === null) return 'sin referencia';
  if (current > previous) return 'subio';
  if (current < previous) return 'bajo';
  return 'sin cambio';
}

export function getLatestMetricFieldSnapshot(items, field) {
  for (const item of items) {
    const value = getNumericMetric(item?.[field]);
    if (value !== null) {
      return {
        value,
        rawValue: item[field],
        date: item.date || null,
        dataSource: item.dataSource || 'manual',
      };
    }
  }

  return {
    value: null,
    rawValue: null,
    date: null,
    dataSource: null,
  };
}

export function getMetricComparisonPair(items, field) {
  const comparableItems = [];

  for (const item of items) {
    const value = getNumericMetric(item?.[field]);
    if (value !== null) {
      comparableItems.push({
        value,
        rawValue: item[field],
        date: item.date || null,
      });
    }

    if (comparableItems.length === 2) break;
  }

  return {
    current: comparableItems[0] || null,
    previous: comparableItems[1] || null,
  };
}
