import { parseInstant } from './dates.ts';
export function getCountdown(startsAt: string, now: number) {
 if (!Number.isFinite(now)) throw new Error('countdown.now: usar instante finito');
 const total = Math.max(0, Math.floor((parseInstant(startsAt).getTime() - now) / 1000));
 return { days: Math.floor(total / 86400), hours: Math.floor(total / 3600) % 24, minutes: Math.floor(total / 60) % 60, seconds: total % 60, expired: total === 0 };
}
