import { getToday, normalizeDateString } from '../date';

export const kravCategoryLabels = {
  striking: 'Striking',
  'defensa-personal': 'Defensa personal',
  distancias: 'Distancias',
  grappling: 'Grappling',
  sparring: 'Sparring',
  acondicionamiento: 'Acondicionamiento',
};

export const kravStageLabels = {
  etapa1: 'Etapa 1',
  etapa2: 'Etapa 2',
  etapa3: 'Etapa 3',
};

export const kravCoachOptions = [
  { value: 'oseas-tonche', label: 'Oseas Tonche' },
  { value: 'jesus', label: 'Jesús' },
  { value: 'otro', label: 'Otro' },
];

function slugify(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createTechnique({ name, category, stage, description = '', tips = '', videoUrl = '' }) {
  return {
    id: `krav-${stage}-${slugify(name)}`,
    name,
    category,
    stage,
    description,
    tips,
    videoUrl,
    level: 0,
    lastPracticedAt: '',
    notes: '',
    isExamRelevant: true,
  };
}

const orangeCurriculumSeed = [
  createTechnique({ name: 'Guardia con golpeo 1-2', category: 'striking', stage: 'etapa1', description: 'Base de guardia con golpeo recto para activar postura, distancia y línea ofensiva.', tips: 'Cuida base, barbilla abajo y regreso rápido a guardia.' }),
  createTechnique({ name: 'Guardia con desplaces y golpeo 1-2', category: 'striking', stage: 'etapa1', description: 'Secuencia de guardia con desplazamiento y golpeo recto 1-2.', tips: 'Desplaza primero y golpea sin cruzar pies.' }),
  createTechnique({ name: 'Frente', category: 'acondicionamiento', stage: 'etapa1', description: 'Trabajo base de frente y orientación corporal.', tips: 'Mantén eje, mirada al frente y peso equilibrado.' }),
  createTechnique({ name: 'Espalda', category: 'acondicionamiento', stage: 'etapa1', description: 'Trabajo base de control corporal hacia espalda.', tips: 'Haz el cambio con control y no sacrifiques postura.' }),
  createTechnique({ name: 'Codazos ambos brazos', category: 'striking', stage: 'etapa1', description: 'Serie de codazos básicos con ambos brazos.', tips: 'Gira cadera y mantiene hombros protegidos.' }),
  createTechnique({ name: 'Rodilla frontal ambas piernas', category: 'striking', stage: 'etapa1', description: 'Rodilla frontal con ambas piernas.', tips: 'Sube la rodilla con cadera y controla la base.' }),
  createTechnique({ name: 'Patada frontal ambas piernas', category: 'striking', stage: 'etapa1', description: 'Patada frontal con ambas piernas.', tips: 'Recoge rápido y vuelve a guardia.' }),
  createTechnique({ name: 'Romper caída frente', category: 'acondicionamiento', stage: 'etapa1', description: 'Caída frontal segura y controlada.', tips: 'Absorbe con manos y antebrazos sin colapsar cuello.' }),
  createTechnique({ name: 'Romper caída espalda suave', category: 'acondicionamiento', stage: 'etapa1', description: 'Caída de espalda suave con técnica básica.', tips: 'Redondea espalda y protege cabeza.' }),
  createTechnique({ name: 'Romper caída espalda duro', category: 'acondicionamiento', stage: 'etapa1', description: 'Caída de espalda con mayor impacto y control.', tips: 'Exhala y golpea el piso de forma controlada.' }),
  createTechnique({ name: 'Puentes', category: 'grappling', stage: 'etapa1', description: 'Puentes para movilidad y escape en piso.', tips: 'Carga hombros y proyecta cadera.' }),
  createTechnique({ name: 'Camarones', category: 'grappling', stage: 'etapa1', description: 'Movimiento de camarón para ganar espacio.', tips: 'Empuja con el pie y separa cadera del rival.' }),
  createTechnique({ name: 'Arm drag', category: 'grappling', stage: 'etapa1', description: 'Entrada básica de arm drag.', tips: 'Jala pegado al cuerpo y gana ángulo.' }),
  createTechnique({ name: 'Pummeling', category: 'grappling', stage: 'etapa1', description: 'Pummeling para pelea de agarres y control interno.', tips: 'Mantén ritmo, postura y conexión de hombros.' }),
  createTechnique({ name: 'Codazos horizontales frontal', category: 'striking', stage: 'etapa1', description: 'Codazo horizontal frontal.', tips: 'Gira cadera y conecta con línea corta.' }),
  createTechnique({ name: 'Codazos horizontales lateral', category: 'striking', stage: 'etapa1', description: 'Codazo horizontal lateral.', tips: 'Alinea hombro y codo con el objetivo.' }),
  createTechnique({ name: 'Codazos horizontales trasero', category: 'striking', stage: 'etapa1', description: 'Codazo horizontal trasero.', tips: 'Mira antes de girar y regresa a base.' }),
  createTechnique({ name: 'Codazos verticales abajo atrás', category: 'striking', stage: 'etapa1', description: 'Codazo vertical abajo atrás.', tips: 'Conecta tronco y cadera para que no salga solo brazo.' }),
  createTechnique({ name: 'Codazos verticales arriba', category: 'striking', stage: 'etapa1', description: 'Codazo vertical hacia arriba.', tips: 'Sube con trayectoria corta y compacta.' }),
  createTechnique({ name: 'Codazos verticales atrás', category: 'striking', stage: 'etapa1', description: 'Codazo vertical hacia atrás.', tips: 'Marca el giro con control del centro.' }),
  createTechnique({ name: 'Codazos verticales ascendente', category: 'striking', stage: 'etapa1', description: 'Codazo vertical ascendente.', tips: 'Explota desde piernas y tronco.' }),
  createTechnique({ name: 'Codazos verticales descendente', category: 'striking', stage: 'etapa1', description: 'Codazo vertical descendente.', tips: 'Baja con peso corporal sin perder guardia.' }),
  createTechnique({ name: '360 con contraataque', category: 'defensa-personal', stage: 'etapa1', description: 'Defensa 360 básica con respuesta inmediata.', tips: 'Bloquea limpio y contraataca sin pausar.' }),

  createTechnique({ name: 'Defensa interna simultáneo arriba', category: 'defensa-personal', stage: 'etapa2', description: 'Defensa interna simultánea alta.', tips: 'Sincroniza defensa y respuesta ofensiva.' }),
  createTechnique({ name: 'Defensa interna simultáneo abajo', category: 'defensa-personal', stage: 'etapa2', description: 'Defensa interna simultánea baja.', tips: 'Cuida línea media y recupera posición.' }),
  createTechnique({ name: 'Defensa interna uno y medio', category: 'defensa-personal', stage: 'etapa2', description: 'Defensa interna uno y medio.', tips: 'Marca tiempo y ángulo antes del contraataque.' }),
  createTechnique({ name: 'Defensa interna esquivando', category: 'defensa-personal', stage: 'etapa2', description: 'Defensa interna con esquiva.', tips: 'Evita quedarte en línea después de defender.' }),
  createTechnique({ name: 'Defensa interna izquierda vs izquierda', category: 'defensa-personal', stage: 'etapa2', description: 'Variante izquierda contra izquierda.', tips: 'Coordina hombro, cadera y guardia opuesta.' }),
  createTechnique({ name: 'Distancia empujando', category: 'distancias', stage: 'etapa2', description: 'Control de distancia empujando.', tips: 'Empuja con estructura, no solo con brazos.' }),
  createTechnique({ name: 'Distancia uno y medio', category: 'distancias', stage: 'etapa2', description: 'Manejo de distancia uno y medio.', tips: 'Usa el paso para recuperar ángulo y espacio.' }),
  createTechnique({ name: 'Distancia doble under-hook', category: 'distancias', stage: 'etapa2', description: 'Control de distancia con doble under-hook.', tips: 'Aprieta codos y domina pecho a pecho.' }),
  createTechnique({ name: 'Derribo de una pierna', category: 'grappling', stage: 'etapa2', description: 'Entrada básica a derribo de una pierna.', tips: 'Entra abajo, cabeza pegada y termina el ángulo.' }),
  createTechnique({ name: 'Golpes curvos defensa de casco', category: 'defensa-personal', stage: 'etapa2', description: 'Defensa tipo casco contra golpes curvos.', tips: 'Cierra bien estructura y responde rápido.' }),
  createTechnique({ name: 'Golpes curvos abajo', category: 'defensa-personal', stage: 'etapa2', description: 'Defensa baja ante golpes curvos.', tips: 'No inclines el torso de más; mantén base.' }),
  createTechnique({ name: 'Golpes curvos esquivando', category: 'defensa-personal', stage: 'etapa2', description: 'Defensa ante curvos con esquiva.', tips: 'Esquiva corta y salida con contraataque.' }),
  createTechnique({ name: 'Abrazo de oso frente brazos atrapados', category: 'defensa-personal', stage: 'etapa2', description: 'Salida ante abrazo de oso al frente con brazos atrapados.', tips: 'Primero base, luego espacio y escape.' }),
  createTechnique({ name: 'Abrazo de oso frente brazos libres', category: 'defensa-personal', stage: 'etapa2', description: 'Salida ante abrazo de oso al frente con brazos libres.', tips: 'Usa brazos para crear marco y romper postura.' }),
  createTechnique({ name: 'Abrazo de oso espalda brazos atrapados arriba', category: 'defensa-personal', stage: 'etapa2', description: 'Salida ante abrazo de oso por la espalda con brazos atrapados arriba.', tips: 'Baja centro de gravedad y rompe control.' }),
  createTechnique({ name: 'Abrazo de oso espalda brazos atrapados abajo', category: 'defensa-personal', stage: 'etapa2', description: 'Salida ante abrazo de oso por la espalda con brazos atrapados abajo.', tips: 'Trabaja base y giro de cadera.' }),
  createTechnique({ name: 'Candado de cuello intento de mata-león', category: 'defensa-personal', stage: 'etapa2', description: 'Defensa ante intento de mata-león.', tips: 'Protege cuello primero y gana giro.' }),
  createTechnique({ name: 'Guillotina', category: 'grappling', stage: 'etapa2', description: 'Defensa o manejo de guillotina.', tips: 'Controla postura y manos antes de salir.' }),
  createTechnique({ name: 'Candado lateral de cuello a tiempo', category: 'defensa-personal', stage: 'etapa2', description: 'Salida a tiempo de candado lateral de cuello.', tips: 'Reconoce entrada temprano y corta base.' }),
  createTechnique({ name: 'Candado lateral de cuello tardío', category: 'defensa-personal', stage: 'etapa2', description: 'Salida tardía de candado lateral de cuello.', tips: 'Prioriza respiración, base y ángulo de escape.' }),

  createTechnique({ name: 'Sombra ofensivo', category: 'sparring', stage: 'etapa3', description: 'Sombra con intención ofensiva.', tips: 'Marca ritmo, entradas y desplazamiento real.' }),
  createTechnique({ name: 'Sombra defensivo', category: 'sparring', stage: 'etapa3', description: 'Sombra con enfoque defensivo.', tips: 'Trabaja reacción, guardia y timing.' }),
  createTechnique({ name: 'Golpeo 1-10', category: 'striking', stage: 'etapa3', description: 'Secuencia de golpeo del 1 al 10.', tips: 'Prioriza orden, fluidez y retorno a guardia.' }),
  createTechnique({ name: 'Slips', category: 'striking', stage: 'etapa3', description: 'Slips básicos de boxeo.', tips: 'Mueve cabeza sin romper postura ni base.' }),
  createTechnique({ name: 'Unders', category: 'striking', stage: 'etapa3', description: 'Unders para esquiva y transición.', tips: 'Baja centro con piernas, no solo con cintura.' }),
  createTechnique({ name: 'Combo holandés', category: 'striking', stage: 'etapa3', description: 'Combinación holandesa.', tips: 'Ordena manos y patada con ritmo sostenido.' }),
  createTechnique({ name: 'Serie de codos 1', category: 'striking', stage: 'etapa3', description: 'Serie de codos uno.', tips: 'Trabaja cambios de línea y recuperación rápida.' }),
  createTechnique({ name: 'Combo sensei', category: 'striking', stage: 'etapa3', description: 'Combinación sensei.', tips: 'No corras la secuencia; prioriza limpieza.' }),
  createTechnique({ name: 'Boxeo sin patadas', category: 'sparring', stage: 'etapa3', description: 'Trabajo de boxeo limitado sin patadas.', tips: 'Usa volumen y lectura de distancia.' }),
  createTechnique({ name: 'Boxeo sin codos', category: 'sparring', stage: 'etapa3', description: 'Trabajo de boxeo limitado sin codos.', tips: 'Mantén criterio táctico con las reglas del drill.' }),
  createTechnique({ name: 'Boxeo sin rodillas', category: 'sparring', stage: 'etapa3', description: 'Trabajo de boxeo limitado sin rodillas.', tips: 'Cambia guardias y entradas sin romper estructura.' }),
  createTechnique({ name: 'Boxeo sin derribos', category: 'sparring', stage: 'etapa3', description: 'Trabajo de boxeo limitado sin derribos.', tips: 'Sostén el intercambio sin buscar piso.' }),
  createTechnique({ name: 'Grappling dominar posición', category: 'grappling', stage: 'etapa3', description: 'Control de posición dominante en grappling.', tips: 'Piensa primero en controlar antes de finalizar.' }),
];

export function createOrangeKravCurriculum() {
  return orangeCurriculumSeed.map((item) => ({ ...item }));
}

export function mergeOrangeKravCurriculum(existing = []) {
  const current = Array.isArray(existing) ? existing : [];
  const seeded = createOrangeKravCurriculum();
  const merged = [...current];

  seeded.forEach((seedTechnique) => {
    const existingIndex = merged.findIndex(
      (item) => item?.id === seedTechnique.id || slugify(item?.name || '') === slugify(seedTechnique.name)
    );

    if (existingIndex >= 0) {
      const currentTechnique = merged[existingIndex];
      merged[existingIndex] = {
        ...currentTechnique,
        id: currentTechnique.id || seedTechnique.id,
        name: currentTechnique.name || seedTechnique.name,
        category: currentTechnique.category || seedTechnique.category,
        stage: currentTechnique.stage || seedTechnique.stage,
        description: currentTechnique.description || seedTechnique.description,
        tips: currentTechnique.tips || seedTechnique.tips,
        videoUrl: currentTechnique.videoUrl || seedTechnique.videoUrl,
        level: Number.isFinite(Number(currentTechnique.level)) ? Number(currentTechnique.level) : seedTechnique.level,
        lastPracticedAt: normalizeDateString(currentTechnique.lastPracticedAt) || seedTechnique.lastPracticedAt,
        notes: currentTechnique.notes || seedTechnique.notes,
        isExamRelevant:
          typeof currentTechnique.isExamRelevant === 'boolean' ? currentTechnique.isExamRelevant : seedTechnique.isExamRelevant,
      };
      return;
    }

    merged.push(seedTechnique);
  });

  return merged;
}

export function createEmptyKravPracticeLog() {
  return {
    date: getToday(),
    coach: 'oseas-tonche',
    coachCustomName: '',
    techniqueIds: [],
    sparring: 'no',
    observations: '',
    mistakes: '',
    reviewNeeded: '',
  };
}

export function createEmptyKravSettings() {
  return {
    currentBelt: 'amarilla',
    targetBelt: 'naranja',
    examDate: '',
    forgottenThresholdDays: '5',
  };
}

export function getKravTechniqueProgress(level) {
  const safeLevel = Math.min(Math.max(Number(level) || 0, 0), 4);
  return (safeLevel / 4) * 100;
}

export function getDaysSincePractice(lastPracticedAt, referenceDate = getToday()) {
  const normalizedLast = normalizeDateString(lastPracticedAt);
  const normalizedReference = normalizeDateString(referenceDate);
  if (!normalizedReference) return null;
  if (!normalizedLast) return null;

  const start = new Date(`${normalizedLast}T12:00:00`);
  const end = new Date(`${normalizedReference}T12:00:00`);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(Math.round(diffMs / 86400000), 0);
}

export function buildKravProgress(curriculum = []) {
  const items = Array.isArray(curriculum) ? curriculum : [];
  const categories = ['striking', 'defensa-personal', 'grappling', 'sparring'];
  const categoryProgress = categories.reduce((accumulator, category) => {
    const categoryItems = items.filter((item) => item.category === category);
    const average =
      categoryItems.length > 0
        ? categoryItems.reduce((sum, item) => sum + getKravTechniqueProgress(item.level), 0) / categoryItems.length
        : 0;
    accumulator[category] = average;
    return accumulator;
  }, {});

  const totalProgress =
    items.length > 0 ? items.reduce((sum, item) => sum + getKravTechniqueProgress(item.level), 0) / items.length : 0;

  return {
    totalProgress,
    categoryProgress,
  };
}

export function getNextKravTechnique(curriculum = [], referenceDate = getToday()) {
  const items = Array.isArray(curriculum) ? [...curriculum] : [];
  if (items.length === 0) return null;

  return items
    .map((item) => ({
      ...item,
      daysSincePractice: getDaysSincePractice(item.lastPracticedAt, referenceDate),
    }))
    .sort((a, b) => {
      const levelDifference = (Number(a.level) || 0) - (Number(b.level) || 0);
      if (levelDifference !== 0) return levelDifference;

      const daysA = a.daysSincePractice === null ? Number.MAX_SAFE_INTEGER : a.daysSincePractice;
      const daysB = b.daysSincePractice === null ? Number.MAX_SAFE_INTEGER : b.daysSincePractice;
      if (daysA !== daysB) return daysB - daysA;

      if (a.stage !== b.stage) return String(a.stage).localeCompare(String(b.stage), 'es-MX');
      return String(a.name).localeCompare(String(b.name), 'es-MX');
    })[0];
}

export function buildKravExamStatus(curriculum = [], settings = {}, referenceDate = getToday()) {
  const items = Array.isArray(curriculum) ? curriculum : [];
  const threshold = Math.max(Number(settings?.forgottenThresholdDays) || 5, 1);
  const averageLevel =
    items.length > 0 ? items.reduce((sum, item) => sum + Math.min(Math.max(Number(item.level) || 0, 0), 4), 0) / items.length : 0;
  const pendingTechniques = items.filter((item) => (Number(item.level) || 0) < 3).length;
  const lowTechniques = items.filter((item) => (Number(item.level) || 0) <= 1).length;
  const forgottenTechniques = items.filter((item) => {
    const days = getDaysSincePractice(item.lastPracticedAt, referenceDate);
    return days === null || days >= threshold;
  }).length;

  const status =
    averageLevel > 3 ? 'listo' : averageLevel >= 2 ? 'riesgo-medio' : 'riesgo-alto';

  return {
    averageLevel,
    pendingTechniques,
    lowTechniques,
    forgottenTechniques,
    status,
  };
}

export function buildKravAlerts(curriculum = [], settings = {}, referenceDate = getToday()) {
  const items = Array.isArray(curriculum) ? curriculum : [];
  const threshold = Math.max(Number(settings?.forgottenThresholdDays) || 5, 1);
  const examStatus = buildKravExamStatus(items, settings, referenceDate);
  const progress = buildKravProgress(items);
  const alerts = [];

  if (examStatus.status === 'riesgo-alto') {
    alerts.push({
      id: 'krav-alert-exam-risk',
      tone: 'warning',
      title: 'Riesgo de examen alto',
      detail: 'El promedio global todavía está por debajo de nivel 2.',
    });
  }

  if (examStatus.lowTechniques > 0) {
    alerts.push({
      id: 'krav-alert-low-level',
      tone: 'warning',
      title: 'Técnicas en nivel 0 o 1',
      detail: `${examStatus.lowTechniques} técnica(s) siguen en dominio técnico muy bajo.`,
    });
  }

  const forgottenCount = items.filter((item) => {
    const days = getDaysSincePractice(item.lastPracticedAt, referenceDate);
    return days === null || days >= threshold;
  }).length;

  if (forgottenCount > 0) {
    alerts.push({
      id: 'krav-alert-forgotten',
      tone: 'neutral',
      title: 'No practicada en 5 días',
      detail: `${forgottenCount} técnica(s) necesitan repaso porque ya se están enfriando.`,
    });
  }

  Object.entries(progress.categoryProgress).forEach(([category, value]) => {
    if (value > 0 && value < 50) {
      alerts.push({
        id: `krav-alert-category-${category}`,
        tone: 'neutral',
        title: `${kravCategoryLabels[category] || category} con promedio bajo`,
        detail: `El dominio técnico de esta categoría sigue por debajo del 50%.`,
      });
    }
  });

  return alerts;
}

export function markKravTechniquePracticed(curriculum = [], techniqueId, date = getToday()) {
  return (Array.isArray(curriculum) ? curriculum : []).map((item) =>
    item.id === techniqueId
      ? {
          ...item,
          lastPracticedAt: normalizeDateString(date) || getToday(),
        }
      : item
  );
}
