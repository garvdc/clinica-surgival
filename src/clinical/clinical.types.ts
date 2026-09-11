export type Encounter = {
  id: string;
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  author: string;
  notes: string;
  status: string;
  version: number;
  updated_at: string;
};
export type EncounterVersion = {
  id: string;
  encounter_id: string;
  version: number;
  notes: string;
  author: string;
  reason: string;
  created_at: string;
};
