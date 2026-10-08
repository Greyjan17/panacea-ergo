# Seguridad y despliegue

## Variables de entorno (Vercel)

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión a Neon Postgres |
| `ADMIN_KEY` | Clave del evaluador. Solo se acepta como `Authorization: Bearer <clave>` (no por URL) |
| `AI_WORKER_URL` | URL del Worker de IA en Cloudflare (ya no está en el código del navegador) |
| `AI_WORKER_SECRET` | Secreto compartido con el Worker (generar con `openssl rand -hex 32`) |

## Worker de IA (Cloudflare)

El navegador ya no llama al Worker: lo hace `/api/ai/analyze`, protegido con `ADMIN_KEY`,
enviando el header `X-Panacea-Secret`. Para cerrar el Worker al público, añadir al inicio
de su `fetch` y guardar el mismo valor como secreto del Worker (`wrangler secret put PANACEA_SECRET`):

```js
if (request.headers.get('X-Panacea-Secret') !== env.PANACEA_SECRET) {
  return new Response('No autorizado', { status: 401 })
}
```

Mientras no se haga, el Worker sigue aceptando peticiones anónimas (y consumiendo créditos de IA).

## Llamadas manuales a la API

```bash
curl -X POST https://<dominio>/api/admin/init -H "Authorization: Bearer $ADMIN_KEY"
```

## Datos personales (Ley 29733)

- El borrador local (nombre, DNI) caduca a las 24 h en el navegador.
- Las fotos no se guardan en el navegador ni en la base de datos.
- Antes de enviar fotos al análisis IA, registrar el consentimiento informado del trabajador.
