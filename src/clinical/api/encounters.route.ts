import { encounters } from '@/clinical/encounters.service';
import { requireRole } from '@/identity/auth.middleware';
import type { Actor } from '@/identity/auth.service';
export async function encountersRoute(
  db: D1Database,
  u: Actor,
  x: Record<string, unknown>,
) {
  return (
    requireRole(
      u.role,
      ['clinician'],
      'Solo el profesional clínico puede modificar atenciones.',
    ) ?? encounters(db, u, x)
  );
}
