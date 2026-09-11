'use client';
import { X, Check } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useEffect, useState, useCallback } from 'react';
import type { Data } from '@/api/clinic.types';
import type { Appointment } from '@/scheduling/scheduling.types';
import { localDay } from '@/shared/format';
import { Workflow } from '@/layout/workflow';
import { useAgendaTool } from '@/scheduling/use-agenda-tool';
import { Loading } from '@/layout/loading';
import { LoginForm } from '@/layout/login-form';
import { Sidebar } from '@/layout/sidebar';
import { Topbar } from '@/layout/topbar';
import { PageHeading } from '@/layout/page-heading';
import { AgendaView } from '@/scheduling/agenda.view';
import { PatientList } from '@/patients/patient-list';
import { AuditLog } from '@/audit/audit-log';
import { PatientForm } from '@/patients/patient-form';
import { AppointmentForm } from '@/scheduling/appointment-form';
export default function Home() {
  const [data, setData] = useState<Data | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [tab, setTab] = useState('agenda'),
    [date, setDate] = useState(localDay),
    [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [professional, setProfessional] = useState('all'),
    [modal, setModal] = useState<'patient' | 'appointment' | null>(null),
    [busy, setBusy] = useState(false),
    [patientId, setPatientId] = useState(''),
    [payerKind, setPayerKind] = useState('self');
  useEffect(() => {
    if (!modal) return;
    const root = document.querySelector<HTMLElement>('.modal');
    const before = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        root?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
        ) ?? [],
      );
    focusables()[0]?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) {
        setModal(null);
        return;
      }
      if (e.key === 'Tab') {
        const nodes = focusables(),
          first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      before?.focus();
    };
  }, [modal, busy]);
  const [reschedule, setReschedule] = useState<Appointment | null>(null);
  const navigateAgenda = useCallback((d: string) => {
    setTab('agenda');
    setDate(d);
  }, []);
  useAgendaTool(navigateAgenda);
  async function load() {
    try {
      const r = await fetch('/api/clinic');
      if (r.status === 401) {
        setData(null);
        return;
      }
      const j = (await r.json()) as Data & { error?: string };
      if (!r.ok) throw Error(j.error);
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function post(body: Record<string, unknown>) {
    const r = await fetch('/api/clinic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = (await r.json()) as { error?: string };
    if (!r.ok) throw Error(j.error || 'No se pudo guardar.');
    return j;
  }
  async function submit(e: React.FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const values = Object.fromEntries(new FormData(e.currentTarget));
      await post({
        action,
        ...values,
        ...(action === 'reschedule' && reschedule
          ? {
              id: reschedule.id,
              previousDate: reschedule.date,
              previousTime: reschedule.time,
            }
          : {}),
      });
      setModal(null);
      setNotice(
        action === 'login' ? 'Sesión iniciada.' : 'Guardado correctamente.',
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  }
  const canWrite = data && ['admin', 'reception'].includes(data.user.role);
  function open(type: 'patient' | 'appointment') {
    setReschedule(null);
    setError('');
    setNotice('');
    setPatientId(data?.patients[0]?.id ?? '');
    setPayerKind('self');
    setModal(type);
  }
  function shift(n: number) {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + n);
    setDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    );
  }
  async function change(a: Appointment, status: string) {
    const reason = window.prompt('Motivo del cambio de estado:');
    if (!reason) return;
    setBusy(true);
    setError('');
    try {
      await post({
        action: 'status',
        id: a.id,
        status,
        previous: a.status,
        reason,
      });
      setNotice('Estado de cita actualizado.');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (!data) return <LoginForm busy={busy} error={error} submit={submit} />;
  const selectedLinks = data.links
    .filter((l) => l.patient_id === patientId)
    .map((l) => l.payer_id);
  const selectedPayers = data.payers.filter((p) =>
    selectedLinks.includes(p.id),
  );
  return (
    <div className="app-shell">
      <Sidebar
        user={data.user}
        tab={tab}
        onNavigate={(next) => {
          setTab(next);
          setSearch('');
        }}
        onLogout={async () => {
          try {
            await post({ action: 'logout' });
            setData(null);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
      <div className="main-area">
        <Topbar tab={tab} />
        <main className="content">
          <PageHeading tab={tab} canWrite={!!canWrite} open={open} />
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="success" role="status">
              <Check size={16} />
              {notice}
              <button aria-label="Cerrar aviso" onClick={() => setNotice('')}>
                <X size={15} />
              </button>
            </div>
          )}
          {tab === 'agenda' && (
            <AgendaView
              data={data}
              date={date}
              search={search}
              filter={filter}
              professional={professional}
              busy={busy}
              canWrite={!!canWrite}
              setDate={setDate}
              setSearch={setSearch}
              setFilter={setFilter}
              setProfessional={setProfessional}
              shift={shift}
              load={load}
              change={change}
              open={open}
              onReschedule={(a) => {
                setReschedule(a);
                setPatientId(a.patient_id);
                setError('');
                setModal('appointment');
              }}
            />
          )}
          {tab === 'patients' && (
            <PatientList data={data} search={search} setSearch={setSearch} />
          )}
          {['clinical', 'quotes', 'sales'].includes(tab) && (
            <Workflow
              tab={tab}
              data={data}
              post={post}
              reload={load}
              report={(s) =>
                s.startsWith('Error:') ? setError(s.slice(7)) : setNotice(s)
              }
            />
          )}
          {tab === 'audit' && <AuditLog events={data.audit} />}
        </main>
        <footer>
          Clínica Surgival <span>MVP local · Venezuela · USD / Bs</span>
        </footer>
      </div>
      {modal && (
        <div
          className="modal-backdrop"
          onClick={(e) =>
            e.target === e.currentTarget && !busy && setModal(null)
          }
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-head">
              <div>
                <span className="eyebrow">
                  {modal === 'patient' ? 'FICHA DE PACIENTE' : 'AGENDA'}
                </span>
                <h2 id="modal-title">
                  {modal === 'patient'
                    ? 'Registrar paciente'
                    : reschedule
                      ? 'Reprogramar cita'
                      : 'Programar una cita'}
                </h2>
              </div>
              <button
                aria-label="Cerrar formulario"
                disabled={busy}
                onClick={() => setModal(null)}
              >
                <X />
              </button>
            </div>
            <form
              onSubmit={(e) => submit(e, reschedule ? 'reschedule' : modal)}
            >
              {modal === 'patient' ? (
                <PatientForm
                  payerKind={payerKind}
                  setPayerKind={setPayerKind}
                />
              ) : (
                <AppointmentForm
                  data={data}
                  patientId={patientId}
                  setPatientId={setPatientId}
                  selectedPayers={selectedPayers}
                  reschedule={reschedule}
                  date={date}
                />
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="modal-actions">
                <Button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={() => setModal(null)}
                >
                  Cancelar
                </Button>
                <Button className="primary" type="submit" disabled={busy}>
                  {busy ? 'Guardando…' : 'Guardar'}
                  <Check size={17} />
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
