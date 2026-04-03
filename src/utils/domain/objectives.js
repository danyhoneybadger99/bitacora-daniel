import { getToday } from '../date';
import { getNumericMetric } from './shared';

export function createEmptyObjective() {
  return {
    title: '',
    goalType: 'personalizada',
    startDate: getToday(),
    deadlineDate: '',
    startWeight: '',
    currentWeight: '',
    targetWeight: '',
    estimatedProgress: '',
    status: 'activa',
    notes: '',
    averageCaloriesTarget: '',
    averageUpperLimit: '',
    minimumUsual: '',
    proteinMinimum: '',
    hydrationBase: '',
    hydrationHighActivity: '',
    strategicReminders: '',
  };
}

export const objectiveTypeLabels = {
  corte: 'Corte',
  mantenimiento: 'Mantenimiento',
  volumen: 'Volumen',
  recomposicion: 'Recomposicion',
  personalizada: 'Personalizada',
};

export const objectiveStatusLabels = {
  activa: 'Activa',
  pausada: 'Pausada',
  cumplida: 'Cumplida',
  cancelada: 'Cancelada',
};

export function calculateObjectiveProgress(startWeight, currentWeight, targetWeight) {
  const start = getNumericMetric(startWeight);
  const current = getNumericMetric(currentWeight);
  const target = getNumericMetric(targetWeight);

  if (start === null || current === null || target === null || start === target) return null;

  const totalDistance = Math.abs(target - start);
  if (totalDistance === 0) return null;

  const coveredDistance = Math.abs(current - start);
  return Math.max(0, Math.min((coveredDistance / totalDistance) * 100, 100));
}

export function getWeightMessage(currentWeight, goalWeight) {
  if (!currentWeight || !goalWeight) return 'Agrega una meta y un peso actual para comparar.';

  const difference = Number(currentWeight) - Number(goalWeight);

  if (difference === 0) return 'Estas exactamente en tu peso objetivo.';
  if (difference > 0) return `Estas ${difference.toFixed(1)} kg por arriba de tu meta.`;
  return `Estas ${Math.abs(difference).toFixed(1)} kg por debajo de tu meta.`;
}
