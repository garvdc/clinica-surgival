'use client';
export function EncounterForm() {
  return (
    <>
      <label>
        Nota clínica
        <textarea
          name="notes"
          rows={7}
          required
          maxLength={8000}
          placeholder="Motivo de consulta, antecedentes relevantes, hallazgos e indicaciones. Solo datos ficticios."
        />
      </label>
      <p className="form-hint">
        Se guarda como borrador. Para modificar un borrador, selecciona la misma
        cita; para una nota cerrada utiliza una corrección.
      </p>
    </>
  );
}
