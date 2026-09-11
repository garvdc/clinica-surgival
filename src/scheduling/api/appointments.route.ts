import {
  createAppointment,
  rescheduleAppointment,
  changeAppointmentStatus,
} from '@/scheduling/appointments.service';
import type { Actor } from '@/identity/auth.service';
export async function appointmentsRoute(
  db: () => D1Database,
  u: Actor,
  x: Record<string, unknown>,
) {
  if (x.action === 'appointment') return createAppointment(db, u, x);
  if (x.action === 'reschedule') return rescheduleAppointment(db, u, x);
  if (x.action === 'status') return changeAppointmentStatus(db, u, x);
  return null;
}
