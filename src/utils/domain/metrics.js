import { getToday } from '../date';
import { formatUnitValue, getNumericMetric } from './shared';

const baseMetricSeedId = 'metric-base-2026-04-10';
const baseMetricSeedDate = '2026-04-10';
const inBodyMay2026MetricSeedId = 'metric-inbody-2026-05-08';
const inBodyMay2026MetricSeedDate = '2026-05-08';
const recentManualMetricSeedId = 'metric-manual-2026-04-17';
const recentManualMetricSeedDate = '2026-04-17';
const recentManualMetricLegacySeedId = 'metric-manual-2026-04-22';
const recentManualMetricLegacySeedDate = '2026-04-22';
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
const recentManualMetricSeedMatchFields = [
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
const inBodyMay2026MetricSeedMatchFields = [];
const metricFieldAliases = {
  weight: ['weightKg'],
  bodyFat: ['bodyFatPercentage', 'percentBodyFat'],
  skeletalMuscleMass: ['skeletalMuscleMassKg'],
  bodyFatMass: ['bodyFatMassKg'],
  fatFreeMass: ['fatFreeMassKg'],
};

function getMetricFieldRawValue(item, field) {
  if (!item || typeof item !== 'object') return undefined;

  if (getNumericMetric(item[field]) !== null) return item[field];

  const aliases = metricFieldAliases[field] || [];
  for (const alias of aliases) {
    if (getNumericMetric(item[alias]) !== null) return item[alias];
  }

  return item[field];
}

export function createEmptyMetric() {
  return {
    date: getToday(),
    time: '',
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
    age: '',
    sex: '',
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
    smi: '',
    recommendedCalorieIntake: '',
    sourceLabel: '',
    idealWeight: '',
    weightControl: '',
    fatControl: '',
    muscleControl: '',
    targetBodyFat: '',
    estimatedWeightAtTargetBodyFat: '',
    estimatedFatToLoseForTarget: '',
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

export function createRecentManualMetricSeed() {
  return {
    ...createEmptyMetric(),
    id: recentManualMetricSeedId,
    date: recentManualMetricSeedDate,
    waist: '79',
    chest: '101',
    arm: '35',
    leg: '55',
    calf: '35',
    forearm: '29',
    upperBackTorso: '121',
    hips: '91',
    neck: '39',
    dataSource: 'manual',
    observations: 'Registro manual reciente de medidas corporales para comparar contra InBody base.',
  };
}

export function createMay2026InBodyMetricSeed() {
  return {
    ...createEmptyMetric(),
    id: inBodyMay2026MetricSeedId,
    date: inBodyMay2026MetricSeedDate,
    time: '09:37',
    sourceLabel: 'InBody 270 - Sport City',
    height: '167',
    age: '37',
    sex: 'Masculino',
    weight: '73.6',
    totalBodyWater: '47.9',
    proteinsMass: '13.1',
    mineralsMass: '4.19',
    bodyFatMass: '8.4',
    skeletalMuscleMass: '37.6',
    bodyFat: '11.4',
    bmi: '26.4',
    fatFreeMass: '65.2',
    basalMetabolicRate: '1779',
    waistHipRatio: '0.83',
    visceralFatLevel: '2',
    smi: '9.6',
    recommendedCalorieIntake: '2609',
    idealWeight: '73.6',
    weightControl: '0.0',
    fatControl: '0.0',
    muscleControl: '0.0',
    targetBodyFat: '10',
    estimatedWeightAtTargetBodyFat: '72.4',
    estimatedFatToLoseForTarget: '1.2',
    dataSource: 'inbody',
    observations:
      'InBody 270 - Sport City. Cambio vs 10 abr 2026: peso -1.9 kg, PGC -1.6 puntos, MME -0.3 kg. Objetivo 10%: peso estimado 72.4 kg y grasa por perder aprox. 1.2 kg.',
  };
}

function normalizeRecentManualMetricSeed(items = []) {
  const seed = createRecentManualMetricSeed();
  const remainingItems = [];
  let foundLegacySeed = false;

  items.forEach((item) => {
    const matchesLegacyId =
      item?.id === recentManualMetricSeedId ||
      item?.id === recentManualMetricLegacySeedId;
    const matchesLegacyDate =
      item?.date === recentManualMetricSeedDate ||
      item?.date === recentManualMetricLegacySeedDate;

    if (matchesLegacyId || matchesLegacyDate) {
      foundLegacySeed = true;
      return;
    }

    remainingItems.push(item);
  });

  return foundLegacySeed ? [seed, ...remainingItems] : remainingItems;
}

function matchesMetricSeed(item, seed, fields) {
  if (!item || typeof item !== 'object') return false;
  if (item.id === seed.id) return true;
  if (item.date !== seed.date) return false;

  return fields.every((field) => String(item[field] ?? '') === String(seed[field] ?? ''));
}

function mergeMetricSeed(items, seed, fields) {
  const existingIndex = items.findIndex((item) => matchesMetricSeed(item, seed, fields));

  if (existingIndex === -1) {
    return [seed, ...items];
  }

  return items.map((item, index) =>
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

export function mergeInitialMetricSeed(items = []) {
  const normalizedItems = normalizeRecentManualMetricSeed(Array.isArray(items) ? items : []);
  const withBase = mergeMetricSeed(normalizedItems, createInitialMetricSeed(), baseMetricSeedMatchFields);
  const withRecentManual = mergeMetricSeed(withBase, createRecentManualMetricSeed(), recentManualMetricSeedMatchFields);
  return mergeMetricSeed(withRecentManual, createMay2026InBodyMetricSeed(), inBodyMay2026MetricSeedMatchFields);
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
    const rawValue = getMetricFieldRawValue(item, field);
    const value = getNumericMetric(rawValue);
    if (value !== null) {
      return {
        value,
        rawValue,
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
    const rawValue = getMetricFieldRawValue(item, field);
    const value = getNumericMetric(rawValue);
    if (value !== null) {
      comparableItems.push({
        value,
        rawValue,
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
