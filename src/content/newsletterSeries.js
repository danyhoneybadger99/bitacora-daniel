const standardDisclaimer =
  'La IA puede ayudarte a estimar y ordenar información, pero no da valores exactos ni garantiza resultados. Registra tus datos reales lo mejor posible y, si tienes una condición médica, consulta a un profesional.';

const foodMacroEstimationPrompt = `Actúa como nutriólogo deportivo y experto en composición corporal. Ayúdame a estimar las calorías, proteína, carbohidratos y grasa de esta comida:

Comida: [describe alimentos]
Porciones aproximadas: [gramos, piezas, tazas, cucharadas o tamaño visual]
Método de preparación: [asado, frito, hervido, con aceite, con mantequilla, etc.]
Objetivo actual: [perder grasa / mantener / ganar músculo]
Contexto: [ayuno, entrenamiento, antojo, comida libre, etc.]

Dame:
1. Estimación total de calorías.
2. Macros aproximados: proteína, carbohidratos y grasa.
3. Rango conservador si hay incertidumbre.
4. Qué dato faltaría para hacerlo más preciso.
5. Una versión lista para copiar a mi bitácora.`;

export const welcomeNewsletter = {
  subject: 'Bienvenido a Bitácora Daniel',
  preheader: 'Empieza simple: registra tus hábitos y usa IA como apoyo práctico.',
  title: 'Tu progreso empieza con un registro honesto',
  intro:
    'Bienvenido. Bitácora Daniel está pensada para ayudarte a ordenar comida, ejercicio, hábitos, check-in y progreso físico desde tu celular. No se trata de hacerlo perfecto; se trata de tener claridad y constancia.',
  aiTip:
    'Usa ChatGPT como apoyo externo antes de registrar. Describe lo que comiste, cómo entrenaste o cómo te sentiste, y pídele una estimación simple que puedas pasar a tu bitácora.',
  personalReflection:
    'La disciplina se vuelve más fuerte cuando tienes evidencia. Registrar tus acciones te ayuda a dejar de depender solo de memoria, culpa o motivación del momento.',
  actionStep:
    'Hoy registra una comida, una actividad física y un check-in breve. Con eso ya tienes una base real para empezar a mejorar.',
  bitacoraPrompt: foodMacroEstimationPrompt,
  disclaimerNote: standardDisclaimer,
};

export const weeklyNewsletterTemplate = {
  subject: '',
  preheader: '',
  title: '',
  intro: '',
  aiTip: '',
  personalReflection: '',
  actionStep: '',
  bitacoraPrompt: '',
  disclaimerNote: standardDisclaimer,
};

