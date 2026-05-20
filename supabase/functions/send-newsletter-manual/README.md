# send-newsletter-manual

Edge Function para envío manual controlado de newsletters reales a usuarios con `newsletter_opt_in = true`.

## Seguridad

- Requiere sesión autenticada de Supabase.
- Solo permite ejecutar si `user.email` es `itsme.daniel0802@gmail.com`.
- No acepta lista de correos desde frontend.
- Lee destinatarios desde `public.app_users` con `newsletter_opt_in = true`.
- Verifica confirmación de correo con Auth Admin antes de enviar.
- Omite destinatarios ya enviados para el mismo `issue_id`.
- Registra resultados en `public.newsletter_send_log`.
- No activa cron ni automatización.
- No envía snapshots, privateVault, PIN, Salud hormonal ni datos personales.

## SQL requerido

Ejecutar la sección `newsletter_send_log` agregada en `supabase/schema.sql`.

## Secrets necesarios

```bash
supabase secrets set RESEND_API_KEY="re_xxxxxxxxx"
supabase secrets set NEWSLETTER_FROM="Bitácora Daniel <newsletter@tu-dominio-verificado.com>"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

`SUPABASE_URL` y `SUPABASE_ANON_KEY` normalmente ya están disponibles en Edge Functions.

## Deploy

```bash
supabase functions deploy send-newsletter-manual
```

No usar `--no-verify-jwt`; esta función debe validar la sesión del usuario.

## Payload

Conteo sin enviar:

```json
{
  "issueId": "week-1",
  "dryRun": true
}
```

La respuesta de `dryRun` incluye resumen y `recipientDiagnostics` para la vista interna de Daniel:

```json
{
  "candidateCount": 2,
  "alreadySentCount": 1,
  "pendingToSendCount": 1,
  "errorCount": 0,
  "recipientDiagnostics": [
    {
      "displayName": "Daniel",
      "emailMasked": "it***@gmail.com",
      "status": "sent",
      "sentAt": "2026-05-20T18:00:00.000Z"
    }
  ]
}
```

Estados posibles por destinatario: `sent`, `pending`, `unconfirmed`, `error`.

Envío real:

```json
{
  "issueId": "week-1",
  "dryRun": false
}
```

## Guardrails

- Si el newsletter no está en estado `ready` en el snapshot de Daniel, devuelve `409`.
- Si ya existe `status = sent` para el mismo `issue_id + recipient_email`, no reenvía.
- Si el correo no está confirmado, registra `skipped`.
