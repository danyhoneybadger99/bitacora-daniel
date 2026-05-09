const RESEND_ENDPOINT = 'https://api.resend.com/emails';

type AppUserRecord = {
  email?: string | null;
  profile_type?: string | null;
  newsletter_opt_in?: boolean | null;
  created_at?: string | null;
  last_seen_at?: string | null;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme?.toLowerCase() === 'bearer' && token) return token;

  return request.headers.get('x-webhook-secret') || '';
}

function getAppUserRecord(payload: Record<string, unknown>): AppUserRecord | null {
  const candidates = [
    payload.record,
    payload.new,
    payload.new_record,
    payload.data,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object') {
      return candidate as AppUserRecord;
    }
  }

  return null;
}

function formatValue(value: unknown, fallback = 'No disponible') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function formatBoolean(value: boolean | null | undefined) {
  if (value === true) return 'Sí';
  if (value === false) return 'No';
  return 'No disponible';
}

function buildEmailBody(record: AppUserRecord) {
  const lines = [
    'Se registró un nuevo usuario en Bitácora Daniel.',
    '',
    `Email del usuario: ${formatValue(record.email)}`,
    `Profile type: ${formatValue(record.profile_type)}`,
    `Newsletter opt-in: ${formatBoolean(record.newsletter_opt_in)}`,
    `Fecha de registro: ${formatValue(record.created_at)}`,
    `Last seen at: ${formatValue(record.last_seen_at)}`,
    '',
    'Este correo contiene solo datos administrativos mínimos de public.app_users.',
  ];

  return lines.join('\n');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const webhookSecret = Deno.env.get('ADMIN_NOTIFY_WEBHOOK_SECRET');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const toEmail = Deno.env.get('ADMIN_NOTIFICATION_TO') || 'ing.darredondo@lobomex.mx';
  const fromEmail = Deno.env.get('ADMIN_NOTIFICATION_FROM');

  if (!webhookSecret || !resendApiKey || !fromEmail) {
    return jsonResponse(
      {
        error: 'Missing required function secrets',
        required: ['ADMIN_NOTIFY_WEBHOOK_SECRET', 'RESEND_API_KEY', 'ADMIN_NOTIFICATION_FROM'],
      },
      500
    );
  }

  if (getBearerToken(request) !== webhookSecret) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch (_error) {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  const record = getAppUserRecord(payload);

  if (!record?.email) {
    return jsonResponse({ error: 'Missing app_users record or email' }, 400);
  }

  const resendResponse = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: 'Nuevo usuario registrado en Bitácora Daniel',
      text: buildEmailBody(record),
    }),
  });

  if (!resendResponse.ok) {
    const errorText = await resendResponse.text();

    console.error('[new-app-user-notification] Resend failed', {
      status: resendResponse.status,
      body: errorText,
    });

    return jsonResponse({ error: 'Email provider failed' }, 502);
  }

  return jsonResponse({ ok: true });
});
