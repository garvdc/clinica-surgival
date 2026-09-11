'use client';
import { ShieldCheck, ArrowUpRight, HeartPulse } from 'lucide-react';
import { Button } from '@/shared/ui/button';
export function LoginForm({
  busy,
  error,
  submit,
}: {
  busy: boolean;
  error: string;
  submit: (
    e: React.FormEvent<HTMLFormElement>,
    action: string,
  ) => Promise<void>;
}) {
  return (
    <main className="login">
      <section className="login-story">
        <div className="brand">
          <HeartPulse />
          Clínica Surgival
        </div>
        <div>
          <span className="eyebrow">PRIMERA ENTREGA · MVP</span>
          <h1>
            Un día más claro.
            <br />
            Una atención
            <br />
            más organizada.
          </h1>
          <p>Pacientes, responsables de pago y agenda en un solo espacio.</p>
        </div>
        <small>Entorno de demostración · Solo datos ficticios</small>
      </section>
      <section className="login-form">
        <span className="eyebrow">BIENVENIDO</span>
        <h2>Accede a tu espacio</h2>
        <p className="muted">
          Usa la cuenta individual de demostración creada durante la
          instalación.
        </p>
        <form onSubmit={(e) => submit(e, 'login')}>
          <label>
            Correo
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              placeholder="recepcion@demo.local"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <Button className="primary" type="submit" disabled={busy}>
            {busy ? 'Accediendo…' : 'Iniciar sesión'}
            <ArrowUpRight size={17} />
          </Button>
        </form>
        <div className="note">
          <ShieldCheck size={19} />
          <span>
            Cada cuenta tiene un rol. Las acciones quedan registradas.
          </span>
        </div>
      </section>
    </main>
  );
}
