# Configuración → Usuarios

Solo Administración puede abrir esta sección y ejecutar sus operaciones en la API.

- **Crear:** nombre, correo único, rol y contraseña individual de 12 a 200 caracteres.
- **Editar:** datos, rol, estado y nueva contraseña opcional. Dejarla vacía conserva la actual.
- **Desactivar:** seleccionar Inactivo y confirmar. Se bloquea el acceso y se cierran las sesiones. El historial permanece asociado a la misma cuenta.
- **Reactivar:** seleccionar Activo. La persona debe iniciar sesión nuevamente.

Cambiar correo, rol, contraseña o estado revoca todas las sesiones de la cuenta, incluida la sesión propia si se modifica la cuenta actual. El servidor verifica el estado activo en cada solicitud autenticada. La última cuenta de Administración activa no puede desactivarse ni perder ese rol; la base también protege esta regla frente a cambios concurrentes.

La lista no devuelve contraseñas, hashes ni sales. La auditoría registra el actor, usuario afectado y cambios, sin credenciales. Las ediciones simultáneas requieren actualizar la lista antes de sobrescribir información.

No hay eliminación definitiva desde la aplicación, envío de invitaciones ni recuperación de contraseña por correo. Administración asigna la contraseña y la entrega a la persona por un canal privado. Crear una cuenta Profesional no crea automáticamente un profesional de agenda: esa administración sigue pendiente.

## Instalación y despliegue

Aplicar `drizzle/0002_user_management.sql` mediante las migraciones de Wrangler antes de ejecutar esta versión. La migración añade estado y versión a las cuentas existentes (activas por defecto), sin sustituir registros. Incluye las protecciones del último administrador y la revocación de sesiones.

Las pruebas de `tests/users.test.mjs` usan una base SQLite aislada y cubren permisos, validación, duplicados, credenciales, cambios concurrentes, desactivación, reactivación y sesiones.

## Verificación local — 14 de septiembre de 2026

- 20 pruebas automatizadas aprobadas, incluidas 7 de gestión de usuarios.
- 57 solicitudes de regresión de API aprobadas (pacientes, pagadores, agenda, atención y cobros).
- Chromium: creación y desactivación mediante el formulario; inicio de sesión rechazado para la cuenta desactivada; pantalla sin desbordamiento general a 1366×600, 390×844 y 320×568.
- TypeScript y compilación para Cloudflare aprobados. Lint de los archivos nuevos de usuarios y autenticación aprobado; el lint general conserva incidencias anteriores en otros módulos.

La migración se aplicó en las bases local y Cloudflare. El 14 de septiembre de 2026 se publicó la función en la demo alojada, tras guardar y validar un respaldo privado. Se verificaron la página (200), la API sin sesión (401), la lista de usuarios para Administración (200) y su rechazo para Recepción (403). Las sesiones de prueba se cerraron al terminar.
