export type Patient = {
  id: string;
  name: string;
  document: string;
  phone: string;
  birth_date: string;
  created_at: string;
};
export type Payer = { id: string; name: string; kind: string };
export type PatientPayer = { patient_id: string; payer_id: string };

export type PayerDetails = {
  payer: Payer;
  patients: Pick<Patient, 'id' | 'name' | 'document'>[];
  associationKey: string;
};
