'use client';
import {
  CalendarDays,
  Users,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { Data } from '@/api/clinic.types';
import type { Appointment } from '@/scheduling/scheduling.types';
import { localDay } from '@/shared/format';
import { statusNames } from '@/scheduling/status-names';
export function AgendaView({
  data,
  date,
  search,
  filter,
  professional,
  busy,
  canWrite,
  setDate,
  setSearch,
  setFilter,
  setProfessional,
  shift,
  load,
  change,
  open,
  onReschedule,
}: {
  data: Pick<Data, 'appointments' | 'professionals'>;
  date: string;
  search: string;
  filter: string;
  professional: string;
  busy: boolean;
  canWrite: boolean;
  setDate: (v: string) => void;
  setSearch: (v: string) => void;
  setFilter: (v: string) => void;
  setProfessional: (v: string) => void;
  shift: (n: number) => void;
  load: () => Promise<void>;
  change: (a: Appointment, status: string) => Promise<void>;
  open: (type: 'appointment') => void;
  onReschedule: (a: Appointment) => void;
}) {
  const dayAppointments = data.appointments.filter((a) => a.date === date);
  const visible = dayAppointments
    .filter(
      (a) =>
        (filter === 'all' || a.status === filter) &&
        (professional === 'all' || a.professional_id === professional) &&
        (a.patient_name + ' ' + a.reason)
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <>
      <div className="stats">
        <div className="stat">
          <span>
            Citas del día
            <CalendarDays size={19} />
          </span>
          <b>
            {
              dayAppointments.filter(
                (a) => !['cancelada', 'no_asistio'].includes(a.status),
              ).length
            }
          </b>
          <small>Programadas para esta fecha</small>
        </div>
        <div className="stat">
          <span>
            Por confirmar
            <Clock3 size={19} />
          </span>
          <b>
            {dayAppointments.filter((a) => a.status === 'programada').length}
          </b>
          <small>Pendientes de confirmación</small>
        </div>
        <div className="stat accent">
          <span>
            En recepción
            <Users size={19} />
          </span>
          <b>
            {
              dayAppointments.filter((a) =>
                ['llego', 'en_espera'].includes(a.status),
              ).length
            }
          </b>
          <small>Pacientes que ya llegaron</small>
        </div>
      </div>
      <section className="panel">
        <div className="schedule-heading">
          <div className="date-controls">
            <button aria-label="Día anterior" onClick={() => shift(-1)}>
              <ChevronLeft size={18} />
            </button>
            <label className="date-label">
              <input
                aria-label="Fecha de agenda"
                type="date"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
              />
            </label>
            <button aria-label="Día siguiente" onClick={() => shift(1)}>
              <ChevronRight size={18} />
            </button>
            <button className="today" onClick={() => setDate(localDay())}>
              Hoy
            </button>
          </div>
          <span className="count">{visible.length} citas</span>
        </div>
        <div className="filters">
          <div className="search">
            <Search size={18} />
            <input
              placeholder="Buscar paciente o servicio…"
              aria-label="Buscar cita"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            aria-label="Filtrar profesional"
            value={professional}
            onChange={(e) => setProfessional(e.target.value)}
          >
            <option value="all">Todos los profesionales</option>
            {data.professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar estado"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            {Object.entries(statusNames).map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
          <button
            className="refresh"
            onClick={() => void load()}
            aria-label="Actualizar agenda"
          >
            <RefreshCw size={17} />
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>HORA</th>
                <th>PACIENTE / SERVICIO</th>
                <th>PROFESIONAL</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong className="time">{a.time}</strong>
                    <small>{a.duration} min</small>
                  </td>
                  <td>
                    <div className="patient-cell">
                      <div className="initials">
                        {a.patient_name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <strong>{a.patient_name}</strong>
                        <small>{a.reason}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{a.professional_name}</strong>
                    <small>Pagador: {a.payer_name}</small>
                  </td>
                  <td>
                    <span className={'status ' + a.status}>
                      {statusNames[a.status]}
                    </span>
                  </td>
                  <td>
                    {canWrite ? (
                      <div className="row-actions">
                        {['programada', 'confirmada'].includes(a.status) && (
                          <button
                            disabled={busy}
                            onClick={() => onReschedule(a)}
                          >
                            Reprogramar
                          </button>
                        )}
                        {a.status === 'programada' && (
                          <button
                            disabled={busy}
                            onClick={() => change(a, 'confirmada')}
                          >
                            Confirmar
                          </button>
                        )}
                        {['programada', 'confirmada'].includes(a.status) && (
                          <button
                            disabled={busy}
                            onClick={() => change(a, 'llego')}
                          >
                            Llegó
                          </button>
                        )}
                        {a.status === 'llego' && (
                          <button
                            disabled={busy}
                            onClick={() => change(a, 'en_espera')}
                          >
                            A espera
                          </button>
                        )}
                        {!['cancelada', 'no_asistio'].includes(a.status) && (
                          <button
                            disabled={busy}
                            className="subtle"
                            onClick={() => change(a, 'cancelada')}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="muted">Consulta</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <div className="empty">
              <CalendarDays size={35} />
              <h3>No hay citas con estos filtros</h3>
              <p>Cambia la fecha o registra una nueva cita.</p>
              {canWrite && (
                <Button
                  className="secondary"
                  onClick={() => open('appointment')}
                >
                  Programar cita
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
      <div className="bottom-note">
        <ShieldCheck size={17} />
        <span>
          Los cambios de estado conservan el autor y el motivo. Los horarios
          superpuestos se bloquean.
        </span>
      </div>
    </>
  );
}
