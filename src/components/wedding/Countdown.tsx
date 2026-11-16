'use client';
import { useEffect, useState } from 'react';
import { getCountdown } from '@/lib/countdown';
export function Countdown({ startsAt }: { startsAt: string }) {
 const [remaining, setRemaining] = useState<ReturnType<typeof getCountdown> | null>(null);
 useEffect(() => {
  const update = () => { const value = getCountdown(startsAt, Date.now()); setRemaining(value); if (value.expired) window.clearInterval(timer); };
  const timer = window.setInterval(update, 1000); update(); return () => window.clearInterval(timer);
 }, [startsAt]);
 return <><div className="countdown" role="timer" aria-label="Tiempo restante para la boda">{([['days','Días'],['hours','Horas'],['minutes','Min'],['seconds','Seg']] as const).map(([key,label]) => <div className="countdown-card" key={key}><span>{remaining ? String(remaining[key]).padStart(2,'0') : '—'}</span><small>{label}</small></div>)}</div>{remaining?.expired && <p className="countdown-ended" role="status">¡Llegó el gran día!</p>}</>;
}
