'use client';
import { ThemeToggle } from '@/layout/theme-toggle';
export function Topbar({ tab }: { tab: string }) {
  return (
    <header className="topbar">
      <span>
        Espacio de trabajo <span className="slash">/</span>{' '}
        <b>
          {
            (
              {
                users: 'Configuración / Usuarios',
                agenda: 'Agenda',
                patients: 'Pacientes',
                audit: 'Actividad',
                clinical: 'Atención clínica',
                quotes: 'Presupuestos',
                sales: 'Ventas y pagos',
              } as Record<string, string>
            )[tab]
          }
        </b>
      </span>
      <div className="topbar-actions">
        <span className="demo-pill">
          <span />
          Datos ficticios · Demo
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
