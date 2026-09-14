'use client';
import { Printer } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { Sale, Payment } from '@/billing/billing.types';
import type { Action } from '@/api/clinic.types';
import { money } from '@/shared/format';
import { methods } from '@/billing/payment-methods';
export function SaleCard({
  s,
  payments,
  busy,
  action,
  onPayment,
}: {
  s: Sale;
  payments: Payment[];
  busy: boolean;
  action: Action;
  onPayment: (id: string) => void;
}) {
  return (
    <section className="panel sale-card">
      <header>
        <div>
          <h2>{s.patient_name}</h2>
          <p className="muted">
            {s.description} · Pagador: {s.payer_name}
          </p>
        </div>
        <span
          className={
            'status ' +
            (s.paid_cents === s.total_cents ? 'confirmada' : 'programada')
          }
        >
          {s.paid_cents === s.total_cents ? 'Pagada' : 'Saldo pendiente'}
        </span>
      </header>
      <div className="sale-totals">
        <div>
          <small>Total</small>
          <b>{money(s.total_cents)}</b>
        </div>
        <div>
          <small>Pagado</small>
          <b>{money(s.paid_cents)}</b>
        </div>
        <div>
          <small>Pendiente</small>
          <b>{money(s.total_cents - s.paid_cents)}</b>
        </div>
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Pagos de la venta"
      >
        <table>
          <thead>
            <tr>
              <th>MÉTODO</th>
              <th>IMPORTE</th>
              <th>TASA BS/USD</th>
              <th>APLICADO USD</th>
              <th>REFERENCIA</th>
            </tr>
          </thead>
          <tbody>
            {payments
              .filter((pay) => pay.sale_id === s.id)
              .map((pay) => (
                <tr key={pay.id}>
                  <td>{methods[pay.method]}</td>
                  <td>
                    {(pay.amount_cents / 100).toFixed(2)} {pay.currency}
                  </td>
                  <td>{pay.currency === 'VES' ? pay.rate : '—'}</td>
                  <td>{money(pay.usd_cents)}</td>
                  <td>{pay.reference}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="sale-actions">
        {s.paid_cents < s.total_cents && (
          <Button className="primary" onClick={() => onPayment(s.id)}>
            Registrar pago
          </Button>
        )}
        <a
          className="secondary"
          href={'/invoice/' + s.id}
          target="_blank"
          rel="noreferrer"
        >
          <Printer size={16} />
          Documento interno
        </a>
        <Button
          className="secondary"
          disabled={busy || s.fiscal_status === 'emitida_simulada'}
          onClick={() => action({ action: 'fiscal', id: s.id })}
        >
          Simular emisión
        </Button>
        <button
          className="subtle"
          disabled={busy || s.fiscal_status === 'emitida_simulada'}
          onClick={() =>
            action({
              action: 'fiscal',
              id: s.id,
              simulateFailure: true,
            })
          }
        >
          Simular fallo
        </button>
      </div>
      <p className="fiscal-note">
        {s.fiscal_status === 'emitida_simulada'
          ? 'Emisión simulada completada'
          : s.fiscal_status === 'error_simulado'
            ? 'Fallo simulado. Puedes reintentar la emisión.'
            : 'Sin envío fiscal simulado'}
        . Sin validez fiscal.
      </p>
    </section>
  );
}
