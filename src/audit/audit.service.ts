import type { Actor } from '@/identity/auth.service';
export function auditStmt(
  db: D1Database,
  u: Pick<Actor, 'name'>,
  action: string,
  id: string,
  detail: string,
  createdAt = new Date().toISOString(),
) {
  return db
    .prepare(
      'INSERT INTO audit(id,actor,action,entity_id,detail,created_at) VALUES(?,?,?,?,?,?)',
    )
    .bind(crypto.randomUUID(), u.name, action, id, detail, createdAt);
}
