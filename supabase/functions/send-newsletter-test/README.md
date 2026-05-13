# send-newsletter-test

Edge Function para enviar un correo de prueba del newsletter únicamente a la cuenta Daniel autorizada.

## Seguridad

- Requiere sesión autenticada de Supabase.
- Verifica que `user.email` sea `itsme.daniel0802@gmail.com`.
- No acepta destinatario desde frontend.
- No consulta ni envía `app_users`.
- No envía snapshots, privateVault, PIN, Salud hormonal ni datos personales del usuario.
- No activa cron ni automatización.

## Secrets necesarios

```bash
supabase secrets set RESEND_API_KEY="re_xxxxxxxxx"
supabase secrets set NEWSLETTER_TEST_FROM="Bitácora Daniel <newsletter@tu-dominio-verificado.com>"
```

Si no se configura `NEWSLETTER_TEST_FROM`, la función intenta usar `ADMIN_NOTIFICATION_FROM`.

`SUPABASE_URL` y `SUPABASE_ANON_KEY` normalmente ya están disponibles en Edge Functions.

## Deploy

```bash
supabase functions deploy send-newsletter-test
```

No usar `--no-verify-jwt`; esta función debe recibir y validar la sesión del usuario.

## Payload

```json
{
  "issueId": "week-1"
}
```

Issues soportados:

- `welcome`
- `week-1`
- `week-2`
- `week-3`
- `week-4`

## Respuesta esperada

```json
{
  "ok": true,
  "issueId": "week-1"
}
```