export const firstFourNewsletters = [
  {
    week: 1,
    subject: 'Semana 1: estima comida y macros con apoyo de IA',
    preheader: 'Convierte una comida real en datos útiles para tu registro diario.',
    title: 'Cómo usar IA para estimar comida, calorías y macros',
    intro:
      'Esta semana el objetivo es aprender a describir mejor lo que comes para registrar con más claridad. No necesitas pesar todo desde el primer día; empieza por anotar con honestidad y suficiente detalle.',
    aiTip:
      'Cuando uses ChatGPT, incluye alimento, cantidad aproximada, método de preparación y extras como aceite, salsas, pan, tortillas, bebidas o postres. Mientras más contexto des, más útil será la estimación.',
    personalReflection:
      'La comida no se controla con culpa; se controla con información. Una estimación imperfecta registrada con constancia vale más que un día perfecto que nunca se anota.',
    actionStep:
      'Elige una comida de hoy, pide una estimación de calorías y macros, y registra esos datos en Bitácora Daniel.',
    bitacoraPrompt: foodMacroEstimationPrompt,
    disclaimerNote: standardDisclaimer,
  },
  {
    week: 2,
    subject: 'Semana 2: cómo usar tu Bitácora Daniel sin complicarte',
    preheader: 'Una guía rápida para entender cada pestaña y registrar mejor tu progreso.',
    title: 'Tu guía rápida para usar Bitácora Daniel',
    intro:
      'Esta semana no se trata de llenar toda la app. Se trata de entender para qué sirve cada pestaña y elegir 2 o 3 registros diarios que sí puedas sostener.',
    aiTip:
      'Usa IA como apoyo externo cuando no sepas cómo escribir un registro. Puedes describir una comida, entrenamiento, hidratación o check-in, y pedir una versión simple para copiar a tu bitácora.',
    personalReflection:
      'Dashboard te da la foto rápida del día. Check-in diario registra estado, energía, sueño y emociones. Alimentos e hidratación ordenan comida, agua y café. Ejercicio guarda entrenamientos. Krav Maga ayuda a seguir técnica y práctica. Métricas registra peso, grasa, músculo y medidas. Semanal resume cómo vas. Historial te deja revisar lo que ya registraste.',
    actionStep:
      'Durante 7 días registra hidratación, check-in diario y una comida o entrenamiento. Con eso basta para empezar a ver patrones sin abrumarte.',
    bitacoraPrompt:
      'Ayúdame a convertir este registro en datos claros para mi Bitácora Daniel: [describe comida, entrenamiento, hidratación o check-in]. Dame una versión simple y práctica para registrar.',
    disclaimerNote:
      'La IA puede ayudarte a ordenar información y estimar datos, pero no calcula perfecto ni sustituye orientación profesional. Úsala como apoyo externo y registra tus datos reales lo mejor posible.',
  },
  {
    week: 3,
    subject: 'Semana 3: entiende peso, grasa, músculo y medidas',
    preheader: 'Aprende a leer progreso sin depender de un solo número.',
    title: 'Cómo interpretar tus métricas corporales con mejor criterio',
    intro:
      'El peso importa, pero no cuenta toda la historia. También conviene revisar grasa corporal, masa muscular, cintura, pecho, brazo, pierna y tendencia en el tiempo.',
    aiTip:
      'Puedes pedir a ChatGPT que te ayude a comparar cambios entre dos fechas. Incluye peso, porcentaje de grasa, masa muscular y medidas. Pide una lectura objetiva, sin diagnóstico médico ni conclusiones exageradas.',
    personalReflection:
      'La paciencia también es disciplina. Una semana puede verse rara; varias semanas juntas muestran dirección. No te castigues por una medición aislada.',
    actionStep:
      'Registra una medición corporal o revisa tu última comparación. Observa qué subió, qué bajó y qué ajuste pequeño conviene hacer esta semana.',
    bitacoraPrompt:
      'Prompt sugerido: "Compara estas dos mediciones: [fecha 1 con datos] y [fecha 2 con datos]. Dime cambios principales en peso, grasa, músculo y medidas. No des diagnóstico médico; dame una lectura práctica para ajustar hábitos."',
    disclaimerNote:
      'Las métricas corporales tienen margen de error. Usa tendencias y registros repetidos; para temas médicos o clínicos consulta a un profesional.',
  },
  {
    week: 4,
    subject: 'Semana 4: disciplina diaria y consistencia real',
    preheader: 'El progreso se sostiene con hábitos pequeños, honestidad y seguimiento.',
    title: 'Registra aunque el día no sea perfecto',
    intro:
      'La bitácora no es para presumir días perfectos. Es para sostener conciencia, corregir rápido y volver al camino cuando algo se desordena.',
    aiTip:
      'Usa ChatGPT para cerrar el día en pocas líneas: qué salió bien, qué se puede corregir y cuál es la acción simple para mañana. No necesitas una respuesta larga.',
    personalReflection:
      'El testimonio se construye en lo ordinario: comer mejor, moverse, descansar, orar o reflexionar, y volver a intentarlo sin drama. La constancia también es una forma de respeto propio.',
    actionStep:
      'Haz tu check-in diario y escribe una nota honesta de una línea: qué hiciste bien y qué vas a cuidar mañana.',
    bitacoraPrompt:
      'Prompt sugerido: "Con base en mi día: [resume comida, ejercicio, energía, sueño y emociones], dame una reflexión breve, una corrección concreta y una acción simple para mañana."',
    disclaimerNote:
      'La IA puede ayudarte a ordenar ideas, pero tus decisiones y registros reales son la base. No promete resultados garantizados.',
  },
];

export const newsletterSeries = {
  welcomeNewsletter,
  weeklyNewsletterTemplate,
  firstFourNewsletters,
};
