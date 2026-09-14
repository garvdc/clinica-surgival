import { db } from '@/shared/db/connection';
export type Actor = { id: string; name: string; email: string; role: string };
export async function actor(
  req: Request,
  connect: () => D1Database = db,
): Promise<Actor | null> {
  const token = req.headers
    .get('cookie')
    ?.split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('clinic_session='))
    ?.slice(15);
  if (!token) return null;
  return connect()
    .prepare(
      'SELECT u.id,u.name,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>? AND u.active=1',
    )
    .bind(token, Date.now())
    .first<Actor>();
}
import { required } from '@/shared/validation';
import { json } from '@/shared/api/response';

import { hash } from '@/identity/password';
export { hash } from '@/identity/password';

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
    .first<
      Actor & {
        salt: string;
        password_hash: string;
        active: number;
        version: number;
      }
    >();
  const result = await hash(password, row?.salt ?? 'invalid-user-salt');
  if (!row || !row.active || result !== row.password_hash)
    return json({ error: 'Correo o contraseña incorrectos.' }, 401);
  const token = crypto.randomUUID() + crypto.randomUUID();
  const saved = await db().batch([
    db()
      .prepare(
        'INSERT INTO sessions(token,user_id,expires) SELECT ?,id,? FROM users WHERE id=? AND active=1 AND password_hash=? AND salt=? AND version=?',
      )
      .bind(
        token,
        Date.now() + 8 * 3600000,
        row.id,
        row.password_hash,
        row.salt,
        row.version,
      ),
    db().prepare('DELETE FROM login_attempts WHERE email=?').bind(email),
    db()
      .prepare(
        'INSERT INTO audit(id,actor,action,entity_id,detail,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM sessions WHERE token=?)',
      )
      .bind(
        crypto.randomUUID(),
        row.name,
        'Inicio de sesión',
        row.id,
        'Cuenta individual',
        new Date().toISOString(),
        token,
      ),
  ]);
  if (!saved[0].meta.changes)
    return json({ error: 'La cuenta cambió. Inicia sesión de nuevo.' }, 401);
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
