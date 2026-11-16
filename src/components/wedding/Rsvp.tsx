'use client';
import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { RSVPConfig, RSVPFieldErrors, RSVPInput, RSVPAvailability } from '@/features/rsvp/types';
import { DEFAULT_MAX_COMPANIONS, getRSVPAvailability, prepareWhatsAppRSVP, validateRSVPInput } from '@/features/rsvp/whatsapp';
import { Icon } from '@/components/ui/Icon';
const availabilityMessages: Record<Exclude<RSVPAvailability,'ready'>,string> = {
 disabled:'El RSVP está deshabilitado para esta invitación de demostración.',
 'missing-phone':'Invitación de demostración: todavía no hay un número receptor configurado.',
 'invalid-phone':'El número receptor no es válido. La confirmación no está disponible.',
 expired:'La fecha límite de confirmación ha finalizado.',
 'invalid-deadline':'La fecha límite no es válida. La confirmación no está disponible.'
};
export function Rsvp({ rsvp, eventLabel }: { rsvp: RSVPConfig; eventLabel: string }) {
 const id = useId(); const nameRef = useRef<HTMLInputElement>(null); const attendanceRef = useRef<HTMLInputElement>(null); const companionsRef = useRef<HTMLSelectElement>(null);
 const [input,setInput] = useState<RSVPInput>({name:'',attendance:'',companions:0});
 const [errors,setErrors] = useState<RSVPFieldErrors>({});
 const [now,setNow] = useState<Date | null>(null);
 const [attempted,setAttempted] = useState(false);
 useEffect(()=>{
  const update = () => setNow(new Date());
  update();
  if (!rsvp.enabled || !rsvp.deadline) return;
  const timer = window.setInterval(update,1000);
  window.addEventListener('focus',update);
  return ()=>{window.clearInterval(timer);window.removeEventListener('focus',update);};
 },[rsvp.enabled,rsvp.deadline]);
 const availability = now ? getRSVPAvailability(rsvp,now) : null;
 const ready = availability === 'ready';
 const max = rsvp.maxCompanions ?? DEFAULT_MAX_COMPANIONS;
 function updateInput(next: RSVPInput) {
  setInput(next); setAttempted(false);
  if (Object.keys(errors).length) { const result = validateRSVPInput(next,max); setErrors(result.valid ? {} : Object.fromEntries((['name','attendance','companions'] as const).filter(key => errors[key] && result.errors[key]).map(key => [key,result.errors[key]]))); }
 }
 function validateFields() { const result = validateRSVPInput(input,max); setErrors(previous => { const next = {...previous}; if (result.valid || !result.errors.name) delete next.name; else next.name = result.errors.name; return next; }); }
 function onSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const result = prepareWhatsAppRSVP(input,rsvp,{eventLabel},new Date());
  if (result.status === 'invalid') {
   setErrors(result.errors);
   if (result.errors.name) nameRef.current?.focus();
   else if (result.errors.attendance) attendanceRef.current?.focus();
   else companionsRef.current?.focus();
   return;
  }
  setErrors({});
  if (result.status !== 'ready') {setNow(new Date());return;}
  setInput({...input,name:result.data.name,companions:result.data.companions});
  setAttempted(true);
  // Same-tab navigation, synchronous with the user's submit: no popup or auto-send.
  window.location.assign(result.url);
 }
 return <><p className="rsvp-intro">{rsvp.intro ?? <>Nos encantará contar contigo<br/>en este día tan especial.</>}</p>
 <form className="rsvp-form" aria-label="Confirmación de asistencia" aria-describedby={`${id}-notice`} onSubmit={onSubmit} noValidate>
  <label htmlFor={`${id}-name`}>Tu nombre <span aria-hidden="true">*</span></label>
  <input ref={nameRef} id={`${id}-name`} name="guest-name" placeholder="Escribe tu nombre" autoComplete="name" required maxLength={100} value={input.name} onChange={event=>updateInput({...input,name:event.target.value})} onBlur={validateFields} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? `${id}-name-error` : undefined}/>
  {errors.name && <p role="alert" className="rsvp-error" id={`${id}-name-error`}>{errors.name}</p>}
  <fieldset role="radiogroup" aria-invalid={Boolean(errors.attendance)} aria-describedby={errors.attendance ? `${id}-attendance-error` : undefined}>
   <legend>¿Asistirás? <span aria-hidden="true">*</span></legend>
   <label><input ref={attendanceRef} type="radio" name={`${id}-attendance`} value="yes" required checked={input.attendance==='yes'} onChange={()=>updateInput({...input,attendance:'yes'})}/> Sí, asistiré.</label>
   <label><input type="radio" name={`${id}-attendance`} value="no" required checked={input.attendance==='no'} onChange={()=>updateInput({...input,attendance:'no',companions:0})}/> No podré asistir.</label>
  </fieldset>
  {errors.attendance && <p role="alert" className="rsvp-error" id={`${id}-attendance-error`}>{errors.attendance}</p>}
  {input.attendance==='yes' && <><label htmlFor={`${id}-companions`}>¿Cuántos acompañantes?</label><select ref={companionsRef} id={`${id}-companions`} name="companions" value={input.companions} onChange={event=>updateInput({...input,companions:Number(event.target.value)})} aria-invalid={Boolean(errors.companions)} aria-describedby={`${id}-companions-help${errors.companions ? ` ${id}-companions-error` : ''}`}>
   {Array.from({length:max+1},(_,i)=><option key={i} value={i}>{i === 0 ? '0 acompañantes' : `${i} ${i===1 ? 'acompañante' : 'acompañantes'}`}</option>)}
  </select><p className="demo-note" id={`${id}-companions-help`}>Los acompañantes no incluyen al invitado principal.</p>{errors.companions && <p role="alert" className="rsvp-error" id={`${id}-companions-error`}>{errors.companions}</p>}</>}
  <button className="action-link action-link--primary" type="submit" disabled={!ready}><Icon name="whatsapp"/>{rsvp.buttonText ?? 'Confirmar por WhatsApp'}</button>
  <div id={`${id}-notice`} className="demo-note" role="status" aria-live="polite">
   {availability === null ? <p>Comprobando disponibilidad de confirmación…</p> : availability !== 'ready' ? <p>{availabilityMessages[availability]} {rsvp.message}</p> : <p>{attempted ? 'Se intentó abrir WhatsApp con tu respuesta preparada. ' : ''}Se abrirá WhatsApp con tu respuesta preparada. Para completar la confirmación, envía el mensaje. La invitación no verifica el envío ni guarda tus respuestas.</p>}
  </div>
 </form></>;
}
