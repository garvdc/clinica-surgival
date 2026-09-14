import { required } from '@/shared/validation';
import { json } from '@/shared/api/response';
import { mayWrite } from '@/identity/roles';
import type { Actor } from '@/identity/auth.service';
import type { Payer, PayerDetails } from '@/patients/patients.types';

async function details(
  db: D1Database,
  id: string,
): Promise<PayerDetails | null> {
  const payer = await db
    .prepare('SELECT * FROM payers WHERE id=?')
    .bind(id)
    .first<Payer>();
  if (!payer) return null;
  const patients = await db
    .prepare(
      'SELECT p.id,p.name,p.document FROM patients p JOIN patient_payers pp ON pp.patient_id=p.id WHERE pp.payer_id=? ORDER BY p.id',
    )
    .bind(id)
    .all<PayerDetails['patients'][number]>();
  return {
    payer,
    patients: patients.results,
    associationKey: JSON.stringify(patients.results.map((p) => p.id)),
  };
}
export async function payerDetails(
  db: () => D1Database,
  u: Actor,
  x: Record<string, unknown>,
) {
  if (!mayWrite(u.role))
    return json({ error: 'No tienes permiso para editar pagadores.' }, 403);
  const result = await details(db(), required(x.id, 'Pagador'));
  return result ? json(result) : json({ error: 'Pagador inexistente.' }, 404);
}
export async function updatePayer(
  db: () => D1Database,
  u: Actor,
  x: Record<string, unknown>,
) {
  if (!mayWrite(u.role))
    return json({ error: 'No tienes permiso para editar pagadores.' }, 403);
  const id = required(x.id, 'Pagador');
  const name = required(x.name, 'Nombre del pagador', 120);
  const kind = required(x.kind, 'Tipo de pagador', 30);
  const current = await details(db(), id);
  if (!current) return json({ error: 'Pagador inexistente.' }, 404);
  if (
    current.payer.kind === 'self' ||
    !['person', 'company', 'insurance'].includes(kind)
  )
    return json(
      {
        error:
          'El propio paciente se actualiza desde su ficha. Aquí solo se editan pagadores externos.',
      },
      400,
    );
  const stale = () =>
    json(
      {
        error:
          'El pagador o sus vínculos cambiaron. Cierra y abre de nuevo el formulario para revisar los datos.',
      },
      409,
    );
  if (
    x.previousName !== current.payer.name ||
    x.previousKind !== current.payer.kind ||
    x.associationKey !== current.associationKey
  )
    return stale();
  if (current.patients.length > 1 && x.confirmShared !== true)
    return json(
      {
        error:
          'Este cambio afectará a ' +
          current.patients.length +
          ' pacientes. Confirma el cambio compartido.',
      },
      409,
    );
  // Recheck the snapshot inside the write to reject concurrent edits/link changes.
  const result = await db().batch([
    db()
      .prepare(
        'UPDATE payers SET name=?,kind=? WHERE id=? AND name=? AND kind=? AND (SELECT json_group_array(patient_id) FROM (SELECT patient_id FROM patient_payers WHERE payer_id=? ORDER BY patient_id))=?',
      )
      .bind(
        name,
        kind,
        id,
        current.payer.name,
        current.payer.kind,
        id,
        current.associationKey,
      ),
    db()
      .prepare(
        'INSERT INTO audit(id,actor,action,entity_id,detail,created_at) SELECT ?,?,?,?,?,? WHERE changes()>0',
      )
      .bind(
        crypto.randomUUID(),
        u.name,
        'Pagador editado',
        id,
        'Nombre/tipo actualizado; ' +
          current.patients.length +
          ' pacientes vinculados; cambio compartido ' +
          (current.patients.length > 1 ? 'confirmado' : 'no necesario'),
        new Date().toISOString(),
      ),
  ]);
  return result[0].meta.changes ? json({ ok: true, id }) : stale();
}
