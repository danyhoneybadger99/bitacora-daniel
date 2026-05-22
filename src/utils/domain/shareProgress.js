export const shareProgressCardTypes = [
  { id: 'daily', label: 'Dia de hoy', group: 'achievements' },
  { id: 'physical', label: 'Hito fisico', group: 'achievements' },
  { id: 'krav', label: 'Krav Maga', group: 'achievements' },
  { id: 'sobriety', label: 'Sobriedad', group: 'achievements' },
  { id: 'food', label: 'Alimentacion', group: 'daily_post' },
  { id: 'exercise', label: 'Ejercicio', group: 'daily_post' },
  { id: 'monthly', label: 'Resumen mensual', group: 'preparation' },
];

export const SOBRIETY_START_DATE = '2023-12-28';
export const SOBRIETY_START_LABEL = 'Desde el 28 de diciembre de 2023';

export function canShowSobrietyCard(profile) {
  const identifiers = [
    profile?.name,
    profile?.id,
    profile?.slug,
    profile?.profileId,
    profile?.profileType,
  ].map((value) => String(value || '').trim().toLowerCase());

  return identifiers.includes('daniel') || identifiers.includes('daniel-full');
}

export const shareAvailabilityLabels = {
  ready: 'Listo',
  in_progress: 'En progreso',
  no_record_today: 'Sin registro hoy',
  missing_data_source: 'Falta conectar dato',
};

export const shareProgressTemplates = [
  {
    id: 'daily-discipline',
    cardType: 'daily',
    label: 'Disciplina diaria',
    phrase: 'La constancia tambien se entrena.',
  },
  {
    id: 'daily-completed',
    cardType: 'daily',
    label: 'Dia cumplido',
    phrase: 'Un dia claro pesa mas que una intencion perfecta.',
  },
  {
    id: 'physical-weight-goal',
    cardType: 'physical',
    label: 'Peso objetivo',
    phrase: 'Mas cerca, mas disciplinado y sin hacer ruido.',
  },
  {
    id: 'physical-composition',
    cardType: 'physical',
    label: 'Composicion corporal',
    phrase: 'Definicion en progreso.',
  },
  {
    id: 'sobriety-days',
    cardType: 'sobriety',
    label: 'Dias de sobriedad',
    phrase: 'Un dia a la vez.',
  },
  {
    id: 'krav-belt-progress',
    cardType: 'krav',
    label: 'Progreso de cinta',
    phrase: 'Tecnica limpia. Control primero. Progreso real.',
  },
  {
    id: 'monthly-progress',
    cardType: 'monthly',
    label: 'Mes en progreso',
    phrase: 'Nutricion, entrenamiento y enfoque.',
  },
  {
    id: 'food-meal',
    cardType: 'food',
    label: 'Post de comida',
    phrase: 'La constancia tambien se cocina.',
  },
  {
    id: 'exercise-session',
    cardType: 'exercise',
    label: 'Post de ejercicio',
    phrase: 'La constancia tambien se entrena.',
  },
];

export const defaultTemplateByCardType = {
  daily: 'daily-discipline',
  physical: 'physical-weight-goal',
  sobriety: 'sobriety-days',
  krav: 'krav-belt-progress',
  monthly: 'monthly-progress',
  food: 'food-meal',
  exercise: 'exercise-session',
};

const mealTypeLabels = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
  snack: 'Snack',
  bebida: 'Bebida',
};

const exerciseModalityLabels = {
  cardio: 'Cardio',
  pesas: 'Pesas',
  caminata: 'Caminata',
  'krav-maga': 'Krav Maga',
  movilidad: 'Movilidad',
  recuperacion: 'Recuperacion',
  otro: 'Entrenamiento',
};

const dailyTitleByReadiness = {
  completed_day: 'Dia ganado',
  strong_day: 'Dia fuerte',
  in_progress: 'Dia en progreso',
};

const dailyMessageByReadiness = {
  completed_day: 'Basicos completos. Hoy la disciplina quedo registrada.',
  strong_day: 'Buen avance. Nutricion, ayuno y disciplina en progreso.',
  in_progress: 'Dia en progreso. Todavia faltan habitos para cerrarlo.',
};

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function formatNumber(value, digits = 0) {
  const number = toNumber(value);
  return new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(number);
}

