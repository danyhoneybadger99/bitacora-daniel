export const shareProgressCardTypes = [
  { id: 'daily', label: 'Disciplina diaria', group: 'achievements' },
  { id: 'physical', label: 'Hito fisico', group: 'achievements' },
  { id: 'krav', label: 'Krav Maga', group: 'achievements' },
  { id: 'sobriety', label: 'Sobriedad', group: 'achievements' },
  { id: 'food', label: 'Alimentacion', group: 'daily_post' },
  { id: 'exercise', label: 'Ejercicio', group: 'daily_post' },
  { id: 'monthly', label: 'Resumen mensual', group: 'preparation' },
];

export const SOBRIETY_START_DATE = '2023-12-28';
export const SOBRIETY_START_LABEL = 'Sobrio desde el 28 de diciembre de 2023';

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
  under_construction: 'En construccion',
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
    phrase: 'Control primero. Progreso real.',
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
  badgeLimit = 4,
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
    badgeLimit,
    footerPhrase,
    privacyLevel,
    textToCopy,
    defaultTemplateId: defaultTemplateId || defaultTemplateByCardType[type],
    fallbackNotes,
    ...metadata,
  };
}

function getBeltName(value = '') {
  return String(value || '').replace(/^cinta\s+/i, '').trim();
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
  const isCompleteDay = completionCount === completionTotal;
  const isShareReady = completionCount >= 5;
  const title = isCompleteDay ? 'Dia cumplido' : isShareReady ? 'Dia fuerte' : 'Dia en construccion';
  const subtitle = isCompleteDay
    ? 'Disciplina completa.'
    : isShareReady
      ? 'Buen avance. El dia ya tiene base para compartirse.'
      : 'Todavia se esta construyendo el dia.';
  const availability = isShareReady ? 'ready' : 'under_construction';
  const primaryLabel = isShareReady ? 'habitos cumplidos' : 'habitos activos';

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
    subtitle,
    primaryMetric: `${completionCount}/${completionTotal}`,
    primaryMetricLines: [`${completionCount}/${completionTotal}`],
    primaryLabel,
    badges,
    footerPhrase: isCompleteDay ? 'Disciplina completa.' : isShareReady ? 'La constancia tambien se entrena.' : 'Todavia se esta construyendo el dia.',
    privacyLevel: 'public-safe',
    textToCopy: `${title} en Bitacora Daniel: ${completionCount}/${completionTotal} ${primaryLabel}. ${subtitle}`,
    defaultTemplateId: defaultTemplateByCardType.daily,
    fallbackNotes: ['Llega a 5/6 habitos para desbloquear Descargar y Compartir.'],
    metadata: {
      eyebrow: 'DISCIPLINA DIARIA',
      headline: title,
      heroValue: `${completionCount}/${completionTotal}`,
      heroUnit: isShareReady ? 'HABITOS' : 'HABITOS ACTIVOS',
      contextLine: subtitle,
      storyLine: isCompleteDay ? 'Disciplina completa.' : isShareReady ? 'La constancia tambien se entrena.' : 'Todavia se esta construyendo el dia.',
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
  skeletalMuscleMass,
  targetBodyFat = 10,
} = {}) {
  const safeWeight = toPositiveNumber(currentWeight);
  const safeGoal = toPositiveNumber(weightGoal);
  const safeBodyFat = toPositiveNumber(bodyFatPercentage);
  const safeMuscleMass = toPositiveNumber(skeletalMuscleMass);
  const weightDelta = safeWeight !== null && safeGoal !== null ? safeWeight - safeGoal : null;
  const distanceToGoal = weightDelta !== null ? Math.max(weightDelta, 0) : null;
  const distanceLabel = distanceToGoal !== null ? `${formatNumber(distanceToGoal, 1)} kg` : 'Sin distancia calculable';
  const hasPhysicalData = safeWeight !== null && safeGoal !== null;
  const availability = hasPhysicalData ? 'ready' : 'missing_data_source';
  const badges = [
    safeWeight !== null ? buildBadge({
      label: 'Actual',
      publicValue: `${formatNumber(safeWeight, 1)} kg actual`,
      personalValue: `${formatNumber(safeWeight, 1)} kg actual`,
      met: true,
      tone: 'success',
    }) : null,
    safeBodyFat !== null ? buildBadge({
      label: 'Grasa',
      publicValue: `${formatNumber(safeBodyFat, 1)}% grasa`,
      personalValue: `${formatNumber(safeBodyFat, 1)}% grasa`,
      met: safeBodyFat <= targetBodyFat,
      tone: safeBodyFat <= targetBodyFat ? 'success' : 'neutral',
    }) : null,
    safeMuscleMass !== null ? buildBadge({
      label: 'Musculo',
      publicValue: `${formatNumber(safeMuscleMass, 1)} kg musculo`,
      personalValue: `${formatNumber(safeMuscleMass, 1)} kg musculo`,
      met: true,
      tone: 'success',
    }) : null,
  ].filter(Boolean);

  return buildCardContract({
    type: 'physical',
    availability,
    date,
    title: hasPhysicalData ? 'Meta fisica cerca' : 'Falta dato corporal',
    subtitle: hasPhysicalData ? `Rumbo a ${formatNumber(safeGoal, 1)} kg` : 'Faltan peso actual y peso objetivo para crear esta tarjeta.',
    primaryMetric: hasPhysicalData ? distanceLabel : 'FALTA DATO',
    primaryMetricLines: hasPhysicalData ? [distanceLabel] : ['FALTA', 'DATO'],
    primaryLabel: hasPhysicalData ? 'para meta' : 'corporal',
    badges,
    footerPhrase: 'La constancia tambien se entrena.',
    privacyLevel: 'public-body-data-allowed',
    textToCopy: hasPhysicalData
      ? `Meta fisica cerca: ${distanceLabel} para llegar a ${formatNumber(safeGoal, 1)} kg. Peso actual ${formatNumber(safeWeight, 1)} kg${safeBodyFat !== null ? `, grasa ${formatNumber(safeBodyFat, 1)}%` : ''}${safeMuscleMass !== null ? `, musculo ${formatNumber(safeMuscleMass, 1)} kg` : ''}.`
      : 'Falta dato corporal para compartir hito fisico en Bitacora Daniel.',
    defaultTemplateId: defaultTemplateByCardType.physical,
    fallbackNotes: ['Faltan peso actual y peso objetivo reales.'],
    metadata: {
      eyebrow: 'META FISICA',
      headline: hasPhysicalData ? 'Cada kilo cuenta' : 'Falta dato corporal',
      heroValue: hasPhysicalData ? formatNumber(distanceToGoal, 1) : 'FALTA',
      heroUnit: hasPhysicalData ? 'KG PARA META' : 'DATO CORPORAL',
      contextLine: hasPhysicalData ? `${formatNumber(safeWeight, 1)} kg actual · objetivo ${formatNumber(safeGoal, 1)} kg` : 'Agrega peso actual y objetivo.',
      storyLine: 'La constancia tambien se entrena.',
      personalBadges: [
        buildBadge({
          label: 'Peso actual',
          publicValue: safeWeight !== null ? `${formatNumber(safeWeight, 1)} kg` : 'Sin registro',
          personalValue: safeWeight !== null ? `${formatNumber(safeWeight, 1)} kg` : 'Sin registro',
          met: safeWeight !== null,
          tone: 'neutral',
        }),
        buildBadge({
          label: 'Objetivo',
          publicValue: safeGoal !== null ? `${formatNumber(safeGoal, 1)} kg` : 'Sin objetivo',
          personalValue: safeGoal !== null ? `${formatNumber(safeGoal, 1)} kg` : 'Sin objetivo',
          met: safeGoal !== null,
          tone: 'neutral',
        }),
        buildBadge({
          label: 'Grasa corporal',
          publicValue: safeBodyFat !== null ? `${formatNumber(safeBodyFat, 1)}%` : 'Sin registro',
          personalValue: safeBodyFat !== null ? `${formatNumber(safeBodyFat, 1)}%` : 'Sin registro',
          met: safeBodyFat !== null && safeBodyFat <= targetBodyFat,
          tone: safeBodyFat !== null && safeBodyFat <= targetBodyFat ? 'success' : 'neutral',
        }),
        buildBadge({
          label: 'Distancia',
          publicValue: distanceLabel,
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
        label: 'Presente',
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
      eyebrow: 'SANO JUICIO',
      headline: 'Sobriedad',
      heroValue: formatNumber(safeDays),
      heroUnit: 'DÍAS',
      contextLine: 'Desde el 28 de diciembre de 2023',
      storyLine: 'Hoy tambien elijo seguir.',
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
  const currentBeltName = getBeltName(currentBelt);
  const targetBeltName = getBeltName(targetBelt);
  const nextTechnique = kravDashboardSnapshot?.nextTechniqueName || '';
  const pendingTechniques = Number(kravDashboardSnapshot?.pendingTechniques);
  const hasPendingTechniques = Number.isFinite(pendingTechniques);
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
    primaryLabel: targetBelt ? `camino a ${targetBelt.toLowerCase()}` : 'cinta actual',
    badges: [
      buildBadge({
        label: 'Avance',
        publicValue: hasProgress ? `${formatNumber(progress)}%` : 'Pendiente',
        personalValue: hasProgress ? `${formatNumber(progress)}%` : 'Sin porcentaje',
        met: hasProgress && progress > 0,
        tone: hasProgress ? 'success' : 'neutral',
      }),
      nextTechnique ? buildBadge({
        label: 'Proxima',
        publicValue: truncateText(nextTechnique, 34),
        personalValue: nextTechnique,
        met: Boolean(nextTechnique),
        tone: 'neutral',
      }) : null,
      hasPendingTechniques ? buildBadge({
        label: 'Por dominar',
        publicValue: `${formatNumber(pendingTechniques)} tecnicas`,
        personalValue: `${formatNumber(pendingTechniques)} tecnicas por dominar`,
        met: pendingTechniques === 0,
        tone: pendingTechniques === 0 ? 'success' : 'neutral',
      }) : null,
      buildBadge({
        label: 'Cinta actual',
        publicValue: currentBelt || 'Pendiente',
        personalValue: currentBelt || 'Pendiente',
        met: Boolean(currentBelt),
        tone: 'success',
      }),
    ].filter(Boolean),
    footerPhrase: 'Control primero. Progreso real.',
    privacyLevel: 'public-safe',
    textToCopy: hasKrav
      ? `Progreso Krav Maga: ${currentBelt || 'cinta actual'}${targetBelt ? `, camino a ${targetBelt.toLowerCase()}` : ''}. Control primero. Progreso real.`
      : 'Krav Maga en preparacion. Falta conectar curriculo activo.',
    defaultTemplateId: defaultTemplateByCardType.krav,
    metadata: {
      eyebrow: targetBeltName ? `CAMINO A CINTA ${targetBeltName.toUpperCase()}` : 'KRAV MAGA',
      headline: hasKrav ? 'Progreso Krav Maga' : 'Krav Maga por registrar',
      heroValue: currentBeltName ? 'CINTA' : 'POR',
      heroUnit: currentBeltName ? currentBeltName.toUpperCase() : 'REGISTRAR',
      contextLine: hasKrav && targetBeltName ? `Camino a cinta ${targetBeltName.toLowerCase()}` : 'Control primero. Progreso real.',
      storyLine: 'Control primero. Progreso real.',
    },
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
  const homeSignal = String(`${entry.notes || ''} ${entry.category || ''}`).toLowerCase().includes('casa');
  const macroContextLine = [
    calories !== null ? `${formatNumber(calories)} kcal` : '',
    carbs !== null ? `${formatNumber(carbs, 0)}C` : '',
    fat !== null ? `${formatNumber(fat, 0)}G` : '',
  ].filter(Boolean).join(' · ');
  const discreetBadges = [
    highProtein ? buildBadge({
      label: 'Alto en proteina',
      publicValue: protein !== null ? `${formatNumber(protein, 0)} g` : 'Registrada',
      personalValue: protein !== null ? `${formatNumber(protein, 1)} g` : 'Registrada',
      met: true,
      tone: 'success',
    }) : hasProtein ? buildBadge({
      label: 'Proteina',
      publicValue: 'Presente',
      personalValue: `${formatNumber(protein, 1)} g`,
      met: true,
      tone: 'success',
    }) : null,
    isCompleteMeal ? buildBadge({
      label: 'Comida completa',
      publicValue: 'Registrada',
      personalValue: 'Comida completa',
      met: true,
      tone: 'success',
    }) : null,
    homeSignal ? buildBadge({
      label: 'Hecho en casa',
      publicValue: 'Registrada',
      personalValue: entry.notes || entry.category || 'Hecho en casa',
      met: true,
      tone: 'success',
    }) : null,
  ].filter(Boolean);
  if (discreetBadges.length === 0) {
    discreetBadges.push(buildBadge({
      label: 'Comida',
      publicValue: 'Registrada',
      personalValue: mealLabel,
      met: true,
      tone: 'neutral',
    }));
  }
  const availability = 'ready';

  return buildCardContract({
    type: 'food',
    availability,
    date: entry.date || date,
    title: getFoodShareTitle(entry, isCompleteMeal),
    subtitle: visualDisplayName,
    primaryMetric: highProtein ? 'ALTO EN PROTEINA' : isCompleteMeal ? 'COMIDA COMPLETA' : 'COMIDA REGISTRADA',
    primaryMetricLines: highProtein ? ['ALTO EN', 'PROTEINA'] : isCompleteMeal ? ['COMIDA', 'COMPLETA'] : ['COMIDA', 'REGISTRADA'],
    primaryLabel: 'Bitacora Daniel',
    badges: discreetBadges,
    badgeLimit: 3,
    footerPhrase: 'La constancia tambien se cocina.',
    privacyLevel: 'public-hides-food-detail',
    textToCopy: hasProtein
      ? 'Comida bien hecha en Bitacora Daniel. Proteina, disciplina y comida real. La constancia tambien se cocina.'
      : 'Comida registrada en Bitacora Daniel. Registro hecho, decision por decision.',
    defaultTemplateId: defaultTemplateByCardType.food,
    metadata: {
      id: entry.id || `food-${index}`,
      eyebrow: `${mealLabel.toUpperCase()} DE DEFINICION`,
      headline: getFoodShareTitle(entry, isCompleteMeal),
      heroValue: highProtein ? 'ALTO EN' : 'COMIDA',
      heroUnit: highProtein ? 'PROTEINA' : isCompleteMeal ? 'COMPLETA' : 'REGISTRADA',
      contextLine: hasEnergy ? `${formatNumber(calories)} kcal registradas` : 'Registro de comida real',
      description: visualDisplayName,
      storyLine: 'La constancia tambien se cocina.',
      macroHeroValue: protein !== null && protein >= 60
        ? formatNumber(protein, 0)
        : calories !== null
          ? formatNumber(calories)
          : 'MACROS',
      macroHeroUnit: protein !== null && protein >= 60 ? 'G PROTEINA' : calories !== null ? 'KCAL' : 'REGISTRADOS',
      macroContextLine: macroContextLine || 'Macros registrados',
      macroCaption: `${mealLabel} de definicion: ${protein !== null ? `${formatNumber(protein, 0)} g de proteina` : 'proteina registrada'}${calories !== null ? `, ${formatNumber(calories)} kcal` : ''} y comida completa. La constancia tambien se cocina.`,
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
      macroPrimaryMetricLines: protein !== null
        ? [`${formatNumber(protein, 0)} G`, 'PROTEINA']
        : calories !== null
          ? [`${formatNumber(calories)}`, 'KCAL']
          : undefined,
      macroBadges: [
        calories !== null ? buildBadge({
          label: 'Energia',
          publicValue: `${formatNumber(calories)} kcal`,
          personalValue: `${formatNumber(calories)} kcal`,
          met: true,
          tone: 'success',
        }) : null,
        protein !== null ? buildBadge({
          label: 'Proteina',
          publicValue: `${formatNumber(protein, 1)} g`,
          personalValue: `${formatNumber(protein, 1)} g`,
          met: true,
          tone: 'success',
        }) : null,
        carbs !== null ? buildBadge({
          label: 'Carbs',
          publicValue: `${formatNumber(carbs, 1)} g`,
          personalValue: `${formatNumber(carbs, 1)} g`,
          met: true,
          tone: 'neutral',
        }) : null,
        fat !== null ? buildBadge({
          label: 'Grasa',
          publicValue: `${formatNumber(fat, 1)} g`,
          personalValue: `${formatNumber(fat, 1)} g`,
          met: true,
          tone: 'neutral',
        }) : null,
        caffeine !== null ? buildBadge({
          label: 'Cafeina',
          publicValue: `${formatNumber(caffeine)} mg`,
          personalValue: `${formatNumber(caffeine)} mg`,
          met: true,
          tone: 'neutral',
        }) : null,
      ].filter(Boolean),
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
  const sessionName = truncateText(entry.name || modality, 42);
  const intensityLabel = entry.intensity ? truncateText(entry.intensity, 28) : '';
  const subtitle = [entry.name ? sessionName : modality, intensityLabel].filter(Boolean).join(' • ');
  const title = duration !== null ? 'Entrenamiento completado' : 'Sesion registrada';
  const useCaloriesHero = calories !== null && calories > 0;
  const exerciseBadges = [
    duration !== null ? buildBadge({
      label: 'Duracion',
      publicValue: `${formatNumber(duration)} min`,
      personalValue: `${formatNumber(duration)} min`,
      met: true,
      tone: 'success',
    }) : null,
    buildBadge({
      label: 'Actividad',
      publicValue: sessionName,
      personalValue: sessionName,
      met: true,
      tone: 'success',
    }),
    entry.intensity ? buildBadge({
      label: 'Intensidad',
      publicValue: truncateText(entry.intensity, 28),
      personalValue: truncateText(entry.intensity, 40),
      met: true,
      tone: 'neutral',
    }) : null,
    distance !== null ? buildBadge({
      label: 'Distancia',
      publicValue: `${formatNumber(distance, 2)} ${entry.distanceUnit || ''}`.trim(),
      personalValue: `${formatNumber(distance, 2)} ${entry.distanceUnit || ''}`.trim(),
      met: true,
      tone: 'neutral',
    }) : null,
    !entry.intensity && !distance && entry.notes ? buildBadge({
      label: 'Nota',
      publicValue: truncateText(entry.notes, 34),
      personalValue: truncateText(entry.notes, 80),
      met: true,
      tone: 'neutral',
    }) : null,
  ].filter(Boolean).slice(0, 4);

  return buildCardContract({
    type: 'exercise',
    availability: 'ready',
    date: entry.date || date,
    title,
    subtitle,
    primaryMetric: useCaloriesHero ? `${formatNumber(calories)} kcal` : duration !== null ? `${formatNumber(duration)} min` : 'Sesion completa',
    primaryMetricLines: useCaloriesHero
      ? [`${formatNumber(calories)}`, 'KCAL']
      : duration !== null
        ? [`${formatNumber(duration)}`, 'MIN']
        : ['SESION', 'COMPLETA'],
    primaryLabel: useCaloriesHero ? 'quemadas' : 'entrenados',
    badges: exerciseBadges,
    badgeLimit: 4,
    footerPhrase: 'La constancia tambien se entrena.',
    privacyLevel: 'public-safe',
    textToCopy: duration !== null
      ? `Entrenamiento completado. ${formatNumber(duration)} min de ${modality}. Movimiento, disciplina y enfoque. La constancia tambien se entrena.`
      : 'Sesion registrada. Movimiento, disciplina y enfoque. La constancia tambien se entrena.',
    defaultTemplateId: defaultTemplateByCardType.exercise,
    metadata: {
      id: entry.id || `exercise-${index}`,
      caption: `${modality} completado: ${duration !== null ? `${formatNumber(duration)} min` : 'sesion registrada'}${entry.intensity ? `, intensidad ${String(entry.intensity).toLowerCase()}` : ''}${calories !== null ? ` y ${formatNumber(calories)} kcal quemadas` : ''}. La constancia tambien se entrena.`,
      eyebrow: 'ENTRENAMIENTO DEL DIA',
      headline: modality === 'Krav Maga' ? 'Krav Maga completado' : 'Entrenamiento completado',
      heroValue: useCaloriesHero ? formatNumber(calories) : duration !== null ? formatNumber(duration) : 'SESION',
      heroUnit: useCaloriesHero ? 'KCAL QUEMADAS' : duration !== null ? 'MIN ENTRENADOS' : 'COMPLETA',
      contextLine: [
        duration !== null ? `${formatNumber(duration)} min` : '',
        entry.intensity ? `intensidad ${String(entry.intensity).toLowerCase()}` : '',
      ].filter(Boolean).join(' · ') || modality,
      description: truncateText(entry.notes || sessionName, 80),
      storyLine: 'La constancia tambien se entrena.',
      optionLabel: truncateText(`${modality}${entry.name ? ` · ${entry.name}` : ''}${getEntryTimeLabel(entry)}`, 96),
      personalTextToCopy: `Sesion registrada: ${duration !== null ? `${formatNumber(duration)} min` : 'duracion sin dato'}, ${modality}, ${calories !== null ? `${formatNumber(calories)} kcal estimadas` : 'calorias sin dato'}${entry.notes ? ` y notas: ${entry.notes}` : ''}. Un paso mas.`,
      personalBadges: [
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
  const badgeLimit = Number.isFinite(Number(summary.badgeLimit)) ? Number(summary.badgeLimit) : 4;

  if (mode === 'personal' && summary.type === 'food' && Array.isArray(summary.macroBadges) && summary.macroBadges.length > 0) {
    return summary.macroBadges.slice(0, 4);
  }

  if (mode === 'personal' && Array.isArray(summary.personalBadges) && summary.personalBadges.length > 0) {
    return summary.personalBadges.slice(0, 4);
  }

  if (mode === 'public' && detailLevel === 'macros' && Array.isArray(summary.macroBadges) && summary.macroBadges.length > 0) {
    return summary.macroBadges.slice(0, 4);
  }

  return (summary.badges || summary.metrics || []).slice(0, badgeLimit);
}

export function getShareStoryVisual(summary = {}, { detailLevel = 'discreet' } = {}) {
  const useFoodMacros = summary.type === 'food' && detailLevel === 'macros';
  const metricLineSource = useFoodMacros && Array.isArray(summary.macroPrimaryMetricLines)
    ? summary.macroPrimaryMetricLines
    : summary.primaryMetricLines;
  const metricLines = Array.isArray(metricLineSource) && metricLineSource.length > 0
    ? metricLineSource.slice(0, 2)
    : [summary.primaryMetric || ''];
  const heroValue = useFoodMacros && summary.macroHeroValue ? summary.macroHeroValue : summary.heroValue || metricLines[0] || '';
  const heroUnit = useFoodMacros && summary.macroHeroUnit ? summary.macroHeroUnit : summary.heroUnit || metricLines.slice(1).join(' ') || summary.primaryLabel || '';

  return {
    eyebrow: summary.eyebrow || summary.brand || 'BITACORA DANIEL',
    headline: summary.headline || summary.title || 'Compartir progreso',
    heroValue,
    heroUnit,
    contextLine: useFoodMacros && summary.macroContextLine ? summary.macroContextLine : summary.contextLine || summary.subtitle || '',
    description: summary.description || summary.subtitle || '',
    storyLine: summary.storyLine || summary.footerPhrase || 'La constancia tambien se entrena.',
  };
}

export function buildShareCardText(summary = {}, { mode = 'public', templateId, detailLevel = 'discreet' } = {}) {
  const template =
    shareProgressTemplates.find((item) => item.id === templateId) ||
    shareProgressTemplates.find((item) => item.id === summary.defaultTemplateId) ||
    shareProgressTemplates[0];
  const badges = getBadgesForMode(summary, mode, detailLevel).map((badge) => `${badge.label}: ${getBadgeValue(badge, mode)}`);

  if (summary.availability === 'missing_data_source' || summary.availability === 'no_record_today' || summary.availability === 'under_construction') {
    return [
      `${summary.brand || 'BITACORA DANIEL'} · ${template.label}`,
      summary.title,
      summary.subtitle,
      '',
      summary.availability === 'no_record_today'
        ? 'Pendiente para generar tarjeta:'
        : summary.availability === 'under_construction'
          ? 'En construccion:'
          : 'Pendiente antes de compartir:',
      ...(summary.fallbackNotes || ['Falta conectar una fuente real.']),
    ].filter(Boolean).join('\n');
  }

  if (mode === 'personal' && summary.personalTextToCopy) return summary.personalTextToCopy;
  if (summary.type === 'food' && detailLevel === 'macros' && summary.macroCaption) return summary.macroCaption;
  if (summary.caption) return summary.caption;

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
  const visual = getShareStoryVisual(summary, { detailLevel });
  const [bgA, bgB, textLight, accent] = getPalette(template.id);
  const hasPhoto = Boolean(photoDataUrl && summary.type === 'food');
  const contextLines = wrapText(visual.contextLine || '', 34, 2);
  const descriptionLines = wrapText(visual.description || '', 34, 2);
  const phraseLines = wrapText(visual.storyLine || template.phrase || summary.footerPhrase, 32, 2);
  const titleLines = wrapText(visual.headline || 'Compartir progreso', 18, 2);
  const metricLines = wrapText(visual.heroValue || '', 14, 2);
  const titleFontSize = String(visual.headline || '').length > 28 ? 62 : 76;
  const metricFontSize = String(visual.heroValue || '').length > 8 ? 90 : 132;
  const contentOffset = hasPhoto ? 250 : 0;
  const badgeRows = badges.map((badge, index) => {
    const y = (hasPhoto ? 1210 : 1030) + index * (hasPhoto ? 92 : 108);
    const valueLines = wrapText(getBadgeValue(badge, mode), 24, 1);
    return `
      <g>
        <rect x="105" y="${y}" width="870" height="${hasPhoto ? 74 : 86}" rx="26" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.28)" />
        <circle cx="150" cy="${y + (hasPhoto ? 38 : 44)}" r="14" fill="${badge.met ? accent : 'rgba(255,255,255,0.38)'}" />
        <text x="190" y="${y + (hasPhoto ? 32 : 37)}" fill="${textLight}" font-size="${hasPhoto ? 28 : 32}" font-weight="900">${escapeXml(badge.label)}</text>
        ${valueLines.map((line) => `<text x="190" y="${y + (hasPhoto ? 60 : 70)}" fill="rgba(255,255,255,0.86)" font-size="${hasPhoto ? 25 : 28}" font-weight="700">${escapeXml(line)}</text>`).join('')}
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
    ${hasPhoto ? `<image href="${escapeXml(photoDataUrl)}" x="105" y="260" width="870" height="500" preserveAspectRatio="xMidYMid slice" opacity="0.9" /><rect x="105" y="260" width="870" height="500" fill="rgba(0,0,0,0.22)" />` : ''}
    <text x="105" y="180" fill="${textLight}" font-size="34" font-weight="900" letter-spacing="4">${escapeXml(visual.eyebrow || 'BITACORA DANIEL')}</text>
    <text x="105" y="238" fill="rgba(255,255,255,0.82)" font-size="30" font-weight="700">${escapeXml(summary.dateLabel || '')}</text>
    ${titleLines.map((line, index) => `<text x="105" y="${365 + contentOffset + index * (titleFontSize + 8)}" fill="#ffffff" font-size="${titleFontSize}" font-weight="950">${escapeXml(line)}</text>`).join('')}
    ${metricLines.map((line, index) => `<text x="105" y="${570 + contentOffset + index * (metricFontSize + 8)}" fill="${accent}" font-size="${metricFontSize}" font-weight="950">${escapeXml(line)}</text>`).join('')}
    <text x="105" y="${745 + contentOffset}" fill="rgba(255,255,255,0.9)" font-size="34" font-weight="900">${escapeXml(visual.heroUnit || '')}</text>
    ${contextLines.map((line, index) => `<text x="105" y="${815 + contentOffset + index * 42}" fill="rgba(255,255,255,0.9)" font-size="32" font-weight="800">${escapeXml(line)}</text>`).join('')}
    ${descriptionLines.map((line, index) => `<text x="105" y="${905 + contentOffset + index * 38}" fill="rgba(255,255,255,0.74)" font-size="28" font-weight="700">${escapeXml(line)}</text>`).join('')}
    ${badgeRows}
    ${phraseLines.map((line, index) => `<text x="105" y="${1660 + index * 50}" fill="#ffffff" font-size="42" font-weight="900">${escapeXml(line)}</text>`).join('')}
    <text x="105" y="1778" fill="rgba(255,255,255,0.68)" font-size="27" font-weight="700">Bitácora Daniel</text>
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
