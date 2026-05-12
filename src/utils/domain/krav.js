import { getToday, normalizeDateString } from '../date';

export const kravCategoryLabels = {
  striking: 'Striking',
  'defensa-personal': 'Defensa personal',
  distancias: 'Distancias',
  grappling: 'Grappling',
  sparring: 'Sparring',
  acondicionamiento: 'Acondicionamiento',
  'warm-up-360': 'Warm Up 360',
  herramientas: 'Herramientas',
  'defensa-interna': 'Defensa personal de pie - defensa interna',
  'golpes-curvos': 'Golpes curvos',
  'abrazo-oso-frente': 'Abrazo de oso frente',
  'abrazo-oso-espalda': 'Abrazo de oso espalda',
  'candados-cuello': 'Candados de cuello',
  'candado-lateral-cuello': 'Candado lateral de cuello',
  'ahorcamiento-frente': 'Ahorcamiento de frente',
  'ahorcamiento-espalda': 'Ahorcamiento de espalda',
  'armas-bate': 'Armas - bate',
  'armas-cuchillo-frontal': 'Armas - cuchillo frontal',
  'armas-pistola-frontal': 'Armas - pistola frontal',
  'armas-cuchillo-espalda': 'Armas - cuchillo espalda',
  'armas-cuchillo-rehen': 'Armas - cuchillo rehén',
  'armas-pistola-espalda': 'Armas - pistola espalda',
  'armas-pistola-rehen': 'Armas - pistola rehén',
  'armas-pistola-lateral': 'Armas - pistola lateral',
  'full-nelson': 'Full Nelson',
  lucha: 'Lucha',
  'romper-caida-piso': 'Defensa personal piso - romper caída',
  'guardia-piso': 'Guardia de piso',
  'patada-frontal-piso': 'Patada frontal de piso',
  'movimientos-fundamentales': 'Movimientos fundamentales',
  flujo: 'Flujo',
  'barridos-piso': 'Barridos piso',
  'pase-guardia-cerrada': 'Pase de guardia cerrada',
  'stiff-arm': 'Stiff arm',
  'control-lateral': 'Control lateral',
  montado: 'Montado',
  'guardia-completa': 'Guardia completa',
  'ahorcamiento-lateral': 'Ahorcamiento lateral',
  'seat-belt': 'Seat-belt',
  bufanda: 'Bufanda',
  pisotones: 'Pisotones',
  'vs-patada-futbol': 'VS patada de futbol',
  'vs-patada-circular': 'VS patada circular',
  'llaves-montado': 'Llaves - montado',
  'llaves-full-guard': 'Llaves - full guard',
  'llaves-seat-belt': 'Llaves - seat belt',
  'llaves-control-lateral': 'Llaves - control lateral',
  llaves: 'Llaves',
  'striking-sombra': 'Striking - sombra',
  'golpeo-1-10': 'Golpeo 1-10',
  combos: 'Combos',
  kyokushin: 'Kyokushin',
  kamman: 'Kamman',
  'sparring-kick-boxing': 'Sparring - kick boxing',
  'sparring-street-fight': 'Sparring - Krav Maga street fight',
  'lucha-sparring': 'Lucha - sparring',
  'grappling-sparring': 'Grappling - sparring',
};

export const kravStageLabels = {
  etapa1: 'Etapa 1',
  etapa2: 'Etapa 2',
  etapa3: 'Etapa 3',
  etapa4: 'Etapa 4',
  etapa5: 'Etapa 5',
  etapa6: 'Etapa 6',
};

export const kravCoachOptions = [
  { value: 'oseas-tonche', label: 'Oseas Tonche' },
  { value: 'jesus', label: 'Jesús' },
  { value: 'otro', label: 'Otro' },
];

