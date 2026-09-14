import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'cloudflare:workers')
      return {
        url: 'data:text/javascript,export const env = {};',
        shortCircuit: true,
      };
    if (specifier.startsWith('@/'))
      return next(
        new URL('../src/' + specifier.slice(2) + '.ts', import.meta.url).href,
        context,
      );
    return next(specifier, context);
  },
});
const { usersRoute } = await import('../src/identity/users.service.ts');
const { login, actor: sessionActor } =
  await import('../src/identity/auth.service.ts');
const { databaseError } = await import('../src/shared/api/errors.ts');
hooks.deregister();
const admin = {
  id: 'admin',
  name: 'Admin',
  email: 'admin@test.local',
  role: 'admin',
};
const input = {
  action: 'user_create',
  name: 'Usuario prueba',
  email: 'user@test.local',
  role: 'reception',
  password: 'Clave-de-prueba-123',
};
function fixture(t) {
  const sql = new DatabaseSync(':memory:');
  t.after(() => sql.close());
  sql.exec('PRAGMA foreign_keys=ON');
  for (const f of readdirSync('drizzle')
    .filter((f) => f.endsWith('.sql'))
    .sort())
    sql.exec(readFileSync('drizzle/' + f, 'utf8'));
  sql.exec(
    "INSERT INTO users(id,name,email,role,salt,password_hash) VALUES('admin','Admin','admin@test.local','admin','salt','hash')",
  );
  const adapter = {
    beforeBatch: null,
    prepare(query) {
      const s = sql.prepare(query);
      const make = (args) => ({
        bind: (...v) => make(v),
        first: async () => s.get(...args) ?? null,
        all: async () => ({ results: s.all(...args) }),
        execute: () => ({ meta: { changes: Number(s.run(...args).changes) } }),
        run: async () => ({
          meta: { changes: Number(s.run(...args).changes) },
        }),
      });
      return make([]);
    },
    async batch(stmts) {
      if (this.beforeBatch) {
        const cb = this.beforeBatch;
        this.beforeBatch = null;
        cb();
      }
      sql.exec('BEGIN');
      try {
        const results = stmts.map((s) => s.execute());
        sql.exec('COMMIT');
        return results;
      } catch (e) {
        sql.exec('ROLLBACK');
        throw e;
      }
    },
  };
  const db = () => adapter;
  const call = async (x, by = admin) => {
    try {
      return await usersRoute(db, by, x);
    } catch (e) {
      return databaseError(e);
    }
  };
  const get = (id) => ({
    ...sql
      .prepare('SELECT id,name,email,role,active,version FROM users WHERE id=?')
      .get(id),
  });
  const update = (id, extra = {}) =>
    call({ action: 'user_update', ...get(id), active: true, ...extra });
  const create = async (extra = {}) => {
    const r = await call({ ...input, ...extra });
    assert.equal(r.status, 200, JSON.stringify(await r.clone().json()));
    return (await r.json()).id;
  };
  return { sql, adapter, db, call, get, update, create };
}
test('usuarios: solo administración accede; privilegios revocados se revalidan', async (t) => {
  const f = fixture(t);
  for (const role of ['reception', 'clinician', 'cashier', 'unknown'])
    for (const action of ['users_list', 'user_create', 'user_update'])
      assert.equal(
        (await f.call({ ...input, action }, { ...admin, role })).status,
        403,
      );
  assert.equal(
    (await f.call({ action: 'users_list' }, { ...admin, id: 'missing' }))
      .status,
    403,
  );
});
test('usuarios: crea, normaliza correo, no expone credenciales y valida entradas', async (t) => {
  const f = fixture(t);
  const id = await f.create({ email: 'USER@TEST.LOCAL' });
  assert.equal(f.get(id).email, 'user@test.local');
  const stored = f.sql.prepare('SELECT * FROM users WHERE id=?').get(id);
  assert.notEqual(stored.password_hash, input.password);
  const list = await (await f.call({ action: 'users_list' })).json();
  assert(!JSON.stringify(list).includes('password'));
  assert(!JSON.stringify(list).includes('salt'));
  for (const extra of [
    { password: 'short' },
    { email: 'invalid' },
    { role: 'owner' },
    { name: '' },
  ])
    assert.equal(
      (
        await f.call({
          ...input,
          ...extra,
          email: extra.email ?? 'other@test.local',
        })
      ).status,
      400,
    );
  assert.equal(
    (await f.call({ ...input, email: 'USER@TEST.LOCAL' })).status,
    409,
  );
  const audit = JSON.stringify(f.sql.prepare('SELECT * FROM audit').all());
  assert(!audit.includes(input.password));
  assert(!audit.includes(stored.password_hash));
});
test('usuarios: última administración protegida al desactivar, degradar y eliminar', async (t) => {
  const f = fixture(t);
  assert.equal(
    (await f.update('admin', { active: false, confirmDeactivate: true }))
      .status,
    409,
  );
  assert.equal((await f.update('admin', { role: 'reception' })).status, 409);
  assert.throws(
    () => f.sql.exec("DELETE FROM users WHERE id='admin'"),
    /last_active_admin/,
  );
  assert.equal(f.sql.prepare('SELECT count(*) n FROM audit').get().n, 0);
  await f.create({ role: 'admin' });
  assert.equal((await f.update('admin', { role: 'reception' })).status, 200);
});
test('usuarios: conflicto concurrente no sobrescribe ni registra auditoría falsa', async (t) => {
  const f = fixture(t);
  const id = await f.create();
  const old = f.get(id);
  assert.equal((await f.update(id, { name: 'Nuevo nombre' })).status, 200);
  const count = f.sql.prepare('SELECT count(*) n FROM audit').get().n;
  assert.equal(
    (await f.call({ ...old, action: 'user_update', active: true })).status,
    409,
  );
  f.adapter.beforeBatch = () =>
    f.sql.prepare('UPDATE users SET version=version+1 WHERE id=?').run(id);
  assert.equal((await f.update(id, { name: 'No debe guardar' })).status, 409);
  assert.equal(f.get(id).name, 'Nuevo nombre');
  assert.equal(f.sql.prepare('SELECT count(*) n FROM audit').get().n, count);
});
test('usuarios: dos bajas concurrentes no dejan la clínica sin administrador', async (t) => {
  const f = fixture(t);
  const id = await f.create({ role: 'admin' });
  f.adapter.beforeBatch = () =>
    f.sql.prepare('UPDATE users SET active=0 WHERE id=?').run(id);
  assert.equal(
    (await f.update('admin', { active: false, confirmDeactivate: true }))
      .status,
    409,
  );
  assert.equal(f.get('admin').active, 1);
});
test('usuarios: sesión, desactivación, reactivación, contraseña y roles', async (t) => {
  const f = fixture(t);
  const id = await f.create();
  const req = new Request('http://localhost/api/clinic');
  async function sign(password = input.password) {
    return login(f.db, req, { email: input.email, password });
  }
  const r = await sign();
  assert.equal(r.status, 200);
  const cookie = r.headers.get('set-cookie').split(';')[0];
  assert.equal(
    (await sessionActor(new Request(req, { headers: { cookie } }), f.db)).id,
    id,
  );
  assert.equal((await f.update(id, { active: false })).status, 400);
  assert.equal(
    (await f.update(id, { active: false, confirmDeactivate: true })).status,
    200,
  );
  assert.equal(
    await sessionActor(new Request(req, { headers: { cookie } }), f.db),
    null,
  );
  assert.equal((await sign()).status, 401);
  assert.equal(
    f.sql.prepare('SELECT count(*) n FROM sessions WHERE user_id=?').get(id).n,
    0,
  );
  assert.equal((await f.update(id, { active: true })).status, 200);
  assert.equal((await sign()).status, 200);
  assert.equal(
    (await f.update(id, { password: 'Otra-clave-segura-123' })).status,
    200,
  );
  assert.equal((await sign()).status, 401);
  assert.equal((await sign('Otra-clave-segura-123')).status, 200);
  assert.equal((await f.update(id, { role: 'cashier' })).status, 200);
  assert.equal(
    f.sql.prepare('SELECT count(*) n FROM sessions WHERE user_id=?').get(id).n,
    0,
  );
});
test('usuarios: baja durante login impide crear sesión', async (t) => {
  const f = fixture(t);
  const id = await f.create();
  f.adapter.beforeBatch = () =>
    f.sql.prepare('UPDATE users SET active=0 WHERE id=?').run(id);
  const r = await login(f.db, new Request('http://localhost/api/clinic'), {
    email: input.email,
    password: input.password,
  });
  assert.equal(r.status, 401);
  assert.equal(f.sql.prepare('SELECT count(*) n FROM sessions').get().n, 0);
});
