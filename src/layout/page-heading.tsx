'use client';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
export function PageHeading({
  tab,
  canWrite,
  open,
}: {
  tab: string;
  canWrite: boolean;
  open: (type: 'patient' | 'appointment') => void;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">
          {
            (
              {
                agenda: 'ORGANIZA LA JORNADA',
                patients: 'PERSONAS Y PAGADORES',
                audit: 'TRAZABILIDAD',
                clinical: 'CONSULTAS',
                quotes: 'GESTIÓN COMERCIAL',
                sales: 'CAJA',
              } as Record<string, string>
            )[tab]
          }
        </span>
        <h1>
          {
            (
              {
                agenda: 'Agenda de atención',
                patients: 'Tus pacientes',
                audit: 'Registro de actividad',
                clinical: 'Atención clínica',
                quotes: 'Presupuestos',
                sales: 'Ventas y pagos',
              } as Record<string, string>
            )[tab]
          }
        </h1>
        <p className="muted">
          {
            (
              {
                agenda: 'Cada cita, en su momento.',
                patients: 'Encuentra una ficha o registra un nuevo paciente.',
                audit: 'Consulta quién hizo cada cambio.',
                clinical: 'Registra y conserva la historia de cada consulta.',
                quotes: 'Prepara el servicio y confirma su presupuesto.',
                sales: 'Registra pagos y consulta el saldo de cada operación.',
              } as Record<string, string>
            )[tab]
          }
        </p>
      </div>
      {canWrite && ['agenda', 'patients'].includes(tab) && (
        <Button
          className="primary"
          onClick={() => open(tab === 'patients' ? 'patient' : 'appointment')}
        >
          <Plus size={18} />
          {tab === 'patients' ? 'Nuevo paciente' : 'Nueva cita'}
        </Button>
      )}
    </div>
  );
}
