# Decisiones vigentes del MVP · Clínica Surgival

Confirmadas por el usuario en esta conversación, 7 y 8 de septiembre de 2026.

| Decisión | Definición |
|---|---|
| Nombre | Clínica Surgival |
| País | Venezuela |
| Ejecución inicial | Local, en la computadora del usuario |
| Alcance | Una sede y datos ficticios; pacientes → agenda → atención → presupuesto → venta → pago |
| Actividad | Citas y consultas; especialidades y procedimientos se especificarán después |
| Precios | USD |
| Conversión | Tasa manual Bs/USD, conservada en cada pago |
| Cobros | Efectivo en USD, transferencia, débito, crédito y Cashea |
| Modalidades | Totales, parciales y combinados |
| Cashea | Registrar monto cubierto y referencia; no administrar cuotas ni integrar la plataforma |
| Facturación externa | Simulada, sin validez fiscal |
| Inventario | Fuera de esta primera demostración |

## Decisiones provisionales de implementación

- Formulario clínico de texto libre, vinculado a cita y paciente, con borrador/cierre/versionado.
- Presupuestos de un concepto y sin cálculo de impuestos. No son documentos fiscales.
- Dos profesionales de ejemplo y cuatro cuentas demo: administración, recepción, profesional y caja.
- Base local SQLite/D1; React/TypeScript y Vinext. Esta implementación usa la plantilla Sites y difiere de la recomendación NestJS/PostgreSQL del PDF; esa recomendación no estaba aprobada como requisito. La arquitectura para operación real sigue abierta.
- Sin conexión a servicios de salud, bancos, Cashea o proveedor fiscal.

## Pendientes funcionales

1. Campos de la historia/consulta, formularios, especialidades y procedimientos reales.
2. Profesionales, horarios, duración de servicios y reglas de reserva.
3. Permisos definitivos por usuario, vínculo cuenta-profesional y acceso a pacientes asignados.
4. Reglas fiscales, impuestos, numeración y proveedor de Caja Negra.
5. Criterios de coincidencia de pacientes y tratamiento de teléfonos familiares compartidos.
6. Reversas, devoluciones, descuentos, convenios y autorizaciones de pagadores.
7. Límites del piloto, conservación de datos, soporte y recuperación.

## Trazabilidad

El Documento Funcional de Arranque v0.1 ya está disponible en la carpeta superior. Su numeración original es la referencia; la lista de 39 requisitos creada antes de disponer de él permanece como síntesis histórica.

No se ha aprobado una salida a producción. El MVP local permite probar el recorrido y definir las siguientes iteraciones con ejemplos reales de la operación, sin cargar datos de pacientes reales.

## Acceso compartido solicitado el 8 de septiembre

El compañero accederá desde otra ubicación. El usuario eligió una demo alojada con enlace, independiente de su computadora. Se prepara una copia de los registros ficticios actuales; las bases local y alojada no se sincronizan. El acceso del compañero queda pendiente de su correo e invitación autorizada.

## Alojamiento independiente solicitado el 9 de septiembre

El usuario pidió salir de Sites y utilizar alojamiento gratuito. Autorizó su cuenta
propia de Cloudflare. La demo se publicó en
https://clinica-surgival-demo.clinica-surgival-mvp.workers.dev y utiliza las cuentas
internas demo, sin requisito de acceso a ChatGPT ni invitación de Sites. Se copió
la base local; las tres instancias permanecen independientes. No se contrató un
plan de pago ni un dominio. La invitación pendiente de la plataforma anterior ya
no es necesaria para probar esta nueva dirección.
