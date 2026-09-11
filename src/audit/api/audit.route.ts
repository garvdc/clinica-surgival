import type { AuditEvent } from '@/audit/audit.types';
import type { Actor } from '@/identity/auth.service';

export function auditRoute(db: () => D1Database, u: Actor) {
  return u.role === 'admin'
    ? db()
        .prepare('SELECT * FROM audit ORDER BY created_at DESC LIMIT 100')
        .all<AuditEvent>()
    : Promise.resolve({ results: [] });
}
