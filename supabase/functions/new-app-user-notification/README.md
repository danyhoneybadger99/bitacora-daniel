# new-app-user-notification

Edge Function administrativa para notificar a `ing.darredondo@lobomex.mx` cuando se crea una fila nueva en `public.app_users`.

## Arquitectura

- La tabla `public.app_users` sigue siendo la fuente administrativa mínima.
- Supabase Database Webhooks debe llamar esta función solo en eventos `INSERT` de `public.app_users`.
- La función valida un secreto compartido antes de procesar el webhook.
- La función envía correo usando Resend desde el servidor de Supabase Edge Functions.
- Ninguna API key se expone en el frontend.

## Datos enviados por correo

- Email del usuario
- Profile type
- Newsletter opt-in
- Fecha de registro
- Last seen at

No se envían datos privados, snapshots, PIN, salud hormonal, métricas, alimentos, check-ins, pagos, ciclos ni medicamentos.

## Secrets necesarios

Configurar en Supabase:

```bash
supabase secrets set ADMIN_NOTIFY_WEBHOOK_SECRET="un-secreto-largo-y-aleatorio"
supabase secrets set RESEND_API_KEY="re_xxxxxxxxx"
supabase secrets set ADMIN_NOTIFICATION_FROM="Bitácora Daniel <notificaciones@tu-dominio-verificado.com>"
supabase secrets set ADMIN_NOTIFICATION_TO="ing.darredondo@lobomex.mx"
```

`ADMIN_NOTIFICATION_TO` tiene default `ing.darredondo@lobomex.mx`, pero se recomienda configurarlo explícitamente.

## Deploy

```bash
supabase functions deploy new-app-user-notification --no-verify-jwt
```

Usamos `--no-verify-jwt` porque el webhook de base de datos no usa la sesión de un usuario final. La seguridad la controla `ADMIN_NOTIFY_WEBHOOK_SECRET`.

## Configurar Database Webhook

En Supabase Dashboard:

1. Ir a `Database` -> `Webhooks`.
2. Crear webhook nuevo.
3. Tabla: `public.app_users`.
4. Evento: `Insert`.
5. Método: `POST`.
6. URL:

```text
https://<project-ref>.functions.supabase.co/new-app-user-notification
```

7. Header:

```text
Authorization: Bearer <ADMIN_NOTIFY_WEBHOOK_SECRET>
```

8. Guardar.

## Prueba con curl

```bash
curl -X POST "https://<project-ref>.functions.supabase.co/new-app-user-notification" \
  -H "Authorization: Bearer <ADMIN_NOTIFY_WEBHOOK_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "app_users",
    "schema": "public",
    "record": {
      "email": "qa@example.com",
      "profile_type": "fitness-basic",
      "newsletter_opt_in": true,
      "created_at": "2026-05-07T00:00:00Z",
      "last_seen_at": "2026-05-07T00:00:00Z"
    }
  }'
```

## Comportamiento ante fallas

Si Resend falla, la función devuelve `502` y registra el error en logs de Edge Functions. La app principal no depende de esta función, así que no se rompe el login, el snapshot ni la experiencia del usuario.
