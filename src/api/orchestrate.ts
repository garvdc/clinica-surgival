import { listPayments } from '@/billing/billing.service';
import { listSales } from '@/billing/billing.service';
import { listQuotes } from '@/billing/billing.service';
import { listEncounterVersions } from '@/clinical/encounters.service';
import { listEncounters } from '@/clinical/encounters.service';
import { auditRoute } from '@/audit/api/audit.route';
import { listAppointments } from '@/scheduling/appointments.service';
import { listProfessionals } from '@/scheduling/appointments.service';
import { listPatientPayers } from '@/patients/patients.service';
import { listPayers } from '@/patients/patients.service';
import { listPatients } from '@/patients/patients.service';
import { requireAuth } from '@/identity/auth.middleware';
import { mayRead, mayWrite } from '@/identity/roles';
import { login, logout } from '@/identity/api/auth.route';
import { workflow } from '@/api/workflow';
import { db } from '@/shared/db/connection';
import { json } from '@/shared/api/response';
import { databaseError } from '@/shared/api/errors';
import { createPatient, updatePatient } from '@/patients/api/patients.route';
import { appointmentsRoute } from '@/scheduling/api/appointments.route';
export async function GET(req: Request) {
  try {
    const u = await requireAuth(req);
    if (u instanceof Response) return u;
    if (!mayRead(u.role)) return json({ error: 'No tienes permiso.' }, 403);
    const [patients, payers, links, professionals, appointments, audit] =
      await Promise.all([
        listPatients(db),
        listPayers(db),
        listPatientPayers(db),
        listProfessionals(db),
        listAppointments(db),
        auditRoute(db, u),
      ]);
    const [encounters, versions, quotes, sales, payments] = await Promise.all([
      listEncounters(db, u),
      listEncounterVersions(db, u),
      listQuotes(db, u),
      listSales(db, u),
      listPayments(db, u),
    ]);
    return json({
      encounters: encounters.results,
      versions: versions.results,
      quotes: quotes.results,
      sales: sales.results,
      payments: payments.results,
      user: u,
      patients: patients.results,
      payers: payers.results,
      links: links.results,
      professionals: professionals.results,
      appointments: appointments.results,
      audit: audit.results,
    });
  } catch (error) {
    console.error(
      'clinic-read',
      error instanceof Error ? error.message : 'error',
    );
    return json(
      {
        error:
          'No se pudo cargar la información. Verifica la base de datos local.',
      },
      503,
    );
  }
}
export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin || origin !== new URL(req.url).origin)
    return json({ error: 'Origen no permitido.' }, 403);
  if (!req.headers.get('content-type')?.startsWith('application/json'))
    return json({ error: 'Formato no permitido.' }, 415);
  let x: Record<string, unknown>;
  try {
    const body = await req.text();
    if (body.length > 16000)
      return json({ error: 'Solicitud demasiado grande.' }, 413);
    x = JSON.parse(body);
    if (!x || typeof x !== 'object' || Array.isArray(x)) throw Error();
  } catch {
    return json({ error: 'Solicitud inválida.' }, 400);
  }
  try {
    if (x.action === 'login') return await login(db, req, x);
    const u = await requireAuth(req);
    if (u instanceof Response) return u;
    if (x.action === 'logout') return await logout(db, req);
    const workflowResult = await workflow(db(), u, x);
    if (workflowResult) return workflowResult;
    if (!mayWrite(u.role))
      return json(
        { error: 'Tu rol tiene acceso de consulta a esta entrega.' },
        403,
      );
    if (x.action === 'patient') return await createPatient(db, u, x);
    if (x.action === 'patient_update') return await updatePatient(db, u, x);
    const appointmentResult = await appointmentsRoute(db, u, x);
    if (appointmentResult) return appointmentResult;
    return json({ error: 'Acción desconocida.' }, 400);
  } catch (error) {
    return databaseError(error);
  }
}
