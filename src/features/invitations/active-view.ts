import {effectiveRsvp} from './demo.ts';
import type {WeddingInvitation} from './types';
import {getVenueVisibility} from './sections.ts';
/** Validation view only: never mutates the stored configuration or the rendered design. */
export function activeInvitation(value:WeddingInvitation):WeddingInvitation {
 for(const key of ['couple','event','messages','ceremony','reception','dressCode','gifts','rsvp','seo'] as const){if(!value?.[key]||typeof value[key]!=='object'||Array.isArray(value[key]))throw new Error(`configuration.${key}: objeto obligatorio.`);}
 for(const key of ['sections','photos','itinerary'] as const)if(!Array.isArray(value[key]))throw new Error(`configuration.${key}: lista obligatoria.`);
 const d=structuredClone(value),enabled=(id:string)=>d.sections.some(s=>s.id===id&&s.enabled===true);
 if(!enabled('welcome')){d.storyPhoto=undefined;d.messages={title:d.messages.title,welcome:d.messages.title,closing:d.messages.closing,...(d.messages.romantic!==undefined?{romantic:d.messages.romantic}:{}),...(d.messages.thankYou!==undefined?{thankYou:d.messages.thankYou}:{})};}
 if(!enabled('gallery'))d.photos=[];
 if(!enabled('itinerary'))d.itinerary=[];
 if(!enabled('dressCode'))d.dressCode={title:'Sección desactivada',description:'Sección desactivada'};
 if(!enabled('gifts'))d.gifts={message:'Sección desactivada'};
 if(!enabled('rsvp'))d.rsvp={enabled:false,message:'Confirmación desactivada'};
 else if(d.rsvp.enabled===false)d.rsvp={...d.rsvp,phone:undefined,deadline:undefined,maxCompanions:undefined,message:d.rsvp.message===''||d.rsvp.message===undefined?'Confirmación desactivada':d.rsvp.message};
 d.rsvp=effectiveRsvp(d);
 const visibility=getVenueVisibility(d);
 for(const kind of ['ceremony','reception'] as const)if(!visibility[kind])d[kind]={name:'Sección desactivada',startsAt:d.event.startsAt};
 return d;
}
