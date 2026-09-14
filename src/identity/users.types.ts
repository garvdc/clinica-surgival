import type { Role } from '@/identity/roles';
export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: number;
  version: number;
};
