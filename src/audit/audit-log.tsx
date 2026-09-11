'use client';
import { ShieldCheck } from 'lucide-react';
import type { AuditEvent } from '@/audit/audit.types';
export function AuditLog({ events }: { events: AuditEvent[] }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Últimos 100 eventos</h2>
        <ShieldCheck size={21} />
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>FECHA</th>
              <th>USUARIO</th>
              <th>ACCIÓN</th>
              <th>DETALLE</th>
            </tr>
          </thead>
          <tbody>
            {events.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.created_at).toLocaleString('es')}</td>
                <td>{a.actor}</td>
                <td>{a.action}</td>
                <td>{a.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
