import { randomBytes, pbkdf2Sync } from 'node:crypto';
import { writeFileSync, existsSync } from 'node:fs';
if (existsSync('.demo-credentials'))
  throw Error('Ya existen credenciales. No se reemplazan automáticamente.');
const password = randomBytes(15).toString('base64url');
const q = (s) => "'" + String(s).replaceAll("'", "''") + "'";
let sql = '';
for (const [id, name, role, email] of [
  ['admin', 'Administración demo', 'admin', 'admin@demo.local'],
  ['reception', 'Recepción demo', 'reception', 'recepcion@demo.local'],
  ['clinician', 'Profesional demo', 'clinician', 'medico@demo.local'],
  ['cashier', 'Caja demo', 'cashier', 'caja@demo.local'],
]) {
  const salt = randomBytes(16).toString('hex'),
    hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  sql += `INSERT OR IGNORE INTO users(id,name,role,email,salt,password_hash) VALUES(${[id, name, role, email, salt, hash].map(q).join(',')});\n`;
}
const today = new Date().toLocaleDateString('en-CA', {
  timeZone: 'America/Caracas',
});
for (const [i, name, time] of [
  [1, 'Paciente Demo Uno', '09:00'],
  [2, 'Paciente Demo Dos', '10:00'],
  [3, 'Paciente Demo Tres', '11:30'],
]) {
  sql += `INSERT OR IGNORE INTO patients(id,name,document,phone,birth_date,created_at) VALUES('p${i}',${q(name)},'DEMO-000${i}','000-000-000${i}','1990-01-0${i}',${q(new Date().toISOString())});\n`;
  sql += `INSERT OR IGNORE INTO payers(id,name,kind) VALUES('pay${i}',${q(name)},'self');\nINSERT OR IGNORE INTO patient_payers(patient_id,payer_id) VALUES('p${i}','pay${i}');\n`;
}
sql +=
  "INSERT OR IGNORE INTO professionals(id,name,specialty) VALUES('dr1','Profesional Demo A','Consulta general'),('dr2','Profesional Demo B','Consulta general');\n";
for (const [i, time, status] of [
  [1, '09:00', 'confirmada'],
  [2, '10:00', 'programada'],
  [3, '11:30', 'llego'],
])
  sql += `INSERT OR IGNORE INTO appointments(id,patient_id,payer_id,professional_id,date,time,duration,reason,status,created_at) SELECT 'a${i}','p${i}','pay${i}','dr1',${q(today)},${q(time)},30,'Consulta de demostración',${q(status)},${q(new Date().toISOString())} WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE id='a${i}');\n`;
writeFileSync('seed.local.sql', sql, { mode: 0o600 });
writeFileSync(
  '.demo-credentials',
  `SOLO DEMOSTRACIÓN LOCAL - NO REUTILIZAR\nCorreos: admin@demo.local, recepcion@demo.local, medico@demo.local, caja@demo.local\nContraseña de las cuentas demo: ${password}\n`,
  { mode: 0o600 },
);
console.log(
  'Semilla y credenciales creadas. Consulta .demo-credentials para iniciar sesión.',
);
