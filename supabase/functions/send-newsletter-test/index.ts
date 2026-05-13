import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DANIEL_ACCOUNT_EMAIL = 'itsme.daniel0802@gmail.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

type Newsletter = {
  subject: string;
  preheader: string;
  title: string;
  intro: string;
  aiTip: string;
  personalReflection: string;
  actionStep: string;
  bitacoraPrompt: string;
  disclaimerNote: string;
};

const newsletters: Record<string, Newsletter> = {
  welcome: {
    subject: 'Bienvenido a Bitácora Daniel',
    preheader: 'Empieza simple: registra tus hábitos y usa IA como apoyo práctico.',
    title: 'Tu progreso empieza con un registro honesto',
    intro:
      'Bienvenido. Bitácora Daniel está pensada para ayudarte a ordenar comida, ejercicio, hábitos, check-in y progreso físico desde tu celular. No se trata de hacerlo perfecto; se trata de tener claridad y constancia.',
    aiTip:
      'Usa ChatGPT como apoyo externo antes de registrar. Describe lo que comiste, cómo entrenaste o cómo te sentiste, y pide una estimación simple que puedas pasar a tu bitácora.',
    personalReflection:
      'La disciplina se vuelve más fuerte cuando tienes evidencia. Registrar tus acciones te ayuda a dejar de depender solo de memoria, culpa o motivación del momento.',
    actionStep:
      'Hoy registra una comida, una actividad física y un check-in breve. Con eso ya tienes una base real para empezar a mejorar.',
    bitacoraPrompt: foodMacroEstimationPrompt,
    disclaimerNote: standardDisclaimer,
  },
  'week-1': {
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
  'week-2': {
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
  'week-3': {
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
  'week-4': {
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
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderText(newsletter: Newsletter) {
  return [
    `Asunto: ${newsletter.subject}`,
    `Preheader: ${newsletter.preheader}`,
    '',
    newsletter.title,
    '',
    'Introducción:',
    newsletter.intro,
    '',
    'Tip de IA:',
    newsletter.aiTip,
    '',
    'Reflexión personal:',
    newsletter.personalReflection,
    '',
    'Acción de la semana:',
    newsletter.actionStep,
    '',
    'Prompt sugerido:',
    newsletter.bitacoraPrompt,
    '',
    'Nota final:',
    newsletter.disclaimerNote,
  ].join('\n');
}

function renderHtmlSection(label: string, content: string, isPrompt = false) {
  const background = isPrompt ? '#f6f1eb' : '#ffffff';
  const border = isPrompt ? '#e2d4c2' : '#e7ecef';

  return `
    <tr>
      <td style="padding: 0 0 14px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: ${background}; border: 1px solid ${border}; border-radius: 14px;">
          <tr>
            <td style="padding: 16px 18px;">
              <p style="margin: 0 0 8px 0; color: #8b3f47; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">${escapeHtml(label)}</p>
              <p style="margin: 0; color: #24313a; font-size: 15px; line-height: 1.55; white-space: pre-line;">${escapeHtml(content)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function renderHtml(newsletter: Newsletter) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(newsletter.subject)}</title>
  </head>
  <body style="margin: 0; padding: 0; background: #f2f5f1; color: #24313a; font-family: Arial, Helvetica, sans-serif;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">${escapeHtml(newsletter.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: #f2f5f1;">
      <tr>
        <td align="center" style="padding: 28px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 640px; background: #ffffff; border: 1px solid #dde5df; border-radius: 22px; overflow: hidden;">
            <tr>
              <td style="padding: 28px 26px 16px 26px;">
                <p style="margin: 0 0 10px 0; color: #60707a; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;">Bitácora Daniel</p>
                <h1 style="margin: 0; color: #17212b; font-size: 28px; line-height: 1.15;">${escapeHtml(newsletter.title)}</h1>
                <p style="margin: 12px 0 0 0; color: #586875; font-size: 15px; line-height: 1.5;">${escapeHtml(newsletter.preheader)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 26px 10px 26px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                  ${renderHtmlSection('Introducción', newsletter.intro)}
                  ${renderHtmlSection('Tip de IA', newsletter.aiTip)}
                  ${renderHtmlSection('Reflexión personal', newsletter.personalReflection)}
                  ${renderHtmlSection('Acción de la semana', newsletter.actionStep)}
                  ${renderHtmlSection('Prompt sugerido para la bitácora', newsletter.bitacoraPrompt, true)}
                  ${renderHtmlSection('Nota final', newsletter.disclaimerNote)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 18px 26px 26px 26px; border-top: 1px solid #edf1ee;">
                <p style="margin: 0; color: #74818a; font-size: 12px; line-height: 1.5;">Correo de prueba interno. No es un envío automático.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('NEWSLETTER_TEST_FROM') || Deno.env.get('ADMIN_NOTIFICATION_FROM');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const authorization = request.headers.get('Authorization') || '';

  if (!resendApiKey || !fromEmail || !supabaseUrl || !supabaseAnonKey) {
    return jsonResponse(
      {
        error: 'Missing required function secrets',
        required: ['RESEND_API_KEY', 'NEWSLETTER_TEST_FROM or ADMIN_NOTIFICATION_FROM', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'],
      },
      500
    );
  }

  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return jsonResponse({ error: 'Missing user session' }, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user?.email) {
    return jsonResponse({ error: 'Invalid user session' }, 401);
  }

  if (user.email.toLowerCase() !== DANIEL_ACCOUNT_EMAIL) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  let body: { issueId?: string };

  try {
    body = await request.json();
  } catch (_error) {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  const issueId = String(body.issueId || '').trim();
  const newsletter = newsletters[issueId];

  if (!newsletter) {
    return jsonResponse({ error: 'Unknown newsletter issue' }, 400);
  }

  const resendResponse = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [DANIEL_ACCOUNT_EMAIL],
      subject: `[PRUEBA] ${newsletter.subject}`,
      html: renderHtml(newsletter),
      text: renderText(newsletter),
    }),
  });

  if (!resendResponse.ok) {
    console.error('[send-newsletter-test] Resend failed', {
      status: resendResponse.status,
      issueId,
    });

    return jsonResponse({ error: 'Email provider failed' }, 502);
  }

  console.info('[send-newsletter-test] sent', { issueId });
  return jsonResponse({ ok: true, issueId });
});
