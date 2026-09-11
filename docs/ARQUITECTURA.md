# Arquitectura por dominios

La refactorización de septiembre de 2026 organiza el MVP de Clínica Surgival por sus funciones de negocio. `app/` conserva los puntos de entrada que necesita Vinext; el código de la aplicación vive en `src/`.

## Dónde encontrar cada función

| Carpeta | Responsabilidad |
|---|---|
| `src/identity/` | Inicio y cierre de sesión, PBKDF2, identificación del usuario y permisos. |
| `src/patients/` | Pacientes, responsables de pago, detección de duplicados, listado y formulario. |
| `src/scheduling/` | Profesionales, agenda, creación y reprogramación de citas, estados y herramienta de navegación de agenda. |
| `src/clinical/` | Notas clínicas, cierre, correcciones, historial de versiones y sus componentes. |
| `src/billing/` | Presupuestos, ventas, pagos USD/Bs, idempotencia, simulación fiscal y documento imprimible. |
| `src/audit/` | Escritura de eventos y consulta de los últimos 100 eventos para administración. |
| `src/shared/` | Base D1/Drizzle, validación común, respuestas y errores HTTP, formatos y componentes de interfaz. |
| `src/layout/` | Sesión de interfaz, navegación, encabezados y composición de los flujos. |
| `src/api/` | Contrato de datos y coordinación de la API existente. |

Cada dominio contiene sus tipos y, cuando corresponde, servicios, adaptadores de API y componentes de pantalla. Los componentes reutilizables de Shadcn/Base UI están en `src/shared/ui/`. El alias `@/` apunta a `src/`.

## Recorrido de una petición

`app/api/clinic/route.ts` exporta los handlers de `src/api/orchestrate.ts`. La URL continúa siendo `/api/clinic` y conserva los mismos nombres de acciones, respuestas y códigos HTTP.

El orquestador comprueba origen, formato y sesión; después delega en el dominio correspondiente. `src/api/workflow.ts` distribuye las acciones clínicas y comerciales. Las lecturas consultan los servicios de cada dominio conservando el orden de las dos tandas de consultas y las restricciones por rol.

`app/invoice/[id]/route.ts` exporta el handler de `src/billing/api/invoice.route.ts`. El documento interno sigue disponible en `/invoice/:id`, con los mismos permisos y formato imprimible.

Los servicios mantienen las consultas preparadas, los parámetros y el orden de los lotes D1. Las escrituras de auditoría que dependen de `changes()` permanecen junto a su operación dentro del mismo lote.

## Composición de la interfaz

`app/page.tsx` exporta el shell de `src/layout/app-shell.tsx`. El shell mantiene la sesión, navegación y estado de los modales, y compone agenda, pacientes, auditoría y flujos clínicos/comerciales.

`app/workflow.tsx` conserva el export de compatibilidad; el controlador está en `src/layout/workflow.tsx`. Los formularios y tarjetas se encuentran en sus dominios. El controlador permanece montado al alternar sus pestañas para conservar el estado compartido y la clave de idempotencia de pago. Esta clave cambia después de completar la operación y recargar los datos.

`WorkflowTarget` mantiene la identidad del selector al cambiar entre cita y venta. La gestión de foco del modal sigue en el shell. Se conservaron los nombres de campos, valores iniciales, campos deshabilitados, clases CSS y textos visibles.

## Reglas puras y persistencia

- `src/scheduling/transitions.ts` contiene el mapa de estados `transitions` y la función pura `transition()`; `appointments.service.ts` los reexporta.
- `src/billing/money.ts` contiene `cents()` y `toUSD()`; `billing.service.ts` las reexporta. Permanecen en cobros porque son reglas monetarias del dominio.
- Los módulos puros permiten ejecutar las pruebas de reglas en Node sin cargar el entorno `cloudflare:workers`.
- `src/shared/format.ts` mantiene el formato de moneda de la interfaz y la fecha local. `print-format.ts` conserva por separado el escape HTML y el formato monetario del comprobante.
- El esquema ahora está en `src/shared/db/schema.ts`; `drizzle.config.ts` solo cambia esa ruta. Las migraciones y la estructura de datos son las mismas.
- Las bases locales y alojadas siguen siendo independientes. Esta refactorización no migra datos ni publica una nueva versión.

## Comprobaciones reproducibles

Desde la carpeta `mvp`:

```bash
npm run typecheck
npm test
npm run build
npm run build:cloudflare
```

Para la prueba integral, iniciar `npm run dev` en otra terminal y ejecutar:

```bash
npm run test:api
```

`test:api` utiliza las credenciales locales privadas y crea registros ficticios identificados como `TEST`. Verifica pacientes, citas, notas/versiones, presupuestos, ventas, pagos, simulación fiscal, documento interno, permisos, cierre de sesión y protección de origen. `CLINIC_TEST_URL` permite elegir otro puerto.

La revisión de código también compara los componentes extraídos y las consultas con la versión previa. La comprobación HTTP de la página principal valida la respuesta inicial del servidor; no sustituye una revisión visual e interactiva en navegador.

### Resultado del 10 de septiembre de 2026

- TypeScript: sin errores.
- Reglas de negocio y restricciones SQLite: 5 pruebas aprobadas.
- API local: 43 solicitudes verificadas, más comprobación del documento interno, protección de origen, permisos y conservación de versiones.
- Página principal: HTTP 200 y contenido inicial correcto.
- Compilación normal y compilación para Cloudflare: ambas completadas.
- Esquema, migraciones, CSS, dependencias y configuraciones protegidas: conservados; solo cambian los paths expresamente necesarios.

Las compilaciones muestran avisos de compatibilidad futura de Vite/Node y de clasificación estática de Vinext, sin impedir la compilación. No se ejecutó una prueba visual en navegador ni se publicó esta refactorización en GitHub o en el alojamiento.
