# Edición de pacientes y responsables de pago

La ficha del paciente y el responsable de pago se editan mediante acciones independientes. Administración y Recepción pueden utilizarlas; Caja y el profesional clínico conservan su acceso de consulta a estos datos.

## Editar un paciente

En Pacientes, el botón Editar abre los datos personales: nombre, identificación, teléfono y fecha de nacimiento. Se mantienen las comprobaciones de duplicados y fechas.

Los responsables externos no cambian. Si el propio paciente es el pagador y ese registro pertenece exclusivamente a su ficha, su nombre se sincroniza. La operación conserva todos los vínculos y permite editar una ficha incluso si no tiene pagador. Un registro heredado de tipo propio compartido no se renombra automáticamente, para evitar afectar a otra persona.

## Editar un responsable de pago

Cada pagador externo visible en la tabla tiene su botón Editar responsable de pago. El formulario consulta por su identificador y muestra nombre, tipo y todos los pacientes vinculados obtenidos del servidor, sin depender del límite de carga del listado principal.

Se pueden corregir los datos de una persona, empresa o aseguradora. Cuando hay varios pacientes vinculados, es obligatorio marcar la confirmación del cambio compartido. El servidor también exige esa confirmación.

Antes de guardar se comprueba que el nombre, tipo y conjunto de vínculos coincidan con los datos revisados. La escritura repite esta comprobación dentro del lote de base de datos. Si cambió la información, se rechaza la operación y se pide abrir de nuevo el formulario. Solo los cambios guardados generan el evento Pagador editado.

Los documentos internos consultan los datos actuales del pagador; una corrección también aparecerá al volver a abrirlos. El formulario informa de este alcance.

## Alcance

No se modifica el esquema de la base de datos. Esta entrega permite corregir los datos del pagador seleccionado; asignar, retirar o sustituir responsables de pago es una operación distinta, pendiente de una próxima entrega. Un pagador externo no puede convertirse en el propio paciente desde este formulario.

## Comprobaciones

- `npm test`: incluye pruebas aisladas en SQLite para pagadores compartidos, sincronización del propio paciente, fichas sin pagador, confirmación, cambios concurrentes, auditoría y permisos.
- `npm run test:api`: incluye edición de pacientes y pagadores por HTTP, además del recorrido clínico y comercial existente. Crea únicamente registros de prueba.
