'use client';
export function QuoteForm() {
  return (
    <>
      <label>
        Servicio
        <input
          name="description"
          required
          maxLength={160}
          placeholder="Consulta general de demostración"
        />
      </label>
      <label>
        Precio total en USD
        <input name="total" type="number" required min="0.01" step="0.01" />
      </label>
      <p className="form-hint">
        Esta primera versión registra un concepto por presupuesto y no calcula
        impuestos. No es un documento fiscal.
      </p>
    </>
  );
}
