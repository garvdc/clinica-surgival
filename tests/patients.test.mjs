import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/'))
      return next(
        new URL('../src/' + specifier.slice(2) + '.ts', import.meta.url).href,
        context,
      );
    return next(specifier, context);
  },
});
const { updatePatient } = await import('../src/patients/patients.service.ts');
const { payerDetails, updatePayer } =
  await import('../src/patients/payers.service.ts');
hooks.deregister();
const actor = {
  id: 'u1',
  name: 'Recepción demo',
  email: 'demo@local',
  role: 'reception',
};
function fixture(t) {
  const sql = new DatabaseSync(':memory:');
  t.after(() => sql.close());
  sql.exec('PRAGMA foreign_keys=ON');
  for (const file of readdirSync('drizzle')
    .filter((f) => f.endsWith('.sql'))
    .sort())
    sql.exec(readFileSync('drizzle/' + file, 'utf8'));
  sql.exec(
    "INSERT INTO patients VALUES('p1','Ana','A1','001','1990-01-01','now'),('p2','Luis','A2','002','1990-02-01','now'); INSERT INTO payers VALUES('shared','Empresa demo','company'),('own','Ana','self'),('other','Otro pagador','insurance'); INSERT INTO patient_payers VALUES('p1','shared'),('p2','shared'),('p1','own'),('p1','other');",
  );
  const db = {
    beforeBatch: null,
    prepare(query) {
      const statement = sql.prepare(query);
      const make = (args) => ({
        bind: (...values) => make(values),
        first: async () => statement.get(...args) ?? null,
        all: async () => ({ results: statement.all(...args) }),
        execute: () => ({
          meta: { changes: Number(statement.run(...args).changes) },
        }),
      });
      return make([]);
    },
    async batch(statements) {
      if (this.beforeBatch) {
        const callback = this.beforeBatch;
        this.beforeBatch = null;
        callback();
      }
      sql.exec('BEGIN');
      try {
        const result = statements.map((s) => s.execute());
        sql.exec('COMMIT');
        return result;
      } catch (e) {
        sql.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return { db: () => db, adapter: db, sql };
}
const patient = {
  id: 'p1',
  name: 'Ana actualizada',
  document: 'A1',
  phone: '001',
  birthDate: '1990-01-01',
};
async function editPayload(db, id = 'shared') {
  const r = await payerDetails(db, actor, { id });
  assert.equal(r.status, 200);
  const d = await r.json();
  return {
    id,
    name: 'Empresa corregida',
    kind: 'company',
    previousName: d.payer.name,
    previousKind: d.payer.kind,
    associationKey: d.associationKey,
  };
}
test('editar paciente conserva todos sus pagadores externos y sincroniza solo el propio', async (t) => {
  const { db, sql } = fixture(t);
  const before = sql
    .prepare("SELECT * FROM payers WHERE kind<>'self' ORDER BY id")
    .all();
  assert.equal(
    (
      await updatePatient(db, actor, {
        ...patient,
        payerKind: 'person',
        payerName: 'No debe aplicarse',
      })
    ).status,
    200,
  );
  assert.deepEqual(
    sql.prepare("SELECT * FROM payers WHERE kind<>'self' ORDER BY id").all(),
    before,
  );
  assert.equal(
    sql.prepare("SELECT name FROM payers WHERE id='own'").get().name,
    patient.name,
  );
  assert.equal(
    sql.prepare("SELECT name FROM patients WHERE id='p2'").get().name,
    'Luis',
  );
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM patient_payers').get().n, 4);
});
test('editar paciente sin pagador conserva su identidad y no crea vínculos', async (t) => {
  const { db, sql } = fixture(t);
  sql.exec("DELETE FROM patient_payers WHERE patient_id='p1'");
  assert.equal((await updatePatient(db, actor, patient)).status, 200);
  assert.equal(
    sql.prepare("SELECT name FROM patients WHERE id='p1'").get().name,
    patient.name,
  );
  assert.equal(
    sql
      .prepare("SELECT COUNT(*) n FROM patient_payers WHERE patient_id='p1'")
      .get().n,
    0,
  );
});
test('un pagador propio compartido por datos heredados no se renombra desde otra ficha', async (t) => {
  const { db, sql } = fixture(t);
  sql.exec("INSERT INTO patient_payers VALUES('p2','own')");
  await updatePatient(db, actor, patient);
  assert.equal(
    sql.prepare("SELECT name FROM payers WHERE id='own'").get().name,
    'Ana',
  );
});
test('pagador compartido exige confirmación explícita y registra un único evento al guardar', async (t) => {
  const { db, sql } = fixture(t);
  const details = await (
    await payerDetails(db, actor, { id: 'shared' })
  ).json();
  assert.deepEqual(
    details.patients.map((p) => p.id),
    ['p1', 'p2'],
  );
  const x = await editPayload(db);
  for (const confirmShared of [undefined, false, 'true', 'on'])
    assert.equal(
      (await updatePayer(db, actor, { ...x, confirmShared })).status,
      409,
    );
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM audit').get().n, 0);
  assert.equal(
    (await updatePayer(db, actor, { ...x, confirmShared: true })).status,
    200,
  );
  assert.equal(
    sql.prepare("SELECT name FROM payers WHERE id='shared'").get().name,
    x.name,
  );
  assert.equal(
    sql.prepare("SELECT name FROM payers WHERE id='other'").get().name,
    'Otro pagador',
  );
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM audit').get().n, 1);
  assert.equal(
    (await updatePayer(db, actor, { ...x, confirmShared: true })).status,
    409,
  );
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM audit').get().n, 1);
});
test('pagador externo individual se edita sin confirmación compartida', async (t) => {
  const { db } = fixture(t);
  assert.equal(
    (await updatePayer(db, actor, await editPayload(db, 'other'))).status,
    200,
  );
});
test('se rechaza una confirmación si cambiaron los pacientes vinculados', async (t) => {
  const { db, sql } = fixture(t);
  const x = await editPayload(db);
  sql.exec(
    "DELETE FROM patient_payers WHERE patient_id='p2' AND payer_id='shared'",
  );
  assert.equal(
    (await updatePayer(db, actor, { ...x, confirmShared: true })).status,
    409,
  );
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM audit').get().n, 0);
});
test('la comprobación atómica bloquea cambios concurrentes y no escribe auditoría falsa', async (t) => {
  const { db, sql, adapter } = fixture(t);
  const x = await editPayload(db);
  adapter.beforeBatch = () =>
    sql.exec(
      "DELETE FROM patient_payers WHERE patient_id='p2' AND payer_id='shared'",
    );
  assert.equal(
    (await updatePayer(db, actor, { ...x, confirmShared: true })).status,
    409,
  );
  assert.equal(
    sql.prepare("SELECT name FROM payers WHERE id='shared'").get().name,
    'Empresa demo',
  );
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM audit').get().n, 0);
});
test('permisos y tipo protegen la edición independiente del pagador', async (t) => {
  const { db } = fixture(t);
  const x = await editPayload(db);
  for (const role of ['cashier', 'clinician', 'unknown']) {
    assert.equal(
      (await payerDetails(db, { ...actor, role }, { id: 'shared' })).status,
      403,
    );
    assert.equal(
      (await updatePayer(db, { ...actor, role }, { ...x, confirmShared: true }))
        .status,
      403,
    );
  }
  assert.equal((await payerDetails(db, actor, { id: 'missing' })).status, 404);
  assert.equal(
    (await updatePayer(db, actor, { ...x, id: 'missing' })).status,
    404,
  );
  assert.equal(
    (await updatePayer(db, actor, { ...x, kind: 'self', confirmShared: true }))
      .status,
    400,
  );
  assert.equal(
    (await updatePayer(db, actor, { ...x, id: 'own', confirmShared: true }))
      .status,
    400,
  );
  assert.equal(
    (
      await updatePayer(
        db,
        { ...actor, role: 'admin' },
        { ...x, confirmShared: true },
      )
    ).status,
    200,
  );
});
