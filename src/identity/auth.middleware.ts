import { actor } from '@/identity/auth.service';
import { json } from '@/shared/api/response';
export async function requireAuth(req: Request) {
  return (
    (await actor(req)) ?? json({ error: 'Inicia sesión para continuar.' }, 401)
  );
}
export function requireRole(role: string, allowed: string[], message: string) {
  return allowed.includes(role) ? null : json({ error: message }, 403);
}
