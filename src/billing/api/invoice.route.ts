import { env } from 'cloudflare:workers';
import { actor } from '@/identity/auth.service';
import { esc, money } from '@/shared/print-format';
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const u = await actor(req);
  if (!u)
    return new Response('Inicia sesión en Clínica Surgival.', { status: 401 });
  if (!['admin', 'cashier'].includes(u.role))
    return new Response('Sin permiso.', { status: 403 });
  const { id } = await context.params;
  const s = await env.DB.prepare(
    'SELECT s.*,q.description,p.name patient_name,py.name payer_name FROM sales s JOIN quotes q ON q.id=s.quote_id JOIN patients p ON p.id=q.patient_id JOIN payers py ON py.id=q.payer_id WHERE s.id=?',
  )
    .bind(id)
    .first<{
      id: string;
      description: string;
      total_cents: number;
      created_at: string;
      patient_name: string;
      payer_name: string;
    }>();
  if (!s) return new Response('Documento no encontrado.', { status: 404 });
  const payments = await env.DB.prepare(
    'SELECT * FROM payments WHERE sale_id=? ORDER BY created_at',
  )
    .bind(id)
    .all<{
      amount_cents: number;
      currency: string;
      rate: string;
      usd_cents: number;
      method: string;
      reference: string;
    }>();
  const paid = payments.results.reduce((sum, p) => sum + p.usd_cents, 0);
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><title>Documento interno - Clínica Surgival</title><style>body{font:15px Arial;max-width:800px;margin:40px auto;color:#213c48;padding:25px}h1{color:#076c74}p{line-height:1.5}table{width:100%;border-collapse:collapse;margin:25px 0}td,th{text-align:left;padding:12px;border-bottom:1px solid #ddd}.notice{padding:16px;background:#fff5df;border:1px solid #eac773}button{background:#086c74;color:white;padding:12px 20px;border:0;border-radius:6px;cursor:pointer}.totals{text-align:right}small{word-break:break-all}@media print{button{display:none}body{margin:0;max-width:none;padding:15px}}</style><button onclick="window.print()">Imprimir / guardar como PDF</button><h1>Clínica Surgival</h1><h2>Comprobante interno de demostración</h2><p class="notice">SIN VALIDEZ FISCAL · Datos ficticios · No se han calculado impuestos.</p><small>Documento: ${esc(s.id)}</small><p>Fecha: ${esc(s.created_at.slice(0, 10))}<br>Paciente: ${esc(s.patient_name)}<br>Pagador: ${esc(s.payer_name)}</p><table><thead><tr><th>Servicio</th><th>Total</th></tr></thead><tbody><tr><td>${esc(s.description)}</td><td>${money(s.total_cents)}</td></tr></tbody></table><h3>Pagos registrados</h3><table><thead><tr><th>Método</th><th>Importe recibido</th><th>Tasa Bs/USD</th><th>Aplicado USD</th><th>Referencia</th></tr></thead><tbody>${payments.results.map((p) => `<tr><td>${esc(p.method)}</td><td>${(p.amount_cents / 100).toFixed(2)} ${esc(p.currency)}</td><td>${p.currency === 'VES' ? esc(p.rate) : '-'}</td><td>${money(p.usd_cents)}</td><td>${esc(p.reference)}</td></tr>`).join('')}</tbody></table><p class="totals">Total: <b>${money(s.total_cents)}</b><br>Pagado: ${money(paid)}<br>Saldo pendiente: <b>${money(s.total_cents - paid)}</b></p><p>Cashea se registra por el monto cubierto. Las tasas de pagos en bolívares conservan el valor manual aplicado al momento del registro.</p></html>`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
