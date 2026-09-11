'use client';
import { useEffect } from 'react';
type Context = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (x: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export function useAgendaTool(navigate: (date: string) => void) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: Context })
      .modelContext;
    if (!context) return;
    const controller = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'show_clinic_agenda',
            description:
              'Mostrar la agenda de una fecha. No crea ni modifica citas.',
            inputSchema: {
              type: 'object',
              properties: {
                date: { type: 'string', description: 'Fecha YYYY-MM-DD' },
              },
              required: ['date'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute: async (input) => {
              const date = (input as { date?: unknown })?.date;
              if (
                typeof date !== 'string' ||
                !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
                !Number.isFinite(Date.parse(date)) ||
                new Date(date).toISOString().slice(0, 10) !== date
              )
                throw Error('Fecha inválida.');
              navigate(date);
              await new Promise((r) =>
                requestAnimationFrame(() => requestAnimationFrame(r)),
              );
              return { shown: true, date };
            },
          },
          { signal: controller.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => controller.abort();
  }, [navigate]);
}
