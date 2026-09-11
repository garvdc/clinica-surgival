import type { Appointment } from '@/scheduling/scheduling.types';
import type { Professional } from '@/scheduling/scheduling.types';
import type { Actor } from '@/identity/auth.service';
import { json } from '@/shared/api/response';
import { auditStmt } from '@/audit/audit.service';
import { required, appointmentInput } from '@/shared/validation';
import { transition } from '@/scheduling/transitions';
export { transitions, transition } from '@/scheduling/transitions';
export async function createAppointment(
  db: () => D1Database,
  u: Actor,
  x: Record<string, unknown>,
) {
  const a = appointmentInput(x);
  const link = await db()
    .prepare('SELECT 1 FROM patient_payers WHERE patient_id=? AND payer_id=?')
    .bind(a.patientId, a.payerId)
    .first();
  if (!link) throw new Error('El pagador no está asociado a este paciente.');
  const id = crypto.randomUUID();
  await db().batch([
    db()
      .prepare(
        'INSERT INTO appointments(id,patient_id,payer_id,professional_id,date,time,duration,reason,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
      )
      .bind(
        id,
        a.patientId,
        a.payerId,
        a.professionalId,
        a.date,
        a.time,
        a.duration,
        a.reason,
        'programada',
        new Date().toISOString(),
      ),
    auditStmt(db(), u, 'Cita programada', id, `${a.date} ${a.time}`),
  ]);
  return json({ ok: true, id }, 201);
}
export async function rescheduleAppointment(
  db: () => D1Database,
  u: Actor,
  x: Record<string, unknown>,
) {
  const id = required(x.id, 'Cita'),
    reason = required(x.changeReason, 'Motivo de reprogramación', 200);
  const existing = await db()
    .prepare(
      "SELECT * FROM appointments WHERE id=? AND status IN ('programada','confirmada')",
    )
    .bind(id)
    .first<{
      patient_id: string;
      payer_id: string;
      professional_id: string;
      date: string;
      time: string;
    }>();
  if (!existing)
    throw Error('Solo puedes reprogramar citas programadas o confirmadas.');
  const a = appointmentInput({
    ...x,
    patientId: existing.patient_id,
    payerId: existing.payer_id,
    professionalId: existing.professional_id,
  });
  const beforeDate = required(x.previousDate, 'Fecha anterior'),
    beforeTime = required(x.previousTime, 'Hora anterior');
  const result = await db().batch([
    db()
      .prepare(
        "UPDATE appointments SET date=?,time=?,duration=?,reason=?,status='programada' WHERE id=? AND date=? AND time=? AND status IN ('programada','confirmada')",
      )
      .bind(a.date, a.time, a.duration, a.reason, id, beforeDate, beforeTime),
    db()
      .prepare(
        'INSERT INTO audit(id,actor,action,entity_id,detail,created_at) SELECT ?,?,?,?,?,? WHERE changes()>0',
      )
      .bind(
        crypto.randomUUID(),
        u.name,
        'Cita reprogramada',
        id,
        `${beforeDate} ${beforeTime} → ${a.date} ${a.time}. ${reason}`,
        new Date().toISOString(),
      ),
  ]);
  if (result[0].meta.changes !== 1)
    return json(
      { error: 'La cita cambió en otra sesión. Actualiza la agenda.' },
      409,
    );
  return json({ ok: true });
}
export async function changeAppointmentStatus(
  db: () => D1Database,
  u: Actor,
  x: Record<string, unknown>,
) {
  const id = required(x.id, 'Cita'),
    next = required(x.status, 'Estado'),
    previous = required(x.previous, 'Estado anterior');
  transition(previous, next);
  const reason = required(x.reason, 'Motivo del cambio', 200);
  const result = await db().batch([
    db()
      .prepare('UPDATE appointments SET status=? WHERE id=? AND status=?')
      .bind(next, id, previous),
    db()
      .prepare(
        'INSERT INTO audit(id,actor,action,entity_id,detail,created_at) SELECT ?,?,?,?,?,? WHERE changes()>0',
      )
      .bind(
        crypto.randomUUID(),
        u.name,
        'Estado de cita',
        id,
        `${previous} → ${next}. ${reason}`,
        new Date().toISOString(),
      ),
  ]);
  if (result[0].meta.changes !== 1)
    return json(
      { error: 'La cita cambió en otra sesión. Actualiza la agenda.' },
      409,
    );
  return json({ ok: true });
}

export function listProfessionals(db: () => D1Database) {
  return db()
    .prepare('SELECT * FROM professionals ORDER BY name')
    .all<Professional>();
}

export function listAppointments(db: () => D1Database) {
  return db()
    .prepare(
      'SELECT a.*,p.name patient_name,pr.name professional_name,py.name payer_name FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN professionals pr ON pr.id=a.professional_id JOIN payers py ON py.id=a.payer_id ORDER BY a.date DESC,a.time LIMIT 1000',
    )
    .all<Appointment>();
}
