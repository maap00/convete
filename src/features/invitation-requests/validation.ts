import {normalizeWhatsAppPhone,isCompanionLimitValid} from '../rsvp/whatsapp.ts';
import {isGoogleMapsUrl,isValidCoordinates} from '../locations/navigation.ts';
import {isHttpsUrl} from '../../lib/urls.ts';
import {resolveTheme} from '../../themes/registry.ts';
import {sectionLabels} from './config.ts';
import {isCalendarDate,isTimeZone,localDateTimeToISO} from './dates.ts';
import {validateImageFile,MAX_GALLERY_PHOTOS,MAX_TOTAL_BYTES} from './files.ts';
import type {RequestDraft,FieldErrors,VenueDraft} from './types';
export function isContactEmail(value:string):boolean {
 const email=value.trim();return email.length<=254&&/^[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/u.test(email)&&!email.includes('..');
}
export function effectiveReception(draft:RequestDraft):VenueDraft {
 return draft.venues.sameLocation?{...draft.venues.ceremony,localDateTime:draft.venues.reception.localDateTime}:draft.venues.reception;
}
export function validateRequestStep(d:RequestDraft,step:number):FieldErrors {
 const errors:FieldErrors={};
 const text=(key:string,value:string,max:number,required=false)=>{
  if(required&&!value.trim())errors[key]='Completa este campo.';
  else if(Array.from(value.trim()).length>max)errors[key]=`Usa hasta ${max} caracteres.`;
  else if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value))errors[key]='Retira los caracteres de control.';
 };
 const instant=(key:string,value:string)=>{try{return Date.parse(localDateTimeToISO(value,d.event.timeZone));}catch(error){errors[key]=error instanceof Error?error.message:'Fecha y hora inválidas.';return undefined;}};
 if(step===0){
  text('couple.first',d.couple.first,100,true);text('couple.second',d.couple.second,100,true);
  if(!isCalendarDate(d.event.date))errors['event.date']='Indica una fecha válida (año desde 1900).';
  if(!isTimeZone(d.event.timeZone))errors['event.timeZone']='Indica una zona IANA, por ejemplo America/Caracas o Europe/Madrid.';
  if(!isContactEmail(d.contact.email))errors['contact.email']='Indica un correo válido, por ejemplo nombre@dominio.com.';
  if(!normalizeWhatsAppPhone(d.contact.whatsapp))errors['contact.whatsapp']='Indica un número internacional, con código de país (8 a 15 dígitos).';
 }
 if(step===1){
  for(const [kind,v] of [['ceremony',d.venues.ceremony],['reception',effectiveReception(d)]] as const){
   const base=`venues.${kind}`;
   if(kind==='ceremony'||!d.venues.sameLocation){
    for(const field of ['name','address','city','country'] as const)text(`${base}.${field}`,v[field],field==='address'?500:160,true);
    text(`${base}.directions`,v.directions,2000);
    if(v.googleMapsUrl.trim()&&!isGoogleMapsUrl(v.googleMapsUrl.trim()))errors[`${base}.googleMapsUrl`]='Usa un enlace HTTPS oficial de Google Maps con un destino concreto.';
    const lat=v.latitude.trim(),lng=v.longitude.trim();
    if(lat||lng){const number=/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;
     if(!number.test(lat)||!number.test(lng)||!isValidCoordinates({latitude:Number(lat),longitude:Number(lng)}))errors[`${base}.latitude`]='Completa ambas coordenadas decimales: latitud −90 a 90 y longitud −180 a 180.';
    }
   }
   instant(`${base}.localDateTime`,v.localDateTime);
  }
  if(d.venues.ceremony.localDateTime.slice(0,10)!==d.event.date)errors['venues.ceremony.localDateTime']='La ceremonia debe corresponder a la fecha de boda del paso 1.';
  try{if(localDateTimeToISO(effectiveReception(d).localDateTime,d.event.timeZone)<localDateTimeToISO(d.venues.ceremony.localDateTime,d.event.timeZone))errors['venues.reception.localDateTime']='La recepción debe comenzar a la misma hora o después de la ceremonia.';}catch{/* Individual fields explain invalid times. */}
 }
 if(step===2){
  text('content.cover',d.content.cover,500,true);
  if(d.preferences.sections.welcome){text('content.welcome',d.content.welcome,2000,true);text('content.story',d.content.story,6000);}
  text('content.closing',d.content.closing,2000);
  const ids=new Set<string>(),names=new Set<string>();let total=0;
  for(const resource of d.resources){
   const error=validateImageFile({name:resource.filename,type:resource.mimeType,size:resource.size});
   if(error)errors[`resources.${resource.destination}`]=error;
   if(!['main','gallery','ceremony','reception'].includes(resource.destination)||!resource.id||ids.has(resource.id)||names.has(resource.filename))errors.resources='Los identificadores y nombres de archivo deben ser únicos y los destinos conocidos.';
   ids.add(resource.id);names.add(resource.filename);total+=resource.size;
  }
  for(const destination of ['main','gallery','ceremony','reception'] as const){
   const count=d.resources.filter(r=>r.destination===destination).length;
   const max=destination==='gallery'?MAX_GALLERY_PHOTOS:1;
   if(count>max)errors[`resources.${destination}`]=`Selecciona como máximo ${max} fotografías.`;
   if(destination==='main'&&count===0)errors['resources.main']='Selecciona la fotografía principal. Su original deberá entregarse junto con el JSON.';
   if(destination==='gallery'&&d.preferences.sections.gallery&&count===0)errors['resources.gallery']='Selecciona al menos una foto o desactiva la galería.';
  }
  if(total>MAX_TOTAL_BYTES)errors.resources='Las fotografías no pueden superar 80 MiB en total.';
 }
 if(step===3){
  if(d.preferences.sections.dressCode){text('celebration.dressCode',d.celebration.dressCode,500,true);text('celebration.colors',d.celebration.colors,300);}
  if(d.preferences.sections.gifts){text('celebration.giftsMessage',d.celebration.giftsMessage,2000,true);
  if(d.celebration.giftsUrl.trim()&&!isHttpsUrl(d.celebration.giftsUrl.trim()))errors['celebration.giftsUrl']='Usa una URL HTTPS sin credenciales, espacios ni puerto personalizado.';}
  text('content.specialInstructions',d.content.specialInstructions,3000);
  if(d.preferences.sections.itinerary){
  if(d.celebration.itinerary.length>20)errors['celebration.itinerary']='Usa hasta 20 actividades.';
  if(d.preferences.sections.itinerary&&!d.celebration.itinerary.length)errors['celebration.itinerary']='Añade una actividad o desactiva el itinerario.';
  let previous=-Infinity;const ids=new Set<string>();
  for(const item of d.celebration.itinerary){
   const base=`itinerary.${item.id}`;text(`${base}.title`,item.title,160,true);text(`${base}.description`,item.description,500);
   const time=instant(`${base}.localDateTime`,item.localDateTime);
   if(time!==undefined&&time<previous)errors[`${base}.localDateTime`]='Ordena las actividades cronológicamente, incluida la fecha después de medianoche.';
   if(time!==undefined)previous=time;
   if(!item.id||ids.has(item.id))errors['celebration.itinerary']='Cada actividad necesita un identificador único.';ids.add(item.id);
  }
 }
 }
 if(step===4){
  try{resolveTheme(d.preferences.theme,{palette:d.preferences.palette});}catch{errors['preferences.theme']='Selecciona un tema y una paleta disponibles.';}
  for(const key of Object.keys(sectionLabels) as (keyof typeof sectionLabels)[])if(typeof d.preferences.sections[key]!=='boolean')errors['preferences.sections']='Revisa las secciones activadas.';
  if(typeof d.rsvp.enabled!=='boolean'||d.preferences.sections.rsvp!==d.rsvp.enabled)errors['rsvp.enabled']='La sección RSVP debe coincidir con la confirmación habilitada.';
  if(d.rsvp.enabled){
   if(!normalizeWhatsAppPhone(d.rsvp.phone))errors['rsvp.phone']='Indica el receptor internacional de RSVP; puede ser distinto del contacto comercial.';
   if(!/^\d+$/.test(d.rsvp.maxCompanions)||!isCompanionLimitValid(Number(d.rsvp.maxCompanions)))errors['rsvp.maxCompanions']='Usa un entero entre 0 y 20.';
   const deadline=instant('rsvp.deadlineLocal',d.rsvp.deadlineLocal);
   try{if(deadline!==undefined&&deadline>Date.parse(localDateTimeToISO(d.venues.ceremony.localDateTime,d.event.timeZone)))errors['rsvp.deadlineLocal']='La fecha límite no puede ser posterior a la ceremonia.';}catch{/* Venues step reports it. */}
  }
 }
 return errors;
}
export function validateRequest(draft:RequestDraft):FieldErrors{return Object.assign({},...[0,1,2,3,4].map(step=>validateRequestStep(draft,step)));}
export function stepForField(key:string):number{
 if(/^(couple|event|contact)\./.test(key))return 0;
 if(key.startsWith('venues.'))return 1;
 if(key.startsWith('content.')&&key!=='content.specialInstructions'||key.startsWith('resources'))return 2;
 if(/^(celebration|itinerary)\./.test(key)||key==='content.specialInstructions')return 3;
 return 4;
}
