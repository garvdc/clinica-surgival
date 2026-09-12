'use client';
import { localDay } from '@/shared/format';
import type { Patient, Payer } from '@/patients/patients.types';
export function PatientForm({
  payerKind,
  setPayerKind,
  editing,
}: {
  payerKind: string;
  setPayerKind: (s: string) => void;
  editing?: { patient: Patient; payer: Payer } | null;
}) {
  const p = editing?.patient;
  const payer = editing?.payer;
  const birthDate = p?.birth_date ?? '';
  const isSelf = payer ? payer.kind === 'self' : false;
  return (
    <>
      <label>
        Nombre completo
        <input
          autoFocus
          name="name"
          maxLength={120}
          required
          defaultValue={p?.name}
        />
      </label>
      <div className="form-grid">
        <label>
          Identificación
          <input
            name="document"
            maxLength={40}
            required
            placeholder="DEMO-0004"
            defaultValue={p?.document}
          />
        </label>
        <label>
          Fecha de nacimiento
          <input
            name="birthDate"
            type="date"
            max={localDay()}
            required
            defaultValue={birthDate}
          />
        </label>
      </div>
      <label>
        Teléfono
        <input
          name="phone"
          type="tel"
          required
          maxLength={40}
          defaultValue={p?.phone}
        />
      </label>
      <label>
        Responsable de pago
        <select
          name="payerKind"
          value={payerKind}
          onChange={(e) => setPayerKind(e.target.value)}
        >
          <option value="self">El propio paciente</option>
          <option value="person">Otra persona</option>
          <option value="company">Empresa</option>
          <option value="insurance">Aseguradora</option>
        </select>
      </label>
      {payerKind !== 'self' && (
        <label>
          Nombre del pagador
          <input
            name="payerName"
            required
            maxLength={120}
            defaultValue={isSelf ? '' : payer?.name}
          />
        </label>
      )}
      <p className="form-hint">
        Se comprobarán coincidencias de identificación, teléfono y nombre con
        fecha de nacimiento.
      </p>
    </>
  );
}
