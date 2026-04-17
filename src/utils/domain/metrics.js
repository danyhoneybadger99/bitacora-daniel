import { getToday } from '../date';
import { formatUnitValue, getNumericMetric } from './shared';

const baseMetricSeedId = 'metric-base-2026-04-10';
const baseMetricSeedDate = '2026-04-10';
const baseMetricSeedMatchFields = [
  'weight',
  'skeletalMuscleMass',
  'bodyFatMass',
  'bodyFat',
  'bmi',
  'totalBodyWater',
  'fatFreeMass',
  'basalMetabolicRate',
  'waistHipRatio',
  'visceralFatLevel',
  'waist',
  'chest',
  'arm',
  'leg',
  'calf',
  'forearm',
  'upperBackTorso',
  'hips',
  'neck',
];

export function createEmptyMetric() {
  return {
    date: getToday(),
    weight: '',
    waist: '',
    chest: '',
    arm: '',
    leg: '',
    calf: '',
    forearm: '',
    upperBackTorso: '',
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

export function createInitialMetricSeed() {
  return {
    ...createEmptyMetric(),
    id: baseMetricSeedId,
    date: baseMetricSeedDate,
    weight: '75.5',
    waist: '83',
    chest: '101.5',
    arm: '34',
    leg: '53',
    calf: '36.5',
    forearm: '29',
    upperBackTorso: '122',
    hips: '92',
    neck: '39',
    bodyFat: '13.0',
    skeletalMuscleMass: '37.9',
    bodyFatMass: '9.8',
    fatFreeMass: '65.7',
    totalBodyWater: '48.2',
    bmi: '27.1',
    basalMetabolicRate: '1788',
    waistHipRatio: '0.85',
    visceralFatLevel: '3',
    dataSource: 'inbody',
    observations: 'Registro base de InBody y medidas corporales para comenzar comparaciones reales.',
  };
}

function matchesBaseMetricSeed(item, seed) {
  if (!item || typeof item !== 'object') return false;
  if (item.id === seed.id) return true;
  if (item.date !== seed.date) return false;

  return baseMetricSeedMatchFields.every((field) => String(item[field] ?? '') === String(seed[field] ?? ''));
}

export function mergeInitialMetricSeed(items = []) {
  const normalizedItems = Array.isArray(items) ? items : [];
  const seed = createInitialMetricSeed();
  const existingIndex = normalizedItems.findIndex((item) => matchesBaseMetricSeed(item, seed));

  if (existingIndex === -1) {
    return [seed, ...normalizedItems];
  }

  return normalizedItems.map((item, index) =>
    index === existingIndex
      ? {
          ...item,
          ...Object.fromEntries(
            Object.entries(seed).map(([key, value]) => [key, item[key] === '' || item[key] === null || item[key] === undefined ? value : item[key]])
          ),
        }
      : item
  );
}

export function formatMetricValue(value, unit = '') {
  if (value === '--' || value === '' || value === null || value === undefined) return '--';
  return formatUnitValue(value, unit, { maximumFractionDigits: 1, fallback: '--' });
}

export function formatMetricText(value, unit = '') {
  if (value === '--' || value === '' || value === null || value === undefined) return 'sin dato';
  return formatUnitValue(value, unit, { maximumFractionDigits: 1, fallback: 'sin dato' });
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
