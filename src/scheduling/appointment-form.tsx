'use client';
import type { Data } from '@/api/clinic.types';
import type { Appointment } from '@/scheduling/scheduling.types';
export function AppointmentForm({
  data,
  patientId,
  setPatientId,
  selectedPayers,
  reschedule,
  date,
}: {
  data: Pick<Data, 'patients' | 'professionals'>;
  patientId: string;
  setPatientId: (s: string) => void;
  selectedPayers: Data['payers'];
  reschedule: Appointment | null;
  date: string;
}) {
  return (
    <>
      <label>
        Paciente
        <select
          name="patientId"
          disabled={!!reschedule}
          autoFocus
          required
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
        >
          {data.patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.document}
            </option>
          ))}
        </select>
      </label>
      <label>
        Pagador
        <select key={patientId} name="payerId" disabled={!!reschedule} required>
          {selectedPayers.map((p) => (
            <option value={p.id} key={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Profesional
        <select
          name="professionalId"
          disabled={!!reschedule}
          defaultValue={reschedule?.professional_id}
          required
        >
          {data.professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.specialty}
            </option>
          ))}
        </select>
      </label>
      <div className="form-grid">
        <label>
          Fecha
          <input
            type="date"
            name="date"
            defaultValue={reschedule?.date ?? date}
            required
          />
        </label>
        <label>
          Hora
          <input
            type="time"
            name="time"
            defaultValue={reschedule?.time ?? '09:00'}
            required
          />
        </label>
      </div>
      <label>
        Duración
        <select name="duration" defaultValue={reschedule?.duration ?? 30}>
          {[15, 30, 45, 60, 90, 120, 180].map((n) => (
            <option key={n} value={n}>
              {n} minutos
            </option>
          ))}
        </select>
      </label>
      <label>
        Servicio o motivo breve
        <input
          name="reason"
          defaultValue={reschedule?.reason ?? ''}
          maxLength={120}
          required
          placeholder="Consulta de demostración"
        />
      </label>
      {reschedule && (
        <label>
          Motivo de reprogramación
          <input name="changeReason" required maxLength={200} />
        </label>
      )}
      <p className="form-hint">
        Solo información administrativa. No escribas diagnósticos ni detalles
        clínicos en la agenda.
      </p>
    </>
  );
}
