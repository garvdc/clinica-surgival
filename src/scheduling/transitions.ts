export const transitions: Record<string, string[]> = {
  programada: ['confirmada', 'llego', 'cancelada', 'no_asistio'],
  confirmada: ['llego', 'cancelada', 'no_asistio'],
  llego: ['en_espera', 'cancelada'],
  en_espera: ['cancelada'],
  cancelada: [],
  no_asistio: [],
};
export function transition(from: string, to: string) {
  if (!transitions[from]?.includes(to))
    throw new Error('El cambio de estado no está permitido.');
}
