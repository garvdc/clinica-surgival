import type { PatientPayer } from '@/patients/patients.types';
import type { Payer } from '@/patients/patients.types';
import type { Patient } from '@/patients/patients.types';
import type { Actor } from '@/identity/auth.service';
import { json } from '@/shared/api/response';
import { auditStmt } from '@/audit/audit.service';
import { required, dateValue } from '@/shared/validation';
export async function createPatient(
  db: () => D1Database,
  u: Actor,
  x: Record<string, unknown>,
) {
  const name = required(x.name, 'Nombre', 120),
    document = required(x.document, 'Identificación', 40).toUpperCase(),
    phone = required(x.phone, 'Teléfono', 40),
    birthDate = dateValue(x.birthDate, 'Fecha de nacimiento');
  if (birthDate > new Date().toISOString().slice(0, 10))
    throw new Error('La fecha de nacimiento no puede estar en el futuro.');
  const dup = await db()
    .prepare(
      'SELECT id FROM patients WHERE document=? OR (lower(name)=lower(?) AND birth_date=?) OR phone=?',
    )
    .bind(document, name, birthDate, phone)
    .first();
  if (dup)
    return json(
      {
        error:
          'Posible duplicado: ya existe un paciente con esa identificación, teléfono o nombre y fecha. Revisa la lista antes de registrar.',
      },
      409,
    );
  const id = crypto.randomUUID(),
    payerId = crypto.randomUUID();
  const own = x.payerKind === 'self';
  const payerName = own
    ? name
    : required(x.payerName, 'Nombre del pagador', 120);
  const kind = required(x.payerKind, 'Tipo de pagador', 30);
  if (!['self', 'person', 'company', 'insurance'].includes(kind))
    throw new Error('Tipo de pagador inválido.');
  await db().batch([
    db()
      .prepare(
        'INSERT INTO patients(id,name,document,phone,birth_date,created_at) VALUES(?,?,?,?,?,?)',
      )
      .bind(id, name, document, phone, birthDate, new Date().toISOString()),
    db()
      .prepare('INSERT INTO payers(id,name,kind) VALUES(?,?,?)')
      .bind(payerId, payerName, kind),
    db()
      .prepare('INSERT INTO patient_payers(patient_id,payer_id) VALUES(?,?)')
      .bind(id, payerId),
    auditStmt(db(), u, 'Paciente registrado', id, 'Ficha y pagador creados'),
  ]);
  return json({ ok: true, id }, 201);
}

export async function updatePatient(
  db: () => D1Database,
  u: Actor,
  x: Record<string, unknown>,
) {
  const id = required(x.id, 'Paciente');
  const name = required(x.name, 'Nombre', 120),
    document = required(x.document, 'Identificación', 40).toUpperCase(),
    phone = required(x.phone, 'Teléfono', 40),
    birthDate = dateValue(x.birthDate, 'Fecha de nacimiento');
  if (birthDate > new Date().toISOString().slice(0, 10))
    throw new Error('La fecha de nacimiento no puede estar en el futuro.');
  const existing = await db()
    .prepare('SELECT id FROM patients WHERE id=?')
    .bind(id)
    .first();
  if (!existing) return json({ error: 'Paciente inexistente.' }, 404);
  const dup = await db()
    .prepare(
      'SELECT id FROM patients WHERE (document=? OR phone=? OR (lower(name)=lower(?) AND birth_date=?)) AND id<>?',
    )
    .bind(document, phone, name, birthDate, id)
    .first();
  if (dup)
    return json(
      {
        error:
          'Posible duplicado: ya existe otro paciente con esa identificación, teléfono o nombre y fecha.',
      },
      409,
    );
  const own = x.payerKind === 'self';
  const kind = required(x.payerKind, 'Tipo de pagador', 30);
  if (!['self', 'person', 'company', 'insurance'].includes(kind))
    throw new Error('Tipo de pagador inválido.');
  const payerName = own
    ? name
    : required(x.payerName, 'Nombre del pagador', 120);
  const linkedPayer = await db()
    .prepare('SELECT payer_id FROM patient_payers WHERE patient_id=? LIMIT 1')
    .bind(id)
    .first<{ payer_id: string }>();
  let payerId = linkedPayer?.payer_id;
  if (payerId) {
    await db().batch([
      db()
        .prepare(
          'UPDATE patients SET name=?,document=?,phone=?,birth_date=? WHERE id=?',
        )
        .bind(name, document, phone, birthDate, id),
      db()
        .prepare('UPDATE payers SET name=?,kind=? WHERE id=?')
        .bind(payerName, kind, payerId),
      auditStmt(db(), u, 'Paciente editado', id, 'Ficha actualizada'),
    ]);
  } else {
    payerId = crypto.randomUUID();
    await db().batch([
      db()
        .prepare(
          'UPDATE patients SET name=?,document=?,phone=?,birth_date=? WHERE id=?',
        )
        .bind(name, document, phone, birthDate, id),
      db().prepare('INSERT INTO payers(id,name,kind) VALUES(?,?,?)').bind(
        payerId,
        payerName,
        kind,
      ),
      db()
        .prepare('INSERT INTO patient_payers(patient_id,payer_id) VALUES(?,?)')
        .bind(id, payerId),
      auditStmt(db(), u, 'Paciente editado', id, 'Ficha actualizada'),
    ]);
  }
  return json({ ok: true, id });
}

export function listPatients(db: () => D1Database) {
  return db()
    .prepare('SELECT * FROM patients ORDER BY created_at DESC LIMIT 500')
    .all<Patient>();
}

export function listPayers(db: () => D1Database) {
  return db()
    .prepare('SELECT * FROM payers ORDER BY name LIMIT 500')
    .all<Payer>();
}

export function listPatientPayers(db: () => D1Database) {
  return db().prepare('SELECT * FROM patient_payers').all<PatientPayer>();
}
