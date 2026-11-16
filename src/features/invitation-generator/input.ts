import {createRequestDraft,sectionLabels} from '../invitation-requests/config.ts';
import {validateRequest} from '../invitation-requests/validation.ts';
import {parseInstant} from '../../lib/dates.ts';
import type {WeddingInvitationRequest,VenueDraft} from '../invitation-requests/types';

function requestInstant(value:string):Date {
 parseInstant(value.replace(/\.\d{3}(?=Z|[+-]\d{2}:\d{2}$)/,''));
 const date=new Date(value);if(!Number.isFinite(date.getTime()))throw new Error('fecha: instante ISO inválido.');return date;
}
type ObjectValue=Record<string,unknown>;
function object(value:unknown,path:string):ObjectValue {if(!value||typeof value!=='object'||Array.isArray(value))throw new Error(`${path}: se requiere un objeto.`);return value as ObjectValue;}
function string(value:unknown,path:string):string {if(typeof value!=='string')throw new Error(`${path}: se requiere texto.`);return value;}
function boolean(value:unknown,path:string):boolean {if(typeof value!=='boolean')throw new Error(`${path}: se requiere booleano.`);return value;}
function number(value:unknown,path:string):number {if(typeof value!=='number'||!Number.isFinite(value))throw new Error(`${path}: se requiere número finito.`);return value;}
function array(value:unknown,path:string):unknown[] {if(!Array.isArray(value)||value.length>100)throw new Error(`${path}: se requiere una lista de hasta 100 elementos.`);return value;}
/** Validate the external JSON's shape before reusing the commercial form's semantic rules. */
export function parseRequest(value:unknown):WeddingInvitationRequest {
 const r=object(value,'solicitud');if(r.schemaVersion!==1)throw new Error('schemaVersion: solo se admite la versión 1.');
 const id=string(r.id,'id');if(!/^[a-zA-Z0-9-]{8,80}$/.test(id))throw new Error('id: identificador inválido.');
 requestInstant(string(r.createdAt,'createdAt'));
 const d=createRequestDraft();
 const couple=object(r.couple,'couple'),event=object(r.event,'event'),commercial=object(r.commercial,'commercial'),contact=object(commercial.contact,'commercial.contact');
 d.couple={first:string(couple.first,'couple.first'),second:string(couple.second,'couple.second')};
 d.event={date:string(event.date,'event.date'),timeZone:string(event.timeZone,'event.timeZone')};
 d.contact={email:string(contact.email,'commercial.contact.email'),whatsapp:string(contact.whatsapp,'commercial.contact.whatsapp')};
 // Instant conversion preserves the input instant, not the machine's local timezone.
 const local=(input:unknown,path:string)=>{
  const instant=requestInstant(string(input,path));
  const parts=Object.fromEntries(new Intl.DateTimeFormat('sv-SE',{timeZone:d.event.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(instant).map(p=>[p.type,p.value]));
  if(parts.second!=='00'||instant.getUTCMilliseconds()!==0)throw new Error(`${path}: el contrato comercial admite precisión de minutos.`);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
 };
 const venues=object(r.venues,'venues');d.venues.sameLocation=boolean(venues.sameLocation,'venues.sameLocation');
 for(const kind of ['ceremony','reception'] as const){
  const path=`venues.${kind}`,v=object(venues[kind],path),location=object(v.location,`${path}.location`);
  const draft=d.venues[kind];
  for(const key of ['name','address','city','country'] as const)draft[key]=string(location[key],`${path}.location.${key}`);
  for(const key of ['googleMapsUrl','directions'] as const)if(location[key]!==undefined)draft[key]=string(location[key],`${path}.location.${key}`);
  if(location.coordinates!==undefined){const c=object(location.coordinates,`${path}.coordinates`);draft.latitude=String(number(c.latitude,`${path}.latitude`));draft.longitude=String(number(c.longitude,`${path}.longitude`));}
  draft.localDateTime=local(v.startsAt,`${path}.startsAt`);
 }
 if(d.venues.sameLocation){
  const locationOnly=(v:VenueDraft)=>{const {localDateTime,...location}=v;void localDateTime;return location;};
  if(JSON.stringify(locationOnly(d.venues.ceremony))!==JSON.stringify(locationOnly(d.venues.reception)))throw new Error('venues.sameLocation: las ubicaciones no coinciden.');
 }
 const content=object(r.content,'content');
 for(const key of ['cover','closing'] as const)d.content[key]=string(content[key],`content.${key}`);
 for(const key of ['welcome','story','specialInstructions'] as const)if(content[key]!==undefined)d.content[key]=string(content[key],`content.${key}`);
 const preferences=object(r.preferences,'preferences'),sections=object(preferences.sections,'preferences.sections');
 // Enum membership is checked by the existing theme resolver below.
 d.preferences.theme=string(preferences.theme,'preferences.theme') as typeof d.preferences.theme;
 d.preferences.palette=string(preferences.palette,'preferences.palette') as typeof d.preferences.palette;
 if(Object.keys(sections).some(key=>!Object.hasOwn(sectionLabels,key)))throw new Error('preferences.sections: sección desconocida.');
 for(const key of Object.keys(sectionLabels) as (keyof typeof sectionLabels)[])d.preferences.sections[key]=boolean(sections[key],`preferences.sections.${key}`);
 const celebration=object(r.celebration,'celebration');
 for(const key of ['dressCode','colors','giftsMessage','giftsUrl'] as const)if(celebration[key]!==undefined)d.celebration[key]=string(celebration[key],`celebration.${key}`);
 d.celebration.itinerary=array(celebration.itinerary,'celebration.itinerary').map((value,index)=>{const p=`celebration.itinerary.${index}`,item=object(value,p);return {id:string(item.id,`${p}.id`),title:string(item.title,`${p}.title`),localDateTime:local(item.startsAt,`${p}.startsAt`),description:item.description===undefined?'':string(item.description,`${p}.description`)};});
 d.resources=array(r.resources,'resources').map((value,index)=>{const p=`resources.${index}`,item=object(value,p);return {id:string(item.id,`${p}.id`),filename:string(item.filename,`${p}.filename`),mimeType:string(item.mimeType,`${p}.mimeType`),size:number(item.size,`${p}.size`),destination:string(item.destination,`${p}.destination`) as typeof d.resources[number]['destination']};});
 const rsvp=object(r.rsvp,'rsvp');d.rsvp.enabled=boolean(rsvp.enabled,'rsvp.enabled');
 if(d.rsvp.enabled){d.rsvp.phone=string(rsvp.phone,'rsvp.phone');d.rsvp.maxCompanions=String(number(rsvp.maxCompanions,'rsvp.maxCompanions'));d.rsvp.deadlineLocal=local(rsvp.deadline,'rsvp.deadline');}
 const complete=object(r.completeness,'completeness');
 if(complete.dataValidated!==true||complete.originalFilesDelivery!=='pending')throw new Error('completeness: se espera el contrato exportado, con originales pendientes.');
 string(complete.note,'completeness.note');const required=array(complete.requiredResourceIds,'completeness.requiredResourceIds').map((v,i)=>string(v,`completeness.requiredResourceIds.${i}`));
 const expected=d.resources.filter(v=>v.destination==='main'||v.destination==='gallery').map(v=>v.id).sort();
 if(JSON.stringify([...required].sort())!==JSON.stringify(expected))throw new Error('completeness.requiredResourceIds: no coincide con el manifiesto.');
 const errors=validateRequest(d);if(Object.keys(errors).length)throw new Error(Object.entries(errors).map(([key,message])=>`${key}: ${message}`).join('\n'));
 // These fields cannot be silently discarded from an inconsistent external document.
 if(!d.preferences.sections.welcome&&(content.welcome!==undefined||content.story!==undefined)||!d.preferences.sections.dressCode&&(celebration.dressCode!==undefined||celebration.colors!==undefined)||!d.preferences.sections.gifts&&(celebration.giftsMessage!==undefined||celebration.giftsUrl!==undefined)||!d.preferences.sections.itinerary&&d.celebration.itinerary.length||!d.preferences.sections.gallery&&d.resources.some(v=>v.destination==='gallery'))throw new Error('sections: contenido presente en una sección desactivada; vuelve a exportar la solicitud.');
 if(!d.rsvp.enabled&&['phone','maxCompanions','deadline'].some(k=>rsvp[k]!==undefined))throw new Error('rsvp: configuración presente con RSVP desactivado.');
 return structuredClone(value) as WeddingInvitationRequest;
}
export function parseRequestJSON(text:string):WeddingInvitationRequest {
 let value:unknown;try{value=JSON.parse(text);}catch{throw new Error('input: JSON inválido.');}return parseRequest(value);
}