const kravProgressCategoryMap = {
  'warm-up-360': 'striking',
  herramientas: 'striking',
  'striking-sombra': 'striking',
  'golpeo-1-10': 'striking',
  combos: 'striking',
  'defensa-interna': 'defensa-personal',
  'golpes-curvos': 'defensa-personal',
  'abrazo-oso-frente': 'defensa-personal',
  'abrazo-oso-espalda': 'defensa-personal',
  'candados-cuello': 'defensa-personal',
  'candado-lateral-cuello': 'defensa-personal',
  'ahorcamiento-frente': 'defensa-personal',
  'ahorcamiento-espalda': 'defensa-personal',
  'armas-bate': 'defensa-personal',
  'armas-cuchillo-frontal': 'defensa-personal',
  'armas-cuchillo-espalda': 'defensa-personal',
  'armas-cuchillo-rehen': 'defensa-personal',
  'armas-pistola-frontal': 'defensa-personal',
  'armas-pistola-espalda': 'defensa-personal',
  'armas-pistola-rehen': 'defensa-personal',
  'armas-pistola-lateral': 'defensa-personal',
  'full-nelson': 'defensa-personal',
  lucha: 'grappling',
  'romper-caida-piso': 'grappling',
  'guardia-piso': 'grappling',
  'patada-frontal-piso': 'grappling',
  'movimientos-fundamentales': 'grappling',
  flujo: 'grappling',
  'barridos-piso': 'grappling',
  'pase-guardia-cerrada': 'grappling',
  'stiff-arm': 'grappling',
  'control-lateral': 'grappling',
  montado: 'grappling',
  'guardia-completa': 'grappling',
  'ahorcamiento-lateral': 'grappling',
  'seat-belt': 'grappling',
  bufanda: 'grappling',
  pisotones: 'grappling',
  'vs-patada-futbol': 'grappling',
  'vs-patada-circular': 'grappling',
  'llaves-montado': 'grappling',
  'llaves-full-guard': 'grappling',
  'llaves-seat-belt': 'grappling',
  'llaves-control-lateral': 'grappling',
  llaves: 'grappling',
  kyokushin: 'striking',
  kamman: 'striking',
  'sparring-kick-boxing': 'sparring',
  'sparring-street-fight': 'sparring',
  'lucha-sparring': 'sparring',
  'grappling-sparring': 'sparring',
};

function getKravProgressCategory(category = '') {
  return kravProgressCategoryMap[category] || category;
}

