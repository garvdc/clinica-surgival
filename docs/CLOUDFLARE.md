# Demo independiente en Cloudflare

Dirección: https://clinica-surgival-demo.clinica-surgival-mvp.workers.dev

La aplicación se publica en la cuenta propia del usuario, mediante Workers y D1.
No requiere ChatGPT ni acceso a Sites. Usa las cuentas del archivo privado
`ACCESOS_DEMO.txt`. El acceso a registros se comprueba en el servidor.

## Publicar cambios

1. Ejecutar `npm run build:cloudflare`.
2. Si hay nuevas migraciones, revisarlas y aplicarlas con
   `npx wrangler d1 migrations apply DB --remote --config wrangler.cloudflare.json`.
3. Ejecutar `npm run deploy:cloudflare`.
4. Comprobar el enlace y las operaciones afectadas por el cambio.

La compilación independiente omite el complemento de Sites. La configuración de
publicación está en `wrangler.cloudflare.json`; el resultado compilado está en
`dist/server/wrangler.json`. No ejecutar la publicación independiente después de
una compilación destinada a Sites: primero usar `build:cloudflare`.

## Datos

El 9 de septiembre de 2026 se copió una instantánea validada de la demo local:
4 usuarios, 4 pacientes, 4 pagadores, 4 vínculos paciente-pagador, 2 profesionales,
4 citas, 23 eventos, 1 consulta, 2 versiones, 2 presupuestos, 2 ventas y 3 pagos.
No se copiaron sesiones activas. Las pruebas posteriores pueden añadir registros
marcados TEST.

La base independiente no se sincroniza con la base local ni con la anterior en
Sites. Ambos participantes deben usar esta dirección para compartir cambios y
recargar la pantalla para ver los cambios de otra persona.

`scripts/export-demo.py` y `scripts/prepare-cloudflare-data.mjs` preparan una copia
local validada para la primera importación. No volver a importarla en una base
con datos. El SQL contiene información de autenticación y queda excluido de Git
dentro de `backups/`.

## Respaldo de esta base alojada

Desde la carpeta del proyecto:

```sh
npx wrangler d1 export DB --remote --config wrangler.cloudflare.json --output backups/cloudflare-respaldo.sql
```

Usar un nombre nuevo para conservar respaldos anteriores. Guardarlos de forma
privada y verificar una restauración aislada antes de sustituir datos. El comando
`backup:local` respalda exclusivamente la copia local.

## Plan y alcance

No se contrató un plan de pago ni un dominio. Se usa la dirección workers.dev.
La disponibilidad está sujeta a las cuotas gratuitas de Workers y D1; no se ha
validado carga de producción. Esta es una demo con datos ficticios y facturación
simulada. La publicación independiente no completa los requisitos pendientes del
sistema clínico.
