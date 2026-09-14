'use client';
import type { PayerDetails } from '@/patients/patients.types';
export function PayerForm({ details }: { details: PayerDetails }) {
  const { payer, patients } = details;
  return (
    <>
      <label>
        Nombre del responsable de pago
        <input name="name" required maxLength={120} defaultValue={payer.name} />
      </label>
      <label>
        Tipo
        <select name="kind" required defaultValue={payer.kind}>
          <option value="person">Otra persona</option>
          <option value="company">Empresa</option>
          <option value="insurance">Aseguradora</option>
        </select>
      </label>
      <div>
        <p>Pacientes vinculados: {patients.length}</p>
        <ul>
          {patients.map((p) => (
            <li key={p.id}>
              {p.name} · {p.document}
            </li>
          ))}
        </ul>
      </div>
      <p className="form-hint">
        El nombre y tipo se actualizarán donde se utilice este responsable,
        incluidos los documentos internos que consultan sus datos actuales.
      </p>
      {patients.length > 1 && (
        <label className="shared-payer-confirm">
          <input type="checkbox" name="confirmShared" required />
          Confirmo que este cambio afectará a los {patients.length} pacientes
          vinculados.
        </label>
      )}
    </>
  );
}
