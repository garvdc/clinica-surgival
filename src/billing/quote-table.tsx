'use client';
import { FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { Quote } from '@/billing/billing.types';
import type { Action } from '@/api/clinic.types';
import { money } from '@/shared/format';
export function QuoteTable({
  quotes,
  busy,
  action,
}: {
  quotes: Quote[];
  busy: boolean;
  action: Action;
}) {
  return (
    <section className="panel table-scroll">
      <table>
        <thead>
          <tr>
            <th>PACIENTE / PAGADOR</th>
            <th>SERVICIO</th>
            <th>TOTAL USD</th>
            <th>ESTADO</th>
            <th>ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <tr key={q.id}>
              <td>
                <strong>{q.patient_name}</strong>
                <small>{q.payer_name}</small>
              </td>
              <td>{q.description}</td>
              <td>{money(q.total_cents)}</td>
              <td>
                <span className="status">{q.status}</span>
              </td>
              <td>
                {q.status === 'borrador' && (
                  <Button
                    className="secondary"
                    disabled={busy}
                    onClick={() => action({ action: 'approve', id: q.id })}
                  >
                    Aprobar
                  </Button>
                )}
                {q.status === 'aprobado' && (
                  <Button
                    className="primary"
                    disabled={busy}
                    onClick={() => action({ action: 'convert', id: q.id })}
                  >
                    Convertir a venta
                    <ArrowRight size={15} />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!quotes.length && (
        <div className="empty">
          <FileText size={30} />
          <h3>No hay presupuestos</h3>
          <p>Crea uno a partir de una cita.</p>
        </div>
      )}
    </section>
  );
}
