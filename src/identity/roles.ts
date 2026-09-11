export type Role = 'admin' | 'reception' | 'clinician' | 'cashier';
export const roles: Record<Role, string> = {
  admin: 'Administración',
  reception: 'Recepción',
  clinician: 'Profesional',
  cashier: 'Caja',
};
export function mayWrite(role: string) {
  return role === 'admin' || role === 'reception';
}
export function mayRead(role: string) {
  return ['admin', 'reception', 'clinician', 'cashier'].includes(role);
}
