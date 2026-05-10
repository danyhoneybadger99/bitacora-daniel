export const welcomeNewsletter = {
  subject: 'Bienvenido a Bitacora Daniel',
  preheader: 'Una forma simple de ordenar habitos, progreso y decisiones diarias.',
  title: 'Empieza simple: registra, revisa y ajusta',
  intro:
    'Bienvenido. Bitacora Daniel esta pensada para ayudarte a llevar un registro claro de comida, ejercicio, habitos, check-in y progreso. La clave no es hacerlo perfecto, sino hacerlo constante.',
  aiTip:
    'Puedes usar ChatGPT como apoyo antes de registrar: describe lo que comiste, como entrenaste o como te sentiste, y pide una estimacion practica en lenguaje simple.',
  personalReflection:
    'La disciplina se construye con evidencia. Cuando registras lo que haces, dejas de depender solo de memoria o sensaciones y empiezas a tomar decisiones con mas claridad.',
  actionStep:
    'Hoy registra una comida, un movimiento fisico y un check-in breve. Con eso ya tienes una base real para empezar.',
  bitacoraPrompt:
    'Prompt sugerido: "Ayudame a estimar calorias, proteina, carbohidratos y grasa de esta comida: [describe comida y porciones]. Dame una estimacion simple para registrarla en mi bitacora."',
  disclaimerNote:
    'Las respuestas de IA son estimaciones. Registra tus datos reales lo mejor posible y usa criterio personal; esto no sustituye consejo medico o nutricional.',
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
  disclaimerNote:
    'Las respuestas de IA son estimaciones. Registra tus datos reales lo mejor posible y usa criterio personal; esto no sustituye consejo medico o nutricional.',
};

export const firstFourNewsletters = [
  {
    week: 1,
    subject: 'Semana 1: usa IA para estimar comida y macros',
    preheader: 'Aprende a convertir una comida real en datos utiles para tu registro.',
    title: 'Como estimar comida, calorias y macros con IA',
    intro:
      'Esta semana el objetivo es aprender a describir mejor lo que comes para obtener una estimacion mas util. No necesitas pesar todo desde el dia uno; empieza por registrar con honestidad y detalle.',
    aiTip:
      'Cuando uses ChatGPT, incluye alimento, cantidad aproximada, metodo de preparacion y extras como aceite, salsas, pan, tortillas o bebidas. Mientras mas contexto das, mejor sera la estimacion.',
    personalReflection:
      'La comida no se controla con culpa, se controla con informacion. Una estimacion imperfecta registrada con constancia vale mas que un dia perfecto que nunca se anota.',
    actionStep:
      'Elige una comida de hoy y pide a la IA una estimacion de calorias, proteina, carbohidratos y grasa. Luego registra esos datos en Bitacora Daniel.',
    bitacoraPrompt:
      'Prompt sugerido: "Estima calorias y macros de esta comida: [comida]. Incluye proteina, carbohidratos y grasa. Dame un rango realista y una version simple para registrar."',
    disclaimerNote:
      'Las respuestas de IA son estimaciones. Registra tus datos reales lo mejor posible y usa criterio personal; esto no sustituye consejo medico o nutricional.',
  },
  {
    week: 2,
    subject: 'Semana 2: registra entrenamientos con mas claridad',
    preheader: 'Usa IA para ordenar sesiones, duracion, intensidad y calorias estimadas.',
    title: 'Como usar IA para registrar ejercicio y calorias quemadas',
    intro:
      'El ejercicio tambien necesita registro simple. No se trata de adivinar perfecto, sino de capturar que hiciste, cuanto tiempo, con que intensidad y como te sentiste.',
    aiTip:
      'Describe tu entrenamiento con duracion, tipo de actividad, intensidad, peso corporal aproximado y pausas. Pide una estimacion conservadora de calorias quemadas y un resumen corto para registrar.',
    personalReflection:
      'Entrenar sin registro puede sentirse bien, pero registrar te permite ver constancia. La bitacora convierte esfuerzo en evidencia.',
    actionStep:
      'Registra un entrenamiento de esta semana con nombre, duracion, intensidad y calorias estimadas. Si dudas, usa una estimacion conservadora.',
    bitacoraPrompt:
      'Prompt sugerido: "Peso aproximadamente [peso]. Hice [actividad] durante [minutos] a intensidad [baja/media/alta]. Estima calorias quemadas de forma conservadora y dame una nota breve para mi registro."',
    disclaimerNote:
      'Las calorias quemadas son aproximadas y pueden variar mucho por persona, intensidad y dispositivo. Usa la estimacion como referencia, no como verdad exacta.',
  },
  {
    week: 3,
    subject: 'Semana 3: entiende peso, grasa, musculo y medidas',
    preheader: 'Aprende a leer progreso sin depender de un solo numero.',
    title: 'Como interpretar tus metricas corporales con mejor criterio',
    intro:
      'El peso es importante, pero no cuenta toda la historia. Tambien importan grasa corporal, masa muscular, cintura, pecho, brazo, pierna y tendencia en el tiempo.',
    aiTip:
      'Puedes pedir a ChatGPT que te ayude a interpretar cambios entre dos fechas. Incluye peso, porcentaje de grasa, masa muscular y medidas. Pide una lectura objetiva, sin exagerar conclusiones.',
    personalReflection:
      'La paciencia tambien es disciplina. Una semana puede verse rara; varias semanas juntas muestran direccion. No te castigues por una medicion aislada.',
    actionStep:
      'Registra una medicion corporal o revisa tu ultima comparacion. Observa que subio, que bajo y que conviene ajustar esta semana.',
    bitacoraPrompt:
      'Prompt sugerido: "Compara estas dos mediciones: [fecha 1 con datos] y [fecha 2 con datos]. Dime cambios principales en peso, grasa, musculo y cintura, sin dar diagnostico medico."',
    disclaimerNote:
      'Las metricas corporales tienen margen de error. Usa tendencias y registros repetidos; para temas medicos consulta a un profesional.',
  },
  {
    week: 4,
    subject: 'Semana 4: disciplina diaria y consistencia',
    preheader: 'El progreso se sostiene con habitos pequenos, honestidad y seguimiento.',
    title: 'Disciplina diaria: registra aunque el dia no sea perfecto',
    intro:
      'La bitacora no es para presumir dias perfectos. Es para sostener conciencia, corregir rapido y volver al camino cuando algo se desordena.',
    aiTip:
      'Usa ChatGPT para hacer cierres breves del dia: que salio bien, que se puede corregir y cual es la accion simple de manana. No necesitas una respuesta larga.',
    personalReflection:
      'El testimonio se construye en lo ordinario: comer mejor, moverse, descansar, orar o reflexionar, y volver a intentarlo sin drama. La constancia tambien es una forma de respeto propio.',
    actionStep:
      'Haz tu check-in diario y escribe una nota honesta de una linea: que hiciste bien y que vas a cuidar manana.',
    bitacoraPrompt:
      'Prompt sugerido: "Con base en mi dia: [resume comida, ejercicio, energia, sueno y emociones], dame una reflexion breve y una accion concreta para manana."',
    disclaimerNote:
      'La IA puede ayudarte a ordenar ideas, pero tus decisiones y registros reales son la base. No promete resultados garantizados.',
  },
];

export const newsletterSeries = {
  welcomeNewsletter,
  weeklyNewsletterTemplate,
  firstFourNewsletters,
};
