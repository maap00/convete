import { parseWebUrl } from '../../lib/urls.ts';
import type { Coordinates, EventLocation } from './types';
export function isValidCoordinates(value: Coordinates): boolean {
 return Boolean(value) && Number.isFinite(value.latitude) && Number.isFinite(value.longitude) && Math.abs(value.latitude)<=90 && Math.abs(value.longitude)<=180;
}
const placeholder = /fictici|demostraci|\bdemo\b|\bejemplo\b|por\s+confirmar|sin\s+direcci[oó]n/iu;
function specificStreet(value: string): boolean {
 return value.trim().length>=8 && /\p{L}/u.test(value) && /\d/.test(value) && !placeholder.test(value);
}
export function hasSpecificAddress(location: EventLocation): boolean {
 return Boolean(location.address && specificStreet(location.address) && location.city && location.city.trim().length>=2 && location.country && location.country.trim().length>=2 && !placeholder.test(`${location.city} ${location.country}`));
}
function coordinateText(value: string): boolean {
 if (!/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(value)) return false;
 const [latitude,longitude]=value.split(',').map(Number);
 return isValidCoordinates({latitude,longitude});
}
function safeNavigationParameters(url: URL): boolean {
 const keys=[...url.searchParams.keys()];
 if (new Set(keys).size!==keys.length) return false;
 for (const [key,value] of url.searchParams) {
  if (/^(?:url|redirect|redirect_uri|redirect_url|continue|link|next|callback)$/i.test(key) || /^(?:https?:|javascript:|data:|\/\/)/i.test(value) || /[\u0000-\u001f\u007f]/.test(value)) return false;
 }
 return true;
}
export function isGoogleMapsUrl(value: string): boolean {
 const url=parseWebUrl(value,true);
 if (!url || !safeNavigationParameters(url)) return false;
 if (url.searchParams.has('api') && url.searchParams.get('api')!=='1') return false;
 if (url.searchParams.has('travelmode') && !['driving','walking','bicycling','transit'].includes(url.searchParams.get('travelmode')!)) return false;
 if (url.searchParams.has('dir_action') && url.searchParams.get('dir_action')!=='navigate') return false;
 if ((url.searchParams.has('destination') || url.searchParams.has('query')) && url.searchParams.get('api')!=='1') return false;
 if (url.hostname==='maps.app.goo.gl') return /^\/[a-zA-Z0-9_-]{6,}\/?$/.test(url.pathname);
 if (url.hostname==='goo.gl') return /^\/maps\/[a-zA-Z0-9_-]{6,}\/?$/.test(url.pathname);
 if (!['google.com','www.google.com','maps.google.com'].includes(url.hostname)) return false;
 if (url.hostname==='maps.google.com' ? !(url.pathname==='/' || /^\/maps(?:\/|$)/.test(url.pathname)) : !/^\/maps(?:\/|$)/.test(url.pathname)) return false;
 if (url.searchParams.has('ll') && !coordinateText(url.searchParams.get('ll')!)) return false;
 for (const key of ['saddr','daddr']) { const input=url.searchParams.get(key); if (input && /^[\d.,-]+$/.test(input) && !coordinateText(input)) return false; }
 for (const key of ['destination','query','q']) {
  const input=url.searchParams.get(key);
  if (input && input.trim().length>=3) {
   if (/^[\d.,-]+$/.test(input) && !coordinateText(input)) return false;
   if (url.searchParams.has('api') && url.searchParams.get('api')!=='1') return false;
   return true;
  }
 }
 return /^\/maps\/(?:place|dir|search)\/[^/]+/.test(url.pathname) || coordinateText(url.searchParams.get('ll') ?? '') || Boolean(url.searchParams.get('daddr')?.trim());
}
export function isWazeUrl(value: string): boolean {
 const url=parseWebUrl(value,true);
 if (!url || !['waze.com','www.waze.com'].includes(url.hostname) || !safeNavigationParameters(url)) return false;
 if (url.searchParams.has('navigate') && url.searchParams.get('navigate')!=='yes') return false;
 if (/^\/ul\/h[a-z\d]{3,}\/?$/i.test(url.pathname)) return true;
 if (!/^\/ul\/?$/.test(url.pathname)) return false;
 if (url.searchParams.has('ll')) return coordinateText(url.searchParams.get('ll')!);
 // An explicitly configured full-address search is accepted; never infer it from a venue name.
 const query=url.searchParams.get('q');
 return Boolean(query && specificStreet(query) && query.split(',').length>=3);
}
export function buildGoogleMapsUrl(location: EventLocation): string | undefined {
 if (location.navigationEnabled===false) return undefined;
 const explicit=location.googleMapsUrl ?? location.mapUrl;
 if (explicit && isGoogleMapsUrl(explicit)) return explicit;
 let destination: string;
 if (location.coordinates && isValidCoordinates(location.coordinates)) destination=`${location.coordinates.latitude},${location.coordinates.longitude}`;
 else if (hasSpecificAddress(location)) destination=[location.address!.trim(),location.city!.trim(),location.country!.trim()].join(', ');
 else return undefined;
 const url=new URL('https://www.google.com/maps/dir/');
 url.search=new URLSearchParams({api:'1',destination}).toString();
 return url.toString();
}
export function buildWazeUrl(location: EventLocation): string | undefined {
 if (location.navigationEnabled===false) return undefined;
 if (location.coordinates && isValidCoordinates(location.coordinates)) {
  const url=new URL('https://www.waze.com/ul');
  url.search=new URLSearchParams({ll:`${location.coordinates.latitude},${location.coordinates.longitude}`,navigate:'yes'}).toString();
  return url.toString();
 }
 return location.wazeUrl && isWazeUrl(location.wazeUrl) ? location.wazeUrl : undefined;
}
export function resolveLocationActions(location: EventLocation) {
 return {googleMaps:buildGoogleMapsUrl(location),waze:buildWazeUrl(location)};
}
