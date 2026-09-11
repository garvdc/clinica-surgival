# Clínica Surgival · MVP local

Primera versión demostrable del flujo paciente → cita → consulta → presupuesto → venta → pago. Dispone de una copia local y una demo alojada con acceso restringido. Utilizar solo datos ficticios; no está habilitada para una operación clínica real ni emisión fiscal.

## Demo independiente en Cloudflare

https://clinica-surgival-demo.clinica-surgival-mvp.workers.dev

Entra directamente con las cuentas de `ACCESOS_DEMO.txt`, sin ChatGPT. Esta es la
dirección para compartir con el cliente. El 9 de septiembre de 2026 se copiaron los
datos ficticios locales y se comprobó el flujo completo en el alojamiento. Las
bases local, Sites y Cloudflare son independientes; para compartir cambios usen
ambos esta dirección y actualicen la pantalla. Instrucciones de publicación y
respaldo en `docs/CLOUDFLARE.md`.

## Publicación anterior en Sites

https://clinica-surgival-demo.rea-de-traba-1179.chatgpt.site

Primero se inicia sesión con la cuenta autorizada por el alojamiento; después se usa una cuenta demo. Se trasladó una copia de los datos ficticios locales el 8 de septiembre de 2026. Las bases local y alojada son independientes: para compartir cambios ambos deben usar la URL alojada y actualizar la página. El compañero aún requiere invitación autorizada.

## Iniciar

Requisito: Node.js 26 o superior y npm. Las dependencias y la base local se incluyen en la copia preparada en esta computadora.

```bash
npm install
npm run setup:local
npm run dev
```

