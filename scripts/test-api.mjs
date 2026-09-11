import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const base = process.env.CLINIC_TEST_URL || 'http://localhost:3000';
const password = readFileSync('.demo-credentials', 'utf8')
  .match(/Contraseña de las cuentas demo: (.*)/)[1]
  .trim();
const jar = {};
let checks = 0;
async function request(role, body, expected = 200) {
  const response = await fetch(base + '/api/clinic', {
    method: body ? 'POST' : 'GET',
    headers: {
      Origin: base,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(jar[role] ? { Cookie: jar[role] } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const j = await response.json();
  assert.equal(response.status, expected, JSON.stringify(j));
  if (response.headers.get('set-cookie'))
    jar[role] = response.headers.get('set-cookie').split(';')[0];
  checks++;
  return j;
}
await request('anon', null, 401);
for (const [role, email] of [
  ['admin', 'admin@demo.local'],
  ['reception', 'recepcion@demo.local'],
  ['clinician', 'medico@demo.local'],
  ['cashier', 'caja@demo.local'],
])
  await request(role, { action: 'login', email, password });
await request(
  'reception',
  { action: 'login', email: 'recepcion@demo.local', password: 'wrong' },
  401,
);
const nonce = Date.now().toString();
const p = await request(
  'reception',
  {
    action: 'patient',
    name: 'Prueba automática ' + nonce,
    document: 'TEST-' + nonce,
    phone: 'TEST-' + nonce,
    birthDate: '1990-01-01',
    payerKind: 'self',
  },
  201,
);
await request(
  'reception',
  {
    action: 'patient',
    name: 'Duplicado ' + nonce,
    document: 'TEST-' + nonce,
    phone: 'TEST-' + nonce,
    birthDate: '1990-01-01',
    payerKind: 'self',
  },
  409,
);
const data = await request('reception');
const payerId = data.links.find((l) => l.patient_id === p.id).payer_id;
const date = new Date(
  2100 + Math.floor(Math.random() * 50),
  Math.floor(Math.random() * 12),
  Math.floor(Math.random() * 28) + 1,
)
  .toISOString()
  .slice(0, 10);
const apt = {
  action: 'appointment',
  patientId: p.id,
  payerId,
  professionalId: 'dr1',
  date,
  time: '09:00',
  duration: 30,
  reason: 'Prueba automatizada',
};
const a = await request('reception', apt, 201);
await request('reception', { ...apt, time: '09:15' }, 409);
await request('clinician', apt, 403);
await request('reception', {
  action: 'reschedule',
  id: a.id,
  previousDate: date,
  previousTime: '09:00',
  date,
  time: '10:00',
  duration: 30,
  reason: 'Prueba reprogramada',
  changeReason: 'Cambio de horario',
});
await request(
  'reception',
  {
    action: 'reschedule',
    id: a.id,
    previousDate: date,
    previousTime: '09:00',
    date,
    time: '11:00',
    duration: 30,
    reason: 'Prueba',
    changeReason: 'Estado obsoleto',
  },
  409,
);
await request(
  'reception',
  { action: 'encounter', appointmentId: a.id, notes: 'Debe bloquearse' },
  403,
);
await request('clinician', {
  action: 'encounter',
  appointmentId: a.id,
  notes: 'Nota ficticia inicial',
});
let clinical = await request('clinician');
const e = clinical.encounters.find((e) => e.appointment_id === a.id);
assert(e);
await request('clinician', { action: 'close', id: e.id });
await request(
  'clinician',
  {
    action: 'encounter',
    appointmentId: a.id,
    notes: 'Intento de sobrescritura',
  },
  409,
);
await request('clinician', {
  action: 'amend',
  id: e.id,
  notes: 'Nota ficticia corregida',
  reason: 'Prueba de versionado',
});
clinical = await request('clinician');
assert.equal(
  clinical.versions.filter((v) => v.encounter_id === e.id).length,
  2,
);
assert(
  clinical.versions.some(
    (v) => v.encounter_id === e.id && v.notes === 'Nota ficticia inicial',
  ),
);
const reception = await request('reception');
assert.equal(reception.encounters.length, 0);
assert.equal(reception.versions.length, 0);
await request('cashier', {
  action: 'quote',
  appointmentId: a.id,
  description: 'Consulta demo prueba',
  total: '100',
});
let caja = await request('cashier');
const q = caja.quotes.find((q) => q.appointment_id === a.id);
assert(q);
await request('cashier', { action: 'convert', id: q.id }, 400);
await request('cashier', { action: 'approve', id: q.id });
const sale = await request('cashier', { action: 'convert', id: q.id });
const same = await request('cashier', { action: 'convert', id: q.id });
assert.equal(sale.id, same.id);
const pay = {
  action: 'payment',
  saleId: sale.id,
  idempotencyKey: 'test-' + nonce,
  method: 'cash',
  currency: 'USD',
  amount: '40',
  reference: 'Prueba',
};
await request('cashier', pay);
await request('cashier', pay);
await request(
  'cashier',
  { ...pay, idempotencyKey: 'over-' + nonce, amount: '61' },
  409,
);
await request('cashier', {
  ...pay,
  idempotencyKey: 'bs-' + nonce,
  method: 'transfer',
  currency: 'VES',
  amount: '1200',
  rate: '40',
});
await request('cashier', {
  ...pay,
  idempotencyKey: 'cashea-' + nonce,
  method: 'cashea',
  amount: '30',
  reference: 'Cashea demo',
});
caja = await request('cashier');
assert.equal(caja.sales.find((s) => s.id === sale.id).paid_cents, 10000);
await request('cashier', {
  action: 'fiscal',
  id: sale.id,
  simulateFailure: true,
});
await request('cashier', { action: 'fiscal', id: sale.id });
await request('cashier', { action: 'fiscal', id: sale.id });
caja = await request('cashier');
assert.equal(
  caja.sales.find((s) => s.id === sale.id).fiscal_status,
  'emitida_simulada',
);
const invoice = await fetch(base + '/invoice/' + sale.id, {
  headers: { Cookie: jar.cashier },
});
assert.equal(invoice.status, 200);
assert((await invoice.text()).includes('SIN VALIDEZ FISCAL'));
const forbidden = await fetch(base + '/invoice/' + sale.id, {
  headers: { Cookie: jar.reception },
});
assert.equal(forbidden.status, 403);
const csrf = await fetch(base + '/api/clinic', {
  method: 'POST',
  headers: {
    Cookie: jar.admin,
    'Content-Type': 'application/json',
    Origin: 'https://untrusted.example',
  },
  body: JSON.stringify({ action: 'logout' }),
});
assert.equal(csrf.status, 403);
await request('reception', {
  action: 'status',
  id: a.id,
  previous: 'programada',
  status: 'confirmada',
  reason: 'Prueba',
});
await request(
  'reception',
  {
    action: 'status',
    id: a.id,
    previous: 'programada',
    status: 'llego',
    reason: 'Estado obsoleto',
  },
  409,
);
const logs = await request('admin');
assert(
  logs.audit.some((e) => e.action === 'Estado de cita' && e.entity_id === a.id),
);
await request('admin', { action: 'logout' });
await request('admin', null, 401);
console.log(
  `Prueba integral aprobada: ${checks} solicitudes verificadas + documento, CSRF, permisos y conservación de versiones. Datos ficticios TEST-${nonce}.`,
);
