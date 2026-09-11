# Cobertura de la primera demostración

| Fuente del arranque | Implementación demostrable | Límite |
|---|---|---|
| BAS-001/002/004 | Acceso individual, roles fijos, auditoría de acciones | Recuperación de acceso y administración de usuarios pendientes |
| PAC-001/002/003/004 | Alta, búsqueda, duplicados y pagador separado | Edición de ficha y múltiples pagadores desde interfaz pendientes |
| AGE-002/003/004/005 | Agenda diaria, reprogramación, estados de recepción, filtros y solapamiento | Horarios configurables y vista semanal pendientes |
| CLI-003/004/005 | Consulta desde cita, borrador, cierre, correcciones versionadas | Plantillas estructuradas, adjuntos y firma certificada pendientes |
| COM-001/002/005/007 | Presupuesto básico, aprobación, venta única y pagos parciales/combinados | Un concepto, sin impuestos; reversas y descuentos pendientes |
| FIS-001/004/005 | Comprobante imprimible, referencia simulada y reintento sin doble emisión | Simulador local; sin proveedor, cola automática ni emisión real |
| CA-01 a CA-06, CA-09 | Casos principales cubiertos por pruebas de API con datos ficticios | Las comprobaciones no sustituyen aceptación clínica |
| CA-07/08/10 | Inventario y reversas de operaciones no implementados | Se mantienen pendientes |

Las pruebas de API incluyen prohibición de notas clínicas para recepción, bloqueo de sobrepago, conservación de versiones, autorización del documento interno, CSRF, estado obsoleto y persistencia tras recargar.

Este documento describe cobertura parcial: no afirma que cada requisito original esté completo por la sola presencia de un componente.
