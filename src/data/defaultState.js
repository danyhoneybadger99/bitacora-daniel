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

export const defaultState = {
  foods: [],
  foodTemplates: [],
  hydrationEntries: [],
  supplements: [],
  routines: [],
  exercises: [],
  bodyMetrics: [],
  fastingProtocols: defaultFastingProtocols,
  fastingLogs: [],
  objectives: [createDefaultObjective()],
  goals: {
    calories: '2200',
    protein: '160',
    weight: '75',
    hydrationBase: '3200',
    hydrationHighActivity: '4000',
  },
  backupMeta: {
    lastExportAt: '',
    lastImportAt: '',
  },
};
