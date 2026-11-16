/** Require an explicit offset: never interpret dates using the server's timezone. */
export function parseInstant(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(value)) throw new Error(`Fecha sin formato ISO con zona: ${value}`);
  const hours = Number(value.slice(11, 13));
  const minutes = Number(value.slice(14, 16));
  const seconds = Number(value.slice(17, 19));
  if (hours > 23 || minutes > 59 || seconds > 59) throw new Error(`Hora inválida: ${value}`);
  const date = new Date(value);
  const calendar = value.slice(0, 10);
  const day = new Date(`${calendar}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== calendar) throw new Error(`Fecha inválida: ${value}`);
  return date;
}
export function formatEventDate(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat("es-VE", { dateStyle: "full", timeZone }).format(parseInstant(value));
}
export function formatEventTime(value: string, timeZone: string, hour12 = true): string {
  return new Intl.DateTimeFormat("es-VE", { timeStyle: "short", timeZone, hour12 }).format(parseInstant(value));
}
