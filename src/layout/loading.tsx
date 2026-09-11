'use client';
import { HeartPulse } from 'lucide-react';
export function Loading() {
  return (
    <main className="loading">
      <HeartPulse size={40} />
      <h1>Clínica Surgival</h1>
      <p>Cargando tu espacio de trabajo…</p>
    </main>
  );
}
