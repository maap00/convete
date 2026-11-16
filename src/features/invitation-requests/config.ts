import type {RequestDraft,VenueDraft} from './types';
export const defaultClosing = 'Gracias por acompañarnos en este nuevo comienzo.';
export const steps = ['La pareja','Los lugares','Textos y fotos','La celebración','Estilo y RSVP','Revisión y entrega'] as const;
export const sectionLabels = {countdown:'Cuenta regresiva',welcome:'Historia y bienvenida',venues:'Ceremonia y recepción',gallery:'Galería',itinerary:'Itinerario',dressCode:'Vestimenta',gifts:'Regalos',rsvp:'Confirmación RSVP'} as const;
export const themeOptions = [{id:'botanical',label:'Jardín Eterno'}] as const;
export const paletteOptions = [{id:'olive',label:'Oliva natural'},{id:'rose',label:'Rosa antiguo'}] as const;
const venue=():VenueDraft=>({name:'',address:'',city:'',country:'',localDateTime:'',googleMapsUrl:'',latitude:'',longitude:'',directions:''});
export function createRequestDraft():RequestDraft{return {
 couple:{first:'',second:''},event:{date:'',timeZone:''},contact:{email:'',whatsapp:''},
 venues:{sameLocation:false,ceremony:venue(),reception:venue()},
 content:{cover:'',welcome:'',story:'',closing:'',specialInstructions:''},resources:[],
 celebration:{dressCode:'',colors:'',giftsMessage:'',giftsUrl:'',itinerary:[]},
 preferences:{theme:'botanical',palette:'olive',sections:{countdown:true,welcome:true,venues:true,gallery:true,itinerary:false,dressCode:true,gifts:false,rsvp:false}},
 rsvp:{enabled:false,phone:'',maxCompanions:'2',deadlineLocal:''}
};}
