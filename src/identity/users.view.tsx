'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { roles } from '@/identity/roles';
import type { ManagedUser } from '@/identity/users.types';

async function request(body: Record<string, unknown>) {
  const r = await fetch('/api/clinic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await r.json()) as { error?: string; users?: ManagedUser[] };
  if (!r.ok) throw Error(data.error || 'No se pudo completar la operación.');
  return data;
}
export function UsersView({
  currentId,
  reload,
}: {
  currentId: string;
  reload: () => Promise<void>;
}) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ManagedUser | 'new' | null>(null);
  const [active, setActive] = useState(true);
  const original = editing && editing !== 'new' ? editing : null;
  const lastAdmin =
    original?.role === 'admin' &&
    !!original.active &&
    users.filter((u) => u.role === 'admin' && u.active).length === 1;
  async function load() {
    setLoading(true);
    try {
      const data = await request({ action: 'users_list' });
      setUsers(data.users ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let cancelled = false;
    request({ action: 'users_list' })
      .then((data) => {
        if (!cancelled) setUsers(data.users ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  function open(user: ManagedUser | 'new') {
    setEditing(user);
    setActive(user === 'new' || !!user.active);
    setError('');
    setNotice('');
  }
  async function save(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await request({
        ...values,
        action: original ? 'user_update' : 'user_create',
        ...(original ? { id: original.id, version: original.version } : {}),
        active,
        confirmDeactivate: values.confirmDeactivate === 'on',
      });
      const own = original?.id === currentId;
      setEditing(null);
      setNotice('Usuario guardado correctamente.');
      if (own) await reload();
      const closesOwnSession =
        own &&
        original &&
        ((typeof values.email === 'string' ? values.email.trim().toLowerCase() : '') !== original.email ||
          values.role !== original.role ||
          active !== !!original.active ||
          (typeof values.password === 'string' && !!values.password.trim()));
      if (!closesOwnSession) await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="users-view" aria-label="Usuarios del sistema">
      <div className="workflow-intro">
        <div>
          <h2>Usuarios</h2>
          <p className="muted">
            Gestiona quién puede entrar y qué rol tiene cada persona.
          </p>
        </div>
        <Button
          className="primary"
          disabled={busy || loading}
          onClick={() => open('new')}
        >
          Nuevo usuario
        </Button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {notice && <output className="success">{notice}</output>}
      {editing && (
        <form
          key={original?.id ?? 'new'}
          className="panel user-editor"
          onSubmit={save}
          aria-label={original ? 'Editar usuario' : 'Crear usuario'}
        >
          <h2>{original ? 'Editar usuario' : 'Crear usuario'}</h2>
          <fieldset disabled={busy} className="user-fields">
            <div className="form-grid">
              <label className="field">
                Nombre
                <input
                  name="name"
                  required
                  maxLength={120}
                  defaultValue={original?.name ?? ''}
                  autoComplete="off"
                />
              </label>
              <label className="field">
                Correo
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={160}
                  defaultValue={original?.email ?? ''}
                  autoComplete="off"
                />
              </label>
              <label className="field">
                Rol
                <select
                  name="role"
                  defaultValue={original?.role ?? 'reception'}
                >
                  {Object.entries(roles).map(([key, label]) => (
                    <option
                      key={key}
                      value={key}
                      disabled={!!lastAdmin && key !== 'admin'}
                    >
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                {original
                  ? 'Nueva contraseña (opcional)'
                  : 'Contraseña individual'}
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={200}
                  required={!original}
                />
                <small>
                  Al menos 12 caracteres.
                  {original ? ' Déjala vacía para conservar la actual.' : ''}
                </small>
              </label>
              {original && (
                <label className="field">
                  Estado
                  <select
                    value={active ? 'active' : 'inactive'}
                    onChange={(e) => setActive(e.target.value === 'active')}
                  >
                    <option value="active">Activo</option>
                    <option value="inactive" disabled={!!lastAdmin}>
                      Inactivo
                    </option>
                  </select>
                </label>
              )}
            </div>
            {lastAdmin && (
              <p className="muted">
                Esta es la última cuenta de Administración activa. Crea o activa
                otra antes de desactivarla o cambiarle el rol.
              </p>
            )}
            {original && (
              <p className="muted">
                Cambiar correo, rol, contraseña o estado cierra las sesiones de
                esta cuenta.
                {original.id === currentId
                  ? ' Si cambias esos datos de tu cuenta, deberás iniciar sesión de nuevo.'
                  : ''}
              </p>
            )}
            {original?.active && !active ? (
              <label className="shared-payer-confirm">
                <input name="confirmDeactivate" type="checkbox" required />
                Confirmo desactivar a {original.name} y cerrar sus sesiones. Su
                historial se conservará.
              </label>
            ) : null}
            <div className="user-actions">
              <Button
                type="button"
                className="secondary"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="primary">
                {busy ? 'Guardando…' : 'Guardar usuario'}
              </Button>
            </div>
          </fieldset>
        </form>
      )}
      <div className="panel">
        <div className="user-toolbar">
          <label className="field">
            Buscar usuario
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre o correo"
            />
          </label>
          <Button
            className="secondary"
            disabled={busy || loading}
            onClick={() => {
              setError('');
              setEditing(null);
              void load();
            }}
          >
            Actualizar lista
          </Button>
        </div>
        {loading ? (
          <output>Cargando usuarios…</output>
        ) : (
          <section
            className="table-scroll"
            // Keyboard users must be able to scroll a wide table.
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            aria-label="Lista de usuarios"
          >
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((u) =>
                    (u.name + ' ' + u.email)
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((u) => (
                    <tr key={u.id}>
                      <td>
                        {u.name}
                        {u.id === currentId ? ' (tú)' : ''}
                      </td>
                      <td>{u.email}</td>
                      <td>{roles[u.role]}</td>
                      <td>{u.active ? 'Activo' : 'Inactivo'}</td>
                      <td>
                        <Button
                          className="secondary"
                          disabled={busy}
                          onClick={() => open(u)}
                          aria-label={'Editar usuario ' + u.name}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!users.some((u) =>
              (u.name + ' ' + u.email)
                .toLowerCase()
                .includes(search.toLowerCase()),
            ) && <p>No hay usuarios que coincidan.</p>}
          </section>
        )}
      </div>
    </section>
  );
}
