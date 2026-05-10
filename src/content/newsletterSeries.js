const standardDisclaimer =
  'La IA puede ayudarte a estimar y ordenar información, pero no da valores exactos ni garantiza resultados. Registra tus datos reales lo mejor posible y, si tienes una condición médica, consulta a un profesional.';

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
  bitacoraPrompt:
    'Prompt sugerido: "Ayúdame a estimar calorías, proteína, carbohidratos y grasa de esta comida: [describe comida y porciones]. Dame una estimación práctica y conservadora para registrarla en mi bitácora."',
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
    bitacoraPrompt:
      'Prompt sugerido: "Estima calorías y macros de esta comida: [describe comida, porciones y preparación]. Incluye proteína, carbohidratos y grasa. Dame un rango realista y una versión simple para registrarla."',
    disclaimerNote: standardDisclaimer,
  },
  {
    week: 2,
    subject: 'Semana 2: registra tus entrenamientos con más claridad',
    preheader: 'Usa IA para ordenar duración, intensidad y calorías estimadas.',
    title: 'Cómo usar IA para registrar ejercicio y calorías quemadas',
    intro:
      'El ejercicio también necesita registro simple. No se trata de adivinar perfecto, sino de capturar qué hiciste, cuánto duró, con qué intensidad y cómo respondió tu cuerpo.',
    aiTip:
      'Describe tu entrenamiento con duración, tipo de actividad, intensidad, peso corporal aproximado y pausas. Pide una estimación conservadora de calorías quemadas y un resumen breve para registrar.',
    personalReflection:
      'Entrenar se siente bien, pero registrar te permite ver constancia. La bitácora convierte esfuerzo suelto en evidencia acumulada.',
    actionStep:
      'Registra un entrenamiento esta semana con nombre, duración, intensidad y calorías estimadas. Si dudas, usa una estimación conservadora.',
    bitacoraPrompt:
      'Prompt sugerido: "Peso aproximadamente [peso]. Hice [actividad] durante [minutos] a intensidad [baja/media/alta], con [pausas o detalles]. Estima calorías quemadas de forma conservadora y dame una nota breve para mi registro."',
    disclaimerNote:
      'Las calorías quemadas son aproximadas y pueden variar mucho por persona, intensidad, técnica y dispositivo. Usa la estimación como referencia, no como verdad exacta.',
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
