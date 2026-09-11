import { json } from '@/shared/api/response';
export function databaseError(error: unknown) {
  const m = error instanceof Error ? error.message : 'Error';
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
