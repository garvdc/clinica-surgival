'use client';
import { Search } from 'lucide-react';
import type { Data } from '@/api/clinic.types';
import type { Patient } from '@/patients/patients.types';
import { Button } from '@/shared/ui/button';
export function PatientList({
  data,
  search,
  setSearch,
  canWrite,
  onEdit,
}: {
  data: Pick<Data, 'patients' | 'payers' | 'links'>;
  search: string;
  setSearch: (s: string) => void;
  canWrite: boolean;
  onEdit: (p: Patient) => void;
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
      <div className="table-scroll">
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
                      .map((py) => py.name)
                      .join(', ')}
                  </td>
                  {canWrite && (
                    <td>
                      <div className="row-actions">
                        <Button
                          className="secondary"
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
