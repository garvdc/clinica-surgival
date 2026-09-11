export function required(value: unknown, label: string, max = 160): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    throw new Error(
      `${label}: completa un valor válido (máximo ${max} caracteres).`,
    );
  return value.trim();
}
export function dateValue(value: unknown, label: string) {
  const s = required(value, label, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(s) ||
    !Number.isFinite(Date.parse(s)) ||
    new Date(s).toISOString().slice(0, 10) !== s
  )
    throw new Error(`${label}: fecha inválida.`);
  return s;
}
export function appointmentInput(x: Record<string, unknown>) {
  const date = dateValue(x.date, 'Fecha'),
    time = required(x.time, 'Hora', 5);
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))
    throw new Error('Hora inválida.');
  const duration = Number(x.duration);
  if (
    !Number.isInteger(duration) ||
    duration < 15 ||
    duration > 180 ||
    duration % 15 !== 0
  )
    throw new Error(
      'La duración debe ser de 15 a 180 minutos, en intervalos de 15.',
    );
  const start = Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  if (start + duration > 1440)
    throw new Error('La cita debe terminar en el mismo día.');
  return {
    date,
    time,
    duration,
    patientId: required(x.patientId, 'Paciente'),
    payerId: required(x.payerId, 'Pagador'),
    professionalId: required(x.professionalId, 'Profesional'),
    reason: required(x.reason, 'Servicio o motivo', 120),
  };
}
