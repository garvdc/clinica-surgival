'use client';
import type { Appointment } from '@/scheduling/scheduling.types';
import type { Sale } from '@/billing/billing.types';
import { money } from '@/shared/format';
// Preserve the selector's identity while the mounted workflow changes tabs.
export function WorkflowTarget({
  tab,
  appointments,
  sales,
  selected,
  setSelected,
}: {
  tab: string;
  appointments: Appointment[];
  sales: Sale[];
  selected: string;
  setSelected: (s: string) => void;
}) {
  return tab !== 'sales' ? (
    <label>
      Cita y paciente
      <select name="appointmentId" required defaultValue="">
        <option value="" disabled>
          Selecciona una cita
        </option>
        {appointments
          .filter((a) => !['cancelada', 'no_asistio'].includes(a.status))
          .map((a) => (
            <option key={a.id} value={a.id}>
              {a.date} {a.time} · {a.patient_name}
            </option>
          ))}
      </select>
    </label>
  ) : (
    <label>
      Venta
      <select
        name="saleId"
        required
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="" disabled>
          Selecciona una venta
        </option>
        {sales
          .filter((s) => s.total_cents > s.paid_cents)
          .map((s) => (
            <option key={s.id} value={s.id}>
              {s.patient_name} · Saldo {money(s.total_cents - s.paid_cents)}
            </option>
          ))}
      </select>
    </label>
  );
}
