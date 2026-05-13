import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DANIEL_ACCOUNT_EMAIL = 'itsme.daniel0802@gmail.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const standardDisclaimer =
  'La IA puede ayudarte a estimar y ordenar informacion, pero no da valores exactos ni garantiza resultados. Registra tus datos reales lo mejor posible y, si tienes una condicion medica, consulta a un profesional.';

const foodMacroEstimationPrompt = `Actua como nutriologo deportivo y experto en composicion corporal. Ayudame a estimar las calorias, proteina, carbohidratos y grasa de esta comida:

Comida: [describe alimentos]
Porciones aproximadas: [gramos, piezas, tazas, cucharadas o tamano visual]
Metodo de preparacion: [asado, frito, hervido, con aceite, con mantequilla, etc.]
Objetivo actual: [perder grasa / mantener / ganar musculo]
Contexto: [ayuno, entrenamiento, antojo, comida libre, etc.]

Dame:
1. Estimacion total de calorias.
2. Macros aproximados: proteina, carbohidratos y grasa.
3. Rango conservador si hay incertidumbre.
4. Que dato faltaria para hacerlo mas preciso.
5. Una version lista para copiar a mi bitacora.`;

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
  profileType: string;
  confirmed: boolean;
  alreadySent: boolean;
};

const newsletters: Record<string, Newsletter> = {
  welcome: {
    subject: 'Bienvenido a Bitacora Daniel',
    preheader: 'Empieza simple: registra tus habitos y usa IA como apoyo practico.',
    title: 'Tu progreso empieza con un registro honesto',
    intro:
      'Bienvenido. Bitacora Daniel esta pensada para ayudarte a ordenar comida, ejercicio, habitos, check-in y progreso fisico desde tu celular. No se trata de hacerlo perfecto; se trata de tener claridad y constancia.',
    aiTip:
      'Usa ChatGPT como apoyo externo antes de registrar. Describe lo que comiste, como entrenaste o como te sentiste, y pide una estimacion simple que puedas pasar a tu bitacora.',
    personalReflection:
      'La disciplina se vuelve mas fuerte cuando tienes evidencia. Registrar tus acciones te ayuda a dejar de depender solo de memoria, culpa o motivacion del momento.',
    actionStep:
      'Hoy registra una comida, una actividad fisica y un check-in breve. Con eso ya tienes una base real para empezar a mejorar.',
    bitacoraPrompt: foodMacroEstimationPrompt,
    disclaimerNote: standardDisclaimer,
  },
  'week-1': {
    subject: 'Semana 1: estima comida y macros con apoyo de IA',
    preheader: 'Convierte una comida real en datos utiles para tu registro diario.',
    title: 'Como usar IA para estimar comida, calorias y macros',
    intro:
      'Esta semana el objetivo es aprender a describir mejor lo que comes para registrar con mas claridad. No necesitas pesar todo desde el primer dia; empieza por anotar con honestidad y suficiente detalle.',
    aiTip:
      'Cuando uses ChatGPT, incluye alimento, cantidad aproximada, metodo de preparacion y extras como aceite, salsas, pan, tortillas, bebidas o postres. Mientras mas contexto des, mas util sera la estimacion.',
    personalReflection:
      'La comida no se controla con culpa; se controla con informacion. Una estimacion imperfecta registrada con constancia vale mas que un dia perfecto que nunca se anota.',
    actionStep:
      'Elige una comida de hoy, pide una estimacion de calorias y macros, y registra esos datos en Bitacora Daniel.',
    bitacoraPrompt: foodMacroEstimationPrompt,
    disclaimerNote: standardDisclaimer,
  },
  'week-2': {
    subject: 'Semana 2: registra tus entrenamientos con mas claridad',
    preheader: 'Usa IA para ordenar duracion, intensidad y calorias estimadas.',
    title: 'Como usar IA para registrar ejercicio y calorias quemadas',
    intro:
      'El ejercicio tambien necesita registro simple. No se trata de adivinar perfecto, sino de capturar que hiciste, cuanto duro, con que intensidad y como respondio tu cuerpo.',
    aiTip:
      'Describe tu entrenamiento con duracion, tipo de actividad, intensidad, peso corporal aproximado y pausas. Pide una estimacion conservadora de calorias quemadas y un resumen breve para registrar.',
    personalReflection:
      'Entrenar se siente bien, pero registrar te permite ver constancia. La bitacora convierte esfuerzo suelto en evidencia acumulada.',
    actionStep:
      'Registra un entrenamiento esta semana con nombre, duracion, intensidad y calorias estimadas. Si dudas, usa una estimacion conservadora.',
    bitacoraPrompt:
      'Prompt sugerido: "Peso aproximadamente [peso]. Hice [actividad] durante [minutos] a intensidad [baja/media/alta], con [pausas o detalles]. Estima calorias quemadas de forma conservadora y dame una nota breve para mi registro."',
    disclaimerNote:
      'Las calorias quemadas son aproximadas y pueden variar mucho por persona, intensidad, tecnica y dispositivo. Usa la estimacion como referencia, no como verdad exacta.',
  },
  'week-3': {
    subject: 'Semana 3: entiende peso, grasa, musculo y medidas',
    preheader: 'Aprende a leer progreso sin depender de un solo numero.',
    title: 'Como interpretar tus metricas corporales con mejor criterio',
    intro:
      'El peso importa, pero no cuenta toda la historia. Tambien conviene revisar grasa corporal, masa muscular, cintura, pecho, brazo, pierna y tendencia en el tiempo.',
    aiTip:
      'Puedes pedir a ChatGPT que te ayude a comparar cambios entre dos fechas. Incluye peso, porcentaje de grasa, masa muscular y medidas. Pide una lectura objetiva, sin diagnostico medico ni conclusiones exageradas.',
    personalReflection:
      'La paciencia tambien es disciplina. Una semana puede verse rara; varias semanas juntas muestran direccion. No te castigues por una medicion aislada.',
    actionStep:
      'Registra una medicion corporal o revisa tu ultima comparacion. Observa que subio, que bajo y que ajuste pequeno conviene hacer esta semana.',
    bitacoraPrompt:
      'Prompt sugerido: "Compara estas dos mediciones: [fecha 1 con datos] y [fecha 2 con datos]. Dime cambios principales en peso, grasa, musculo y medidas. No des diagnostico medico; dame una lectura practica para ajustar habitos."',
    disclaimerNote:
      'Las metricas corporales tienen margen de error. Usa tendencias y registros repetidos; para temas medicos o clinicos consulta a un profesional.',
  },
  'week-4': {
    subject: 'Semana 4: disciplina diaria y consistencia real',
    preheader: 'El progreso se sostiene con habitos pequenos, honestidad y seguimiento.',
    title: 'Registra aunque el dia no sea perfecto',
    intro:
      'La bitacora no es para presumir dias perfectos. Es para sostener conciencia, corregir rapido y volver al camino cuando algo se desordena.',
    aiTip:
      'Usa ChatGPT para cerrar el dia en pocas lineas: que salio bien, que se puede corregir y cual es la accion simple para manana. No necesitas una respuesta larga.',
    personalReflection:
      'El testimonio se construye en lo ordinario: comer mejor, moverse, descansar, orar o reflexionar, y volver a intentarlo sin drama. La constancia tambien es una forma de respeto propio.',
    actionStep:
      'Haz tu check-in diario y escribe una nota honesta de una linea: que hiciste bien y que vas a cuidar manana.',
    bitacoraPrompt:
      'Prompt sugerido: "Con base en mi dia: [resume comida, ejercicio, energia, sueno y emociones], dame una reflexion breve, una correccion concreta y una accion simple para manana."',
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

function renderText(newsletter: Newsletter) {
  return [
    `Asunto: ${newsletter.subject}`,
    `Preheader: ${newsletter.preheader}`,
    '',
    newsletter.title,
    '',
    'Introduccion:',
    newsletter.intro,
    '',
    'Tip de IA:',
    newsletter.aiTip,
    '',
    'Reflexion personal:',
    newsletter.personalReflection,
    '',
    'Accion de la semana:',
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
                <p style="margin: 0 0 10px 0; color: #60707a; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;">Bitacora Daniel</p>
                <h1 style="margin: 0; color: #17212b; font-size: 28px; line-height: 1.15;">${escapeHtml(newsletter.title)}</h1>
                <p style="margin: 12px 0 0 0; color: #586875; font-size: 15px; line-height: 1.5;">${escapeHtml(newsletter.preheader)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 26px 10px 26px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                  ${renderHtmlSection('Introduccion', newsletter.intro)}
                  ${renderHtmlSection('Tip de IA', newsletter.aiTip)}
                  ${renderHtmlSection('Reflexion personal', newsletter.personalReflection)}
                  ${renderHtmlSection('Accion de la semana', newsletter.actionStep)}
                  ${renderHtmlSection('Prompt sugerido', newsletter.bitacoraPrompt, true)}
                  ${renderHtmlSection('Nota final', newsletter.disclaimerNote)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 18px 26px 26px 26px; border-top: 1px solid #edf1ee;">
                <p style="margin: 0; color: #74818a; font-size: 12px; line-height: 1.5;">
                  Recibes este contenido porque aceptaste recibir tips de bienestar, habitos y progreso de Bitacora Daniel.
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
    .eq('newsletter_opt_in', true)
    .not('email', 'is', null);

  if (appUsersError) throw appUsersError;

  const { data: sentRows, error: sentError } = await serviceClient
    .from('newsletter_send_log')
    .select('recipient_email')
    .eq('issue_id', issueId)
    .eq('status', 'sent');

  if (sentError) throw sentError;

  const alreadySentEmails = new Set((sentRows || []).map((item) => normalizeEmail(item.recipient_email)));
  const candidates: RecipientCandidate[] = [];

  for (const appUser of (appUsers || []) as AppUserRecord[]) {
    const email = normalizeEmail(appUser.email || '');
    if (!email || !appUser.user_id) continue;

    const { data: authUserData, error: authUserError } = await serviceClient.auth.admin.getUserById(appUser.user_id);
    const authUser = authUserData?.user as Record<string, unknown> | undefined;

    candidates.push({
      userId: appUser.user_id,
      email,
      profileType: appUser.profile_type || 'fitness-basic',
      confirmed: !authUserError && isConfirmedAuthUser(authUser),
      alreadySent: alreadySentEmails.has(email),
    });
  }

  return candidates;
}

function summarizeCandidates(candidates: RecipientCandidate[]) {
  return {
    candidateCount: candidates.length,
    confirmedCount: candidates.filter((item) => item.confirmed).length,
    alreadySentCount: candidates.filter((item) => item.alreadySent).length,
    skippedUnconfirmedCount: candidates.filter((item) => !item.confirmed).length,
    sendableCount: candidates.filter((item) => item.confirmed && !item.alreadySent).length,
  };
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

  if (dryRun) {
    return jsonResponse({ ok: true, issueId, dryRun: true, ...summary });
  }

  const status = await getNewsletterStatus(serviceClient, user.id, issueId);
  if (status !== 'ready') {
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
          subject: newsletter.subject,
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
    sentCount,
    failedCount,
    skippedCount,
  });
});
