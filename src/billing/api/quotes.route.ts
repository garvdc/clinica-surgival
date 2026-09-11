import { billing } from '@/billing/billing.service';
import { requireRole } from '@/identity/auth.middleware';
import type { Actor } from '@/identity/auth.service';
export async function quotesRoute(
  db: D1Database,
  u: Actor,
  x: Record<string, unknown>,
) {
  return (
    requireRole(
      u.role,
      ['admin', 'cashier'],
      'Esta acción corresponde a caja o administración.',
    ) ?? billing(db, u, x)
  );
}
