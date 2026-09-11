import type { Payment } from '@/billing/billing.types';
import type { Sale } from '@/billing/billing.types';
import type { Quote } from '@/billing/billing.types';
import { required } from '@/shared/validation';
import type { Actor } from '@/identity/auth.service';
import { reply } from '@/shared/api/response';
import { auditStmt } from '@/audit/audit.service';
import { cents, toUSD } from '@/billing/money';
export { cents, toUSD } from '@/billing/money';
export async function billing(
  db: D1Database,
  u: Actor,
  x: Record<string, unknown>,
) {
  const now = new Date().toISOString();
  const audit = (action: string, id: string, detail: string) =>
    auditStmt(db, u, action, id, detail, now);
  if (x.action === 'quote') {
    const appointmentId = required(x.appointmentId, 'Cita'),
      description = required(x.description, 'Servicio', 160),
      total = cents(x.total);
    const a = await db
      .prepare('SELECT patient_id,payer_id FROM appointments WHERE id=?')
      .bind(appointmentId)
      .first<{ patient_id: string; payer_id: string }>();
    if (!a) throw Error('Cita inexistente.');
    const id = crypto.randomUUID();
    await db.batch([
      db
        .prepare(
          "INSERT INTO quotes(id,appointment_id,patient_id,payer_id,description,total_cents,status,created_at) VALUES(?,?,?,?,?,?,'borrador',?)",
        )
        .bind(
          id,
          appointmentId,
          a.patient_id,
          a.payer_id,
          description,
          total,
          now,
        ),
      audit('Presupuesto creado', id, 'Importe en USD'),
    ]);
    return reply({ ok: true });
  }
  if (x.action === 'approve') {
    const id = required(x.id, 'Presupuesto');
    const results = await db.batch([
      db
        .prepare(
          "UPDATE quotes SET status='aprobado' WHERE id=? AND status='borrador'",
        )
        .bind(id),
      db
        .prepare(
          'INSERT INTO audit(id,actor,action,entity_id,detail,created_at) SELECT ?,?,?,?,?,? WHERE changes()>0',
        )
        .bind(
          crypto.randomUUID(),
          u.name,
          'Presupuesto aprobado',
          id,
          'Importe aceptado',
          now,
        ),
    ]);
    if (!results[0].meta.changes)
      throw Error('El presupuesto no está en borrador.');
    return reply({ ok: true });
  }
  if (x.action === 'convert') {
    const id = required(x.id, 'Presupuesto');
    const existing = await db
      .prepare('SELECT id FROM sales WHERE quote_id=?')
      .bind(id)
      .first();
    if (existing) return reply({ ok: true, ...existing });
    const q = await db
      .prepare(
        "SELECT total_cents FROM quotes WHERE id=? AND status='aprobado'",
      )
      .bind(id)
      .first<{ total_cents: number }>();
    if (!q) throw Error('Aprueba el presupuesto antes de convertirlo.');
    const saleId = crypto.randomUUID();
    await db.batch([
      db
        .prepare(
          "INSERT INTO sales(id,quote_id,total_cents,fiscal_status,created_at) VALUES(?,?,?,'no_enviada',?)",
        )
        .bind(saleId, id, q.total_cents, now),
      db.prepare("UPDATE quotes SET status='convertido' WHERE id=?").bind(id),
      audit('Venta creada', saleId, 'Presupuesto conservado'),
    ]);
    return reply({ ok: true, id: saleId });
  }
  if (x.action === 'payment') {
    const saleId = required(x.saleId, 'Venta'),
      id = required(x.idempotencyKey, 'Identificador de pago', 100);
    const old = await db
      .prepare('SELECT id,sale_id FROM payments WHERE id=?')
      .bind(id)
      .first<{ id: string; sale_id: string }>();
    if (old) {
      if (old.sale_id !== saleId)
        throw Error('Identificador de pago utilizado en otra venta.');
      return reply({ ok: true, id: old.id });
    }
    const currency = required(x.currency, 'Moneda'),
      method = required(x.method, 'Método de pago');
    if (!['cash', 'transfer', 'debit', 'credit', 'cashea'].includes(method))
      throw Error('Método de pago inválido.');
    if (method === 'cash' && currency !== 'USD')
      throw Error('El efectivo de esta demo se registra en USD.');
    const amount = cents(x.amount),
      conversion = toUSD(amount, currency, x.rate);
    const reference =
      method === 'cash'
        ? String(x.reference ?? 'Efectivo')
        : required(x.reference, 'Referencia del pago', 100);
    const sale = await db
      .prepare('SELECT id FROM sales WHERE id=?')
      .bind(saleId)
      .first();
    if (!sale) throw Error('Venta inexistente.');
    await db.batch([
      db
        .prepare(
          'INSERT INTO payments(id,sale_id,amount_cents,currency,rate,usd_cents,method,reference,created_at) VALUES(?,?,?,?,?,?,?,?,?)',
        )
        .bind(
          id,
          saleId,
          amount,
          currency,
          conversion.rate,
          conversion.usdCents,
          method,
          reference,
          now,
        ),
      audit(
        'Pago registrado',
        saleId,
        `${method}; ${currency}; tasa conservada`,
      ),
    ]);
    return reply({ ok: true });
  }
  if (x.action === 'fiscal') {
    const id = required(x.id, 'Venta');
    const sale = await db
      .prepare('SELECT fiscal_status,fiscal_ref FROM sales WHERE id=?')
      .bind(id)
      .first<{ fiscal_status: string; fiscal_ref: string | null }>();
    if (!sale) throw Error('Venta inexistente.');
    if (sale.fiscal_status === 'emitida_simulada') return reply({ ok: true });
    const status = x.simulateFailure ? 'error_simulado' : 'emitida_simulada',
      ref = x.simulateFailure ? null : `DEMO-${id}`;
    await db.batch([
      db
        .prepare(
          "UPDATE sales SET fiscal_status=?,fiscal_ref=? WHERE id=? AND fiscal_status<>'emitida_simulada'",
        )
        .bind(status, ref, id),
      audit('Simulación fiscal', id, status),
    ]);
    return reply({ ok: true });
  }
  return null;
}

export function listQuotes(db: () => D1Database, u: Actor) {
  return ['admin', 'cashier'].includes(u.role)
    ? db()
        .prepare(
          'SELECT q.*,p.name patient_name,py.name payer_name FROM quotes q JOIN patients p ON p.id=q.patient_id JOIN payers py ON py.id=q.payer_id ORDER BY q.created_at DESC',
        )
        .all<Quote>()
    : Promise.resolve({ results: [] });
}

export function listSales(db: () => D1Database, u: Actor) {
  return ['admin', 'cashier'].includes(u.role)
    ? db()
        .prepare(
          'SELECT s.*,q.description,q.patient_id,q.payer_id,p.name patient_name,py.name payer_name,COALESCE((SELECT SUM(usd_cents) FROM payments WHERE sale_id=s.id),0) paid_cents FROM sales s JOIN quotes q ON q.id=s.quote_id JOIN patients p ON p.id=q.patient_id JOIN payers py ON py.id=q.payer_id ORDER BY s.created_at DESC',
        )
        .all<Sale>()
    : Promise.resolve({ results: [] });
}

export function listPayments(db: () => D1Database, u: Actor) {
  return ['admin', 'cashier'].includes(u.role)
    ? db()
        .prepare('SELECT * FROM payments ORDER BY created_at DESC')
        .all<Payment>()
    : Promise.resolve({ results: [] });
}
