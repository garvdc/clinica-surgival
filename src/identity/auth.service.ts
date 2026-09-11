import { db } from '@/shared/db/connection';
export type Actor = { id: string; name: string; email: string; role: string };
export async function actor(req: Request): Promise<Actor | null> {
  const token = req.headers
    .get('cookie')
    ?.split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('clinic_session='))
    ?.slice(15);
  if (!token) return null;
  return db()
    .prepare(
      'SELECT u.id,u.name,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?',
    )
    .bind(token, Date.now())
    .first<Actor>();
}
import { required } from '@/shared/validation';
import { json } from '@/shared/api/response';
import { auditStmt } from '@/audit/audit.service';

const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (x) =>
    x.toString(16).padStart(2, '0'),
  ).join('');
export async function hash(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  return hex(
    await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(salt),
        iterations: 100000,
        hash: 'SHA-256',
      },
      key,
      256,
    ),
  );
}

export async function login(
  db: () => D1Database,
  req: Request,
  x: Record<string, unknown>,
) {
  const email = required(x.email, 'Correo', 160).toLowerCase(),
    password = required(x.password, 'Contraseña', 200);
  const attempt = await db()
    .prepare('SELECT count,window FROM login_attempts WHERE email=?')
    .bind(email)
    .first<{ count: number; window: number }>();
  if (attempt && attempt.window > Date.now() - 900000 && attempt.count >= 8)
    return json({ error: 'Demasiados intentos. Espera 15 minutos.' }, 429);
  await db()
    .prepare(
      'INSERT INTO login_attempts(email,count,window) VALUES(?,1,?) ON CONFLICT(email) DO UPDATE SET count=CASE WHEN window<? THEN 1 ELSE count+1 END,window=CASE WHEN window<? THEN ? ELSE window END',
    )
    .bind(
      email,
      Date.now(),
      Date.now() - 900000,
      Date.now() - 900000,
      Date.now(),
    )
    .run();
  const row = await db()
    .prepare('SELECT * FROM users WHERE email=?')
    .bind(email)
    .first<Actor & { salt: string; password_hash: string }>();
  const result = await hash(password, row?.salt ?? 'invalid-user-salt');
  if (!row || result !== row.password_hash)
    return json({ error: 'Correo o contraseña incorrectos.' }, 401);
  const token = crypto.randomUUID() + crypto.randomUUID();
  await db().batch([
    db()
      .prepare('INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)')
      .bind(token, row.id, Date.now() + 8 * 3600000),
    db().prepare('DELETE FROM login_attempts WHERE email=?').bind(email),
    auditStmt(db(), row, 'Inicio de sesión', row.id, 'Cuenta individual'),
  ]);
  return json({ ok: true }, 200, {
    'Set-Cookie': `clinic_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${new URL(req.url).protocol === 'https:' ? '; Secure' : ''}`,
  });
}
export async function logout(db: () => D1Database, req: Request) {
  const token = req.headers
    .get('cookie')
    ?.split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('clinic_session='))
    ?.slice(15);
  await db()
    .prepare('DELETE FROM sessions WHERE token=?')
    .bind(token ?? '')
    .run();
  return json({ ok: true }, 200, {
    'Set-Cookie':
      'clinic_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0',
  });
}
