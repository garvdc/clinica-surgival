'use client';
import { Search } from 'lucide-react';
import type { Data } from '@/api/clinic.types';
import type { Patient, Payer } from '@/patients/patients.types';
import { Button } from '@/shared/ui/button';
export function PatientList({
  data,
  search,
  setSearch,
  canWrite,
  onEdit,
  onEditPayer,
  busy,
}: {
  data: Pick<Data, 'patients' | 'payers' | 'links'>;
  search: string;
  setSearch: (s: string) => void;
  canWrite: boolean;
  onEdit: (p: Patient) => void;
  onEditPayer: (p: Payer) => void;
  busy: boolean;
}) {
  return (
    <section className="panel">
      <div className="filters">
        <div className="search">
          <Search size={18} />
          <input
            aria-label="Buscar pacientes"
            placeholder="Buscar por nombre, identificación o teléfono…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="count">{data.patients.length} pacientes</span>
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Pacientes"
      >
        <table>
          <thead>
            <tr>
              <th>PACIENTE</th>
              <th>IDENTIFICACIÓN</th>
              <th>TELÉFONO</th>
              <th>NACIMIENTO</th>
              <th>PAGADOR</th>
              {canWrite && <th>ACCIONES</th>}
            </tr>
          </thead>
          <tbody>
            {data.patients
              .filter((p) =>
                (p.name + ' ' + p.document + ' ' + p.phone)
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.document}</td>
                  <td>{p.phone}</td>
                  <td>{p.birth_date}</td>
                  <td>
                    {data.payers
                      .filter((py) =>
                        data.links.some(
                          (l) => l.patient_id === p.id && l.payer_id === py.id,
                        ),
                      )
                      .map((py) => (
                        <div key={py.id}>
                          <span>{py.name}</span>
                          {canWrite && py.kind !== 'self' && (
                            <Button
                              type="button"
                              className="secondary"
                              disabled={busy}
                              onClick={() => onEditPayer(py)}
                              aria-label={
                                'Editar responsable de pago: ' + py.name
                              }
                            >
                              Editar responsable de pago
                            </Button>
                          )}
                        </div>
                      ))}
                  </td>
                  {canWrite && (
                    <td>
                      <div className="row-actions">
                        <Button
                          className="secondary"
                          disabled={busy}
                          onClick={() => onEdit(p)}
                        >
                          Editar
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
