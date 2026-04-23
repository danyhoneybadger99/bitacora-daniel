import { getToday } from '../date';

export const privateCategoryLabels = {
  trt: 'TRT',
  testosterona: 'Testosterona',
  cipionate: 'Cipionate',
  't-sustanon': 'T sustanón',
  'hormona-diaria': 'Hormona diaria',
  oxandrolone: 'Oxandrolona',
  oxandrolona: 'Oxandrolona',
  tamoxifeno: 'Tamoxifeno',
  clomifeno: 'Clomifeno',
  masteron: 'Masteron',
  primo: 'Primo',
  primobolan: 'Primobolan',
  trembolona: 'Trembolona',
  wistrol: 'Winstrol',
  winstrol: 'Winstrol',
  clembuterol: 'Clembuterol',
  hcg: 'HCG',
  ia: 'IA',
  peptidos: 'Peptidos',
  suplemento: 'Suplemento',
  'peptidos-ozempic': 'Peptidos / Ozempic',
  'liver-cleanse': 'Liver cleanse',
  'otro-compuesto': 'Otro compuesto',
  aplicacion: 'Aplicacion',
  oral: 'Oral',
  soporte: 'Soporte',
  control: 'Control',
  pct: 'PCT',
  envio: 'Envío',
  laboratorio: 'Laboratorio',
  'nota-clinica': 'Nota clinica',
};

export const privateCycleTypeLabels = {
  corte: 'Corte',
  mantenimiento: 'Mantenimiento',
  volumen: 'Volumen',
  recomposicion: 'Recomposicion',
  terapetico: 'Terapeutico',
  personalizado: 'Personalizado',
};

export const privateCycleStatusLabels = {
  planeado: 'Planeado',
  activo: 'Activo',
  pausado: 'Pausado',
  cerrado: 'Finalizado',
};

export const privateProductStatusLabels = {
  pendiente: 'Pendiente',
  comprado: 'Comprado',
  'en-uso': 'En uso',
  terminado: 'Terminado',
  descartado: 'Descartado',
};

export const privatePaymentStatusLabels = {
  pagado: 'Pagado',
  pendiente: 'Pendiente',
};

export const privateEventTypeLabels = {
  aplicacion: 'Aplicacion',
  toma: 'Toma',
  'toma-oral': 'Toma oral',
  compra: 'Compra',
  pago: 'Pago',
  analitica: 'Analitica',
  sintoma: 'Sintoma',
  control: 'Control',
  observacion: 'Observacion',
  otro: 'Otro',
};

export const privateDailyRetentionLabels = {
  ninguna: 'Ninguna',
  leve: 'Leve',
  moderada: 'Moderada',
  alta: 'Alta',
};

export const privateMedicationTypeLabels = {
  protector: 'Protector',
  oral: 'Oral',
};

export const privateMedicationScheduleLabels = {
  single: '1 al día',
  split: '2 al día',
};

export const privateMedicationSlotLabels = {
  single: 'Tomar',
  manana: 'Mañana',
  tarde: 'Tarde',
};

export const privateDailyScaleOptions = [
  { value: '', label: 'Sin registrar' },
  { value: '1', label: '1 · Muy bajo' },
  { value: '2', label: '2 · Bajo' },
  { value: '3', label: '3 · Medio' },
  { value: '4', label: '4 · Bueno' },
  { value: '5', label: '5 · Muy bueno' },
];

export const PRIVATE_CYCLE_2026_SEED_VERSION = 6;
const PRIVATE_CYCLE_2026_MEDICATION_CORRECTION_DATE = '2026-04-16';

export function createEmptyPrivateCycle() {
  return {
    name: '',
    type: 'personalizado',
    startDate: getToday(),
    estimatedEndDate: '',
    status: 'planeado',
    objective: '',
    notes: '',
  };
}

export function createEmptyPrivateProduct() {
  return {
    cycleId: '',
    name: '',
    category: 'otro-compuesto',
    presentation: '',
    purchasedQuantity: '',
    unit: '',
    totalCost: '',
    supplier: '',
    purchaseDate: getToday(),
    status: 'pendiente',
    notes: '',
  };
}

export function createEmptyPrivatePayment() {
  return {
    cycleId: '',
    concept: '',
    date: getToday(),
    amount: '',
    method: '',
    status: 'pagado',
    notes: '',
  };
}

export function createEmptyPrivateEntry() {
  return {
    date: getToday(),
    time: '',
    cycleId: '',
    productId: '',
    eventType: 'aplicacion',
    name: '',
    category: 'otro-compuesto',
    dose: '',
    unit: '',
    route: '',
    frequency: '',
    nextApplication: '',
    notes: '',
  };
}

export function createEmptyPrivateDailyCheck() {
  return {
    date: getToday(),
    cycleId: '',
    energy: '',
    mood: '',
    libido: '',
    sleep: '',
    focus: '',
    appetite: '',
    retention: 'ninguna',
    sideEffects: '',
    notes: '',
  };
}

export function createEmptyPrivateMedication() {
  return {
    cycleId: '',
    name: '',
    alias: '',
    medicationType: 'protector',
    initialInventory: '',
    remainingInventory: '',
    unit: 'tableta',
    expectedDailyDose: '1',
    scheduleMode: 'single',
    intakeHistory: [],
    lastTakenAt: '',
    notes: '',
  };
}

export function getPrivatePinLength(privateVault) {
  return privateVault?.pinMode === 'numeric-6' ? 6 : 4;
}

export function isValidPrivatePin(pin, privateVault) {
  const requiredLength = getPrivatePinLength(privateVault);
  const numericRegex = new RegExp(`^\\d{${requiredLength}}$`);
  return numericRegex.test(String(pin || ''));
}

export function getPrivateActiveCycle(privateCycles = []) {
  return (privateCycles || []).find((item) => item.status === 'activo') || null;
}

function toSafeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getEntryTimestamp(entry) {
  if (entry?.nextApplication) return entry.nextApplication;
  if (entry?.date && entry?.time) return `${entry.date}T${entry.time}`;
  if (entry?.date) return `${entry.date}T00:00`;
  return '';
}

function sortByTimestampDesc(items = []) {
  return [...items].sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
}

function normalizePrivateSeedKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function mergePrivateNotes(existingNotes, fallbackNotes) {
  if (!existingNotes) return fallbackNotes || '';
  if (!fallbackNotes) return existingNotes;
  return normalizePrivateSeedKey(existingNotes).includes(normalizePrivateSeedKey(fallbackNotes))
    ? existingNotes
    : `${existingNotes}\n${fallbackNotes}`.trim();
}