function slugify(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createTechnique({ name, category, stage, description = '', tips = '', videoUrl = '', curriculumBelt = 'amarilla' }) {
  return {
    id: `krav-${stage}-${slugify(name)}`,
    name,
    category,
    stage,
    curriculumBelt,
    description,
    tips,
    videoUrl,
    level: 0,
    lastPracticedAt: '',
    notes: '',
    isExamRelevant: true,
  };
}

function createGreenTechnique({ name, category, stage }) {
  const categoryLabel = kravCategoryLabels[category] || category;
  return {
    ...createTechnique({
      name,
      category,
      stage,
      curriculumBelt: 'verde',
      description: `Currículo de cinta verde · ${categoryLabel}.`,
      tips: '',
    }),
    id: `krav-verde-${stage}-${category}-${slugify(name)}`,
    targetBelt: 'verde',
    status: 'pending',
    seededAt: '2026-05-11',
  };
}

function createBrownTechnique({ name, category, stage }) {
  const categoryLabel = kravCategoryLabels[category] || category;
  return {
    ...createTechnique({
      name,
      category,
      stage,
      curriculumBelt: 'cafe',
      description: `Currículo café adultos 360 · ${categoryLabel}.`,
      tips: '',
    }),
    id: `krav-brown-${stage}-${category}-${slugify(name)}`,
    curriculumKey: 'brown-adults-360',
    targetBelt: 'cafe',
    status: 'pending',
    relevantForExam: true,
    sourceLabel: '360 Company - Brown Belt Adultos',
    seededAt: '2026-05-11',
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

const greenCurriculumGroups = [
  { stage: 'etapa1', category: 'warm-up-360', names: ['Guardia con golpeo 1-2', 'Guardia con desplaces y golpeo 1-2 frente', 'Guardia con desplaces y golpeo 1-2 espalda', 'Codazos ambos brazos', 'Rodilla frontal ambas piernas', 'Patada frontal ambas piernas', 'Romper caída frente', 'Romper caída espalda suave', 'Romper caída espalda duro', 'Puentes', 'Camarones'] },
  { stage: 'etapa1', category: 'herramientas', names: ['Arm drag', 'Pummeling', 'Codazos horizontales frontal', 'Codazos horizontales lateral', 'Codazos horizontales trasero', 'Codazos verticales abajo atrás', 'Codazos verticales arriba', 'Codazos verticales atrás', 'Codazos verticales ascendente', 'Codazos verticales descendente', '360 con contraataque'] },
  { stage: 'etapa2', category: 'defensa-interna', names: ['Defensa interna simultáneo arriba', 'Defensa interna simultáneo abajo', 'Defensa interna uno y medio', 'Defensa interna esquivando', 'Defensa interna izquierda vs izquierda'] },
  { stage: 'etapa2', category: 'distancias', names: ['Empujando', 'Uno y medio', 'Doble under-hook', 'Derribo de una pierna'] },
  { stage: 'etapa2', category: 'golpes-curvos', names: ['Defensa de casco', 'Abajo', 'Esquivando'] },
  { stage: 'etapa2', category: 'abrazo-oso-frente', names: ['Brazos atrapados', 'Brazos libres', 'Cargado atrapado', 'Cargado libre'] },
  { stage: 'etapa2', category: 'abrazo-oso-espalda', names: ['Brazos atrapados arriba', 'Brazos atrapados abajo', 'Brazos libres', 'Opción nudillos'] },
  { stage: 'etapa2', category: 'candados-cuello', names: ['Intento de mata-león', 'Guillotina'] },
  { stage: 'etapa2', category: 'candado-lateral-cuello', names: ['A tiempo', 'Tardío'] },
  { stage: 'etapa2', category: 'ahorcamiento-frente', names: ['Media distancia', 'Corta distancia', 'Muy corta distancia', 'Empujando', 'Contra la pared'] },
  { stage: 'etapa2', category: 'ahorcamiento-espalda', names: ['Jalando', 'Empujando', 'Vs pared dinámico pierna', 'Vs pared dinámico palmas', 'Vs pared dinámico antebrazos', 'Vs pared dinámico codos', 'Vs pared estático'] },
  { stage: 'etapa2', category: 'armas-bate', names: ['Descendente lado vivo', 'Descendente lado muerto', 'Cuerpo'] },
  { stage: 'etapa2', category: 'armas-cuchillo-frontal', names: ['Amenaza'] },
  { stage: 'etapa2', category: 'armas-pistola-frontal', names: ['Barril', 'Antebrazo', 'Uno y medio'] },
  { stage: 'etapa3', category: 'lucha', names: ['Sprawl frontal', 'Derribo O Soto Gari'] },
  { stage: 'etapa3', category: 'romper-caida-piso', names: ['Encuadre', 'Guardia sentado', 'Levantarse'] },
  { stage: 'etapa3', category: 'guardia-piso', names: ['Boca arriba', 'Sentado'] },
  { stage: 'etapa3', category: 'patada-frontal-piso', names: ['Derecha', 'Izquierda'] },
  { stage: 'etapa3', category: 'movimientos-fundamentales', names: ['Puente', 'Camarón', 'Guardia sentado', 'Stiff arm'] },
  { stage: 'etapa3', category: 'flujo', names: ['Bravo series'] },
  { stage: 'etapa3', category: 'stiff-arm', names: ['Dos piernas', 'Una pierna', 'Guardia completa'] },
  { stage: 'etapa3', category: 'llaves', names: ['Montado armbar', 'Full guard triángulo', 'Seat belt mata-león', 'Control lateral americana'] },
  { stage: 'etapa3', category: 'striking-sombra', names: ['Ofensivo', 'Defensivo', 'Foot work'] },
  { stage: 'etapa3', category: 'golpeo-1-10', names: ['Slips', 'Unders', 'Covers', 'Parrys', 'Leanings'] },
  { stage: 'etapa3', category: 'combos', names: ['Combo holandés', 'Serie de codos 1', 'Serie de codos 2', 'Combo Sensei', 'Combo Dekker general', 'Combo Dekker progresivo 1', 'Combo Dekker progresivo 2'] },
  { stage: 'etapa4', category: 'sparring-kick-boxing', names: ['Light sparring', 'Sin derribos', 'Sin codos y rodillas'] },
  { stage: 'etapa4', category: 'lucha', names: ['Pummeling', 'Toma de espalda'] },
  { stage: 'etapa4', category: 'grappling', names: ['Dominar posición', 'Sumisiones'] },
];

const greenCurriculumSeed = greenCurriculumGroups.flatMap((group) =>
  group.names.map((name) => createGreenTechnique({ name, category: group.category, stage: group.stage }))
);

const brownAdults360CurriculumGroups = [
  { stage: 'etapa1', category: 'warm-up-360', names: ['Guardia con golpeo 1-2', 'Guardia con desplaces y golpeo 1-2 frente', 'Guardia con desplaces y golpeo 1-2 espalda', 'Codazos ambos brazos', 'Rodilla frontal ambas piernas', 'Patada frontal ambas piernas', 'Romper caída frente', 'Romper caída espalda suave', 'Romper caída espalda duro', 'Puentes', 'Camarones'] },
  { stage: 'etapa1', category: 'herramientas', names: ['Arm drag', 'Pummeling', 'Codazos horizontales frontal', 'Codazos horizontales lateral', 'Codazos horizontales trasero', 'Codazos verticales abajo atrás', 'Codazos verticales arriba atrás', 'Codazos verticales atrás', 'Codazos verticales ascendente', 'Codazos verticales descendente', '360 con contraataque'] },
  { stage: 'etapa2', category: 'defensa-interna', names: ['Defensa interna simultáneo arriba', 'Defensa interna simultáneo abajo', 'Defensa interna uno y medio', 'Defensa interna esquivando', 'Defensa interna izquierda vs izquierda'] },
  { stage: 'etapa2', category: 'distancias', names: ['Empujando', 'Uno y medio', 'Doble under-hook', 'Derribo de una pierna'] },
  { stage: 'etapa2', category: 'golpes-curvos', names: ['Defensa de casco', 'Abajo', 'Esquivando'] },
  { stage: 'etapa2', category: 'abrazo-oso-frente', names: ['Brazos atrapados', 'Brazos libres', 'Cargado atrapado', 'Cargado libre'] },
  { stage: 'etapa2', category: 'abrazo-oso-espalda', names: ['Brazos atrapados arriba/abajo', 'Brazos libres codos/nudillos', 'Cargado atrapado/libre', 'Kimura'] },
  { stage: 'etapa2', category: 'candados-cuello', names: ['Intento de mata-león', 'Guillotina', 'Guillotina con caída'] },
  { stage: 'etapa2', category: 'candado-lateral-cuello', names: ['A tiempo', 'Tardío', 'Rodando adelante'] },
  { stage: 'etapa2', category: 'ahorcamiento-frente', names: ['Media distancia', 'Corta distancia', 'Muy corta distancia', 'Empujando', 'Contra la pared'] },
  { stage: 'etapa2', category: 'ahorcamiento-espalda', names: ['Jalando', 'Empujando', 'VS pared dinámico pierna', 'VS pared dinámico palmas', 'VS pared dinámico antebrazos', 'VS pared dinámico codos', 'VS pared estático'] },
  { stage: 'etapa2', category: 'full-nelson', names: ['A tiempo', 'Tardío'] },
  { stage: 'etapa3', category: 'armas-bate', names: ['Descendente lado vivo/lado muerto', 'Cuerpo una mano/dos manos', 'Cara a tiempo/tardío', 'Garganta', 'Culata lado vivo/lado muerto'] },
  { stage: 'etapa3', category: 'armas-cuchillo-frontal', names: ['Amenaza', 'Descendente', 'Uno y medio', 'Ascendente vertical/diagonal', 'Slash', 'Counter slash con desarme/sin desarme'] },
  { stage: 'etapa3', category: 'armas-cuchillo-espalda', names: ['Amenaza múltiples alturas'] },
  { stage: 'etapa3', category: 'armas-cuchillo-rehen', names: ['Espalda', 'Cuello', 'Con desarme/sin desarme'] },
  { stage: 'etapa3', category: 'armas-pistola-frontal', names: ['Barril', 'Antebrazo', 'Uno y medio', 'Control de dos manos', 'Frente', 'Empujón lado vivo/lado muerto'] },
  { stage: 'etapa3', category: 'armas-pistola-espalda', names: ['Lado vivo', 'Lado muerto', 'Media distancia', 'Corta distancia', 'Machine gun take-down'] },
  { stage: 'etapa3', category: 'armas-pistola-rehen', names: ['Frontal', 'Sien', 'Nuca'] },
  { stage: 'etapa3', category: 'armas-pistola-lateral', names: ['Arriba lado vivo/lado muerto'] },
  { stage: 'etapa4', category: 'lucha', names: ['Sprawl frontal', 'Sprawl derecha', 'Sprawl izquierda', 'Sprawl vs derribo de dos piernas', 'Derribo frente O Soto Gari', 'Derribo frente dos piernas', 'Derribo frente una pierna', 'Derribo espalda Tani Otoshi', 'Derribo espalda barrido de rodilla'] },
  { stage: 'etapa4', category: 'romper-caida-piso', names: ['Encuadre', 'Guardia sentado', 'Levantarse'] },
  { stage: 'etapa4', category: 'guardia-piso', names: ['Boca arriba', 'Sentado'] },
  { stage: 'etapa4', category: 'patada-frontal-piso', names: ['Derecha', 'Izquierda'] },
  { stage: 'etapa4', category: 'movimientos-fundamentales', names: ['Puente', 'Camarón', 'Guardia sentado', 'Stiff arm'] },
  { stage: 'etapa4', category: 'flujo', names: ['Bravo series', 'Kimura series', 'Guillotine series'] },
  { stage: 'etapa4', category: 'barridos-piso', names: ['Tripié', 'Tobillo', 'Tijera'] },
  { stage: 'etapa4', category: 'pase-guardia-cerrada', names: ['Knee slide', 'Double under', 'Back step'] },
  { stage: 'etapa4', category: 'stiff-arm', names: ['Dos piernas', 'Una pierna', 'Guardia completa'] },
  { stage: 'etapa4', category: 'control-lateral', names: ['Escape fantasma', 'Retomando guardia completa', 'Derribo de una pierna'] },
  { stage: 'etapa4', category: 'montado', names: ['Puente y giro', 'Puerta trasera', 'Escape de codo'] },
  { stage: 'etapa4', category: 'guardia-completa', names: ['Etapa 1 vs golpes', 'Ahorcamiento RTP/triángulo', 'Codo a cuello D’Arce choke', 'Barrido a montado', 'Barrido de tijera corbata', 'Barrido de tijera piernas levantadas'] },
  { stage: 'etapa4', category: 'ahorcamiento-lateral', names: ['Con patada', 'Arm bar'] },
  { stage: 'etapa4', category: 'seat-belt', names: ['Lado vivo', 'Lado muerto'] },
  { stage: 'etapa4', category: 'bufanda', names: ['Brazo atrapado', 'Brazos libres', 'Cabeza abajo atrapado/libre'] },
  { stage: 'etapa4', category: 'pisotones', names: ['Cara', 'Cuerpo'] },
  { stage: 'etapa4', category: 'vs-patada-futbol', names: ['Check', 'Check contraataque', 'Check derribo'] },
  { stage: 'etapa4', category: 'vs-patada-circular', names: ['Sentado derecha/izquierda', 'Hincado derecha/izquierda'] },
  { stage: 'etapa4', category: 'llaves-montado', names: ['Armbar', 'Americana', 'D’Arce choke'] },
  { stage: 'etapa4', category: 'llaves-full-guard', names: ['Guillotina', 'Triángulo', 'Arm bar', 'Kimura'] },
  { stage: 'etapa4', category: 'llaves-seat-belt', names: ['Mata-león'] },
  { stage: 'etapa4', category: 'llaves-control-lateral', names: ['Americana', 'Kimura'] },
  { stage: 'etapa5', category: 'striking-sombra', names: ['Ofensivo', 'Defensivo', 'Foot work'] },
  { stage: 'etapa5', category: 'golpeo-1-10', names: ['Slips', 'Unders', 'Covers', 'Parrys', 'Leanings'] },
  { stage: 'etapa5', category: 'combos', names: ['Combo holandés', 'Serie de codos 1', 'Serie de codos 2', 'Breed', 'Combo sensei etapa 1', 'Combo sensei etapa 2', 'Combo sensei etapa 3', 'Combo Dekker general', 'Combo Dekker progresivo 1', 'Combo Dekker progresivo 2'] },
  { stage: 'etapa5', category: 'kyokushin', names: ['Simple', 'Compuesto'] },
  { stage: 'etapa5', category: 'kamman', names: ['VOS 1', 'VOS 2', 'VOS combinado', 'Boxing 8'] },
  { stage: 'etapa6', category: 'sparring-street-fight', names: ['Sparring', 'Con derribos', 'Sumisiones con golpeo', 'Codos y rodillas ligeras', 'Múltiples oponentes'] },
  { stage: 'etapa6', category: 'lucha-sparring', names: ['Sweeps', 'Take-downs'] },
  { stage: 'etapa6', category: 'grappling-sparring', names: ['Sumisiones', 'Sumisiones con golpeo ligero mano abierta'] },
];

const brownAdults360CurriculumSeed = brownAdults360CurriculumGroups.flatMap((group) =>
  group.names.map((name) => createBrownTechnique({ name, category: group.category, stage: group.stage }))
);

const danielFirstOrangePracticeDate = '2026-05-11';
const danielFirstOrangePracticeTechniqueIds = [
  'krav-verde-etapa3-combos-combo-dekker-progresivo-1',
  'krav-verde-etapa2-armas-cuchillo-frontal-amenaza',
];
const danielOseasPracticeDate = '2026-05-12';
const danielOseasPracticeTechniqueIds = [
  'krav-verde-etapa1-warm-up-360-guardia-con-golpeo-1-2',
  'krav-verde-etapa1-warm-up-360-guardia-con-desplaces-y-golpeo-1-2-frente',
  'krav-verde-etapa1-warm-up-360-guardia-con-desplaces-y-golpeo-1-2-espalda',
  'krav-verde-etapa1-warm-up-360-codazos-ambos-brazos',
  'krav-verde-etapa1-warm-up-360-rodilla-frontal-ambas-piernas',
  'krav-verde-etapa1-warm-up-360-patada-frontal-ambas-piernas',
  'krav-verde-etapa1-warm-up-360-romper-caida-frente',
  'krav-verde-etapa1-warm-up-360-romper-caida-espalda-suave',
  'krav-verde-etapa1-warm-up-360-romper-caida-espalda-duro',
  'krav-verde-etapa1-warm-up-360-puentes',
  'krav-verde-etapa1-warm-up-360-camarones',
  'krav-verde-etapa1-herramientas-360-con-contraataque',
  'krav-verde-etapa2-armas-cuchillo-frontal-amenaza',
  'krav-verde-etapa3-combos-serie-de-codos-1',
  'krav-verde-etapa3-combos-serie-de-codos-2',
];

export function createDanielFirstOrangePracticeLog() {
  return {
    id: 'krav-practice-daniel-orange-first-2026-05-11',
    date: danielFirstOrangePracticeDate,
    startTime: '08:00',
    endTime: '09:00',
    coach: 'otro',
    coachCustomName: 'Jesús Flores',
    techniqueIds: [...danielFirstOrangePracticeTechniqueIds],
    sparring: 'no',
    currentBelt: 'naranja',
    targetBelt: 'verde',
    type: 'Krav Maga / técnica',
    description: 'Primer entrenamiento como cinta naranja.',
    observations:
      'Primer entrenamiento como cinta naranja. Se practicó Combo Dekker 1 y técnica de desarme ante amenaza con cuchillo. Enfoque principal: adaptación al currículo de cinta verde, coordinación, reacción inicial y ejecución técnica limpia.',
    mistakes: '',
    reviewNeeded:
      'Repasar entradas del Combo Dekker 1, fluidez entre golpes y reacción inicial ante amenaza con cuchillo. Priorizar control, distancia y ejecución segura antes de subir nivel.',
    seededAt: danielFirstOrangePracticeDate,
  };
}

export function createDanielOseasPracticeLog() {
  return {
    id: 'krav-practice-daniel-oseas-tonche-2026-05-12',
    date: danielOseasPracticeDate,
    startTime: '08:00',
    endTime: '09:00',
    coach: 'oseas-tonche',
    coachCustomName: '',
    techniqueIds: [...danielOseasPracticeTechniqueIds],
    sparring: 'no',
    currentBelt: 'naranja',
    targetBelt: 'verde',
    type: 'Krav Maga / técnica',
    description: 'Sesión Krav Maga - 360, contraataque y cuchillo ascendente',
    observations:
      'Primera mitad de la sesión enfocada en acondicionamiento y técnica base: rodillas sin clinch, Serie de Codos #1, Kickushing, Serie de Codos #2, Defensa de Golpes Rectos, Vos Combinado, sentadillas, abdominales completos, lagartijas, burpees, desplantes y squats. Segunda mitad enfocada en 360, 360 con contraataque y defensa de cuchillo ascendente.',
    mistakes:
      'Revisar precisión en la transición entre 360 con contraataque y defensa de cuchillo ascendente. Cuidar timing, distancia y salida segura después del contraataque.',
    reviewNeeded:
      '360 con contraataque, defensa de cuchillo ascendente, defensa de golpes rectos, series de codos, vos combinado y lectura de amenaza.',
    seededAt: danielOseasPracticeDate,
  };
}

export function createOrangeKravCurriculum() {
  return orangeCurriculumSeed.map((item) => ({ ...item }));
}

export function createGreenKravCurriculum() {
  return greenCurriculumSeed.map((item) => ({ ...item }));
}

export function createBrownAdults360KravCurriculum() {
  return brownAdults360CurriculumSeed.map((item) => ({ ...item }));
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
        curriculumBelt: currentTechnique.curriculumBelt || seedTechnique.curriculumBelt,
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

export function mergeGreenKravCurriculum(existing = []) {
  const current = Array.isArray(existing) ? existing : [];
  const seeded = createGreenKravCurriculum();
  const merged = [...current];

  seeded.forEach((seedTechnique) => {
    const seedKey = [
      seedTechnique.curriculumBelt,
      seedTechnique.stage,
      seedTechnique.category,
      slugify(seedTechnique.name),
    ].join('|');
    const existingIndex = merged.findIndex((item) => {
      const itemKey = [
        item?.curriculumBelt,
        item?.stage,
        item?.category,
        slugify(item?.name || ''),
      ].join('|');
      return item?.id === seedTechnique.id || itemKey === seedKey;
    });

    if (existingIndex >= 0) {
      const currentTechnique = merged[existingIndex];
      merged[existingIndex] = {
        ...seedTechnique,
        ...currentTechnique,
        id: currentTechnique.id || seedTechnique.id,
        curriculumBelt: currentTechnique.curriculumBelt || seedTechnique.curriculumBelt,
        targetBelt: currentTechnique.targetBelt || seedTechnique.targetBelt,
        status: currentTechnique.status || seedTechnique.status,
        seededAt: currentTechnique.seededAt || seedTechnique.seededAt,
        level: Number.isFinite(Number(currentTechnique.level)) ? Number(currentTechnique.level) : seedTechnique.level,
        lastPracticedAt: normalizeDateString(currentTechnique.lastPracticedAt) || seedTechnique.lastPracticedAt,
        isExamRelevant:
          typeof currentTechnique.isExamRelevant === 'boolean' ? currentTechnique.isExamRelevant : seedTechnique.isExamRelevant,
      };
      return;
    }

    merged.push(seedTechnique);
  });

  return merged;
}

export function mergeBrownAdults360KravCurriculum(existing = []) {
  const current = Array.isArray(existing) ? existing : [];
  const seeded = createBrownAdults360KravCurriculum();
  const merged = [...current];

  seeded.forEach((seedTechnique) => {
    const seedKey = [
      seedTechnique.curriculumKey,
      seedTechnique.curriculumBelt,
      seedTechnique.stage,
      seedTechnique.category,
      slugify(seedTechnique.name),
    ].join('|');
    const existingIndex = merged.findIndex((item) => {
      const itemKey = [
        item?.curriculumKey,
        item?.curriculumBelt,
        item?.stage,
        item?.category,
        slugify(item?.name || ''),
      ].join('|');
      return item?.id === seedTechnique.id || itemKey === seedKey;
    });

    if (existingIndex >= 0) {
      const currentTechnique = merged[existingIndex];
      merged[existingIndex] = {
        ...seedTechnique,
        ...currentTechnique,
        id: currentTechnique.id || seedTechnique.id,
        curriculumKey: currentTechnique.curriculumKey || seedTechnique.curriculumKey,
        curriculumBelt: currentTechnique.curriculumBelt || seedTechnique.curriculumBelt,
        targetBelt: currentTechnique.targetBelt || seedTechnique.targetBelt,
        status: currentTechnique.status || seedTechnique.status,
        sourceLabel: currentTechnique.sourceLabel || seedTechnique.sourceLabel,
        seededAt: currentTechnique.seededAt || seedTechnique.seededAt,
        level: Number.isFinite(Number(currentTechnique.level)) ? Number(currentTechnique.level) : seedTechnique.level,
        lastPracticedAt: normalizeDateString(currentTechnique.lastPracticedAt) || seedTechnique.lastPracticedAt,
        isExamRelevant:
          typeof currentTechnique.isExamRelevant === 'boolean' ? currentTechnique.isExamRelevant : seedTechnique.isExamRelevant,
        relevantForExam:
          typeof currentTechnique.relevantForExam === 'boolean' ? currentTechnique.relevantForExam : seedTechnique.relevantForExam,
      };
      return;
    }

    merged.push(seedTechnique);
  });

  return merged;
}

export function mergeDanielKravCurriculum(existing = []) {
  return mergeGreenKravCurriculum(mergeOrangeKravCurriculum(existing));
}

function getLatestPracticeDate(currentDate = '', seedDate = '') {
  const normalizedCurrent = normalizeDateString(currentDate);
  const normalizedSeed = normalizeDateString(seedDate);
  if (!normalizedCurrent) return normalizedSeed;
  if (!normalizedSeed) return normalizedCurrent;
  return normalizedCurrent >= normalizedSeed ? normalizedCurrent : normalizedSeed;
}

export function applyDanielPracticeSeedsToCurriculum(curriculum = []) {
  const practiceSeedMap = new Map();

  [
    { date: danielFirstOrangePracticeDate, techniqueIds: danielFirstOrangePracticeTechniqueIds },
    { date: danielOseasPracticeDate, techniqueIds: danielOseasPracticeTechniqueIds },
  ].forEach((seed) => {
    seed.techniqueIds.forEach((techniqueId) => {
      practiceSeedMap.set(techniqueId, getLatestPracticeDate(practiceSeedMap.get(techniqueId), seed.date));
    });
  });

  return (Array.isArray(curriculum) ? curriculum : []).map((item) => {
    const practiceDate = practiceSeedMap.get(item?.id);
    if (!practiceDate) return item;

    return {
      ...item,
      lastPracticedAt: getLatestPracticeDate(item.lastPracticedAt, practiceDate),
    };
  });
}

function hasDanielPracticeLog(logs = [], seedLog, seedTechniqueIds = []) {
  return (Array.isArray(logs) ? logs : []).some((item) => {
    if (item?.id === seedLog.id) return true;
    const itemTechniqueIds = Array.isArray(item?.techniqueIds) ? item.techniqueIds : [];
    return (
      normalizeDateString(item?.date) === seedLog.date &&
      item?.coach === seedLog.coach &&
      seedTechniqueIds.every((techniqueId) => itemTechniqueIds.includes(techniqueId))
    );
  });
}

function mergeDanielPracticeLog(existing = [], createSeedLog, seedTechniqueIds = []) {
  const current = Array.isArray(existing) ? existing : [];
  const seedLog = createSeedLog();

  if (hasDanielPracticeLog(current, seedLog, seedTechniqueIds)) {
    return current.map((item) => {
      if (item?.id !== seedLog.id) return item;
      return {
        ...seedLog,
        ...item,
        techniqueIds: Array.isArray(item.techniqueIds) && item.techniqueIds.length > 0
          ? item.techniqueIds
          : [...seedTechniqueIds],
      };
    });
  }

  return [seedLog, ...current];
}

export function mergeDanielPracticeLogs(existing = []) {
  return mergeDanielPracticeLog(
    mergeDanielPracticeLog(existing, createDanielFirstOrangePracticeLog, danielFirstOrangePracticeTechniqueIds),
    createDanielOseasPracticeLog,
    danielOseasPracticeTechniqueIds
  );
}

export function applyDanielKravPracticeSeed({ curriculum = [], practiceLogs = [] } = {}) {
  return {
    curriculum: applyDanielPracticeSeedsToCurriculum(curriculum),
    practiceLogs: mergeDanielPracticeLogs(practiceLogs),
  };
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
    currentBelt: 'naranja',
    targetBelt: 'verde',
    activeCurriculumBelt: 'verde',
    activeCurriculumKey: '',
    activeCurriculumLabel: '',
    sourceLabel: '',
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
    const categoryItems = items.filter((item) => getKravProgressCategory(item.category) === category);
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
  const neverPracticedTechniques = items.filter((item) => !normalizeDateString(item.lastPracticedAt)).length;
  const stalePracticeTechniques = items.filter((item) => {
    const days = getDaysSincePractice(item.lastPracticedAt, referenceDate);
    return days !== null && days >= threshold;
  }).length;
  const forgottenTechniques = neverPracticedTechniques + stalePracticeTechniques;

  const status =
    averageLevel > 3 ? 'listo' : averageLevel >= 2 ? 'riesgo-medio' : 'riesgo-alto';

  return {
    averageLevel,
    pendingTechniques,
    lowTechniques,
    neverPracticedTechniques,
    stalePracticeTechniques,
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

  const forgottenCount = examStatus.neverPracticedTechniques + examStatus.stalePracticeTechniques;

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
