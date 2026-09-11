export type Quote = {
  id: string;
  appointment_id: string;
  patient_id: string;
  payer_id: string;
  patient_name: string;
  payer_name: string;
  description: string;
  total_cents: number;
  status: string;
  created_at: string;
};
export type Sale = {
  id: string;
  quote_id: string;
  total_cents: number;
  paid_cents: number;
  fiscal_status: string;
  fiscal_ref: string | null;
  created_at: string;
  description: string;
  patient_id: string;
  payer_id: string;
  patient_name: string;
  payer_name: string;
};
export type Payment = {
  id: string;
  sale_id: string;
  amount_cents: number;
  currency: string;
  rate: string;
  usd_cents: number;
  method: string;
  reference: string;
  created_at: string;
};