function isBlankValue(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function matchPrivatePaymentSeed(current, seedPayment) {
  return (
    (current.date || '') === (seedPayment.date || '') &&
    String(current.amount || '') === String(seedPayment.amount || '')
  );
}

function canReusePrivateCycleRecord(currentCycleId, resolvedCycleId, seedId) {
  return !currentCycleId || currentCycleId === resolvedCycleId || normalizePrivateSeedKey(currentCycleId) === normalizePrivateSeedKey(seedId);
}

function matchPrivateEntrySeed(current, seedEntry) {
  return (
    normalizePrivateSeedKey(current.name) === normalizePrivateSeedKey(seedEntry.name) &&
    (current.date || '') === (seedEntry.date || '') &&
    String(current.time || '') === String(seedEntry.time || '')
  );
}

function matchPrivateDailyCheckSeed(current, seedCheck) {
  return (
    (current.date || '') === (seedCheck.date || '') &&
    normalizePrivateSeedKey(current.notes || '') === normalizePrivateSeedKey(seedCheck.notes || '')
  );
}

function isDateInsideRange(date, startDate, endDate) {
  return Boolean(date && startDate && endDate && date >= startDate && date <= endDate);
}

function toPrivateScaleNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function averagePrivateScale(items, fieldName) {
  const values = items.map((item) => toPrivateScaleNumber(item[fieldName])).filter((value) => value !== null);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getPrivateEntryEffectiveTimestamp(entry) {
  if (entry?.nextApplication) return entry.nextApplication;
  if (entry?.date && entry?.time) return `${entry.date}T${entry.time}`;
  if (entry?.date) return `${entry.date}T00:00`;
  return '';
}

export function getPrivateCanonicalCategory(value) {
  const normalized = normalizePrivateSeedKey(value);

  const aliases = {
    oxandrolone: 'oxandrolona',
    oxandrolona: 'oxandrolona',
    tamoxifeno: 'tamoxifeno',
    clomifeno: 'clomifeno',
    't-sustanon': 't-sustanon',
    't sustanon': 't-sustanon',
    't sustanon ': 't-sustanon',
    sustanon: 't-sustanon',
    'hormona-diaria': 'hormona-diaria',
    'hormona diaria': 'hormona-diaria',
    primobolan: 'primobolan',
    envio: 'envio',
    'cobro de envio': 'envio',
    wistrol: 'winstrol',
    winstrol: 'winstrol',
    'peptidos-ozempic': 'peptidos',
    peptidos: 'peptidos',
    suplemento: 'suplemento',
    testosterona: 'testosterona',
    cipionate: 'cipionate',
    masteron: 'masteron',
    primo: 'primo',
    trembolona: 'trembolona',
    clembuterol: 'clembuterol',
    hcg: 'hcg',
    ia: 'ia',
    'otro-compuesto': 'otro-compuesto',
  };

  return aliases[normalized] || normalized || '';
}

export function getPrivateCanonicalEventType(value) {
  const normalized = normalizePrivateSeedKey(value);

  const aliases = {
    aplicacion: 'aplicacion',
    toma: 'toma-oral',
    'toma-oral': 'toma-oral',
    analitica: 'analitica',
    sintoma: 'sintoma',
    control: 'control',
    compra: 'compra',
    pago: 'pago',
    observacion: 'observacion',
    otro: 'observacion',
  };

  return aliases[normalized] || normalized || '';
}

export function getPrivateMedicationExpectedSlots(item) {
  if ((item?.scheduleMode || '') === 'split' || Number(item?.expectedDailyDose || 0) >= 2) {
    return ['manana', 'tarde'];
  }

  return ['single'];
}

export function getPrivateMedicationDailyLog(item, date = getToday()) {
  return (item?.intakeHistory || []).find((entry) => entry?.date === date) || null;
}

export function getPrivateMedicationDailyStatus(item, date = getToday()) {
  const expectedSlots = getPrivateMedicationExpectedSlots(item);
  const todayLog = getPrivateMedicationDailyLog(item, date);
  const takenSlots = Array.isArray(todayLog?.takenSlots)
    ? expectedSlots.filter((slot) => todayLog.takenSlots.includes(slot))
    : [];
  const remainingInventory = toSafeNumber(item?.remainingInventory);

  return {
    expectedSlots,
    takenSlots,
    takenCount: takenSlots.length,
    expectedCount: expectedSlots.length,
    isComplete: takenSlots.length >= expectedSlots.length,
    hasTakenToday: takenSlots.length > 0,
    remainingInventory,
    isLowInventory: remainingInventory > 0 && remainingInventory <= 10,
    isOutOfStock: remainingInventory <= 0,
  };
}

export function applyPrivateMedicationDose(item, slot = 'single', date = getToday(), timestamp = new Date().toISOString()) {
  const status = getPrivateMedicationDailyStatus(item, date);
  if (status.isOutOfStock) return item;

  const normalizedSlot = status.expectedSlots.includes(slot) ? slot : status.expectedSlots[0];
  if (!normalizedSlot || status.takenSlots.includes(normalizedSlot)) return item;

  const nextTakenSlots = [...status.takenSlots, normalizedSlot].sort(
    (a, b) => status.expectedSlots.indexOf(a) - status.expectedSlots.indexOf(b)
  );
  const nextHistory = Array.isArray(item?.intakeHistory) ? [...item.intakeHistory] : [];
  const currentIndex = nextHistory.findIndex((entry) => entry?.date === date);
  const nextLog = {
    date,
    takenSlots: nextTakenSlots,
    updatedAt: timestamp,
  };

  if (currentIndex >= 0) {
    nextHistory[currentIndex] = {
      ...nextHistory[currentIndex],
      ...nextLog,
    };
  } else {
    nextHistory.unshift(nextLog);
  }

  return {
    ...item,
    intakeHistory: nextHistory,
    remainingInventory: String(Math.max(status.remainingInventory - 1, 0)),
    lastTakenAt: timestamp,
  };
}

export function removePrivateMedicationDose(item, slot = 'single', date = getToday(), timestamp = new Date().toISOString()) {
  const status = getPrivateMedicationDailyStatus(item, date);
  const normalizedSlot = status.expectedSlots.includes(slot) ? slot : status.expectedSlots[0];
  if (!normalizedSlot || !status.takenSlots.includes(normalizedSlot)) return item;

  const nextTakenSlots = status.takenSlots.filter((entry) => entry !== normalizedSlot);
  const nextHistory = Array.isArray(item?.intakeHistory) ? [...item.intakeHistory] : [];
  const currentIndex = nextHistory.findIndex((entry) => entry?.date === date);

  if (currentIndex >= 0) {
    if (nextTakenSlots.length === 0) {
      nextHistory.splice(currentIndex, 1);
    } else {
      nextHistory[currentIndex] = {
        ...nextHistory[currentIndex],
        date,
        takenSlots: nextTakenSlots,
        updatedAt: timestamp,
      };
    }
  }

  const currentRemaining = toSafeNumber(item?.remainingInventory);
  const initialInventory = toSafeNumber(item?.initialInventory);
  const maxInventory = initialInventory > 0 ? initialInventory : currentRemaining + 1;

  return {
    ...item,
    intakeHistory: nextHistory,
    remainingInventory: String(Math.min(currentRemaining + 1, maxInventory)),
    lastTakenAt: nextHistory.length > 0 ? item?.lastTakenAt || timestamp : '',
  };
}

export function createPrivateCycle2026SeedData(cycleId = 'private-cycle-2026') {
  return {
    privateSeedVersion: PRIVATE_CYCLE_2026_SEED_VERSION,
    privateCycles: [
      {
        id: cycleId,
        name: 'Ciclo 2026',
        type: 'personalizado',
        startDate: '2026-01-23',
        estimatedEndDate: '2026-06-23',
        status: 'activo',
        objective: 'Definir musculo',
        notes:
          'Ciclo iniciado el 23 de enero de 2026. Seguimiento privado de compuestos, aplicaciones, pagos y observaciones.',
      },
    ],
    privateProducts: [
      {
        id: 'private-product-primo-2026',
        cycleId,
        name: 'Primo',
        category: 'primo',
        presentation: '',
        purchasedQuantity: '15',
        unit: 'ampolletas',
        totalCost: '5250',
        supplier: '',
        purchaseDate: '',
        status: 'comprado',
        notes: 'Compra inicial del ciclo',
      },
      {
        id: 'private-product-cipionate-2026',
        cycleId,
        name: 'Cipionate',
        category: 'cipionate',
        presentation: '',
        purchasedQuantity: '2',
        unit: 'unidades',
        totalCost: '3900',
        supplier: '',
        purchaseDate: '',
        status: 'comprado',
        notes: 'Compra inicial del ciclo',
      },
      {
        id: 'private-product-oxandrolone-2026',
        cycleId,
        name: 'Oxandrolone',
        category: 'oxandrolone',
        presentation: '',
        purchasedQuantity: '2',
        unit: 'unidades',
        totalCost: '4200',
        supplier: '',
        purchaseDate: '',
        status: 'comprado',
        notes: 'Compra inicial del ciclo',
      },
      {
        id: 'private-product-masteron-2026',
        cycleId,
        name: 'Masteron',
        category: 'masteron',
        presentation: '',
        purchasedQuantity: '2',
        unit: 'unidades',
        totalCost: '2800',
        supplier: '',
        purchaseDate: '',
        status: 'comprado',
        notes: 'Compra inicial del ciclo',
      },
      {
        id: 'private-product-trembolona-2026',
        cycleId,
        name: 'Trembolona',
        category: 'trembolona',
        presentation: '',
        purchasedQuantity: '1',
        unit: 'unidad',
        totalCost: '',
        supplier: '',
        purchaseDate: '',
        status: 'comprado',
        notes: 'Costo pendiente de confirmar',
      },
      {
        id: 'private-product-wistrol-2026',
        cycleId,
        name: 'Wistrol',
        category: 'wistrol',
        presentation: '',
        purchasedQuantity: '1',
        unit: 'unidad',
        totalCost: '',
        supplier: '',
        purchaseDate: '',
        status: 'comprado',
        notes: 'Costo pendiente de confirmar',
      },
      {
        id: 'private-product-clembuterol-2026',
        cycleId,
        name: 'Clembuterol',
        category: 'clembuterol',
        presentation: '',
        purchasedQuantity: '1',
        unit: 'unidad',
        totalCost: '1200',
        supplier: '',
        purchaseDate: '',
        status: 'comprado',
        notes: 'Compra inicial del ciclo',
      },
      {
        id: 'private-product-peptidos-2026',
        cycleId,
        name: 'Peptidos/Ozempic',
        category: 'peptidos-ozempic',
        presentation: '',
        purchasedQuantity: '1',
        unit: 'lote',
        totalCost: '2450',
        supplier: '',
        purchaseDate: '',
        status: 'comprado',
        notes: 'Compra inicial del ciclo. 1450 ya estaba cubierto.',
      },
      {
        id: 'private-product-liver-cleanse-2026',
        cycleId,
        name: 'Liver cleanse',
        category: 'liver-cleanse',
        presentation: '',
        purchasedQuantity: '1',
        unit: 'unidad',
        totalCost: '656',
        supplier: '',
        purchaseDate: '2026-02-04',
        status: 'comprado',
        notes: 'Compra adicional del 4 de febrero',
      },
    ],
    privatePayments: [
      { id: 'private-payment-2026-01-02', cycleId, concept: 'Pago 1 del ciclo 2026', date: '2026-01-02', amount: '1450', method: '', status: 'pagado', notes: '' },
      { id: 'private-payment-2026-01-07', cycleId, concept: 'Pago 2 del ciclo 2026', date: '2026-01-07', amount: '6415', method: '', status: 'pagado', notes: '' },
      { id: 'private-payment-2026-01-14', cycleId, concept: 'Pago 3 del ciclo 2026', date: '2026-01-14', amount: '5000', method: '', status: 'pagado', notes: '' },
      { id: 'private-payment-2026-01-21', cycleId, concept: 'Pago 4 del ciclo 2026', date: '2026-01-21', amount: '2135', method: '', status: 'pagado', notes: '' },
      { id: 'private-payment-2026-02-04', cycleId, concept: 'Pago 5 del ciclo 2026', date: '2026-02-04', amount: '2728', method: '', status: 'pagado', notes: '' },
      { id: 'private-payment-2026-02-11', cycleId, concept: 'Pago 6 del ciclo 2026', date: '2026-02-11', amount: '2728', method: '', status: 'pagado', notes: '' },
    ],
    privateHormonalEntries: [
      {
        id: 'private-entry-masteron-2026-04-06-1700',
        date: '2026-04-06',
        time: '17:00',
        cycleId,
        productId: 'private-product-masteron-2026',
        eventType: 'aplicacion',
        name: 'Aplicacion Masteron',
        category: 'masteron',
        dose: '1',
        unit: 'ml',
        route: 'Inyeccion',
        frequency: 'Semanal',
        nextApplication: '2026-04-08T17:00',
        notes: 'Aplicacion de 1 ml de Masteron. Registrado con base en confirmacion con coach.',
      },
      {
        id: 'private-entry-testosterona-2026-04-06-1700',
        date: '2026-04-06',
        time: '17:00',
        cycleId,
        productId: '',
        eventType: 'aplicacion',
        name: 'Aplicacion Testosterona',
        category: 'testosterona',
        dose: '1',
        unit: 'ml',
        route: 'Inyeccion',
        frequency: 'Semanal',
        nextApplication: '2026-04-08T17:00',
        notes: 'Aplicacion de 1 ml de testosterona. Registrado con base en confirmacion con coach.',
      },
    ],
    privateDailyChecks: [
      {
        id: 'private-daily-check-2026-04-09',
        date: '2026-04-09',
        cycleId,
        energy: '3',
        mood: '3',
        libido: '3',
        sleep: '4',
        focus: '3',
        appetite: '3',
        retention: 'ninguna',
        sideEffects: 'Sin efecto relevante',
        notes:
          'Semana funcional. Energia media. Dormi bien en general, aunque costo despertar algunos dias. Animo estable. Entrenamiento y alimentacion cumplidos.',
      },
    ],
    privateCycleMedications: [
      {
        id: 'private-medication-liver-2026',
        cycleId,
        name: 'Liver',
        alias: '',
        medicationType: 'protector',
        initialInventory: '94',
        remainingInventory: '94',
        unit: 'tableta',
        expectedDailyDose: '1',
        scheduleMode: 'single',
        intakeHistory: [],
        lastTakenAt: '',
        notes: '',
      },
      {
        id: 'private-medication-tamoxifeno-2026',
        cycleId,
        name: 'Tamoxifeno',
        alias: '',
        medicationType: 'protector',
        initialInventory: '110',
        remainingInventory: '110',
        unit: 'tableta',
        expectedDailyDose: '1',
        scheduleMode: 'single',
        intakeHistory: [],
        lastTakenAt: '',
        notes: '',
      },
      {
        id: 'private-medication-clomifeno-2026',
        cycleId,
        name: 'Clomifeno',
        alias: '',
        medicationType: 'protector',
        initialInventory: '100',
        remainingInventory: '100',
        unit: 'tableta',
        expectedDailyDose: '1',
        scheduleMode: 'single',
        intakeHistory: [],
        lastTakenAt: '',
        notes: '',
      },
      {
        id: 'private-medication-oxandrolona-2026',
        cycleId,
        name: 'Oxandrolona',
        alias: 'Anavar / Oxandrolona',
        medicationType: 'oral',
        initialInventory: '48',
        remainingInventory: '48',
        unit: 'tableta',
        expectedDailyDose: '2',
        scheduleMode: 'split',
        intakeHistory: [],
        lastTakenAt: '',
        notes: '',
      },
    ],
  };
}

export function createPrivateCycle2SeedData(cycleId = 'private-cycle-2-2026', status = 'planeado') {
  return {
    privateSeedVersion: PRIVATE_CYCLE_2026_SEED_VERSION,
    privateCycles: [
      {
        id: cycleId,
        name: 'Ciclo #2 - 2026',
        type: 'personalizado',
        startDate: '2026-04-14',
        estimatedEndDate: '',
        status,
        objective: '',
        notes:
          'Ciclo con protectores, compuestos y pagos confirmados. Sustanón sigue pendiente por confirmar y no entra al total confirmado. BPC-157 queda fuera de compras activas y totales.',
      },
    ],
    privateProducts: [
      {
        id: 'private-product-cycle2-clomifeno-2026-04-15',
        cycleId,
        name: 'Clomifeno',
        category: 'clomifeno',
        presentation: '',
        purchasedQuantity: '',
        unit: '',
        totalCost: '1450',
        supplier: '',
        purchaseDate: '2026-04-15',
        status: 'comprado',
        notes: 'Protector confirmado para el ciclo.',
      },
      {
        id: 'private-product-cycle2-tamoxifeno-2026-04-15',
        cycleId,
        name: 'Tamoxifeno',
        category: 'tamoxifeno',
        presentation: '',
        purchasedQuantity: '',
        unit: '',
        totalCost: '1370',
        supplier: '',
        purchaseDate: '2026-04-15',
        status: 'comprado',
        notes: 'Protector confirmado para el ciclo.',
      },
      {
        id: 'private-product-cycle2-oxandrolona-2026-04-15',
        cycleId,
        name: 'Oxandrolona',
        category: 'oxandrolona',
        presentation: '',
        purchasedQuantity: '',
        unit: '',
        totalCost: '1250',
        supplier: '',
        purchaseDate: '2026-04-15',
        status: 'comprado',
        notes: 'Protector / oral confirmado para el ciclo.',
      },
      {
        id: 'private-product-cycle2-liver-cleanse-2026-04-15',
        cycleId,
        name: 'Liver Cleanse',
        category: 'liver-cleanse',
        presentation: '',
        purchasedQuantity: '',
        unit: '',
        totalCost: '650',
        supplier: '',
        purchaseDate: '2026-04-15',
        status: 'comprado',
        notes: 'Protector confirmado para el ciclo.',
      },
      {
        id: 'private-product-cycle2-envio-2026-04-15',
        cycleId,
        name: 'Cobro de envío',
        category: 'envio',
        presentation: '',
        purchasedQuantity: '',
        unit: '',
        totalCost: '270',
        supplier: '',
        purchaseDate: '2026-04-15',
        status: 'comprado',
        notes: 'Cargo logístico confirmado para el ciclo.',
      },
      {
        id: 'private-product-cycle2-trembo-2026',
        cycleId,
        name: 'Trembo',
        category: 'trembolona',
        presentation: '',
        purchasedQuantity: '',
        unit: '',
        totalCost: '1450',
        supplier: '',
        purchaseDate: '',
        status: 'comprado',
        notes: 'Compuesto TRT confirmado.',
      },
      {
        id: 'private-product-cycle2-wistrol-2026',
        cycleId,
        name: 'Wistrol',
        category: 'wistrol',
        presentation: '',
        purchasedQuantity: '',
        unit: '',
        totalCost: '1400',
        supplier: '',
        purchaseDate: '',
        status: 'comprado',
        notes: 'Compuesto TRT confirmado.',
      },
      {
        id: 'private-product-cycle2-hormona-diaria-2026',
        cycleId,
        name: 'Hormona diaria',
        category: 'hormona-diaria',
        presentation: '',
        purchasedQuantity: '',
        unit: '',
        totalCost: '20000',
        supplier: '',
        purchaseDate: '',
        status: 'comprado',
        notes: 'Monto confirmado para el bloque TRT.',
      },
      {
        id: 'private-product-cycle2-primobolan-2026',
        cycleId,
        name: 'Primobolan',
        category: 'primobolan',
        presentation: '',
        purchasedQuantity: '',
        unit: '',
        totalCost: '1950',
        supplier: '',
        purchaseDate: '',
        status: 'comprado',
        notes: 'Compuesto TRT confirmado.',
      },
      {
        id: 'private-product-cycle2-clembuterol-2026',
        cycleId,
        name: 'Clembuterol',
        category: 'clembuterol',
        presentation: '',
        purchasedQuantity: '',
        unit: '',
        totalCost: '1200',
        supplier: '',
        purchaseDate: '',
        status: 'comprado',
        notes: 'Compuesto TRT confirmado.',
      },
      {
        id: 'private-product-cycle2-sustanon-2026',
        cycleId,
        name: 'T sustanón',
        category: 't-sustanon',
        presentation: '',
        purchasedQuantity: '',
        unit: '',
        totalCost: '',
        supplier: '',
        purchaseDate: '',
        status: 'pendiente',
        notes: 'Costo pendiente por confirmar. No incluido en el total confirmado.',
      },
    ],
    privatePayments: [
      {
        id: 'private-payment-cycle2-2026-04-14',
        cycleId,
        concept: 'Pago ciclo #2 - 2026',
        date: '2026-04-14',
        amount: '950',
        method: '',
        status: 'pagado',
        notes: '',
      },
      {
        id: 'private-payment-cycle2-2026-04-15',
        cycleId,
        concept: 'Pago ciclo #2 - 2026',
        date: '2026-04-15',
        amount: '3000',
        method: '',
        status: 'pagado',
        notes: '',
      },
      {
        id: 'private-payment-cycle2-2026-04-22',
        cycleId,
        concept: 'Pago ciclo #2 - 2026',
        date: '2026-04-22',
        amount: '5000',
        method: '',
        status: 'pagado',
        notes: '',
      },
    ],
    privateHormonalEntries: [],
    privateDailyChecks: [],
    privateCycleMedications: [],
  };
}

function applyPrivateCycleSeedBundle(
  {
    privateCycles = [],
    privateProducts = [],
    privatePayments = [],
    privateHormonalEntries = [],
    privateDailyChecks = [],
    privateCycleMedications = [],
    privateSeedVersion = 0,
  },
  seed,
  { medicationCorrections = [] } = {}
) {
  const seedCycle = seed.privateCycles[0];
  const existingCycle = privateCycles.find(
    (item) =>
      normalizePrivateSeedKey(item.name) === normalizePrivateSeedKey(seedCycle.name) ||
      normalizePrivateSeedKey(item.id) === normalizePrivateSeedKey(seedCycle.id)
  );
  const resolvedCycleId = existingCycle?.id || seedCycle.id;

  const repairedCycle = {
    ...seedCycle,
    ...(existingCycle || {}),
    id: resolvedCycleId,
    name: existingCycle?.name || seedCycle.name,
    type: existingCycle?.type || seedCycle.type,
    startDate: existingCycle?.startDate || seedCycle.startDate,
    estimatedEndDate: existingCycle?.estimatedEndDate || seedCycle.estimatedEndDate,
    status: existingCycle?.status || seedCycle.status,
    objective: existingCycle?.objective || seedCycle.objective,
    notes: mergePrivateNotes(existingCycle?.notes, seedCycle.notes),
  };

  const nextCycles = existingCycle
    ? privateCycles.map((item) => (item.id === existingCycle.id ? repairedCycle : item))
    : [repairedCycle, ...privateCycles];

  const nextProducts = [...privateProducts];
  seed.privateProducts.forEach((seedProduct) => {
    const existingProductIndex = nextProducts.findIndex(
      (item) =>
        normalizePrivateSeedKey(item.name) === normalizePrivateSeedKey(seedProduct.name) &&
        canReusePrivateCycleRecord(item.cycleId, resolvedCycleId, seedProduct.id)
    );

    if (existingProductIndex >= 0) {
      const currentProduct = nextProducts[existingProductIndex];
      nextProducts[existingProductIndex] = {
        ...currentProduct,
        cycleId: resolvedCycleId,
        name: currentProduct.name || seedProduct.name,
        category: currentProduct.category || seedProduct.category,
        purchasedQuantity: isBlankValue(currentProduct.purchasedQuantity)
          ? seedProduct.purchasedQuantity
          : currentProduct.purchasedQuantity,
        unit: currentProduct.unit || seedProduct.unit,
        presentation: currentProduct.presentation || seedProduct.presentation,
        totalCost:
          !isBlankValue(seedProduct.totalCost) && isBlankValue(currentProduct.totalCost)
            ? seedProduct.totalCost
            : currentProduct.totalCost,
        supplier: currentProduct.supplier || seedProduct.supplier,
        purchaseDate: currentProduct.purchaseDate || seedProduct.purchaseDate,
        status: currentProduct.status || seedProduct.status,
        notes: mergePrivateNotes(currentProduct.notes, seedProduct.notes),
      };
      return;
    }

    nextProducts.unshift({
      ...seedProduct,
      cycleId: resolvedCycleId,
    });
  });

  const masteronProduct = nextProducts.find(
    (item) => normalizePrivateSeedKey(item.name) === normalizePrivateSeedKey('Masteron')
  );

  const nextPayments = [...privatePayments];
  seed.privatePayments.forEach((seedPayment) => {
    const existingPaymentIndex = nextPayments.findIndex(
      (item) =>
        matchPrivatePaymentSeed(item, seedPayment) &&
        canReusePrivateCycleRecord(item.cycleId, resolvedCycleId, seedPayment.id)
    );

    if (existingPaymentIndex >= 0) {
      const currentPayment = nextPayments[existingPaymentIndex];
      nextPayments[existingPaymentIndex] = {
        ...currentPayment,
        cycleId: resolvedCycleId,
        concept: currentPayment.concept || seedPayment.concept,
        method: currentPayment.method || seedPayment.method,
        status: currentPayment.status || seedPayment.status,
        notes: mergePrivateNotes(currentPayment.notes, seedPayment.notes),
      };
      return;
    }

    nextPayments.unshift({
      ...seedPayment,
      cycleId: resolvedCycleId,
    });
  });

  const nextEntries = [...privateHormonalEntries];
  seed.privateHormonalEntries.forEach((seedEntry) => {
    const existingEntryIndex = nextEntries.findIndex(
      (item) =>
        matchPrivateEntrySeed(item, seedEntry) &&
        canReusePrivateCycleRecord(item.cycleId, resolvedCycleId, seedEntry.id)
    );

    if (existingEntryIndex >= 0) {
      const currentEntry = nextEntries[existingEntryIndex];
      nextEntries[existingEntryIndex] = {
        ...currentEntry,
        cycleId: resolvedCycleId,
        productId:
          normalizePrivateSeedKey(seedEntry.name).includes('masteron') && masteronProduct
            ? masteronProduct.id
            : currentEntry.productId || seedEntry.productId,
        category: currentEntry.category || seedEntry.category,
        eventType: currentEntry.eventType || seedEntry.eventType,
        dose: currentEntry.dose || seedEntry.dose,
        unit: currentEntry.unit || seedEntry.unit,
        route: currentEntry.route || seedEntry.route,
        frequency: currentEntry.frequency || seedEntry.frequency,
        nextApplication: currentEntry.nextApplication || seedEntry.nextApplication,
        notes: mergePrivateNotes(currentEntry.notes, seedEntry.notes),
      };
      return;
    }

    nextEntries.unshift({
      ...seedEntry,
      cycleId: resolvedCycleId,
      productId:
        normalizePrivateSeedKey(seedEntry.name).includes('masteron') && masteronProduct
          ? masteronProduct.id
          : seedEntry.productId,
    });
  });

  const nextDailyChecks = [...privateDailyChecks];
  seed.privateDailyChecks.forEach((seedCheck) => {
    const existingDailyCheckIndex = nextDailyChecks.findIndex(
      (item) =>
        canReusePrivateCycleRecord(item.cycleId, resolvedCycleId, seedCheck.id) &&
        (matchPrivateDailyCheckSeed(item, seedCheck) || (item.date || '') === (seedCheck.date || ''))
    );

    if (existingDailyCheckIndex >= 0) {
      const currentDailyCheck = nextDailyChecks[existingDailyCheckIndex];
      nextDailyChecks[existingDailyCheckIndex] = {
        ...currentDailyCheck,
        cycleId: resolvedCycleId,
        energy: currentDailyCheck.energy || seedCheck.energy,
        mood: currentDailyCheck.mood || seedCheck.mood,
        libido: currentDailyCheck.libido || seedCheck.libido,
        sleep: currentDailyCheck.sleep || seedCheck.sleep,
        focus: currentDailyCheck.focus || seedCheck.focus,
        appetite: currentDailyCheck.appetite || seedCheck.appetite,
        retention: currentDailyCheck.retention || seedCheck.retention,
        sideEffects: currentDailyCheck.sideEffects || seedCheck.sideEffects,
        notes: mergePrivateNotes(currentDailyCheck.notes, seedCheck.notes),
      };
      return;
    }

    nextDailyChecks.unshift({
      ...seedCheck,
      cycleId: resolvedCycleId,
    });
  });

  const nextMedications = [...privateCycleMedications];
  seed.privateCycleMedications.forEach((seedMedication) => {
    const existingMedicationIndex = nextMedications.findIndex(
      (item) =>
        normalizePrivateSeedKey(item.name) === normalizePrivateSeedKey(seedMedication.name) &&
        canReusePrivateCycleRecord(item.cycleId, resolvedCycleId, seedMedication.id)
    );

    if (existingMedicationIndex >= 0) {
      const currentMedication = nextMedications[existingMedicationIndex];
      nextMedications[existingMedicationIndex] = {
        ...currentMedication,
        cycleId: resolvedCycleId,
        alias: currentMedication.alias || seedMedication.alias,
        medicationType: currentMedication.medicationType || seedMedication.medicationType,
        initialInventory: isBlankValue(currentMedication.initialInventory)
          ? seedMedication.initialInventory
          : currentMedication.initialInventory,
        remainingInventory: isBlankValue(currentMedication.remainingInventory)
          ? currentMedication.initialInventory || seedMedication.remainingInventory
          : currentMedication.remainingInventory,
        unit: currentMedication.unit || seedMedication.unit,
        expectedDailyDose: currentMedication.expectedDailyDose || seedMedication.expectedDailyDose,
        scheduleMode: currentMedication.scheduleMode || seedMedication.scheduleMode,
        intakeHistory: Array.isArray(currentMedication.intakeHistory) ? currentMedication.intakeHistory : [],
        lastTakenAt: currentMedication.lastTakenAt || seedMedication.lastTakenAt,
        notes: mergePrivateNotes(currentMedication.notes, seedMedication.notes),
      };
      return;
    }

    nextMedications.unshift({
      ...seedMedication,
      cycleId: resolvedCycleId,
    });
  });

  medicationCorrections.forEach((correction) => {
    const medicationIndex = nextMedications.findIndex(
      (item) =>
        normalizePrivateSeedKey(item.name) === normalizePrivateSeedKey(correction.medicationName) &&
        canReusePrivateCycleRecord(item.cycleId, resolvedCycleId, correction.seedId || correction.medicationName)
    );

    if (medicationIndex === -1) return;

    const medication = nextMedications[medicationIndex];
    const correctionStatus = getPrivateMedicationDailyStatus(medication, correction.date);
    const desiredTakenSlots = correction.desiredTakenSlots || [];
    const currentTakenSlots = correctionStatus.takenSlots;

    if (
      currentTakenSlots.length === desiredTakenSlots.length &&
      currentTakenSlots.every((slot) => desiredTakenSlots.includes(slot))
    ) {
      return;
    }

    const currentRemaining = toSafeNumber(medication.remainingInventory);
    const initialInventory = toSafeNumber(medication.initialInventory);
    const delta = currentTakenSlots.length - desiredTakenSlots.length;
    const nextRemaining = Math.max(0, Math.min(currentRemaining + delta, initialInventory || currentRemaining + Math.abs(delta)));
    const nextHistory = Array.isArray(medication.intakeHistory) ? [...medication.intakeHistory] : [];
    const currentIndex = nextHistory.findIndex((entry) => entry?.date === correction.date);
    const correctionTimestamp = new Date(`${correction.date}T12:00:00`).toISOString();

    if (currentIndex >= 0) {
      nextHistory[currentIndex] = {
        ...nextHistory[currentIndex],
        date: correction.date,
        takenSlots: desiredTakenSlots,
        updatedAt: nextHistory[currentIndex]?.updatedAt || correctionTimestamp,
      };
    } else if (desiredTakenSlots.length > 0) {
      nextHistory.unshift({
        date: correction.date,
        takenSlots: desiredTakenSlots,
        updatedAt: correctionTimestamp,
      });
    }

    nextMedications[medicationIndex] = {
      ...medication,
      intakeHistory: desiredTakenSlots.length > 0 ? nextHistory : nextHistory.filter((entry) => entry?.date !== correction.date),
      remainingInventory: String(nextRemaining),
      lastTakenAt: medication.lastTakenAt || correctionTimestamp,
    };
  });

  return {
    privateCycles: nextCycles,
    privateProducts: nextProducts,
    privatePayments: nextPayments,
    privateHormonalEntries: nextEntries,
    privateDailyChecks: nextDailyChecks,
    privateCycleMedications: nextMedications,
    privateSeedVersion: Math.max(Number(privateSeedVersion) || 0, seed.privateSeedVersion),
  };
}

export function repairPrivateCycle2026Data({
  privateCycles = [],
  privateProducts = [],
  privatePayments = [],
  privateHormonalEntries = [],
  privateDailyChecks = [],
  privateCycleMedications = [],
  privateSeedVersion = 0,
} = {}) {
  const cycle1State = applyPrivateCycleSeedBundle(
    {
      privateCycles,
      privateProducts,
      privatePayments,
      privateHormonalEntries,
      privateDailyChecks,
      privateCycleMedications,
      privateSeedVersion,
    },
    createPrivateCycle2026SeedData(),
    {
      medicationCorrections: [
        {
          medicationName: 'Oxandrolona',
          seedId: 'private-medication-oxandrolona-2026',
          date: PRIVATE_CYCLE_2026_MEDICATION_CORRECTION_DATE,
          desiredTakenSlots: ['manana'],
        },
      ],
    }
  );

  const shouldCreateCycle2AsActive = !cycle1State.privateCycles.some((item) => item.status === 'activo');

  return applyPrivateCycleSeedBundle(
    cycle1State,
    createPrivateCycle2SeedData('private-cycle-2-2026', shouldCreateCycle2AsActive ? 'activo' : 'planeado')
  );
}

export function getPrivateCycleFinancialSummary(cycleId, privateProducts = [], privatePayments = []) {
  const cycleProducts = cycleId ? privateProducts.filter((item) => item.cycleId === cycleId) : [];
  const cyclePayments = cycleId ? privatePayments.filter((item) => item.cycleId === cycleId) : [];

  const getFinancialBucket = (item) => {
    const normalizedName = normalizePrivateSeedKey(item?.name);
    const normalizedCategory = getPrivateCanonicalCategory(item?.category);

    if (
      normalizedCategory === 'tamoxifeno' ||
      normalizedCategory === 'clomifeno' ||
      normalizedCategory === 'oxandrolona' ||
      normalizedCategory === 'liver-cleanse' ||
      normalizedCategory === 'envio' ||
      normalizedName.includes('tamox') ||
      normalizedName.includes('clomif') ||
      normalizedName.includes('oxandrol') ||
      normalizedName.includes('liver') ||
      normalizedName.includes('envio')
    ) {
      return 'protectors';
    }

    if (
      normalizedCategory === 'trt' ||
      normalizedCategory === 'testosterona' ||
      normalizedCategory === 'cipionate' ||
      normalizedCategory === 't-sustanon' ||
      normalizedCategory === 'hormona-diaria' ||
      normalizedCategory === 'primo' ||
      normalizedCategory === 'primobolan' ||
      normalizedCategory === 'trembolona' ||
      normalizedCategory === 'winstrol' ||
      normalizedCategory === 'clembuterol' ||
      normalizedName.includes('susta') ||
      normalizedName.includes('hormona diaria') ||
      normalizedName.includes('primob') ||
      normalizedName.includes('primo') ||
      normalizedName.includes('trembo') ||
      normalizedName.includes('wistrol') ||
      normalizedName.includes('winstrol') ||
      normalizedName.includes('clembuter')
    ) {
      return 'trt';
    }

    return 'other';
  };

  const totalInvested = cycleProducts.reduce((sum, item) => sum + toSafeNumber(item.totalCost), 0);
  const totalPaid = cyclePayments
    .filter((item) => item.status === 'pagado')
    .reduce((sum, item) => sum + toSafeNumber(item.amount), 0);
  const pendingPayments = cyclePayments
    .filter((item) => item.status === 'pendiente')
    .reduce((sum, item) => sum + toSafeNumber(item.amount), 0);
  const pendingBalance = Math.max(totalInvested - totalPaid, pendingPayments, 0);
  const orderedPayments = [...cyclePayments].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const protectorsSubtotal = cycleProducts
    .filter((item) => getFinancialBucket(item) === 'protectors')
    .reduce((sum, item) => sum + toSafeNumber(item.totalCost), 0);
  const trtConfirmedSubtotal = cycleProducts
    .filter((item) => getFinancialBucket(item) === 'trt')
    .reduce((sum, item) => sum + toSafeNumber(item.totalCost), 0);
  const confirmedTotal = protectorsSubtotal + trtConfirmedSubtotal;
  const confirmedPendingBalance = Math.max(confirmedTotal - totalPaid, 0);
  const unresolvedProducts = cycleProducts
    .filter((item) => isBlankValue(item.totalCost))
    .map((item) => item.name || 'Producto pendiente');

  return {
    totalInvested,
    totalPaid,
    pendingBalance,
    protectorsSubtotal,
    trtConfirmedSubtotal,
    confirmedTotal,
    confirmedPendingBalance,
    unresolvedProducts,
    hasOperationalBreakdown: protectorsSubtotal > 0 || trtConfirmedSubtotal > 0,
    orderedPayments,
    cycleProducts,
    cyclePayments,
    cycleProductsCount: cycleProducts.length,
    cyclePaymentsCount: cyclePayments.length,
  };
}

export function buildPrivateSummary({
  privateCycles = [],
  privateProducts = [],
  privatePayments = [],
  privateEntries = [],
  now = new Date(),
} = {}) {
  const activeCycle = getPrivateActiveCycle(privateCycles);
  const activeCycleId = activeCycle?.id || '';

  const activeProducts = activeCycleId
    ? privateProducts.filter((item) => item.cycleId === activeCycleId)
    : [];
  const activeEntries = activeCycleId
    ? privateEntries.filter((item) => item.cycleId === activeCycleId)
    : [];
  const activeCycleFinancials = getPrivateCycleFinancialSummary(activeCycleId, privateProducts, privatePayments);

  const nowIso = now.toISOString();
  const nextEvent =
    [...activeEntries]
      .filter((item) => {
        const timestamp = getEntryTimestamp(item);
        return timestamp && timestamp >= nowIso;
      })
      .sort((a, b) => getEntryTimestamp(a).localeCompare(getEntryTimestamp(b)))[0] || null;

  return {
    activeCycle,
    totalInvested: activeCycleFinancials.totalInvested,
    totalPaid: activeCycleFinancials.totalPaid,
    pendingBalance: activeCycleFinancials.pendingBalance,
    totalEntries: privateEntries.length,
    nextEvent,
    activeEntriesCount: activeEntries.length,
    activeProductsCount: activeProducts.length,
    activePaymentsCount: activeCycleFinancials.cyclePayments.length,
    activeCycleFinancials,
  };
}

export function buildPrivateTimeline({
  privateEntries = [],
  privateProducts = [],
  privatePayments = [],
  cycleId = '',
} = {}) {
  const filteredEntries = cycleId ? privateEntries.filter((item) => item.cycleId === cycleId) : privateEntries;
  const filteredProducts = cycleId ? privateProducts.filter((item) => item.cycleId === cycleId) : privateProducts;
  const filteredPayments = cycleId ? privatePayments.filter((item) => item.cycleId === cycleId) : privatePayments;

  const entryItems = filteredEntries.map((item) => ({
    id: `entry-${item.id}`,
    sourceId: item.id,
    kind: 'entry',
    eventType: item.eventType || 'otro',
    timestamp: getEntryTimestamp(item),
    date: item.date || '',
    time: item.time || '',
    cycleId: item.cycleId || '',
    productId: item.productId || '',
    title: item.name || 'Evento privado',
    category: item.category || '',
    amountLabel: item.dose ? `${item.dose} ${item.unit || ''}`.trim() : '',
    secondary: item.route || item.frequency || '',
    notes: item.notes || '',
  }));

  const productItems = filteredProducts.map((item) => ({
    id: `product-${item.id}`,
    sourceId: item.id,
    kind: 'product',
    eventType: 'compra',
    timestamp: item.purchaseDate ? `${item.purchaseDate}T00:00` : '',
    date: item.purchaseDate || '',
    time: '',
    cycleId: item.cycleId || '',
    productId: item.id,
    title: item.name || 'Compra privada',
    category: item.category || '',
    amountLabel: item.totalCost ? `$${item.totalCost}` : '',
    secondary: item.purchasedQuantity ? `${item.purchasedQuantity} ${item.unit || ''}`.trim() : item.presentation || '',
    notes: item.notes || '',
  }));

  const paymentItems = filteredPayments.map((item) => ({
    id: `payment-${item.id}`,
    sourceId: item.id,
    kind: 'payment',
    eventType: 'pago',
    timestamp: item.date ? `${item.date}T00:00` : '',
    date: item.date || '',
    time: '',
    cycleId: item.cycleId || '',
    productId: '',
    title: item.concept || 'Pago privado',
    category: '',
    amountLabel: item.amount ? `$${item.amount}` : '',
    secondary: item.method || item.status || '',
    notes: item.notes || '',
  }));

  return sortByTimestampDesc([...entryItems, ...productItems, ...paymentItems]);
}

export function buildPrivateHormonalWeeklySummary({
  activeCycle = null,
  privateEntries = [],
  privateProducts = [],
  privatePayments = [],
  privateDailyChecks = [],
  weekStart = '',
  weekEnd = '',
  currentDate = getToday(),
  now = new Date(),
} = {}) {
  const activeCycleId = activeCycle?.id || '';

  if (!activeCycleId) {
    return {
      weeklyApplicationsCount: 0,
      nextApplication: null,
      activeCompoundNames: [],
      totalPaid: 0,
      totalPending: 0,
      paidCount: 0,
      pendingCount: 0,
      repeatedSymptoms: [],
      energyAverage: null,
      sleepAverage: null,
      moodAverage: null,
      adherenceRate: 0,
      trackedDaysCount: 0,
      weeklyDailyChecksCount: 0,
      weeklyEntriesCount: 0,
    };
  }

  const cycleEntries = privateEntries.filter((item) => item.cycleId === activeCycleId);
  const cycleProducts = privateProducts.filter((item) => item.cycleId === activeCycleId);
  const cyclePayments = privatePayments.filter((item) => item.cycleId === activeCycleId);
  const cycleDailyChecks = privateDailyChecks.filter((item) => item.cycleId === activeCycleId);

  const weeklyEntries = cycleEntries.filter((item) => isDateInsideRange(item.date, weekStart, weekEnd));
  const weeklyDailyChecks = cycleDailyChecks.filter((item) => isDateInsideRange(item.date, weekStart, weekEnd));
  const weeklyApplications = weeklyEntries.filter(
    (item) => getPrivateCanonicalEventType(item.eventType) === 'aplicacion'
  );
  const futureApplications = cycleEntries
    .filter((item) => getPrivateCanonicalEventType(item.eventType) === 'aplicacion')
    .filter((item) => {
      const timestamp = getPrivateEntryEffectiveTimestamp(item);
      return Boolean(timestamp) && timestamp >= now.toISOString();
    })
    .sort((a, b) => getPrivateEntryEffectiveTimestamp(a).localeCompare(getPrivateEntryEffectiveTimestamp(b)));

  const symptomMap = weeklyEntries
    .filter((item) => getPrivateCanonicalEventType(item.eventType) === 'sintoma')
    .reduce((accumulator, item) => {
      const key = normalizePrivateSeedKey(item.name || item.category || 'sintoma');
      const current = accumulator.get(key) || {
        key,
        label: item.name || privateCategoryLabels[item.category] || 'Sintoma',
        count: 0,
      };
      current.count += 1;
      accumulator.set(key, current);
      return accumulator;
    }, new Map());

  const repeatedSymptoms = [...symptomMap.values()].filter((item) => item.count >= 2).sort((a, b) => b.count - a.count);
  const activeCompoundNames = [
    ...new Set(
      cycleProducts
        .filter((item) => item.status !== 'descartado')
        .map((item) => privateCategoryLabels[item.category] || item.name || 'Componente')
        .filter(Boolean)
    ),
  ];
  const trackedDays = new Set([
    ...weeklyEntries.map((item) => item.date).filter(Boolean),
    ...weeklyDailyChecks.map((item) => item.date).filter(Boolean),
  ]);
  const paidPayments = cyclePayments.filter((item) => item.status === 'pagado');
  const pendingPayments = cyclePayments.filter((item) => item.status === 'pendiente');

  return {
    weeklyApplicationsCount: weeklyApplications.length,
    nextApplication: futureApplications[0] || null,
    activeCompoundNames,
    totalPaid: paidPayments.reduce((sum, item) => sum + toSafeNumber(item.amount), 0),
    totalPending: pendingPayments.reduce((sum, item) => sum + toSafeNumber(item.amount), 0),
    paidCount: paidPayments.length,
    pendingCount: pendingPayments.length,
    repeatedSymptoms,
    energyAverage: averagePrivateScale(weeklyDailyChecks, 'energy'),
    sleepAverage: averagePrivateScale(weeklyDailyChecks, 'sleep'),
    moodAverage: averagePrivateScale(weeklyDailyChecks, 'mood'),
    adherenceRate: Math.round((trackedDays.size / 7) * 100),
    trackedDaysCount: trackedDays.size,
    weeklyDailyChecksCount: weeklyDailyChecks.length,
    weeklyEntriesCount: weeklyEntries.length,
    latestTrackedDate:
      [...trackedDays].sort((a, b) => String(b).localeCompare(String(a)))[0] || currentDate,
  };
}

export function buildPrivateOperationalAlerts({
  activeCycle = null,
  privateEntries = [],
  privatePayments = [],
  privateDailyChecks = [],
  weekStart = '',
  weekEnd = '',
  currentDate = getToday(),
  now = new Date(),
} = {}) {
  const alerts = [];

  if (!activeCycle) {
    return [
      {
        id: 'private-alert-no-cycle',
        tone: 'neutral',
        title: 'Sin ciclo activo',
        body: 'Activa un ciclo para empezar el seguimiento operativo.',
      },
    ];
  }

  const cycleEntries = privateEntries.filter((item) => item.cycleId === activeCycle.id);
  const cyclePayments = privatePayments.filter((item) => item.cycleId === activeCycle.id);
  const cycleDailyChecks = privateDailyChecks.filter((item) => item.cycleId === activeCycle.id);
  const weeklyEntries = cycleEntries.filter((item) => isDateInsideRange(item.date, weekStart, weekEnd));
  const weeklyChecks = cycleDailyChecks.filter((item) => isDateInsideRange(item.date, weekStart, weekEnd));
  const futureApplications = cycleEntries
    .filter((item) => getPrivateCanonicalEventType(item.eventType) === 'aplicacion')
    .filter((item) => {
      const timestamp = getPrivateEntryEffectiveTimestamp(item);
      return Boolean(timestamp) && timestamp >= now.toISOString();
    })
    .sort((a, b) => getPrivateEntryEffectiveTimestamp(a).localeCompare(getPrivateEntryEffectiveTimestamp(b)));
  const entriesWithoutDose = cycleEntries.filter((item) => {
    const canonicalType = getPrivateCanonicalEventType(item.eventType);
    return (canonicalType === 'aplicacion' || canonicalType === 'toma-oral') && isBlankValue(item.dose);
  });
  const pendingPayments = cyclePayments.filter((item) => item.status === 'pendiente');
  const symptomCounts = weeklyEntries
    .filter((item) => getPrivateCanonicalEventType(item.eventType) === 'sintoma')
    .reduce((accumulator, item) => {
      const key = normalizePrivateSeedKey(item.name || item.category || 'sintoma');
      accumulator.set(key, (accumulator.get(key) || 0) + 1);
      return accumulator;
    }, new Map());
  const repeatedSymptoms = [...symptomCounts.values()].filter((count) => count >= 2).length;
  const latestTrackedDate = [...cycleEntries, ...cycleDailyChecks]
    .map((item) => item.date || '')
    .filter(Boolean)
    .sort((a, b) => String(b).localeCompare(String(a)))[0];
  const daysWithoutActivity = latestTrackedDate
    ? Math.floor((new Date(`${currentDate}T00:00:00`).getTime() - new Date(`${latestTrackedDate}T00:00:00`).getTime()) / 86400000)
    : 999;

  if (!futureApplications.length) {
    alerts.push({
      id: 'private-alert-next-application',
      tone: 'warning',
      title: 'Falta próxima aplicación',
      body: 'No hay una aplicación futura registrada para el ciclo activo.',
    });
  }

  if (entriesWithoutDose.length > 0) {
    alerts.push({
      id: 'private-alert-missing-dose',
      tone: 'warning',
      title: 'Eventos sin dosis',
      body: `${entriesWithoutDose.length} registro(s) de aplicación o toma oral siguen sin dosis capturada.`,
    });
  }

  if (pendingPayments.length > 0) {
    alerts.push({
      id: 'private-alert-pending-payments',
      tone: 'warning',
      title: 'Pagos pendientes',
      body: `${pendingPayments.length} pago(s) siguen pendientes dentro del ciclo activo.`,
    });
  }

  if (repeatedSymptoms > 0) {
    alerts.push({
      id: 'private-alert-symptoms',
      tone: 'warning',
      title: 'Síntomas repetidos',
      body: 'Hay síntomas repetidos esta semana. Vale la pena revisar el patrón.',
    });
  }

  if (daysWithoutActivity >= 3) {
    alerts.push({
      id: 'private-alert-no-activity',
      tone: 'neutral',
      title: 'Seguimiento detenido',
      body: latestTrackedDate
        ? `No registras actividad nueva desde ${latestTrackedDate}.`
        : 'Aún no registras actividad en este ciclo.',
    });
  }

  if (weeklyChecks.length === 0) {
    alerts.push({
      id: 'private-alert-minimum-data',
      tone: 'neutral',
      title: 'Faltan datos mínimos',
      body: 'Todavía no hay chequeos diarios esta semana para leer energía, ánimo y sueño.',
    });
  }

  return alerts;
}
