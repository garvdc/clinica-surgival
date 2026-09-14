import type { Actor } from '@/identity/auth.service';
import { hash } from '@/identity/password';
import type { ManagedUser } from '@/identity/users.types';
import { roles } from '@/identity/roles';
import { required } from '@/shared/validation';
import { json } from '@/shared/api/response';

const columns = 'id,name,email,role,active,version';
export async function usersRoute(
  connect: () => D1Database,
  actor: Actor,
  x: Record<string, unknown>,
) {
  if (!['users_list', 'user_create', 'user_update'].includes(String(x.action)))
    return null;
  if (actor.role !== 'admin')
    return json(
      { error: 'Solo Administración puede gestionar usuarios.' },
      403,
    );
  const db = connect();
  // Revalidate privileges before handling an administrative request.
  const admin = await db
    .prepare("SELECT id FROM users WHERE id=? AND role='admin' AND active=1")
    .bind(actor.id)
    .first();
  if (!admin)
    return json(
      { error: 'Tu cuenta ya no tiene permisos de administración.' },
      403,
    );
  if (x.action === 'users_list') {
    const rows = await db
      .prepare(`SELECT ${columns} FROM users ORDER BY active DESC,name,email`)
      .all<ManagedUser>();
    return json({ users: rows.results });
  }
  const name = required(x.name, 'Nombre', 120);
  const email = required(x.email, 'Correo', 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return json({ error: 'Escribe un correo válido.' }, 400);
  const role = required(x.role, 'Rol');
  if (!Object.hasOwn(roles, role))
    return json({ error: 'Rol no válido.' }, 400);
  const create = x.action === 'user_create';
  if (!create && typeof x.active !== 'boolean')
    return json({ error: 'Selecciona el estado de la cuenta.' }, 400);
  const active = create || x.active === true ? 1 : 0;
  const id = create ? crypto.randomUUID() : required(x.id, 'Usuario');
  if (!create && (!Number.isInteger(x.version) || Number(x.version) < 1))
    return json({ error: 'Actualiza la lista de usuarios.' }, 409);
  const previous = create
    ? null
    : await db
        .prepare(`SELECT ${columns} FROM users WHERE id=?`)
        .bind(id)
        .first<ManagedUser>();
  if (!create && !previous)
    return json({ error: 'Usuario no encontrado.' }, 404);
  if (!create && previous?.version !== x.version)
    return json(
      {
        error: 'La cuenta fue modificada. Actualiza la lista antes de guardar.',
      },
      409,
    );
  if (previous?.active && !active && x.confirmDeactivate !== true)
    return json(
      { error: 'Confirma la desactivación y el cierre de sus sesiones.' },
      400,
    );
  let password: string | null = null;
  if (create || (x.password !== undefined && x.password !== '')) {
    password = required(x.password, 'Contraseña', 200);
    if (password.length < 12)
      return json(
        { error: 'La contraseña debe tener al menos 12 caracteres.' },
        400,
      );
  }
  const salt = password ? crypto.randomUUID() : null;
  const passwordHash = password && salt ? await hash(password, salt) : null;
  const allowed =
    "EXISTS(SELECT 1 FROM users WHERE id=? AND role='admin' AND active=1)";
  const write = create
    ? db
        .prepare(
          `INSERT INTO users(id,name,email,role,salt,password_hash,active,version) SELECT ?,?,?,?,?,?,1,1 WHERE ${allowed}`,
        )
        .bind(id, name, email, role, salt, passwordHash, actor.id)
    : db
        .prepare(
          `UPDATE users SET name=?,email=?,role=?,active=?,salt=COALESCE(?,salt),password_hash=COALESCE(?,password_hash),version=version+1 WHERE id=? AND version=? AND ${allowed}`,
        )
        .bind(
          name,
          email,
          role,
          active,
          salt,
          passwordHash,
          id,
          x.version,
          actor.id,
        );
  const action = create
    ? 'Creación de usuario'
    : !active && previous?.active
      ? 'Desactivación de usuario'
      : active && !previous?.active
        ? 'Reactivación de usuario'
        : 'Edición de usuario';
  // No credentials are placed in responses or audit history.
  const detail = JSON.stringify({
    actorId: actor.id,
    name,
    email,
    role,
    active: !!active,
    passwordChanged: !!password,
    ...(previous
      ? {
          previous: {
            name: previous.name,
            email: previous.email,
            role: previous.role,
            active: !!previous.active,
          },
        }
      : {}),
  });
  const audit = db
    .prepare(
      'INSERT INTO audit(id,actor,action,entity_id,detail,created_at) SELECT ?,?,?,?,?,? WHERE changes()=1',
    )
    .bind(
      crypto.randomUUID(),
      actor.name,
      action,
      id,
      detail,
      new Date().toISOString(),
    );
  const result = await db.batch([write, audit]);
  if (!result[0].meta.changes)
    return json(
      { error: 'La cuenta o tus permisos cambiaron. Actualiza la página.' },
      409,
    );
  return json({ ok: true, id });
}
