import { getToday } from '../date';

export const privateCategoryLabels = {
  trt: 'TRT',
  testosterona: 'Testosterona',
  cipionate: 'Cipionate',
  oxandrolone: 'Oxandrolone',
  masteron: 'Masteron',
  primo: 'Primo',
  trembolona: 'Trembolona',
  wistrol: 'Wistrol',
  clembuterol: 'Clembuterol',
  'peptidos-ozempic': 'Peptidos / Ozempic',
  'liver-cleanse': 'Liver cleanse',
  'otro-compuesto': 'Otro compuesto',
  aplicacion: 'Aplicacion',
  oral: 'Oral',
  soporte: 'Soporte',
  control: 'Control',
  pct: 'PCT',
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
  compra: 'Compra',
  pago: 'Pago',
  analitica: 'Analitica',
  sintoma: 'Sintoma',
  control: 'Control',
  otro: 'Otro',
};

export const PRIVATE_CYCLE_2026_SEED_VERSION = 2;

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
  };
}

export function repairPrivateCycle2026Data({
  privateCycles = [],
  privateProducts = [],
  privatePayments = [],
  privateHormonalEntries = [],
  privateSeedVersion = 0,
} = {}) {
  const seed = createPrivateCycle2026SeedData();
  const seedCycle = seed.privateCycles[0];
  const existingCycle = privateCycles.find(
    (item) =>
      normalizePrivateSeedKey(item.name) === normalizePrivateSeedKey(seedCycle.name) ||
      normalizePrivateSeedKey(item.id) === normalizePrivateSeedKey(seedCycle.id)
  );
  const resolvedCycleId = existingCycle?.id || seedCycle.id;

  const repairedCycle = {
    ...(existingCycle || seedCycle),
    ...seedCycle,
    id: resolvedCycleId,
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

  return {
    privateCycles: nextCycles,
    privateProducts: nextProducts,
    privatePayments: nextPayments,
    privateHormonalEntries: nextEntries,
    privateSeedVersion: Math.max(Number(privateSeedVersion) || 0, seed.privateSeedVersion),
  };
}

export function getPrivateCycleFinancialSummary(cycleId, privateProducts = [], privatePayments = []) {
  const cycleProducts = cycleId ? privateProducts.filter((item) => item.cycleId === cycleId) : [];
  const cyclePayments = cycleId ? privatePayments.filter((item) => item.cycleId === cycleId) : [];

  const totalInvested = cycleProducts.reduce((sum, item) => sum + toSafeNumber(item.totalCost), 0);
  const totalPaid = cyclePayments
    .filter((item) => item.status === 'pagado')
    .reduce((sum, item) => sum + toSafeNumber(item.amount), 0);
  const pendingPayments = cyclePayments
    .filter((item) => item.status === 'pendiente')
    .reduce((sum, item) => sum + toSafeNumber(item.amount), 0);
  const pendingBalance = Math.max(totalInvested - totalPaid, pendingPayments, 0);
  const orderedPayments = [...cyclePayments].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  return {
    totalInvested,
    totalPaid,
    pendingBalance,
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
