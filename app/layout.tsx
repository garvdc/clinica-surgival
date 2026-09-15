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
    <html lang="es" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.dataset.theme=localStorage.getItem('surgival-theme')==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}",
          }}
        />
        {children}
      </body>
    </html>
  );
}
