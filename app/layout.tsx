import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Clínica Surgival · MVP',
  description: 'Pacientes y agenda de la clínica',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