function formatDateLabel(dateValue = '') {
  const [year, month, day] = String(dateValue || '').split('-').map(Number);
  const date = year && month && day ? new Date(year, month - 1, day) : new Date();

  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatMonthLabel(dateValue = '') {
  const [year, month] = String(dateValue || '').split('-').map(Number);
  const date = year && month ? new Date(year, month - 1, 1) : new Date();

  return new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getLocalDateParts(value = new Date()) {
  if (typeof value === 'string') {
    const [year, month, day] = value.split('-').map(Number);
    if (year && month && day) return { year, month, day };
  }

  const date = value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date();
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function getUtcDayNumber(value = new Date()) {
  const { year, month, day } = getLocalDateParts(value);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

export function getSobrietyDays(currentDate = new Date()) {
  return Math.max(0, getUtcDayNumber(currentDate) - getUtcDayNumber(SOBRIETY_START_DATE));
}

function normalizeBeltLabel(value = '') {
  const label = String(value || '').trim();
  if (!label) return '';
  return label.toLowerCase().startsWith('cinta') ? label : `Cinta ${label}`;
}

function getEntryTimeLabel(entry = {}) {
  return entry.time ? ` · ${entry.time}` : '';
}

function truncateText(value = '', maxLength = 80) {
  const text = String(value || '').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(maxLength - 3, 0)).trim()}...`;
}

function getFoodDisplayName(entry = {}) {
  const mealLabel = mealTypeLabels[entry.mealType] || 'Comida';
  return entry.name ? `${mealLabel}: ${entry.name}` : mealLabel;
}

function getFoodTextSource(entry = {}) {
  return `${entry.name || ''} ${entry.category || ''} ${entry.notes || ''}`.toLowerCase();
}

function hasFoodCompletionSignal(entry = {}) {
  const source = getFoodTextSource(entry);
  return source.includes('completo') || source.includes('completa');
}

function hasHighProteinSignal(entry = {}, protein = null) {
  const source = getFoodTextSource(entry);
  return source.includes('alto en prote') || (protein !== null && protein >= 30);
}

function getFoodShareTitle(entry = {}, isCompleteMeal = false) {
  const mealLabel = mealTypeLabels[entry.mealType] || 'Comida';
  if (String(entry.mealType || '').toLowerCase() === 'desayuno' && isCompleteMeal) return 'Desayuno completo';
  if (isCompleteMeal) return ['Comida', 'Cena'].includes(mealLabel) ? `${mealLabel} completa` : `${mealLabel} completo`;
  return mealLabel === 'Comida' ? 'Comida registrada' : `${mealLabel} registrado`;
}

function summarizeFoodName(name = '') {
  const text = String(name || '').trim();
  if (!text) return '';

  const simplified = text
    .split('+')
    .map((part) => {
      const item = part.trim().toLowerCase();
      if (item.includes('licuado')) return 'Licuado';
      if (item.includes('yogurt griego') && item.includes('fruta')) return 'fruta con yogurt griego';
      if (item.includes('picadillo')) return 'picadillo';
      return part.trim().split(/\s+/).slice(0, 5).join(' ');
    })
    .filter(Boolean)
    .join(' + ');

  return truncateText(simplified || text, 80);
}

function getExerciseDisplayName(entry = {}) {
  const modalityLabel = exerciseModalityLabels[entry.modality] || entry.modality || 'Ejercicio';
  return entry.name ? `${modalityLabel}: ${entry.name}` : modalityLabel;
}

function inferWholeFoodLabel(entry = {}) {
  const source = `${entry.category || ''} ${entry.name || ''} ${entry.notes || ''}`.toLowerCase();
  const wholeFoodTerms = [
    'pollo',
    'pescado',
    'salmon',
    'huevo',
    'claras',
    'verdura',
    'ensalada',
    'espinaca',
    'pepino',
    'chayote',
    'esparrago',
    'aguacate',
    'manzana',
    'kiwi',
    'casero',
    'hecho en casa',
    'whole',
    'natural',
  ];

  return wholeFoodTerms.some((term) => source.includes(term)) ? 'Whole foods' : 'Comida registrada';
}

function getCaloriesPublicValue({ calories, calorieGoal, met }) {
  if (met) return 'Cumplido';
  if (calorieGoal > 0 && calories > calorieGoal) return 'En progreso';
  return 'Pendiente';
}

function getBadgeValue(badge, mode = 'public') {
  return mode === 'personal' ? badge.personalValue : badge.publicValue;
}

function buildBadge({ label, publicValue, personalValue = publicValue, met = false, tone = 'neutral' }) {
  return {
    label,
    publicValue,
    personalValue,
    met: Boolean(met),
    tone,
  };
}

function buildCardContract({
  type,
  availability = 'ready',
  brand = 'BITACORA DANIEL',
  date,
  dateLabel,
  title,
  subtitle,
  primaryMetric,
  primaryMetricLines,
  primaryLabel,
  badges = [],
  footerPhrase,
  privacyLevel = 'public-safe',
  textToCopy,
  defaultTemplateId,
  fallbackNotes = [],
  metadata = {},
}) {
  return {
    type,
    availability,
    brand,
    date,
    dateLabel: dateLabel || formatDateLabel(date),
    title,
    subtitle,
    primaryMetric,
    primaryMetricLines: Array.isArray(primaryMetricLines)
      ? primaryMetricLines.slice(0, 2)
      : undefined,
    primaryLabel,
    mainMetric: primaryMetric,
    message: subtitle,
    badges: badges.slice(0, 4),
    metrics: badges.slice(0, 4),
    footerPhrase,
    privacyLevel,
    textToCopy,
    defaultTemplateId: defaultTemplateId || defaultTemplateByCardType[type],
    fallbackNotes,
    ...metadata,
  };
}

export function getShareTemplatesForType(cardType) {
  return shareProgressTemplates.filter((template) => template.cardType === cardType);
}

export function evaluateShareReadiness(criteria = {}) {
  const checks = [
    criteria.caloriesInGoal,
    criteria.proteinMet,
    criteria.fatWithinLimit,
    criteria.fastingCompleted,
    criteria.hydrationMet,
    criteria.activityLogged,
  ];
  const completedCount = checks.filter(Boolean).length;
  const totalCount = checks.length;

  if (completedCount === totalCount) return 'completed_day';
  if (completedCount >= 4) return 'strong_day';
  return 'in_progress';
}

export function buildDailyShareSummary({
  date,
  todaySummary = {},
  calorieGoal = 0,
  proteinGoal = 0,
  dailyFatLimitGrams = 80,
  hydrationBaseGoal = 0,
  activeFastingReachedGoal = false,
  displayedFastingStatus = '',
  activeFastingElapsedHours = 0,
  profileType = 'fitness-basic',
} = {}) {
  const calories = toNumber(todaySummary.calories);
  const protein = toNumber(todaySummary.protein);
  const fat = toNumber(todaySummary.fat);
  const hydrationMl = toNumber(todaySummary.hydrationMl);
  const exerciseMinutes = toNumber(todaySummary.exerciseMinutes);
  const exerciseCalories = toNumber(todaySummary.exerciseCalories);
  const fastingStatus = String(displayedFastingStatus || todaySummary.fastingStatus || '').toLowerCase();

  const criteria = {
    caloriesInGoal: calorieGoal > 0 && calories > 0 && calories <= calorieGoal,
    proteinMet: proteinGoal > 0 && protein >= proteinGoal,
    fatWithinLimit: dailyFatLimitGrams > 0 && fat <= dailyFatLimitGrams,
    fastingCompleted: activeFastingReachedGoal || fastingStatus === 'cumplido',
    hydrationMet: hydrationBaseGoal > 0 && hydrationMl >= hydrationBaseGoal,
    activityLogged: exerciseMinutes > 0 || exerciseCalories > 0,
  };
  const readiness = evaluateShareReadiness(criteria);
  const completionCount = Object.values(criteria).filter(Boolean).length;
  const completionTotal = Object.keys(criteria).length;
  const fastingHours = toNumber(activeFastingElapsedHours);
  const title = dailyTitleByReadiness[readiness];
  const availability = readiness === 'in_progress' ? 'in_progress' : 'ready';

  const badges = [
    buildBadge({
      label: 'Calorias',
      publicValue: getCaloriesPublicValue({ calories, calorieGoal, met: criteria.caloriesInGoal }),
      personalValue: calorieGoal > 0 ? `${formatNumber(calories)} / ${formatNumber(calorieGoal)} kcal` : `${formatNumber(calories)} kcal`,
      met: criteria.caloriesInGoal,
      tone: criteria.caloriesInGoal ? 'success' : 'warning',
    }),
    buildBadge({
      label: 'Proteina',
      publicValue: criteria.proteinMet ? 'Cumplido' : 'Pendiente',
      personalValue: proteinGoal > 0 ? `${formatNumber(protein, 1)} / ${formatNumber(proteinGoal, 1)} g` : `${formatNumber(protein, 1)} g`,
      met: criteria.proteinMet,
      tone: criteria.proteinMet ? 'success' : 'warning',
    }),
    buildBadge({
      label: 'Ayuno',
      publicValue: criteria.fastingCompleted ? 'Cumplido' : 'En progreso',
      personalValue: fastingHours > 0 ? `${formatNumber(fastingHours, 1)} h` : 'Sin progreso activo',
      met: criteria.fastingCompleted,
      tone: criteria.fastingCompleted ? 'success' : 'neutral',
    }),
    buildBadge({
      label: 'Hidratacion',
      publicValue: criteria.hydrationMet ? 'Cumplido' : 'Pendiente',
      personalValue: hydrationBaseGoal > 0 ? `${formatNumber(hydrationMl)} / ${formatNumber(hydrationBaseGoal)} ml` : `${formatNumber(hydrationMl)} ml`,
      met: criteria.hydrationMet,
      tone: criteria.hydrationMet ? 'success' : 'warning',
    }),
  ];

  return buildCardContract({
    type: 'daily',
    availability,
    date,
    title,
    subtitle: dailyMessageByReadiness[readiness],
    primaryMetric: `${completionCount}/${completionTotal}`,
    primaryMetricLines: [`${completionCount}/${completionTotal}`],
    primaryLabel: 'habitos cumplidos',
    badges,
    footerPhrase: 'La constancia tambien se entrena.',
    privacyLevel: 'public-safe',
    textToCopy: `${title} en Bitacora Daniel: ${completionCount}/${completionTotal} habitos cumplidos. ${dailyMessageByReadiness[readiness]} La constancia tambien se entrena.`,
    defaultTemplateId: defaultTemplateByCardType.daily,
    metadata: {
      profileType,
      readiness,
      completionCount,
      completionTotal,
      criteria,
      hiddenDailyBadges: [
        buildBadge({
          label: 'Grasa',
          publicValue: criteria.fatWithinLimit ? 'Cumplido' : 'En progreso',
          personalValue: `${formatNumber(fat, 1)} / ${formatNumber(dailyFatLimitGrams)} g`,
          met: criteria.fatWithinLimit,
          tone: criteria.fatWithinLimit ? 'success' : 'warning',
        }),
        buildBadge({
          label: 'Actividad',
          publicValue: criteria.activityLogged ? 'Cumplido' : 'Pendiente',
          personalValue: `${formatNumber(exerciseMinutes)} min · ${formatNumber(exerciseCalories)} kcal`,
          met: criteria.activityLogged,
          tone: criteria.activityLogged ? 'success' : 'neutral',
        }),
      ],
    },
  });
}

export function buildPhysicalMilestoneSummary({
  date,
  currentWeight,
  weightGoal,
  bodyFatPercentage,
  targetBodyFat = 10,
} = {}) {
  const safeWeight = toPositiveNumber(currentWeight);
  const safeGoal = toPositiveNumber(weightGoal);
  const safeBodyFat = toPositiveNumber(bodyFatPercentage);
  const weightDelta = safeWeight !== null && safeGoal !== null ? safeWeight - safeGoal : null;
  const distanceLabel = weightDelta !== null
    ? `${formatNumber(Math.abs(weightDelta), 1)} kg ${weightDelta > 0 ? 'por ajustar' : 'de margen'}`
    : 'Sin distancia calculable';
  const hasPhysicalData = safeWeight !== null || safeGoal !== null || safeBodyFat !== null;
  const availability = hasPhysicalData ? 'ready' : 'missing_data_source';

  const badges = [
    buildBadge({
      label: 'Peso objetivo',
      publicValue: 'En seguimiento',
      personalValue: safeGoal !== null ? `${formatNumber(safeGoal, 1)} kg` : 'Sin objetivo',
      met: safeGoal !== null,
      tone: 'neutral',
    }),
    buildBadge({
      label: 'Disciplina',
      publicValue: 'Activa',
      personalValue: 'Activa',
      met: true,
      tone: 'success',
    }),
    buildBadge({
      label: 'Nutricion',
      publicValue: 'En progreso',
      personalValue: 'En progreso',
      met: true,
      tone: 'neutral',
    }),
    buildBadge({
      label: 'Entrenamiento',
      publicValue: 'Constante',
      personalValue: safeWeight !== null ? `Peso actual: ${formatNumber(safeWeight, 1)} kg` : 'Constante',
      met: true,
      tone: 'success',
    }),
  ];

  return buildCardContract({
    type: 'physical',
    availability,
    date,
    title: 'Definicion en progreso',
    subtitle: hasPhysicalData ? 'Mas cerca, mas disciplinado y sin hacer ruido.' : 'Faltan metricas corporales reales para cerrar esta tarjeta.',
    primaryMetric: hasPhysicalData ? 'AVANCE CONSTANTE' : 'POR CONECTAR',
    primaryMetricLines: hasPhysicalData ? ['AVANCE', 'CONSTANTE'] : ['POR', 'CONECTAR'],
    primaryLabel: 'meta fisica',
    badges,
    footerPhrase: 'La constancia tambien se entrena.',
    privacyLevel: 'public-hides-body-data',
    textToCopy: hasPhysicalData
      ? 'Meta fisica en progreso. Mas cerca, mas disciplinado y sin hacer ruido. La constancia tambien se entrena.'
      : 'Meta fisica en preparacion en Bitacora Daniel.',
    defaultTemplateId: defaultTemplateByCardType.physical,
    metadata: {
      personalBadges: [
        buildBadge({
          label: 'Peso actual',
          publicValue: 'Dato privado',
          personalValue: safeWeight !== null ? `${formatNumber(safeWeight, 1)} kg` : 'Sin registro',
          met: safeWeight !== null,
          tone: 'neutral',
        }),
        buildBadge({
          label: 'Objetivo',
          publicValue: 'En seguimiento',
          personalValue: safeGoal !== null ? `${formatNumber(safeGoal, 1)} kg` : 'Sin objetivo',
          met: safeGoal !== null,
          tone: 'neutral',
        }),
        buildBadge({
          label: 'Grasa corporal',
          publicValue: 'Dato privado',
          personalValue: safeBodyFat !== null ? `${formatNumber(safeBodyFat, 1)}%` : 'Sin registro',
          met: safeBodyFat !== null && safeBodyFat <= targetBodyFat,
          tone: safeBodyFat !== null && safeBodyFat <= targetBodyFat ? 'success' : 'neutral',
        }),
        buildBadge({
          label: 'Distancia',
          publicValue: 'Avance constante',
          personalValue: distanceLabel,
          met: weightDelta !== null,
          tone: weightDelta !== null ? 'success' : 'neutral',
        }),
      ],
    },
  });
}

export function buildSobrietyShareSummary({ date, sobrietyStartDate = '', sobrietyDays = null } = {}) {
  const safeDays = toPositiveNumber(sobrietyDays) ?? getSobrietyDays(date || new Date());
  const startDate = sobrietyStartDate || SOBRIETY_START_DATE;

  return buildCardContract({
    type: 'sobriety',
    availability: 'ready',
    date,
    title: 'Sobriedad',
    subtitle: SOBRIETY_START_LABEL,
    primaryMetric: `${formatNumber(safeDays)} DIAS`,
    primaryMetricLines: [`${formatNumber(safeDays)}`, 'DIAS'],
    primaryLabel: 'sobrio',
    badges: [
      buildBadge({
        label: 'Un dia a la vez',
        publicValue: 'Presente',
        personalValue: 'Sin nada que nuble mi sano juicio',
        met: true,
        tone: 'success',
      }),
      buildBadge({
        label: 'Sano juicio',
        publicValue: 'Enfoque',
        personalValue: 'Sano juicio',
        met: true,
        tone: 'success',
      }),
      buildBadge({
        label: 'Constancia',
        publicValue: SOBRIETY_START_LABEL,
        personalValue: `Inicio: ${startDate}`,
        met: true,
        tone: 'neutral',
      }),
    ],
    footerPhrase: 'Un dia a la vez.',
    privacyLevel: 'personal-sensitive',
    textToCopy: `Hoy cumplo ${formatNumber(safeDays)} dias sobrio desde el 28 de diciembre de 2023. Un dia a la vez.`,
    defaultTemplateId: defaultTemplateByCardType.sobriety,
    metadata: {
      sobrietyStartDate: startDate,
      sobrietyStartContext: 'jueves 28 de diciembre de 2023',
    },
  });
}

export function buildKravMagaShareSummary({ date, kravDashboardSnapshot = null } = {}) {
  const progress = Number(kravDashboardSnapshot?.totalProgress);
  const hasProgress = Number.isFinite(progress);
  const currentBelt = normalizeBeltLabel(kravDashboardSnapshot?.currentBelt || '');
  const targetBelt = normalizeBeltLabel(kravDashboardSnapshot?.targetBelt || '');
  const nextTechnique = kravDashboardSnapshot?.nextTechniqueName || '';
  const hasKrav = Boolean(kravDashboardSnapshot?.hasKravProfileData);
  const availability = hasKrav ? 'ready' : 'missing_data_source';

  return buildCardContract({
    type: 'krav',
    availability,
    date,
    title: hasKrav ? 'Progreso Krav Maga' : 'Krav Maga en preparacion',
    subtitle: hasKrav && targetBelt ? `Camino a ${targetBelt.toLowerCase()}.` : 'Por registrar datos de Krav Maga para este perfil.',
    primaryMetric: currentBelt || 'POR REGISTRAR',
    primaryMetricLines: currentBelt
      ? String(currentBelt).toUpperCase().split(/\s+/).slice(0, 2)
      : ['POR', 'REGISTRAR'],
    primaryLabel: targetBelt ? `objetivo: ${targetBelt.toLowerCase()}` : 'cinta actual',
    badges: [
      buildBadge({
        label: 'Cinta actual',
        publicValue: currentBelt || 'Pendiente',
        personalValue: currentBelt || 'Pendiente',
        met: Boolean(currentBelt),
        tone: 'success',
      }),
      buildBadge({
        label: 'Objetivo',
        publicValue: targetBelt ? `Camino a ${targetBelt.toLowerCase()}` : 'Pendiente',
        personalValue: targetBelt || 'Pendiente',
        met: Boolean(targetBelt),
        tone: 'success',
      }),
      buildBadge({
        label: 'Avance',
        publicValue: hasProgress ? 'En avance' : 'Pendiente',
        personalValue: hasProgress ? `${formatNumber(progress)}%` : 'Sin porcentaje',
        met: hasProgress && progress > 0,
        tone: hasProgress ? 'success' : 'neutral',
      }),
      buildBadge({
        label: 'Proxima tecnica',
        publicValue: nextTechnique ? 'Tecnica prioritaria' : 'Tecnica pendiente de conectar',
        personalValue: nextTechnique || 'Tecnica pendiente de conectar',
        met: Boolean(nextTechnique),
        tone: 'neutral',
      }),
    ],
    footerPhrase: 'Tecnica limpia. Control primero. Progreso real.',
    privacyLevel: 'public-safe',
    textToCopy: hasKrav
      ? `Progreso Krav Maga: ${currentBelt || 'cinta actual'}${targetBelt ? `, camino a ${targetBelt.toLowerCase()}` : ''}. Tecnica limpia. Control primero.`
      : 'Krav Maga en preparacion. Falta conectar curriculo activo.',
    defaultTemplateId: defaultTemplateByCardType.krav,
  });
}

export function buildMonthlyShareSummary({ date } = {}) {
  return buildCardContract({
    type: 'monthly',
    availability: 'missing_data_source',
    date,
    dateLabel: formatMonthLabel(date),
    title: 'Resumen mensual',
    subtitle: 'Se activara cuando existan metricas mensuales reales.',
    primaryMetric: 'POR CONECTAR',
    primaryMetricLines: ['POR', 'CONECTAR'],
    primaryLabel: 'agregados mensuales',
    badges: [
      buildBadge({
        label: 'Faltan agregados',
        publicValue: 'Por conectar',
        personalValue: 'Metricas mensuales reales pendientes',
        met: false,
        tone: 'neutral',
      }),
      buildBadge({
        label: 'Entrenamiento',
        publicValue: 'Por conectar',
        personalValue: 'Por conectar',
        met: false,
        tone: 'neutral',
      }),
      buildBadge({
        label: 'Enfoque',
        publicValue: 'En preparacion',
        personalValue: 'En preparacion',
        met: false,
        tone: 'neutral',
      }),
    ],
    footerPhrase: 'Nutricion, entrenamiento y enfoque.',
    privacyLevel: 'public-safe',
    textToCopy: 'Resumen mensual en preparacion. Falta conectar metricas mensuales reales.',
    defaultTemplateId: defaultTemplateByCardType.monthly,
    fallbackNotes: ['Faltan agregados mensuales estructurados para mostrar numeros reales.'],
  });
}

function buildFoodShareSummary({ date, entry, index = 0 } = {}) {
  if (!entry) {
    return buildCardContract({
      type: 'food',
      availability: 'no_record_today',
      date,
      title: 'Sin comida registrada',
      subtitle: 'No hay comida registrada hoy. Ve a Alimentacion, registra una comida y vuelve para compartirla.',
      primaryMetric: 'Sin registro',
      primaryMetricLines: ['SIN', 'REGISTRO'],
      primaryLabel: 'registro de comida',
      badges: [
        buildBadge({
          label: 'Comida',
          publicValue: 'Sin registro',
          personalValue: 'Sin registro',
          met: false,
        }),
      ],
      footerPhrase: 'La constancia tambien se cocina.',
      privacyLevel: 'public-safe',
      textToCopy: 'No hay comida registrada hoy. Ve a Alimentacion, registra una comida y vuelve para compartirla.',
      defaultTemplateId: defaultTemplateByCardType.food,
      fallbackNotes: ['No hay comida registrada hoy. Ve a Alimentacion, registra una comida y vuelve para compartirla.'],
    });
  }

  const calories = toPositiveNumber(entry.calories);
  const protein = toPositiveNumber(entry.protein);
  const carbs = toPositiveNumber(entry.carbs);
  const fat = toPositiveNumber(entry.fat);
  const displayName = getFoodDisplayName(entry);
  const summarizedName = summarizeFoodName(entry.name);
  const visualDisplayName = summarizedName
    ? `${mealTypeLabels[entry.mealType] || 'Comida'}: ${summarizedName}`
    : truncateText(displayName, 80);
  const wholeFoodLabel = inferWholeFoodLabel(entry);
  const hasProtein = protein !== null && protein > 0;
  const hasEnergy = calories !== null && calories > 0;
  const isCompleteMeal = (hasProtein && hasEnergy) || hasFoodCompletionSignal(entry);
  const highProtein = hasHighProteinSignal(entry, protein);
  const caffeine = toPositiveNumber(entry.caffeineMg);
  const cost = toPositiveNumber(entry.costMxn);
  const mealLabel = mealTypeLabels[entry.mealType] || 'Comida';
  const availability = 'ready';

  return buildCardContract({
    type: 'food',
    availability,
    date: entry.date || date,
    title: getFoodShareTitle(entry, isCompleteMeal),
    subtitle: visualDisplayName,
    primaryMetric: isCompleteMeal ? 'COMIDA COMPLETA' : 'COMIDA REGISTRADA',
    primaryMetricLines: isCompleteMeal ? ['COMIDA', 'COMPLETA'] : ['COMIDA', 'REGISTRADA'],
    primaryLabel: 'Bitacora Daniel',
    badges: [
      buildBadge({
        label: highProtein ? 'Alto en proteina' : 'Proteina',
        publicValue: highProtein ? 'Si' : hasProtein ? 'Presente' : 'Registrada',
        personalValue: protein !== null ? `${formatNumber(protein, 1)} g` : 'Sin dato',
        met: hasProtein,
        tone: hasProtein ? 'success' : 'neutral',
      }),
      buildBadge({
        label: 'Calidad',
        publicValue: isCompleteMeal ? 'Comida completa' : wholeFoodLabel,
        personalValue: isCompleteMeal ? 'Comida completa' : wholeFoodLabel,
        met: isCompleteMeal || wholeFoodLabel === 'Whole foods',
        tone: isCompleteMeal || wholeFoodLabel === 'Whole foods' ? 'success' : 'neutral',
      }),
      buildBadge({
        label: 'Tipo',
        publicValue: mealLabel,
        personalValue: mealLabel,
        met: Boolean(entry.mealType),
        tone: 'neutral',
      }),
      buildBadge({
        label: caffeine !== null ? 'Cafeina' : 'Hecho en casa',
        publicValue: caffeine !== null ? 'Registrada' : String(`${entry.notes || ''} ${entry.category || ''}`).toLowerCase().includes('casa') ? 'Probable' : 'No especificado',
        personalValue: caffeine !== null ? `${formatNumber(caffeine)} mg` : entry.notes || entry.category || 'No especificado',
        met: caffeine !== null || String(`${entry.notes || ''} ${entry.category || ''}`).toLowerCase().includes('casa'),
        tone: 'neutral',
      }),
    ],
    footerPhrase: 'La constancia tambien se cocina.',
    privacyLevel: 'public-hides-food-detail',
    textToCopy: hasProtein
      ? 'Comida bien hecha en Bitacora Daniel. Proteina, disciplina y comida real. La constancia tambien se cocina.'
      : 'Comida registrada en Bitacora Daniel. Registro hecho, decision por decision.',
    defaultTemplateId: defaultTemplateByCardType.food,
    metadata: {
      id: entry.id || `food-${index}`,
      optionLabel: truncateText(`${mealTypeLabels[entry.mealType] || 'Comida'}${entry.name ? ` · ${entry.name}` : ''}${getEntryTimeLabel(entry)}`, 96),
      personalTextToCopy: [
        `Comida registrada: ${entry.name || mealLabel}.`,
        calories !== null ? `${formatNumber(calories)} kcal` : 'kcal sin dato',
        protein !== null ? `${formatNumber(protein, 1)} g proteina` : 'proteina sin dato',
        carbs !== null ? `${formatNumber(carbs, 1)} g carbs` : 'carbs sin dato',
        fat !== null ? `${formatNumber(fat, 1)} g grasa` : 'grasa sin dato',
        caffeine !== null ? `${formatNumber(caffeine)} mg cafeina` : '',
        cost !== null ? `$${formatNumber(cost, 2)} MXN` : '',
        entry.notes ? `Notas: ${entry.notes}` : '',
      ].filter(Boolean).join(' · '),
      macroBadges: [
        buildBadge({
          label: 'Energia',
          publicValue: calories !== null ? `${formatNumber(calories)} kcal` : 'Sin dato',
          personalValue: calories !== null ? `${formatNumber(calories)} kcal` : 'Sin dato',
          met: calories !== null,
          tone: calories !== null ? 'success' : 'neutral',
        }),
        buildBadge({
          label: 'Proteina',
          publicValue: protein !== null ? `${formatNumber(protein, 1)} g` : 'Sin dato',
          personalValue: protein !== null ? `${formatNumber(protein, 1)} g` : 'Sin dato',
          met: protein !== null,
          tone: protein !== null ? 'success' : 'neutral',
        }),
        buildBadge({
          label: 'Carbs',
          publicValue: carbs !== null ? `${formatNumber(carbs, 1)} g` : 'Sin dato',
          personalValue: carbs !== null ? `${formatNumber(carbs, 1)} g` : 'Sin dato',
          met: carbs !== null,
          tone: 'neutral',
        }),
        buildBadge({
          label: 'Grasa',
          publicValue: fat !== null ? `${formatNumber(fat, 1)} g` : 'Sin dato',
          personalValue: fat !== null ? `${formatNumber(fat, 1)} g` : 'Sin dato',
          met: fat !== null,
          tone: 'neutral',
        }),
      ],
      personalBadges: [
        buildBadge({
          label: 'Energia',
          publicValue: 'Dato privado',
          personalValue: calories !== null ? `${formatNumber(calories)} kcal` : 'Sin dato',
          met: calories !== null,
          tone: 'success',
        }),
        buildBadge({
          label: 'Proteina',
          publicValue: 'Dato privado',
          personalValue: protein !== null ? `${formatNumber(protein, 1)} g` : 'Sin dato',
          met: protein !== null,
          tone: protein !== null ? 'success' : 'neutral',
        }),
        buildBadge({
          label: 'Carbs / grasa',
          publicValue: 'Dato privado',
          personalValue: `${carbs !== null ? `${formatNumber(carbs, 1)} g C` : 'C --'} · ${fat !== null ? `${formatNumber(fat, 1)} g G` : 'G --'}`,
          met: carbs !== null || fat !== null,
          tone: 'neutral',
        }),
        buildBadge({
          label: caffeine !== null ? 'Cafeina' : 'Notas',
          publicValue: 'Dato privado',
          personalValue: `${carbs !== null ? `${formatNumber(carbs, 1)} g C` : 'C --'} · ${fat !== null ? `${formatNumber(fat, 1)} g G` : 'G --'}`,
          met: carbs !== null || fat !== null,
          tone: 'neutral',
        }),
      ],
    },
  });
}

export function buildFoodShareSummaryGroup({ date, foods = [] } = {}) {
  const entries = Array.isArray(foods) ? foods.filter((item) => item && item.mealType !== 'bebida') : [];
  const options = entries.map((entry, index) => buildFoodShareSummary({ date, entry, index }));

  if (options.length === 0) {
    return buildFoodShareSummary({ date });
  }

  const fallback = options[options.length - 1] || options[0];
  return {
    ...fallback,
    availability: 'ready',
    primaryMetric: options.length === 1 ? fallback.primaryMetric : `${options.length} registros`,
    primaryLabel: options.length === 1 ? fallback.primaryLabel : 'comidas hoy',
    options,
  };
}

function buildExerciseShareSummary({ date, entry, index = 0 } = {}) {
  if (!entry) {
    return buildCardContract({
      type: 'exercise',
      availability: 'no_record_today',
      date,
      title: 'Sin ejercicio registrado',
      subtitle: 'No hay ejercicio registrado hoy. Registra una sesion de entrenamiento y vuelve para compartirla.',
      primaryMetric: 'Sin registro',
      primaryMetricLines: ['SIN', 'REGISTRO'],
      primaryLabel: 'sesion',
      badges: [
        buildBadge({
          label: 'Ejercicio',
          publicValue: 'Sin registro',
          personalValue: 'Sin registro',
          met: false,
        }),
      ],
      footerPhrase: 'La constancia tambien se entrena.',
      privacyLevel: 'public-safe',
      textToCopy: 'No hay ejercicio registrado hoy. Registra una sesion de entrenamiento y vuelve para compartirla.',
      defaultTemplateId: defaultTemplateByCardType.exercise,
      fallbackNotes: ['No hay ejercicio registrado hoy. Registra una sesion de entrenamiento y vuelve para compartirla.'],
    });
  }

  const duration = toPositiveNumber(entry.duration);
  const calories = toPositiveNumber(entry.caloriesBurned);
  const distance = toPositiveNumber(entry.distance);
  const modality = exerciseModalityLabels[entry.modality] || entry.modality || 'Ejercicio';
  const title = duration !== null ? 'Entrenamiento completado' : 'Sesion registrada';

  return buildCardContract({
    type: 'exercise',
    availability: 'ready',
    date: entry.date || date,
    title,
    subtitle: getExerciseDisplayName(entry),
    primaryMetric: duration !== null ? `${formatNumber(duration)} min` : 'Sesion completa',
    primaryMetricLines: duration !== null ? [`${formatNumber(duration)}`, 'MIN'] : ['SESION', 'COMPLETA'],
    primaryLabel: modality,
    badges: [
      buildBadge({
        label: 'Actividad',
        publicValue: modality,
        personalValue: getExerciseDisplayName(entry),
        met: true,
        tone: 'success',
      }),
      buildBadge({
        label: 'Duracion',
        publicValue: duration !== null ? `${formatNumber(duration)} min` : 'Registrada',
        personalValue: duration !== null ? `${formatNumber(duration)} min` : 'Sin dato',
        met: duration !== null,
        tone: duration !== null ? 'success' : 'neutral',
      }),
      buildBadge({
        label: 'Calorias',
        publicValue: calories !== null ? 'Registradas' : 'Pendiente',
        personalValue: calories !== null ? `${formatNumber(calories)} kcal` : 'Sin dato',
        met: calories !== null,
        tone: calories !== null ? 'success' : 'neutral',
      }),
      buildBadge({
        label: 'Intensidad',
        publicValue: entry.intensity || 'No especificada',
        personalValue: truncateText(entry.notes || entry.intensity || 'No especificada', 80),
        met: Boolean(entry.intensity),
        tone: 'neutral',
      }),
    ],
    footerPhrase: 'La constancia tambien se entrena.',
    privacyLevel: 'public-safe',
    textToCopy: duration !== null
      ? `Entrenamiento completado. ${formatNumber(duration)} min de ${modality}. Movimiento, disciplina y enfoque. La constancia tambien se entrena.`
      : 'Sesion registrada. Movimiento, disciplina y enfoque. La constancia tambien se entrena.',
    defaultTemplateId: defaultTemplateByCardType.exercise,
    metadata: {
      id: entry.id || `exercise-${index}`,
      optionLabel: truncateText(`${modality}${entry.name ? ` · ${entry.name}` : ''}${getEntryTimeLabel(entry)}`, 96),
      personalTextToCopy: `Sesion registrada: ${duration !== null ? `${formatNumber(duration)} min` : 'duracion sin dato'}, ${modality}, ${calories !== null ? `${formatNumber(calories)} kcal estimadas` : 'calorias sin dato'}${entry.notes ? ` y notas: ${entry.notes}` : ''}. Un paso mas.`,
      personalBadges: [
        buildBadge({
          label: 'Actividad',
          publicValue: modality,
          personalValue: getExerciseDisplayName(entry),
          met: true,
          tone: 'success',
        }),
        buildBadge({
          label: 'Duracion',
          publicValue: duration !== null ? `${formatNumber(duration)} min` : 'Registrada',
          personalValue: duration !== null ? `${formatNumber(duration)} min` : 'Sin dato',
          met: duration !== null,
          tone: duration !== null ? 'success' : 'neutral',
        }),
        buildBadge({
          label: 'Calorias',
          publicValue: 'Dato opcional',
          personalValue: calories !== null ? `${formatNumber(calories)} kcal` : 'Sin dato',
          met: calories !== null,
          tone: 'neutral',
        }),
        buildBadge({
          label: 'Distancia / notas',
          publicValue: 'Detalle personal',
          personalValue: distance !== null ? `${formatNumber(distance, 2)} ${entry.distanceUnit || ''}` : truncateText(entry.notes || 'Sin notas', 80),
          met: distance !== null || Boolean(entry.notes),
          tone: 'neutral',
        }),
      ],
    },
  });
}

export function buildExerciseShareSummaryGroup({ date, exercises = [] } = {}) {
  const entries = Array.isArray(exercises) ? exercises.filter(Boolean) : [];
  const options = entries.map((entry, index) => buildExerciseShareSummary({ date, entry, index }));

  if (options.length === 0) {
    return buildExerciseShareSummary({ date });
  }

  const fallback = options[options.length - 1] || options[0];
  return {
    ...fallback,
    availability: 'ready',
    primaryMetric: options.length === 1 ? fallback.primaryMetric : `${options.length} sesiones`,
    primaryLabel: options.length === 1 ? fallback.primaryLabel : 'ejercicio hoy',
    options,
  };
}

function getBadgesForMode(summary = {}, mode = 'public', detailLevel = 'discreet') {
  if (mode === 'personal' && summary.type === 'food' && Array.isArray(summary.macroBadges) && summary.macroBadges.length > 0) {
    return summary.macroBadges.slice(0, 4);
  }

  if (mode === 'personal' && Array.isArray(summary.personalBadges) && summary.personalBadges.length > 0) {
    return summary.personalBadges.slice(0, 4);
  }

  if (mode === 'public' && detailLevel === 'macros' && Array.isArray(summary.macroBadges) && summary.macroBadges.length > 0) {
    return summary.macroBadges.slice(0, 4);
  }

  return (summary.badges || summary.metrics || []).slice(0, 4);
}

export function buildShareCardText(summary = {}, { mode = 'public', templateId, detailLevel = 'discreet' } = {}) {
  const template =
    shareProgressTemplates.find((item) => item.id === templateId) ||
    shareProgressTemplates.find((item) => item.id === summary.defaultTemplateId) ||
    shareProgressTemplates[0];
  const badges = getBadgesForMode(summary, mode, detailLevel).map((badge) => `${badge.label}: ${getBadgeValue(badge, mode)}`);

  if (summary.availability === 'missing_data_source' || summary.availability === 'no_record_today') {
    return [
      `${summary.brand || 'BITACORA DANIEL'} · ${template.label}`,
      summary.title,
      summary.subtitle,
      '',
      summary.availability === 'no_record_today' ? 'Pendiente para generar tarjeta:' : 'Pendiente antes de compartir:',
      ...(summary.fallbackNotes || ['Falta conectar una fuente real.']),
    ].filter(Boolean).join('\n');
  }

  if (mode === 'personal' && summary.personalTextToCopy) return summary.personalTextToCopy;

  return summary.textToCopy || [
    `${summary.title} en Bitacora Daniel: ${summary.primaryMetric} ${summary.primaryLabel}.`,
    summary.subtitle,
    badges.length ? badges.join(' · ') : '',
    template.phrase || summary.footerPhrase,
  ].filter(Boolean).join(' ');
}

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wrapText(value = '', maxLength = 32, maxLines = 3) {
  const words = String(value || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const safeWord = word.length > maxLength ? truncateText(word, maxLength) : word;
    const next = current ? `${current} ${safeWord}` : safeWord;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = safeWord;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;

  const visibleLines = lines.slice(0, maxLines);
  visibleLines[visibleLines.length - 1] = truncateText(visibleLines[visibleLines.length - 1], maxLength);
  return visibleLines;
}

function getPalette(templateId = '') {
  if (templateId.includes('completed')) return ['#10291f', '#2f7d4f', '#f5f4eb', '#d6a94f'];
  if (templateId.includes('physical')) return ['#13232b', '#425a55', '#f5efe3', '#d7b46a'];
  if (templateId.includes('sobriety')) return ['#101c2a', '#315f8c', '#f2f5f7', '#c9d8e8'];
  if (templateId.includes('krav')) return ['#23150d', '#c46d2d', '#fff4e7', '#2f7d4f'];
  if (templateId.includes('monthly')) return ['#17202a', '#614d35', '#f8efe2', '#d7b46a'];
  if (templateId.includes('food')) return ['#1d2a21', '#5c6b3b', '#fff7e8', '#e0b968'];
  if (templateId.includes('exercise')) return ['#14202b', '#2d5f73', '#f3fbff', '#79c7d3'];
  return ['#121f26', '#27433e', '#f5efe3', '#d7b46a'];
}

export function buildShareCardSvg(summary = {}, options = {}) {
  const { mode = 'public', templateId, photoDataUrl = '', detailLevel = 'discreet' } = options;
  const template =
    shareProgressTemplates.find((item) => item.id === templateId) ||
    shareProgressTemplates.find((item) => item.id === summary.defaultTemplateId) ||
    shareProgressTemplates[0];
  const badges = getBadgesForMode(summary, mode, detailLevel);
  const [bgA, bgB, textLight, accent] = getPalette(template.id);
  const hasPhoto = Boolean(photoDataUrl && summary.type === 'food');
  const subtitleLines = wrapText(summary.subtitle || '', 34, 3);
  const phraseLines = wrapText(template.phrase || summary.footerPhrase, 32, 2);
  const titleLines = wrapText(summary.title || 'Compartir progreso', 18, 2);
  const metricLines = Array.isArray(summary.primaryMetricLines) && summary.primaryMetricLines.length > 0
    ? summary.primaryMetricLines.slice(0, 2).map((line) => truncateText(line, 16))
    : wrapText(summary.primaryMetric || '', 18, 2);
  const titleFontSize = String(summary.title || '').length > 28 ? 62 : 76;
  const metricFontSize = String(summary.primaryMetric || '').length > 18 ? 70 : 84;
  const contentOffset = hasPhoto ? 190 : 0;
  const badgeRows = badges.map((badge, index) => {
    const y = 980 + contentOffset + index * 118;
    const valueLines = wrapText(getBadgeValue(badge, mode), 24, 1);
    return `
      <g>
        <rect x="105" y="${y}" width="870" height="90" rx="28" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.28)" />
        <circle cx="150" cy="${y + 46}" r="15" fill="${badge.met ? accent : 'rgba(255,255,255,0.38)'}" />
        <text x="190" y="${y + 39}" fill="${textLight}" font-size="32" font-weight="900">${escapeXml(badge.label)}</text>
        ${valueLines.map((line) => `<text x="190" y="${y + 73}" fill="rgba(255,255,255,0.86)" font-size="28" font-weight="700">${escapeXml(line)}</text>`).join('')}
      </g>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bgA}" />
        <stop offset="100%" stop-color="${bgB}" />
      </linearGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity="0.25" />
      </filter>
    </defs>
    <rect width="1080" height="1920" fill="url(#bg)" />
    <circle cx="930" cy="150" r="260" fill="rgba(255,255,255,0.08)" />
    <circle cx="120" cy="1750" r="330" fill="rgba(255,255,255,0.07)" />
    <rect x="70" y="90" width="940" height="1740" rx="58" fill="rgba(10,18,22,0.24)" stroke="rgba(255,255,255,0.24)" filter="url(#softShadow)" />
    ${hasPhoto ? `<image href="${escapeXml(photoDataUrl)}" x="105" y="280" width="870" height="360" preserveAspectRatio="xMidYMid slice" opacity="0.88" /><rect x="105" y="280" width="870" height="360" fill="rgba(0,0,0,0.16)" />` : ''}
    <text x="105" y="180" fill="${textLight}" font-size="38" font-weight="900" letter-spacing="4">${escapeXml(summary.brand || 'BITACORA DANIEL')}</text>
    <text x="105" y="238" fill="rgba(255,255,255,0.82)" font-size="30" font-weight="700">${escapeXml(summary.dateLabel || '')}</text>
    ${titleLines.map((line, index) => `<text x="105" y="${365 + contentOffset + index * (titleFontSize + 8)}" fill="#ffffff" font-size="${titleFontSize}" font-weight="950">${escapeXml(line)}</text>`).join('')}
    ${metricLines.map((line, index) => `<text x="105" y="${570 + contentOffset + index * (metricFontSize + 8)}" fill="${accent}" font-size="${metricFontSize}" font-weight="950">${escapeXml(line)}</text>`).join('')}
    <text x="105" y="${745 + contentOffset}" fill="rgba(255,255,255,0.9)" font-size="34" font-weight="900">${escapeXml(summary.primaryLabel || '')}</text>
    ${subtitleLines.map((line, index) => `<text x="105" y="${820 + contentOffset + index * 42}" fill="rgba(255,255,255,0.88)" font-size="32" font-weight="700">${escapeXml(line)}</text>`).join('')}
    ${badgeRows}
    ${phraseLines.map((line, index) => `<text x="105" y="${1660 + index * 50}" fill="#ffffff" font-size="42" font-weight="900">${escapeXml(line)}</text>`).join('')}
    <text x="105" y="1778" fill="rgba(255,255,255,0.68)" font-size="27" font-weight="700">Generado localmente · Compartir manual</text>
  </svg>`;
}

export async function createShareCardPngBlob(summary = {}, options = {}) {
  const svg = buildShareCardSvg(summary, options);
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    image.decoding = 'async';
    const loaded = new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    image.src = url;
    await loaded;

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);

    return await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
