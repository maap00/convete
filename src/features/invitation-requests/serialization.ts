import {normalizeWhatsAppPhone} from '../rsvp/whatsapp.ts';
import {defaultClosing,sectionLabels} from './config.ts';
import {effectiveReception,validateRequest} from './validation.ts';
import {localDateTimeToISO} from './dates.ts';
import type {RequestDraft,WeddingInvitationRequest,VenueDraft} from './types';
const clean=(value:string)=>value.trim().replace(/\r\n?/g,'\n');
const optional=(value:string)=>clean(value)||undefined;
/** Pure, explicit whitelist: no spread of UI objects or File instances into the document. */
export function serializeRequest(d:RequestDraft,identity:{id:string;createdAt:string}):WeddingInvitationRequest {
 const errors=validateRequest(d);if(Object.keys(errors).length)throw new Error('La solicitud contiene campos pendientes de corregir.');
 if(!/^[a-zA-Z0-9-]{8,80}$/.test(identity.id)||!Number.isFinite(Date.parse(identity.createdAt)))throw new Error('Identificador o fecha de exportación inválidos.');
 const venue=(v:VenueDraft)=>({location:{name:clean(v.name),address:clean(v.address),city:clean(v.city),country:clean(v.country),...(optional(v.googleMapsUrl)?{googleMapsUrl:clean(v.googleMapsUrl)}:{}),...(v.latitude.trim()?{coordinates:{latitude:Number(v.latitude),longitude:Number(v.longitude)}}:{}),...(optional(v.directions)?{directions:clean(v.directions)}:{})},startsAt:localDateTimeToISO(v.localDateTime,d.event.timeZone)});
 const resources=d.resources.filter(r=>r.destination!=='gallery'||d.preferences.sections.gallery).map(r=>({id:r.id,filename:r.filename,mimeType:r.mimeType,size:r.size,destination:r.destination}));
 return {schemaVersion:1,id:identity.id,createdAt:new Date(identity.createdAt).toISOString(),
 commercial:{contact:{email:clean(d.contact.email),whatsapp:normalizeWhatsAppPhone(d.contact.whatsapp)!}},
 couple:{first:clean(d.couple.first),second:clean(d.couple.second)},event:{date:d.event.date,timeZone:clean(d.event.timeZone)},
 venues:{sameLocation:d.venues.sameLocation,ceremony:venue(d.venues.ceremony),reception:venue(effectiveReception(d))},
 content:{cover:clean(d.content.cover),...(d.preferences.sections.welcome?{welcome:clean(d.content.welcome),...(optional(d.content.story)?{story:clean(d.content.story)}:{})}:{}),closing:optional(d.content.closing)??defaultClosing,...(optional(d.content.specialInstructions)?{specialInstructions:clean(d.content.specialInstructions)}:{})},
 resources,celebration:{...(d.preferences.sections.dressCode?{dressCode:clean(d.celebration.dressCode),...(optional(d.celebration.colors)?{colors:clean(d.celebration.colors)}:{})}:{}),...(d.preferences.sections.gifts?{giftsMessage:clean(d.celebration.giftsMessage),...(optional(d.celebration.giftsUrl)?{giftsUrl:clean(d.celebration.giftsUrl)}:{})}:{}),itinerary:(d.preferences.sections.itinerary?d.celebration.itinerary:[]).map(i=>({id:i.id,title:clean(i.title),startsAt:localDateTimeToISO(i.localDateTime,d.event.timeZone),...(optional(i.description)?{description:clean(i.description)}:{})}))},
 preferences:{theme:d.preferences.theme,palette:d.preferences.palette,sections:Object.fromEntries(Object.keys(sectionLabels).map(key=>[key,d.preferences.sections[key as keyof typeof sectionLabels]])) as RequestDraft['preferences']['sections']},
 rsvp:d.rsvp.enabled?{enabled:true,phone:normalizeWhatsAppPhone(d.rsvp.phone)!,maxCompanions:Number(d.rsvp.maxCompanions),deadline:localDateTimeToISO(d.rsvp.deadlineLocal,d.event.timeZone)}:{enabled:false},
 completeness:{dataValidated:true,originalFilesDelivery:'pending',requiredResourceIds:resources.filter(r=>r.destination==='main'||r.destination==='gallery').map(r=>r.id),note:'El JSON contiene un manifiesto, no fotografías. Entregar todos los archivos originales indicados junto con este JSON. Descargar no equivale a enviar la solicitud.'}
 };
}
export function requestJSON(request:WeddingInvitationRequest):string{return JSON.stringify(request,null,2)+'\n';}
