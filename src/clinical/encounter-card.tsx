'use client';
import { Check, History } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { Encounter, EncounterVersion } from '@/clinical/clinical.types';
import type { Action } from '@/api/clinic.types';
export function EncounterCard({
  e,
  versions,
  busy,
  expanded,
  onToggle,
  action,
}: {
  e: Encounter;
  versions: EncounterVersion[];
  busy: boolean;
  expanded: boolean;
  onToggle: () => void;
  action: Action;
}) {
  return (
    <section className="panel encounter-card">
      <header>
        <div>
          <h2>{e.patient_name}</h2>
          <p className="muted">
            Versión {e.version} ·{' '}
            {e.status === 'cerrada' ? 'Cerrada' : 'Borrador'}
          </p>
        </div>
        <span
          className={
            'status ' + (e.status === 'cerrada' ? 'confirmada' : 'programada')
          }
        >
          {e.status}
        </span>
      </header>
      <pre>{e.notes}</pre>
      <div className="row-actions">
        {e.status === 'borrador' ? (
          <Button
            className="primary"
            disabled={busy}
            onClick={() => action({ action: 'close', id: e.id })}
          >
            <Check size={16} />
            Cerrar atención
          </Button>
        ) : (
          <Button
            className="secondary"
            disabled={busy}
            onClick={() => {
              const notes = prompt(
                'Corrección de la nota (se conservará el original):',
                e.notes,
              );
              if (!notes) return;
              const reason = prompt('Motivo de la corrección:');
              if (reason)
                void action({
                  action: 'amend',
                  id: e.id,
                  notes,
                  reason,
                });
            }}
          >
            Añadir corrección
          </Button>
        )}
        <Button className="secondary" onClick={onToggle}>
          <History size={16} />
          Versiones
        </Button>
      </div>
      {expanded && (
        <div className="history-list">
          {versions
            .filter((v) => v.encounter_id === e.id)
            .map((v) => (
              <article key={v.id}>
                <b>
                  Versión {v.version} · {v.reason}
                </b>
                <small>{new Date(v.created_at).toLocaleString('es-VE')}</small>
                <pre>{v.notes}</pre>
              </article>
            ))}
        </div>
      )}
    </section>
  );
}
