# Seguridad y despliegue

## Variables de entorno (Vercel)

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión a Neon Postgres |
| `ADMIN_KEY` | Clave del evaluador. Solo se acepta como `Authorization: Bearer <clave>` (no por URL) |
| `ANTHROPIC_API_KEY` | Clave de la API de Claude para el análisis de fotos con IA (`/api/ai/analyze`) |

## Análisis de fotos con IA

- Se ejecuta en Vercel (`/api/ai/analyze`), protegido con `ADMIN_KEY`. Ya no usa el Worker de Cloudflare.
- Requiere marcar el consentimiento informado del trabajador; queda registrado en la evaluación (`info.consentimientoIA`).
- La IA solo propone códigos posturales; el médico revisa y decide si los aplica.
- El Worker antiguo `panacea-ergo-ai.wences18.workers.dev` (v2.1) ya no se usa. Si se recupera el acceso a esa
  cuenta de Cloudflare, desactivarlo; mientras tanto, anular la clave de IA que tenga configurada.

## Llamadas manuales a la API

```bash
curl -X POST https://<dominio>/api/admin/init -H "Authorization: Bearer $ADMIN_KEY"
```

## Datos personales (Ley 29733)

- El borrador local (nombre, DNI) caduca a las 24 h en el navegador.
- Las fotos no se guardan en el navegador ni en la base de datos.
- Antes de enviar fotos al análisis IA, registrar el consentimiento informado del trabajador.
