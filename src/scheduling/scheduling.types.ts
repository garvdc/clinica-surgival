export type Appointment = {
  id: string;
  patient_id: string;
  payer_id: string;
  professional_id: string;
  patient_name: string;
  professional_name: string;
  payer_name: string;
  date: string;
  time: string;
  duration: number;
  reason: string;
  status: string;
  created_at: string;
};
export type Professional = { id: string; name: string; specialty: string };
export type StatusTransition = {
  previous: string;
  status: string;
  reason: string;
};
