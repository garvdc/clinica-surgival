# Verificación de la primera versión · 8 de septiembre de 2026

## Cloudflare independiente · 9 de septiembre de 2026

- `npm run build:cloudflare`: completado omitiendo el complemento de Sites.
- `npm run typecheck`: sin errores.
- Publicación activa: `06a87b25-fc10-4c98-a68a-19ee1887f1be`.
- HTTPS devuelve 200 en https://clinica-surgival-demo.clinica-surgival-mvp.workers.dev.
- Prueba integral HTTP en esa dirección: 43 solicitudes verificadas, más
  documento, CSRF, permisos y versiones clínicas; aprobada. Registro ficticio
  añadido: `TEST-1788990806743`.
- Las tablas y la instantánea inicial se importaron en una nueva base D1. No se
  copiaron sesiones locales. La prueba confirma funcionamiento de la demo; no
  constituye una validación de carga ni una certificación para datos clínicos reales.

## Historial de la primera entrega

Ubicación de ejecución: `/home/gabriel/Escritorio/Clinica/mvp`.

- `npm run typecheck`: aprobado, sin errores de TypeScript.
- `npm test`: cinco pruebas de reglas aprobadas; fechas y duración, roles y transiciones, conversión en centavos, solapamientos y saldo/venta única.
- `npm run build`: compilación completada para aplicación, API y documento interno.
- `npm run test:api`: 43 solicitudes verificadas, más comprobaciones de documento interno y origen de solicitudes. Se probó alta y duplicado de paciente, reserva y conflicto de horario, reprogramación y estado obsoleto, notas clínicas y acceso denegado a recepción, cierre/corrección, conservación de dos versiones, aprobación y conversión única, pago repetido, sobrepago, cobro mixto USD/Bs/Cashea, simulación fiscal con fallo/reintento y cierre de sesión.
- `npm run backup:local`: exportación SQL completada y restaurada en una base temporal aislada; `PRAGMA integrity_check` devolvió `ok`. La base activa no se modificó durante esta comprobación.
- La instalación del conjunto corregido de dependencias reportó cero vulnerabilidades conocidas en la auditoría de npm. Esto no constituye una auditoría integral de seguridad de la aplicación.

Las pruebas de API dejaron datos ficticios TEST para poder revisar su trazabilidad. No contienen datos de pacientes reales. El rendimiento registrado en desarrollo no acredita los objetivos de carga o tiempos de respuesta de producción.

No se ha realizado una prueba visual/interactiva de navegador, ni validación con usuarios clínicos. El mecanismo WebMCP se activa solo si el navegador lo soporta; su registro y ejecución no se han verificado en un contexto compatible y no son necesarios para usar la interfaz.

Se ha desplegado una demo alojada privada. No está conectada a servicios de facturación, bancos o Cashea. Las limitaciones funcionales están documentadas en README.md y docs/COBERTURA.md.

## Publicación privada y transferencia

URL: https://clinica-surgival-demo.rea-de-traba-1179.chatgpt.site

El 8 de septiembre se copiaron 4 usuarios, 4 pacientes, 4 pagadores, 4 relaciones paciente-pagador, 2 profesionales, 4 citas, 23 eventos, 1 consulta, 2 versiones clínicas, 2 presupuestos, 2 ventas y 3 pagos. No se copiaron sesiones ni intentos de acceso. El snapshot se validó con integridad y claves foráneas en una base aislada antes de importarlo.

Por HTTP se comprobaron la página, API sin sesión (401), cuatro accesos demo, IDs conservados, notas y versiones, documento interno y restricciones de recepción (403). La importación repetida fue rechazada (409). Tras la copia se retiró del código la ruta temporal de importación. El acceso desde la PC del compañero sigue pendiente de invitación y comprobación por él.
