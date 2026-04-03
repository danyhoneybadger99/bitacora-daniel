import { getToday } from '../date';

export function createEmptyFood() {
  return {
    date: getToday(),
    time: '',
    mealType: 'comida',
    name: '',
    quantity: '',
    unit: '',
    category: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    notes: '',
  };
}

export function createEmptyHydration() {
  return {
    date: getToday(),
    time: '',
    drinkType: 'agua',
    name: '',
    quantity: '',
    unit: 'ml',
    containsCaffeine: 'no',
    containsElectrolytes: 'no',
    notes: '',
  };
}

export function createEmptyFoodTemplate() {
  return {
    mealType: 'comida',
    name: '',
    quantity: '',
    unit: '',
    category: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    notes: '',
  };
}

export function createEmptySupplement() {
  return {
    date: getToday(),
    time: '',
    name: '',
    category: 'suplemento',
    dose: '',
    unit: '',
    stockRemaining: '',
    daytime: 'manana',
    foodRelation: 'no-aplica',
    frequency: 'diario',
    taken: 'si',
    notes: '',
  };
}

export const emptyRoutineItem = {
  name: '',
  category: 'suplemento',
  dose: '',
  unit: '',
  daytime: 'manana',
  foodRelation: 'no-aplica',
  frequency: 'diario',
  notes: '',
};

export function createEmptyExercise() {
  return {
    date: getToday(),
    time: '',
    name: '',
    modality: 'cardio',
    duration: '',
    caloriesBurned: '',
    distance: '',
    distanceUnit: 'no-aplica',
    intensity: 'media',
    completed: 'si',
    notes: '',
  };
}

export const mealTypeLabels = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
  snack: 'Snack',
};

export const mealTypeOrder = {
  desayuno: 1,
  comida: 2,
  cena: 3,
  snack: 4,
};

export const drinkTypeLabels = {
  agua: 'Agua',
  cafe: 'Cafe',
  te: 'Te',
  'agua-mineral': 'Agua mineral',
  electrolitos: 'Electrolitos',
  'bebida-cero': 'Bebida cero',
  otra: 'Otra',
};

export const supplementCategoryLabels = {
  suplemento: 'Suplemento',
  medicamento: 'Medicamento',
  'pre-entreno': 'Pre entreno',
  'post-entreno': 'Post entreno',
  vitamina: 'Vitamina',
  mineral: 'Mineral',
  hormonal: 'Hormonal',
  otro: 'Otro',
};

export const daytimeLabels = {
  manana: 'Manana',
  mediodia: 'Mediodia',
  tarde: 'Tarde',
  noche: 'Noche',
};

export const foodRelationLabels = {
  ayuno: 'En ayuno',
  'antes-comer': 'Antes de comer',
  'con-comida': 'Con comida',
  'despues-comer': 'Despues de comer',
  'no-aplica': 'No aplica',
};

export const frequencyLabels = {
  diario: 'Diario',
  'algunos-dias': 'Algunos dias',
  ocasional: 'Ocasional',
};

export const supplementFilterOptions = [
  { value: 'todos', label: 'Todos' },
  { value: 'suplemento', label: 'Suplemento' },
  { value: 'medicamento', label: 'Medicamento' },
  { value: 'pre-entreno', label: 'Pre entreno' },
  { value: 'post-entreno', label: 'Post entreno' },
  { value: 'vitamina', label: 'Vitamina' },
  { value: 'mineral', label: 'Mineral' },
  { value: 'hormonal', label: 'Hormonal' },
  { value: 'otro', label: 'Otro' },
];

export const exerciseModalityLabels = {
  cardio: 'Cardio',
  pesas: 'Pesas',
  caminata: 'Caminata',
  'krav-maga': 'Krav Maga',
  movilidad: 'Movilidad',
  recuperacion: 'Recuperacion',
  otro: 'Otro',
};

export const exerciseIntensityLabels = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
};

export const exerciseFilterOptions = [
  { value: 'todos', label: 'Todos' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'pesas', label: 'Pesas' },
  { value: 'caminata', label: 'Caminata' },
  { value: 'krav-maga', label: 'Krav Maga' },
  { value: 'movilidad', label: 'Movilidad' },
  { value: 'recuperacion', label: 'Recuperacion' },
  { value: 'otro', label: 'Otro' },
];

export function sortFoods(items) {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);

    const mealDiff = (mealTypeOrder[a.mealType] || 99) - (mealTypeOrder[b.mealType] || 99);
    if (mealDiff !== 0) return mealDiff;

    const timeA = a.time || '99:99';
    const timeB = b.time || '99:99';
    if (timeA !== timeB) return timeA.localeCompare(timeB);

    return String(b.id).localeCompare(String(a.id));
  });
}

export function sortHydrationEntries(items) {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);

    const timeA = a.time || '99:99';
    const timeB = b.time || '99:99';
    if (timeA !== timeB) return timeA.localeCompare(timeB);

    return String(b.id).localeCompare(String(a.id));
  });
}

export function getHydrationMl(entry) {
  const quantity = Number(entry?.quantity || 0);
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  if (entry?.unit === 'l') return quantity * 1000;
  return quantity;
}

export function sortSupplements(items) {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);

    const timeA = a.time || '99:99';
    const timeB = b.time || '99:99';
    if (timeA !== timeB) return timeA.localeCompare(timeB);

    return String(b.id).localeCompare(String(a.id));
  });
}

export function sortExercises(items) {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);

    const timeA = a.time || '99:99';
    const timeB = b.time || '99:99';
    if (timeA !== timeB) return timeA.localeCompare(timeB);

    return String(b.id).localeCompare(String(a.id));
  });
}