Si ya están instaladas las dependencias y configurada la base, basta `npm run dev`. Abre la dirección que imprime el servidor (normalmente http://localhost:3000). El servidor se limita a la interfaz local 127.0.0.1. Detener con Ctrl+C.

`npm run setup:local` aplica las migraciones y agrega datos ficticios de ejemplo sin reemplazar registros existentes. Los datos se guardan en `.wrangler/state/`; cerrar el navegador no los borra. No borrar esa carpeta si se desea conservarlos.

## Cuentas de demostración

Los accesos están en `ACCESOS_DEMO.txt`. La contraseña aleatoria generada en la instalación también está en `.demo-credentials`; ambos archivos son privados y están excluidos de Git. Estas cuentas comparten una contraseña de demostración; antes de cualquier piloto deberán crearse credenciales únicas para usuarios reales y reemplazar estas cuentas.

| Cuenta | Puede hacer |
|---|---|
| `admin@demo.local` | Pacientes, citas, presupuestos, ventas/pagos y auditoría; no obtiene notas clínicas. |
| `recepcion@demo.local` | Pacientes y agenda; sin notas clínicas ni cobros. |
| `medico@demo.local` | Consulta agenda; crea, cierra y corrige sus propias notas clínicas. |
| `caja@demo.local` | Consulta pacientes/agenda; presupuestos, ventas, pagos y documentos internos. |

## Recorrido de prueba

1. Entrar con recepción. Registrar un paciente ficticio y su pagador; programar una cita.
2. Entrar con profesional. Abrir Atención clínica, elegir la cita y guardar una nota ficticia. Cerrar la atención; una corrección posterior conserva la versión anterior.
3. Entrar con caja. Crear un presupuesto de un servicio en USD, aprobarlo y convertirlo en venta.
4. Registrar varios pagos: efectivo USD, transferencia, débito, crédito o Cashea. Los pagos en Bs requieren tasa manual Bs/USD; la conversión se guarda sin recalcular el pasado.
5. Abrir Documento interno y usar Imprimir / guardar como PDF. El documento indica que no tiene validez fiscal.
6. Simular fallo fiscal y reintentar la emisión. Se conserva una referencia simulada por venta.
7. Consultar Registro de actividad con administración.

Cashea se registra por el monto cubierto, con referencia; no hay integración con Cashea ni control de cuotas. Una venta de USD 100 puede pagarse con USD 40 en efectivo, Bs 1.200 a una tasa ficticia de 40 Bs/USD y USD 30 cubiertos por Cashea. Es solo un ejemplo de prueba; la tasa no es actual ni se consulta automáticamente.

## Qué está implementado

- Sesiones individuales con cookie HttpOnly, contraseña derivada con PBKDF2, expiración y cierre; limitación de intentos de acceso por cuenta.
- Paciente separado del pagador; detección de identificación duplicada y coincidencias de teléfono/nombre-fecha.
- Agenda diaria filtrable por profesional/estado, reprogramación, llegada, confirmación, cancelación y control de solapamiento en la base de datos.
- Notas de consulta, borrador, cierre y correcciones con versiones conservadas; autorización clínica en el servidor.
- Presupuesto básico de un concepto, aprobación, conversión única a venta.
- Pagos totales, parciales y combinados, importes en centavos, tasa manual conservada e idempotencia de pago.
- Protección contra sobrepago en la base, auditoría y documento interno imprimible.
- Simulación fiscal controlada, sin conexión a un proveedor externo.

## Límites de esta primera versión

- No equivale al MVP completo de todos los documentos: faltan edición de fichas, administración de profesionales/usuarios/horarios, agenda semanal, adjuntos, formularios configurables, procedimientos específicos, múltiples líneas por presupuesto y reversas de pagos/ventas.
- Los horarios reales, campos clínicos y reglas de impuestos siguen pendientes de definir. La agenda permite reservar libremente por fecha/hora mientras se especifican los horarios; solo evita solapamientos.
- El profesional demo puede iniciar una atención sobre una cita disponible; el vínculo entre cuenta y profesional de agenda debe configurarse antes de un piloto con varios profesionales.
- Hay topes de carga inicial (500 pacientes/pagadores, 1.000 citas). La paginación en servidor y el rendimiento con volumen real quedan pendientes.
- No hay firma electrónica certificada, recuperación de contraseña, permisos configurables, emisión fiscal real, inventario, reportes avanzados ni migración de datos reales.
- No se debe alojar públicamente esta demo ni usar su servidor de desarrollo como producción. Revisar dependencias, autenticación, privacidad, respaldo y restauración antes de ese paso.
- El botón Documento interno abre una página imprimible; la generación de un archivo PDF se realiza con la función Guardar como PDF del navegador.

## Verificación

```bash
npm run typecheck
npm test
npm run build
npm run test:api
```

`test:api` requiere un servidor activo. Usa `CLINIC_TEST_URL` si el puerto es distinto. Ejecuta el flujo y sus errores por HTTP; crea datos ficticios identificados como TEST. No ejecutarlo contra datos reales. No se ha realizado una prueba visual de navegador en esta entrega.

## Respaldos

`npm run backup:local` exporta exclusivamente la base local (no la alojada) a `backups/`, carpeta privada excluida de Git. Para restaurar, usar una copia vacía del proyecto y ejecutar el SQL exportado con Wrangler local; verificar recuentos e integridad antes de sustituir cualquier base. Una restauración sobre una base existente no es una operación automática ni se autoriza por este comando.

## Arquitectura y fuentes

El código está organizado por dominios en `src/`: identidad, pacientes, agenda, atención clínica, cobros y auditoría. Consulta [la guía de arquitectura](docs/ARQUITECTURA.md) para ubicar servicios, pantallas, rutas y comprobaciones de la refactorización.

React + TypeScript, Vinext/Vite, consultas preparadas y transacciones sobre D1/SQLite local, migraciones Drizzle. La demo alojada usa un Site con acceso restringido y su propia base D1. El scaffold incluye componentes de interfaz Shadcn/Base UI.

Esto difiere de la propuesta técnica NestJS/PostgreSQL: dicha propuesta no era una selección aprobada. Este código demuestra el flujo; antes de una versión operativa se debe decidir si conservar esta infraestructura o trasladar los módulos a aquella arquitectura.

Fuentes: Documento Funcional de Arranque v0.1, propuesta técnica, esquema gráfico y ruta del proyecto en la carpeta superior. Las respuestas confirmadas del usuario se registran en `docs/DECISIONES.md`.
