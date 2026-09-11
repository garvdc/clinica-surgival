'use client';
import { localDay } from '@/shared/format';
export function PatientForm({
  payerKind,
  setPayerKind,
}: {
  payerKind: string;
  setPayerKind: (s: string) => void;
}) {
  return (
    <>
      <label>
        Nombre completo
        <input autoFocus name="name" maxLength={120} required />
      </label>
      <div className="form-grid">
        <label>
          Identificación
          <input
            name="document"
            maxLength={40}
            required
            placeholder="DEMO-0004"
          />
        </label>
        <label>
          Fecha de nacimiento
          <input name="birthDate" type="date" max={localDay()} required />
        </label>
      </div>
      <label>
        Teléfono
        <input name="phone" type="tel" required maxLength={40} />
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
          <input name="payerName" required maxLength={120} />
        </label>
      )}
      <p className="form-hint">
        Se comprobarán coincidencias de identificación, teléfono y nombre con
        fecha de nacimiento.
      </p>
    </>
  );
}
