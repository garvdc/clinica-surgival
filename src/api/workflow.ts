import type { Actor } from '@/identity/auth.service';
import { encountersRoute } from '@/clinical/api/encounters.route';
import { quotesRoute } from '@/billing/api/quotes.route';
import { salesRoute } from '@/billing/api/sales.route';
export async function workflow(
  db: D1Database,
  u: Actor,
  x: Record<string, unknown>,
) {
  if (['encounter', 'close', 'amend'].includes(String(x.action)))
    return encountersRoute(db, u, x);
  if (['quote', 'approve'].includes(String(x.action)))
    return quotesRoute(db, u, x);
  if (['convert', 'payment', 'fiscal'].includes(String(x.action)))
    return salesRoute(db, u, x);
  return null;
}
