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

type AppUserRecord = {
  user_id: string;
  email: string | null;
  profile_type?: string | null;
  newsletter_opt_in?: boolean | null;
};

type RecipientCandidate = {
  userId: string;
  email: string;
  emailMasked: string;
  displayName: string;
  profileType: string;
  validEmail: boolean;
  confirmed: boolean;
  alreadySent: boolean;
  status: 'sent' | 'pending' | 'unconfirmed' | 'invalid_email' | 'error';
  reason: 'already_sent' | 'ready_to_send' | 'email_not_confirmed' | 'invalid_email' | 'last_attempt_failed';
  sentAt: string | null;
  errorMessage: string | null;
};

type SendLogRow = {
  recipient_email: string | null;
  status: 'sent' | 'failed' | 'skipped';
  provider_message_id?: string | null;
  error_message?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
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

function normalizeEmail(email = '') {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email = '') {
  const normalized = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function maskEmail(email = '') {
  const normalized = normalizeEmail(email);
  const [localPart = '', domain = ''] = normalized.split('@');
  if (!localPart || !domain) return normalized;

  const visibleLocal = localPart.length <= 2 ? localPart[0] || '*' : localPart.slice(0, 2);
  return `${visibleLocal}***@${domain}`;
}

function inferDisplayName(email = '') {
  const normalized = normalizeEmail(email);
  if (normalized === 'itsme.daniel0802@gmail.com') return 'Daniel';
  if (normalized === 'jfloresm1994@gmail.com') return 'Jesús';

  const [localPart = 'Usuario'] = normalized.split('@');
  return localPart
    .split(/[._+-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ') || 'Usuario';
}

function logNewsletterRecipientsDebug(issueId: string, candidates: RecipientCandidate[]) {
  const debugEnabled =
    Deno.env.get('NEWSLETTER_DEBUG') === 'true' ||
    Deno.env.get('ENVIRONMENT') === 'development' ||
    Deno.env.get('DENO_ENV') === 'development';

  if (!debugEnabled) return;

  console.info('[send-newsletter-manual] recipients:plan', {
    issueId,
    candidateCount: candidates.length,
    recipients: candidates.map((candidate) => ({
      email: candidate.emailMasked,
      profileType: candidate.profileType,
      status: candidate.status,
      reason: candidate.reason,
    })),
  });
}

function getRealSubject(subject = '') {
  return String(subject || '').replace(/^\[PRUEBA\]\s*/i, '').trim();
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
                <p style="margin: 0; color: #74818a; font-size: 12px; line-height: 1.5;">
                  Recibes este contenido porque aceptaste recibir tips de bienestar, hábitos y progreso de Bitácora Daniel.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function isConfirmedAuthUser(user: Record<string, unknown> | null | undefined) {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

async function getDanielUser(request: Request, supabaseUrl: string, supabaseAnonKey: string) {
  const authorization = request.headers.get('Authorization') || '';

  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return { user: null, error: 'Missing user session' };
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
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

  const { data, error } = await client.auth.getUser();
  const user = data?.user;

  if (error || !user?.email) return { user: null, error: 'Invalid user session' };
  if (normalizeEmail(user.email) !== DANIEL_ACCOUNT_EMAIL) return { user: null, error: 'Forbidden' };

  return { user, error: '' };
}

async function getNewsletterStatus(serviceClient: ReturnType<typeof createClient>, userId: string, issueId: string) {
  const { data, error } = await serviceClient
    .from('diary_snapshots')
    .select('payload')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  const newsletterAdmin = data?.payload?.newsletterAdmin || {};
  return newsletterAdmin.currentIssueId === issueId ? newsletterAdmin.status || 'draft' : 'draft';
}

async function getRecipientCandidates(serviceClient: ReturnType<typeof createClient>, issueId: string) {
  const { data: appUsers, error: appUsersError } = await serviceClient
    .from('app_users')
    .select('user_id, email, profile_type, newsletter_opt_in')
    .eq('newsletter_opt_in', true);

  if (appUsersError) throw appUsersError;

  const { data: logRows, error: logError } = await serviceClient
    .from('newsletter_send_log')
    .select('recipient_email, status, provider_message_id, error_message, sent_at, created_at')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false });

  if (logError) throw logError;

  const alreadySentEmails = new Set(
    ((logRows || []) as SendLogRow[])
      .filter((item) => item.status === 'sent')
      .map((item) => normalizeEmail(item.recipient_email || ''))
      .filter(Boolean)
  );
  const latestLogByEmail = new Map<string, SendLogRow>();

  for (const logRow of ((logRows || []) as SendLogRow[])) {
    const email = normalizeEmail(logRow.recipient_email || '');
    if (!email || latestLogByEmail.has(email)) continue;
    latestLogByEmail.set(email, logRow);
  }

  const candidates: RecipientCandidate[] = [];

  for (const appUser of (appUsers || []) as AppUserRecord[]) {
    const email = normalizeEmail(appUser.email || '');
    const validEmail = isValidEmail(email);
    const userId = appUser.user_id || '';
    const authResult = userId
      ? await serviceClient.auth.admin.getUserById(userId)
      : { data: null, error: new Error('Missing user_id') };
    const authUser = authResult.data?.user as Record<string, unknown> | undefined;
    const confirmed = validEmail && !authResult.error && isConfirmedAuthUser(authUser);
    const alreadySent = validEmail && alreadySentEmails.has(email);
    const latestLog = validEmail ? latestLogByEmail.get(email) : undefined;
    const hasLatestError = latestLog?.status === 'failed';
    const status = !validEmail
      ? 'invalid_email'
      : alreadySent
      ? 'sent'
      : !confirmed
        ? 'unconfirmed'
        : hasLatestError
          ? 'error'
          : 'pending';
    const reason = !validEmail
      ? 'invalid_email'
      : alreadySent
      ? 'already_sent'
      : !confirmed
        ? 'email_not_confirmed'
        : hasLatestError
          ? 'last_attempt_failed'
          : 'ready_to_send';

    candidates.push({
      userId,
      email,
      emailMasked: validEmail ? maskEmail(email) : 'Correo invalido',
      displayName: validEmail ? inferDisplayName(email) : `Usuario ${userId.slice(0, 8) || 'opt-in'}`,
      profileType: appUser.profile_type || 'fitness-basic',
      validEmail,
      confirmed,
      alreadySent,
      status,
      reason,
      sentAt: alreadySent ? latestLog?.sent_at || latestLog?.created_at || null : null,
      errorMessage: hasLatestError ? String(latestLog?.error_message || '').slice(0, 160) : null,
    });
  }

  return candidates;
}

function summarizeCandidates(candidates: RecipientCandidate[]) {
  const invalidEmailCount = candidates.filter((item) => !item.validEmail).length;
  const unconfirmedCount = candidates.filter((item) => item.validEmail && !item.confirmed).length;

  return {
    candidateCount: candidates.length,
    confirmedCount: candidates.filter((item) => item.confirmed).length,
    alreadySentCount: candidates.filter((item) => item.alreadySent).length,
    skippedUnconfirmedCount: unconfirmedCount,
    invalidEmailCount,
    blockingRecipientIssueCount: invalidEmailCount,
    errorCount: candidates.filter((item) => item.status === 'error').length,
    pendingToSendCount: candidates.filter((item) => item.status === 'pending').length,
    sendableCount: candidates.filter((item) => item.status === 'pending').length,
  };
}

function buildRecipientDiagnostics(candidates: RecipientCandidate[]) {
  return candidates.map((candidate) => ({
    displayName: candidate.displayName,
    emailMasked: candidate.emailMasked,
    profileType: candidate.profileType,
    validEmail: candidate.validEmail,
    confirmed: candidate.confirmed,
    alreadySent: candidate.alreadySent,
    sendable: candidate.status === 'pending',
    status: candidate.status,
    sentAt: candidate.sentAt,
    errorMessage: candidate.errorMessage,
    reason: candidate.reason,
  }));
}

async function insertSendLog(
  serviceClient: ReturnType<typeof createClient>,
  row: {
    issue_id: string;
    recipient_email: string;
    status: 'sent' | 'failed' | 'skipped';
    provider_message_id?: string | null;
    error_message?: string | null;
    sent_at?: string | null;
  }
) {
  await serviceClient.from('newsletter_send_log').insert(row);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('NEWSLETTER_FROM') || Deno.env.get('NEWSLETTER_TEST_FROM') || Deno.env.get('ADMIN_NOTIFICATION_FROM');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!resendApiKey || !fromEmail || !supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return jsonResponse(
      {
        error: 'Missing required function secrets',
        required: ['RESEND_API_KEY', 'NEWSLETTER_FROM or NEWSLETTER_TEST_FROM', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
      },
      500
    );
  }

  const { user, error: userError } = await getDanielUser(request, supabaseUrl, supabaseAnonKey);
  if (!user) {
    return jsonResponse({ error: userError }, userError === 'Forbidden' ? 403 : 401);
  }

  let body: { issueId?: string; dryRun?: boolean };

  try {
    body = await request.json();
  } catch (_error) {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  const issueId = String(body.issueId || '').trim();
  const dryRun = Boolean(body.dryRun);
  const newsletter = newsletters[issueId];

  if (!newsletter) {
    return jsonResponse({ error: 'Unknown newsletter issue' }, 400);
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const candidates = await getRecipientCandidates(serviceClient, issueId);
  const summary = summarizeCandidates(candidates);
  const recipientDiagnostics = buildRecipientDiagnostics(candidates);
  logNewsletterRecipientsDebug(issueId, candidates);

  if (dryRun) {
    return jsonResponse({ ok: true, issueId, dryRun: true, ...summary, recipientDiagnostics });
  }

  if (summary.blockingRecipientIssueCount > 0) {
    return jsonResponse(
      {
        error: 'Hay destinatarios opt-in con correo faltante o invalido. Corrige app_users antes de enviar.',
        issueId,
        dryRun: false,
        ...summary,
        recipientDiagnostics,
      },
      409
    );
  }

  const status = await getNewsletterStatus(serviceClient, user.id, issueId);
  if (status !== 'ready' && status !== 'manually_sent') {
    return jsonResponse({ error: 'Newsletter is not ready to send', issueId, status, ...summary }, 409);
  }

  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const candidate of candidates) {
    if (candidate.alreadySent) {
      skippedCount += 1;
      continue;
    }

    if (!candidate.confirmed) {
      skippedCount += 1;
      await insertSendLog(serviceClient, {
        issue_id: issueId,
        recipient_email: candidate.email,
        status: 'skipped',
        error_message: 'Email not confirmed',
      });
      continue;
    }

    if (candidate.status === 'error') {
      skippedCount += 1;
      continue;
    }

    try {
      const resendResponse = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [candidate.email],
          subject: getRealSubject(newsletter.subject),
          html: renderHtml(newsletter),
          text: renderText(newsletter),
        }),
      });

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        failedCount += 1;
        await insertSendLog(serviceClient, {
          issue_id: issueId,
          recipient_email: candidate.email,
          status: 'failed',
          error_message: errorText.slice(0, 500),
        });
        continue;
      }

      const providerPayload = await resendResponse.json().catch(() => ({}));
      sentCount += 1;
      await insertSendLog(serviceClient, {
        issue_id: issueId,
        recipient_email: candidate.email,
        status: 'sent',
        provider_message_id: providerPayload?.id || null,
        sent_at: new Date().toISOString(),
      });
    } catch (error) {
      failedCount += 1;
      await insertSendLog(serviceClient, {
        issue_id: issueId,
        recipient_email: candidate.email,
        status: 'failed',
        error_message: error instanceof Error ? error.message.slice(0, 500) : 'Unknown send error',
      });
    }
  }

  console.info('[send-newsletter-manual] completed', {
    issueId,
    candidates: candidates.length,
    sentCount,
    failedCount,
    skippedCount,
  });

  return jsonResponse({
    ok: true,
    issueId,
    dryRun: false,
    ...summary,
    recipientDiagnostics,
    sentCount,
    failedCount,
    skippedCount,
  });
});
