import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { appointmentInput, dateValue } from '../src/shared/validation.ts';
import { transition } from '../src/scheduling/transitions.ts';
import { cents, toUSD } from '../src/billing/money.ts';
import { mayWrite } from '../src/identity/roles.ts';
const input = {
  date: '2026-09-08',
  time: '09:00',
  duration: 30,
  patientId: 'p1',
  payerId: 'py1',
  professionalId: 'dr1',
  reason: 'Consulta',
};
test('fechas imposibles y duración fuera de límites se rechazan', () => {
  assert.throws(() => dateValue('2026-02-30', 'Fecha'));
  assert.throws(() => appointmentInput({ ...input, duration: 0 }));
  assert.throws(() => appointmentInput({ ...input, time: '23:45' }));
  assert.equal(appointmentInput(input).duration, 30);
});
test('estados terminales y roles no permiten modificar citas', () => {
  assert.throws(() => transition('cancelada', 'confirmada'));
  assert.throws(() => transition('programada', 'en_espera'));
  assert.equal(mayWrite('clinician'), false);
  assert.equal(mayWrite('reception'), true);
});
test('importes y conversión Bs/USD usan enteros y tasa manual', () => {
  assert.equal(cents('10.25'), 1025);
  assert.throws(() => cents('1.001'));
  assert.throws(() => cents('-4'));
  assert.deepEqual(toUSD(40000, 'VES', '40'), { usdCents: 1000, rate: '40' });
  assert.equal(toUSD(100, 'VES', '3').usdCents, 33);
  assert.throws(() => toUSD(100, 'VES', '0'));
  assert.equal(toUSD(1050, 'USD', '').usdCents, 1050);
});
function db() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=ON');
  for (const f of readdirSync('drizzle')
    .filter((f) => f.endsWith('.sql'))
    .sort())
    db.exec(readFileSync('drizzle/' + f, 'utf8'));
  db.exec(
    "INSERT INTO patients VALUES('p1','Demo','DOC1','000','1990-01-01','now');INSERT INTO payers VALUES('py1','Demo','self');INSERT INTO patient_payers VALUES('p1','py1');INSERT INTO professionals VALUES('dr1','Demo','General');",
  );
  return db;
}
const insert =
  "INSERT INTO appointments(id,patient_id,payer_id,professional_id,date,time,duration,reason,status,created_at) VALUES(?,'p1','py1','dr1','2026-09-08',?,30,'Demo',?,'now')";
test('la base bloquea solapamientos, permite contiguas y libera canceladas', () => {
  const d = db(),
    s = d.prepare(insert);
  s.run('a1', '09:00', 'programada');
  assert.throws(
    () => s.run('a2', '09:15', 'programada'),
    /appointment_overlap/,
  );
  s.run('a3', '09:30', 'programada');
  d.exec("UPDATE appointments SET status='cancelada' WHERE id='a1'");
  s.run('a4', '09:00', 'programada');
  assert.throws(
    () => d.exec("UPDATE appointments SET status='confirmada' WHERE id='a1'"),
    /appointment_overlap/,
  );
  d.close();
});
test('saldo y una única venta por presupuesto se protegen en la base', () => {
  const d = db();
  d.prepare(insert).run('a1', '09:00', 'programada');
  d.exec(
    "INSERT INTO quotes VALUES('q1','a1','p1','py1','Demo',10000,'aprobado','now');INSERT INTO sales VALUES('s1','q1',10000,'no_enviada',NULL,'now');",
  );
  assert.throws(() =>
    d.exec("INSERT INTO sales VALUES('s2','q1',10000,'no_enviada',NULL,'now')"),
  );
  d.exec(
    "INSERT INTO payments VALUES('pay1','s1',6000,'USD','1',6000,'cash','demo','now');",
  );
  assert.throws(
    () =>
      d.exec(
        "INSERT INTO payments VALUES('pay2','s1',5000,'USD','1',5000,'cash','demo','now')",
      ),
    /payment_exceeds_balance/,
  );
  d.exec(
    "INSERT INTO payments VALUES('pay3','s1',4000,'USD','1',4000,'cashea','ref','now');",
  );
  assert.equal(
    d.prepare('SELECT SUM(usd_cents) total FROM payments').get().total,
    10000,
  );
  d.close();
});
