import { getToday } from '../date';

export const privateCategoryLabels = {
  trt: 'TRT',
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
    category: 'trt',
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
    category: 'trt',
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
