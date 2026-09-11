'use client';
import { Activity, LogOut, HeartPulse } from 'lucide-react';
import type { Data } from '@/api/clinic.types';
import { roles } from '@/identity/roles';
import { Tabs } from '@/layout/tabs';
export function Sidebar({
  user,
  tab,
  onNavigate,
  onLogout,
}: {
  user: Data['user'];
  tab: string;
  onNavigate: (tab: string) => void;
  onLogout: () => Promise<void>;
}) {
  const roleNames: Record<string, string> = roles;
  return (
    <aside className="sidebar">
      <a className="brand" href="/">
        <span className="brand-icon">
          <HeartPulse />
        </span>
        <span>
          Clínica
          <br />
          <b>Surgival</b>
        </span>
      </a>
      <div className="workspace">
        SEDE DE DEMOSTRACIÓN
        <span className="live-dot" />
      </div>
      <Tabs role={user.role} tab={tab} onNavigate={onNavigate} />
      <div className="sidebar-bottom">
        <div className="demo-card">
          <Activity size={18} />
          <strong>MVP en construcción</strong>
          <p>
            Recorrido de demostración con consultas y cobros. Solo datos
            ficticios.
          </p>
        </div>
        <div className="account">
          <div className="avatar">{user.name.slice(0, 1)}</div>
          <div>
            <strong>{user.name}</strong>
            <small>{roleNames[user.role]}</small>
          </div>
          <button
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            onClick={onLogout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
