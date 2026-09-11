export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  entity_id: string;
  detail: string;
  created_at: string;
};
