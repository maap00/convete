import { parseInstant } from "../../lib/dates.ts";
/** Future RSVP boundary; no submission, storage or network calls. */
export function isRsvpOpen(deadline: string, now: Date): boolean {
  if (!Number.isFinite(now.getTime())) throw new Error("Fecha de referencia inválida");
  return now.getTime() <= parseInstant(deadline).getTime();
}
