'use client';
import {
  CalendarDays,
  Users,
  ShieldCheck,
  FileText,
  Wallet,
  Stethoscope,
} from 'lucide-react';
export function Tabs({
  role,
  tab,
  onNavigate,
}: {
  role: string;
  tab: string;
  onNavigate: (tab: string) => void;
}) {
  return (
    <nav>
      {[
        { key: 'agenda', label: 'Agenda', icon: CalendarDays },
        { key: 'patients', label: 'Pacientes', icon: Users },
        ...(role === 'clinician'
          ? [
              {
                key: 'clinical',
                label: 'Atención clínica',
                icon: Stethoscope,
              },
            ]
          : []),
        ...(['admin', 'cashier'].includes(role)
          ? [
              { key: 'quotes', label: 'Presupuestos', icon: FileText },
              { key: 'sales', label: 'Ventas y pagos', icon: Wallet },
            ]
          : []),
        ...(role === 'admin'
          ? [
              {
                key: 'audit',
                label: 'Registro de actividad',
                icon: ShieldCheck,
              },
            ]
          : []),
      ].map((item) => (
        <button
          key={item.key}
          className={tab === item.key ? 'nav-active' : ''}
          onClick={() => onNavigate(item.key)}
        >
          <item.icon size={19} />
          {item.label}
          {tab === item.key && <span className="nav-dot" />}
        </button>
      ))}
    </nav>
  );
}
