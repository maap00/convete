import type {WeddingInvitation,Photo,SectionId} from '../invitations/types';
import type {WeddingInvitationRequest,RequestedVenue} from '../invitation-requests/types';
import {validateInvitation} from '../invitations/validation.ts';
import {normalizeWhatsAppPhone} from '../rsvp/whatsapp.ts';
import {validateSlug} from './slug.ts';
import {defaultClosing} from '../invitation-requests/config.ts';
import {parseRequest} from './input.ts';
export type ResolvedPhotos=Record<string,Photo>;
/** Pure adapter: no filesystem, clock, UUID generation or mutation. */
export function requestToInvitation(input:WeddingInvitationRequest,slug:string,photos:ResolvedPhotos):WeddingInvitation {
 const r=parseRequest(input);validateSlug(slug);
 const find=(destination:string)=>r.resources.filter(v=>v.destination===destination).map(v=>{
  const photo=photos[v.id];if(!photo)throw new Error(`resources.${v.id}: fotografía sin resolver.`);
  return {...photo};
 });
 const instant=(value:string)=>value.replace('.000','');
 const venue=(v:RequestedVenue,destination:string)=>({...v.location,startsAt:instant(v.startsAt),...(find(destination)[0]?{photo:find(destination)[0]}:{})});
 const couple=structuredClone(r.couple),names=`${couple.first} y ${couple.second}`,main=find('main')[0];
 const result:WeddingInvitation={
  id:`generated-${slug}`,slug,couple,event:{startsAt:instant(r.venues.ceremony.startsAt),timeZone:r.event.timeZone},
  messages:{title:r.content.cover,romantic:r.content.cover,welcome:r.content.welcome??r.content.cover,closing:r.content.closing.trim()||defaultClosing,...(r.content.story?{story:r.content.story}:{})},
  ...(r.content.specialInstructions?{guestInstructions:r.content.specialInstructions}:{}),
  ceremony:venue(r.venues.ceremony,'ceremony'),reception:venue(r.venues.reception,'reception'),storyPhoto:main,photos:find('gallery'),
  itinerary:r.celebration.itinerary.map(item=>({...item,startsAt:instant(item.startsAt)})),
  dressCode:{title:'Código de vestimenta',description:r.celebration.dressCode??'Sección desactivada.',...(r.celebration.colors?{suggestedColors:r.celebration.colors}:{})},
  gifts:{message:r.celebration.giftsMessage??'Sección desactivada.',...(r.celebration.giftsUrl?{url:r.celebration.giftsUrl}:{})},
  rsvp:r.rsvp.enabled?{...r.rsvp,deadline:instant(r.rsvp.deadline),phone:normalizeWhatsAppPhone(r.rsvp.phone)!,message:'Confirma tu asistencia por WhatsApp.'}:{enabled:false,message:'Confirmación desactivada.'},
  theme:r.preferences.theme,personalization:{palette:r.preferences.palette},
  sections:(Object.entries(r.preferences.sections) as [SectionId,boolean][]).map(([id,enabled])=>({id,enabled})),
  seo:{title:`${names} · Nuestra boda`,description:`Invitación de boda de ${names}. ${r.event.date}.`,noIndex:true,image:main.src}
 };
 validateInvitation(result);return result;
}
