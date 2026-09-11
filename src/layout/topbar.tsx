'use client';
export function Topbar({ tab }: { tab: string }) {
  return (
    <header className="topbar">
      <span>
        Espacio de trabajo <span className="slash">/</span>{' '}
        <b>
          {
            (
              {
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
      <span className="demo-pill">
        <span />
        Datos ficticios · Demo
      </span>
    </header>
  );
}
