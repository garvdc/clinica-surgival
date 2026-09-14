import { json } from '@/shared/api/response';
export function databaseError(error: unknown) {
  const m = error instanceof Error ? error.message : 'Error';
  if (m.includes('last_active_admin'))
    return json(
      {
        error:
          'Debe quedar al menos un administrador activo. Crea o activa otro antes de cambiar esta cuenta.',
      },
      409,
    );
  if (m.includes('users.email'))
    return json({ error: 'Ya existe una cuenta con ese correo.' }, 409);
  if (m.includes('payment_exceeds_balance'))
    return json(
      { error: 'El pago supera el saldo pendiente. Actualiza la venta.' },
      409,
    );
  if (m.includes('appointment_overlap'))
    return json(
      {
        error:
          'El profesional ya tiene una cita en ese horario. Elige otro horario.',
      },
      409,
    );
  if (m.includes('UNIQUE constraint'))
    return json({ error: 'El registro ya existe. Actualiza la lista.' }, 409);
  if (m.includes('D1_') || m.includes('SQLITE') || m.includes('FOREIGN KEY'))
    return json(
      {
        error:
          'No se pudo guardar. Verifica los datos seleccionados e inténtalo de nuevo.',
      },
      400,
    );
  return json({ error: m }, 400);
}
