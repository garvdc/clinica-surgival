'use client';
import type { Sale } from '@/billing/billing.types';
import { methods } from '@/billing/payment-methods';
import { money } from '@/shared/format';
export function PaymentForm({
  sales,
  selected,
  currency,
  setCurrency,
  method,
  setMethod,
}: {
  sales: Sale[];
  selected: string;
  currency: string;
  setCurrency: (s: string) => void;
  method: string;
  setMethod: (s: string) => void;
}) {
  const selectedSale = sales.find((s) => s.id === selected);
  return (
    <>
      <>
        <div className="form-grid">
          <label>
            Método
            <select
              name="method"
              value={method}
              onChange={(e) => {
                setMethod(e.target.value);
                if (e.target.value === 'cash') setCurrency('USD');
              }}
            >
              {Object.entries(methods).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Moneda
            <select
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD</option>
              {method !== 'cash' && <option value="VES">Bolívares (Bs)</option>}
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>
            Importe recibido ({currency === 'VES' ? 'Bs' : 'USD'})
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
            />
          </label>
          {currency === 'VES' && (
            <label>
              Tasa Bs por USD
              <input
                name="rate"
                type="number"
                step="0.000001"
                min="0.000001"
                required
              />
            </label>
          )}
        </div>
        <label>
          Referencia
          <input
            name="reference"
            required={method !== 'cash'}
            maxLength={100}
            placeholder={
              method === 'cashea'
                ? 'Referencia del monto cubierto por Cashea'
                : 'Número o referencia de la operación'
            }
          />
        </label>
        {selectedSale && (
          <p className="form-hint">
            Saldo disponible:{' '}
            {money(selectedSale.total_cents - selectedSale.paid_cents)}. Puedes
            registrar varios métodos hasta completar el total.
          </p>
        )}
      </>
    </>
  );
}
