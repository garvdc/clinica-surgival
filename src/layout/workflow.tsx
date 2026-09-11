'use client';
import { Plus, Wallet, Stethoscope } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useState } from 'react';
import type { Data } from '@/api/clinic.types';
import { EncounterCard } from '@/clinical/encounter-card';
import { EncounterForm } from '@/clinical/encounter-form';
import { QuoteTable } from '@/billing/quote-table';
import { QuoteForm } from '@/billing/quote-form';
import { SaleCard } from '@/billing/sale-card';
import { PaymentForm } from '@/billing/payment-form';
import { WorkflowTarget } from '@/layout/workflow-target';
export function Workflow({
  tab,
  data,
  post,
  reload,
  report,
}: {
  tab: string;
  data: Data;
  post: (x: Record<string, unknown>) => Promise<unknown>;
  reload: () => Promise<void>;
  report: (s: string) => void;
}) {
  const [paymentKey, setPaymentKey] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false),
    [selected, setSelected] = useState(''),
    [show, setShow] = useState(false),
    [currency, setCurrency] = useState('USD'),
    [method, setMethod] = useState('cash'),
    [history, setHistory] = useState('');
  async function action(x: Record<string, unknown>) {
    setBusy(true);
    try {
      await post(x);
      await reload();
      setPaymentKey(crypto.randomUUID());
      setShow(false);
      report('Operación guardada.');
    } catch (e) {
      report('Error: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(
    e: React.FormEvent<HTMLFormElement>,
    actionName: string,
    extra: Record<string, unknown> = {},
  ) {
    e.preventDefault();
    await action({
      action: actionName,
      ...Object.fromEntries(new FormData(e.currentTarget)),
      ...extra,
    });
  }
  const clinical = tab === 'clinical';
  const sales = data.sales ?? [];
  return (
    <div className="workflow">
      <div className="workflow-intro">
        <span>
          {clinical
            ? 'Plantilla clínica básica de demostración'
            : tab === 'quotes'
              ? 'Precios en USD · Impuestos pendientes de definir'
              : 'Pagos en USD y Bs · Tasa manual por operación'}
        </span>
        <Button
          className="primary"
          onClick={() => {
            setShow(!show);
            setSelected('');
          }}
        >
          <Plus size={17} />
          {clinical
            ? 'Registrar consulta'
            : tab === 'quotes'
              ? 'Nuevo presupuesto'
              : 'Registrar pago'}
        </Button>
      </div>
      {show && (
        <section className="panel workflow-form">
          <h2>
            {clinical
              ? 'Consulta desde la agenda'
              : tab === 'quotes'
                ? 'Presupuesto de un servicio'
                : 'Aplicar pago a una venta'}
          </h2>
          <form
            onSubmit={(e) =>
              submit(
                e,
                clinical ? 'encounter' : tab === 'quotes' ? 'quote' : 'payment',
                tab === 'sales' ? { idempotencyKey: paymentKey } : {},
              )
            }
          >
            <WorkflowTarget
              tab={tab}
              appointments={data.appointments}
              sales={sales}
              selected={selected}
              setSelected={setSelected}
            />
            {clinical ? (
              <EncounterForm />
            ) : tab === 'quotes' ? (
              <QuoteForm />
            ) : (
              <PaymentForm
                sales={sales}
                selected={selected}
                currency={currency}
                setCurrency={setCurrency}
                method={method}
                setMethod={setMethod}
              />
            )}
            <div className="modal-actions">
              <Button
                type="button"
                className="secondary"
                onClick={() => setShow(false)}
              >
                Cancelar
              </Button>
              <Button className="primary" type="submit" disabled={busy}>
                {busy ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </form>
        </section>
      )}
      {clinical && (
        <div className="clinical-list">
          {!(data.encounters ?? []).length && (
            <div className="panel empty">
              <Stethoscope size={30} />
              <h3>Aún no hay consultas registradas</h3>
              <p>
                Selecciona una cita para crear la primera nota de demostración.
              </p>
            </div>
          )}
          {(data.encounters ?? []).map((e) => (
            <EncounterCard
              key={e.id}
              e={e}
              versions={data.versions ?? []}
              busy={busy}
              expanded={history === e.id}
              onToggle={() => setHistory(history === e.id ? '' : e.id)}
              action={action}
            />
          ))}
        </div>
      )}
      {tab === 'quotes' && (
        <QuoteTable quotes={data.quotes ?? []} busy={busy} action={action} />
      )}
      {tab === 'sales' && (
        <div className="sales-list">
          {!sales.length && (
            <div className="panel empty">
              <Wallet size={30} />
              <h3>No hay ventas todavía</h3>
              <p>Aprueba y convierte un presupuesto para registrar pagos.</p>
            </div>
          )}
          {sales.map((s) => (
            <SaleCard
              key={s.id}
              s={s}
              payments={data.payments ?? []}
              busy={busy}
              action={action}
              onPayment={(id) => {
                setSelected(id);
                setShow(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
