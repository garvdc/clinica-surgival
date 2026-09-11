import type { EncounterVersion } from '@/clinical/clinical.types';
import type { Encounter } from '@/clinical/clinical.types';
import { required } from '@/shared/validation';
import type { Actor } from '@/identity/auth.service';
import { reply } from '@/shared/api/response';
import { auditStmt } from '@/audit/audit.service';
export async function encounters(
  db: D1Database,
  u: Actor,
  x: Record<string, unknown>,
) {
  const now = new Date().toISOString();
  const audit = (action: string, id: string, detail: string) =>
    auditStmt(db, u, action, id, detail, now);
  if (x.action === 'encounter') {
    const appointmentId = required(x.appointmentId, 'Cita'),
      notes = required(x.notes, 'Nota de consulta', 8000);
    const a = await db
      .prepare(
        "SELECT * FROM appointments WHERE id=? AND status NOT IN ('cancelada','no_asistio')",
      )
      .bind(appointmentId)
      .first<{ patient_id: string }>();
    if (!a) throw Error('La cita no está disponible para atención.');
    const id = crypto.randomUUID();
    const saved = await db.batch([
      db
        .prepare(
          "INSERT INTO encounters(id,appointment_id,patient_id,author,notes,status,version,updated_at) VALUES(?,?,?,?,?,'borrador',1,?) ON CONFLICT(appointment_id) DO UPDATE SET notes=excluded.notes,updated_at=excluded.updated_at WHERE encounters.status='borrador' AND encounters.author=excluded.author",
        )
        .bind(id, appointmentId, a.patient_id, u.id, notes, now),
      db
        .prepare(
          'INSERT INTO audit(id,actor,action,entity_id,detail,created_at) SELECT ?,?,?,?,?,? WHERE changes()>0',
        )
        .bind(
          crypto.randomUUID(),
          u.name,
          'Borrador clínico',
          appointmentId,
          'Sin contenido clínico en auditoría',
          now,
        ),
    ]);
    if (saved[0].meta.changes !== 1)
      return reply(
        {
          error:
            'La nota ya está cerrada o pertenece a otro profesional. Utiliza una corrección.',
        },
        409,
      );
    return reply({ ok: true });
  }
  if (x.action === 'close') {
    const id = required(x.id, 'Atención');
    const e = await db
      .prepare(
        "SELECT * FROM encounters WHERE id=? AND status='borrador' AND author=?",
      )
      .bind(id, u.id)
      .first<{ notes: string; version: number; appointment_id: string }>();
    if (!e) throw Error('No hay un borrador propio disponible para cerrar.');
    await db.batch([
      db
        .prepare(
          "INSERT INTO encounter_versions(id,encounter_id,version,notes,author,reason,created_at) SELECT ?,id,version,notes,author,'Cierre inicial',? FROM encounters WHERE id=? AND status='borrador' AND author=?",
        )
        .bind(crypto.randomUUID(), now, id, u.id),
      db
        .prepare(
          "UPDATE encounters SET status='cerrada',updated_at=? WHERE id=? AND status='borrador'",
        )
        .bind(now, id),
      audit('Atención cerrada', id, 'Nota versionada'),
    ]);
    return reply({ ok: true });
  }
  if (x.action === 'amend') {
    const id = required(x.id, 'Atención'),
      notes = required(x.notes, 'Corrección', 8000),
      reason = required(x.reason, 'Motivo de corrección', 200);
    const e = await db
      .prepare(
        "SELECT * FROM encounters WHERE id=? AND status='cerrada' AND author=?",
      )
      .bind(id, u.id)
      .first<{ version: number }>();
    if (!e)
      throw Error('Solo puedes corregir tus propias atenciones cerradas.');
    await db.batch([
      db
        .prepare(
          'INSERT INTO encounter_versions(id,encounter_id,version,notes,author,reason,created_at) VALUES(?,?,?,?,?,?,?)',
        )
        .bind(crypto.randomUUID(), id, e.version + 1, notes, u.id, reason, now),
      db
        .prepare(
          'UPDATE encounters SET version=?,notes=?,updated_at=? WHERE id=?',
        )
        .bind(e.version + 1, notes, now, id),
      audit('Corrección clínica', id, 'Nueva versión; original conservado'),
    ]);
    return reply({ ok: true });
  }
  return null;
}

export function listEncounters(db: () => D1Database, u: Actor) {
  return u.role === 'clinician'
    ? db()
        .prepare(
          'SELECT e.*,p.name patient_name FROM encounters e JOIN patients p ON p.id=e.patient_id WHERE e.author=? ORDER BY e.updated_at DESC',
        )
        .bind(u.id)
        .all<Encounter>()
    : Promise.resolve({ results: [] });
}

export function listEncounterVersions(db: () => D1Database, u: Actor) {
  return u.role === 'clinician'
    ? db()
        .prepare(
          'SELECT v.* FROM encounter_versions v JOIN encounters e ON e.id=v.encounter_id WHERE e.author=? ORDER BY v.version DESC',
        )
        .bind(u.id)
        .all<EncounterVersion>()
    : Promise.resolve({ results: [] });
}
