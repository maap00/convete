import {activeInvitation} from './active-view.ts';
import { isHttpsUrl } from "../../lib/urls.ts";
import { isValidCoordinates, isGoogleMapsUrl, isWazeUrl } from "../locations/navigation.ts";
import { normalizeWhatsAppPhone, DEFAULT_MAX_COMPANIONS, isCompanionLimitValid, defaultRSVPMessages } from "../rsvp/whatsapp.ts";
import { parseInstant } from '../../lib/dates.ts';
import { resolveTheme } from '../../themes/registry.ts';
import type { WeddingInvitation, SectionId, Photo } from './types';
const sectionIds: readonly SectionId[] = ['countdown','welcome','venues','gallery','itinerary','dressCode','gifts','rsvp'];
export function isInvitationSlug(slug: string): boolean { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug); }
export const isSafeUrl = isHttpsUrl;
export function isLocalAsset(value: string, slug: string, shared = false): boolean {
 return (value.startsWith(`/invitations/${slug}/`) || (shared && value.startsWith('/themes/'))) && /^\/[a-zA-Z0-9/_-]+\.(?:webp|avif|jpe?g|png|svg)$/.test(value);
}
export function getInvitationPhotos(value: WeddingInvitation): readonly Photo[] {
 return [...value.photos,value.storyPhoto,value.ceremony.photo,value.reception.photo].filter((photo): photo is Photo => Boolean(photo));
}
export function validateInvitation(invitation: WeddingInvitation,options:{activeOnly?:boolean}={}): void {
 if(options.activeOnly)invitation=activeInvitation(invitation);
 const fail = (field: string, message: string): never => { throw new Error(`[${invitation.slug || 'sin-slug'}] ${field}: ${message}`); };
 const text = (field: string, value: string) => { if (typeof value !== 'string' || !value.trim()) fail(field,'campo obligatorio'); };
 const instant = (field: string, value: string) => { try { return parseInstant(value); } catch { return fail(field,'usar fecha ISO válida con segundos y offset explícito'); } };
 const url = (field: string, value?: string) => { if (value !== undefined && !isSafeUrl(value)) fail(field,'usar HTTPS sin credenciales ni espacios'); };
 text('id',invitation.id);
 if (!isInvitationSlug(invitation.slug)) fail('slug','usar minúsculas, números y guiones simples');
 text('couple.first',invitation.couple.first); text('couple.second',invitation.couple.second);
 for (const key of ['title','welcome','closing'] as const) text(`messages.${key}`,invitation.messages[key]);
 try { new Intl.DateTimeFormat('es',{ timeZone: invitation.event.timeZone }); } catch { fail('event.timeZone','zona IANA desconocida'); }
 text('event.timeZone',invitation.event.timeZone);
 for (const key of ['romantic','story','thankYou'] as const) if (invitation.messages[key] !== undefined) text(`messages.${key}`,invitation.messages[key]);
 const start = instant('event.startsAt',invitation.event.startsAt);
 if (invitation.rsvp.deadline !== undefined && instant('rsvp.deadline',invitation.rsvp.deadline) > start) fail('rsvp.deadline','no puede ser posterior al evento');
 text('rsvp.message',invitation.rsvp.message);
 if (typeof invitation.rsvp.enabled !== 'boolean') fail('rsvp.enabled','usar booleano');
 const companions = invitation.rsvp.maxCompanions ?? DEFAULT_MAX_COMPANIONS;
 if (!isCompanionLimitValid(companions)) fail('rsvp.maxCompanions','usar entero entre 0 y 20');
 if (invitation.rsvp.phone !== undefined && !normalizeWhatsAppPhone(invitation.rsvp.phone)) fail('rsvp.phone','usar número internacional válido con código de país');
 for (const key of ['intro','buttonText','eventLabel'] as const) if (invitation.rsvp[key] !== undefined) text(`rsvp.${key}`,invitation.rsvp[key]);
 for (const [key,value] of Object.entries(invitation.rsvp.texts ?? {})) {
  if (!Object.hasOwn(defaultRSVPMessages,key)) fail(`rsvp.texts.${key}`,'texto desconocido');
  text(`rsvp.texts.${key}`,value);
 }
 for (const [key,venue] of [['ceremony',invitation.ceremony],['reception',invitation.reception]] as const) {
  text(`${key}.name`,venue.name); instant(`${key}.startsAt`,venue.startsAt);
  for (const field of ['address','city','country','directions'] as const) if (venue[field] !== undefined) text(`${key}.${field}`,venue[field]);
  if (venue.coordinates !== undefined && !isValidCoordinates(venue.coordinates)) fail(`${key}.coordinates`,'latitud entre -90 y 90, longitud entre -180 y 180; números finitos');
  if (venue.navigationEnabled !== undefined && typeof venue.navigationEnabled !== 'boolean') fail(`${key}.navigationEnabled`,'usar booleano');
  for (const field of ['googleMapsUrl','mapUrl'] as const) if (venue[field] !== undefined && !isGoogleMapsUrl(venue[field])) fail(`${key}.${field}`,'usar URL HTTPS oficial de Google Maps con destino');
  if (venue.googleMapsUrl && venue.mapUrl && venue.googleMapsUrl !== venue.mapUrl) fail(`${key}.mapUrl`,'no definir dos URLs de Google Maps distintas');
  if (venue.wazeUrl !== undefined && !isWazeUrl(venue.wazeUrl)) fail(`${key}.wazeUrl`,'usar URL HTTPS oficial de Waze con destino');
 }
 const ids = new Set<string>();
 for (const section of invitation.sections) {
  if (!sectionIds.includes(section.id) || ids.has(section.id)) fail('sections',`sección desconocida o duplicada: ${section.id}`);
  if (typeof section.enabled !== 'boolean') fail(`sections.${section.id}.enabled`,'usar booleano');
  for (const key of ['ceremony','reception'] as const) if (section[key] !== undefined && (section.id !== 'venues' || typeof section[key] !== 'boolean')) fail(`sections.${section.id}.${key}`,'solo válido como booleano en venues');
  ids.add(section.id);
 }
 let previous = -Infinity; const itineraryIds = new Set<string>();
 for (const item of invitation.itinerary) {
  text('itinerary.id',item.id); text(`itinerary.${item.id}.title`,item.title);
  const time = instant(`itinerary.${item.id}.startsAt`,item.startsAt).getTime();
  if (time < previous || itineraryIds.has(item.id)) fail('itinerary','actividades duplicadas o fuera de orden');
  if (item.icon && !['rings','camera','dinner','music','cake'].includes(item.icon)) fail(`itinerary.${item.id}.icon`,'icono desconocido');
  previous = time; itineraryIds.add(item.id);
 }
 for (const photo of getInvitationPhotos(invitation)) {
  if (!isLocalAsset(photo.src,invitation.slug) || !Number.isInteger(photo.width) || !Number.isInteger(photo.height) || photo.width <= 0 || photo.height <= 0) fail('photos',`ruta o dimensiones inválidas: ${photo.src}`);
  text(`photos.${photo.src}.alt`,photo.alt);
 }
 if (new Set(invitation.photos.map(photo=>photo.src)).size !== invitation.photos.length) fail('photos','rutas de galería duplicadas');
 if(invitation.guestInstructions!==undefined)text('guestInstructions',invitation.guestInstructions);
 if(invitation.dressCode.suggestedColors!==undefined)text('dressCode.suggestedColors',invitation.dressCode.suggestedColors);
 text('dressCode.title',invitation.dressCode.title); text('dressCode.description',invitation.dressCode.description);
 for (const color of invitation.dressCode.palette ?? []) { text('dressCode.palette.name',color.name); if (!/^#[\da-f]{6}$/i.test(color.color)) fail('dressCode.palette.color','usar hexadecimal de seis dígitos'); }
 text('gifts.message',invitation.gifts.message); url('gifts.url',invitation.gifts.url);
 if (invitation.gifts.buttonText !== undefined) text('gifts.buttonText',invitation.gifts.buttonText);
 text('seo.title',invitation.seo.title); text('seo.description',invitation.seo.description);
 if (typeof invitation.seo.noIndex !== 'boolean') fail('seo.noIndex','usar booleano');
 if (invitation.seo.image !== undefined && !isLocalAsset(invitation.seo.image,invitation.slug)) fail('seo.image','usar recurso local de la invitación');
 try {
  const theme = resolveTheme(invitation.theme,invitation.personalization);
  for (const [key,path] of Object.entries(theme.assets)) if (path && !isLocalAsset(path,invitation.slug,true)) fail(`personalization.assets.${key}`,'usar recurso local de esta invitación o de themes');
 } catch (error) { fail('theme',error instanceof Error ? error.message : 'configuración inválida'); }
}
export function validateInvitationRegistry(invitations: readonly WeddingInvitation[],options:{activeOnly?:boolean}={}): void {
 const slugs = new Set<string>(); const ids = new Set<string>();
 for (const invitation of invitations) {
  validateInvitation(invitation,options);
  if (slugs.has(invitation.slug) || ids.has(invitation.id)) throw new Error(`[${invitation.slug}] registry: slug o identificador duplicado`);
  slugs.add(invitation.slug); ids.add(invitation.id);
 }
}
