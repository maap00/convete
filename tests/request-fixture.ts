import {createRequestDraft} from '../src/features/invitation-requests/config.ts';
import type {RequestDraft} from '../src/features/invitation-requests/types';
export function requestFixture():RequestDraft{
 const d=createRequestDraft();
 d.couple={first:' María Luz ',second:'Alex Kim'};
 d.event={date:'2027-04-17',timeZone:'America/Caracas'};
 d.contact={email:' pareja@example.com ',whatsapp:'+58 412 555 0100'};
 d.venues.ceremony={name:'Jardín de prueba',address:'Calle de muestra 12',city:'Caracas',country:'Venezuela',localDateTime:'2027-04-17T16:00',googleMapsUrl:'',latitude:'0',longitude:'0',directions:''};
 d.venues.reception={...d.venues.ceremony,name:'Salón de prueba',localDateTime:'2027-04-17T18:00',latitude:'',longitude:''};
 d.content={cover:' Celebremos juntos ',welcome:'Primera línea\r\nSegunda línea',story:' ',closing:'Gracias por acompañarnos.',specialInstructions:''};
 d.celebration.dressCode='Formal';
 d.resources=[{id:'resource-main',filename:'principal.jpg',mimeType:'image/jpeg',size:1024,destination:'main'},{id:'resource-gallery',filename:'galeria.webp',mimeType:'image/webp',size:2048,destination:'gallery'}];
 return d;
}
