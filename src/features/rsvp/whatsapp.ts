import { isRsvpOpen } from './deadline.ts';
import type { RSVPConfig, RSVPInput, ValidatedRSVP, RSVPFieldErrors, RSVPAvailability, RSVPMessageContext, RSVPMessages } from './types';
export const DEFAULT_MAX_COMPANIONS = 2;
export function isCompanionLimitValid(max: number): boolean { return Number.isInteger(max) && max >= 0 && max <= 20; }
/** Validate syntax, not account existence. Only known formatting separators are removed. */
export function normalizeWhatsAppPhone(value?: string): string | undefined {
 if (typeof value !== 'string' || !/^\+?[1-9][\d ()\-.]*$/.test(value.trim())) return undefined;
 const phone = value.replace(/[+ ()\-.]/g,'').trim();
 return /^[1-9]\d{7,14}$/.test(phone) ? phone : undefined;
}
export function validateRSVPInput(input: RSVPInput, maxCompanions = DEFAULT_MAX_COMPANIONS): { valid: true; data: ValidatedRSVP } | { valid: false; errors: RSVPFieldErrors } {
 const errors: RSVPFieldErrors = {};
 const name = input.name.trim().replace(/\s+/g,' ');
 if (!name) errors.name = 'Escribe tu nombre.';
 else if (Array.from(name).length > 100) errors.name = 'El nombre no puede superar los 100 caracteres.';
 const attendance = input.attendance;
 if (attendance !== 'yes' && attendance !== 'no') errors.attendance = 'Selecciona si asistirás o no podrás asistir.';
 const companions = attendance === 'no' ? 0 : input.companions;
 if (!isCompanionLimitValid(maxCompanions) || (attendance === 'yes' && (!Number.isInteger(companions) || companions < 0 || companions > maxCompanions))) errors.companions = `Elige entre 0 y ${maxCompanions} acompañantes.`;
 if (Object.keys(errors).length) return {valid:false,errors};
 return {valid:true,data:{name,attendance:attendance as 'yes'|'no',companions}};
}
export function getRSVPAvailability(config: RSVPConfig, now: Date): RSVPAvailability {
 if (!config.enabled) return 'disabled';
 if (!config.phone?.trim()) return 'missing-phone';
 if (!normalizeWhatsAppPhone(config.phone)) return 'invalid-phone';
 if (config.deadline !== undefined) {
  try { if (!isRsvpOpen(config.deadline,now)) return 'expired'; } catch { return 'invalid-deadline'; }
 }
 return 'ready';
}
export const defaultRSVPMessages: RSVPMessages = {
 greeting:'Hola, {event}.', acceptIntro:'Quiero confirmar mi asistencia a su boda.', declineIntro:'Gracias por la invitación.',
 nameLabel:'Nombre', attendanceLabel:'Asistencia', companionsLabel:'Acompañantes', totalLabel:'Total de personas',
 acceptAnswer:'Sí, asistiré.', declineAnswer:'No podré asistir.', acceptClosing:'¡Nos vemos en la celebración!', declineClosing:'Les deseo una celebración maravillosa.'
};
export function buildWhatsAppRSVPMessage(data: ValidatedRSVP, context: RSVPMessageContext): string {
 const text = {...defaultRSVPMessages,...context.texts};
 const greeting = text.greeting.replaceAll('{event}',()=>context.eventLabel);
 const fields = [`${text.nameLabel}: ${data.name}`,`${text.attendanceLabel}: ${data.attendance === 'yes' ? text.acceptAnswer : text.declineAnswer}`];
 if (data.attendance === 'yes') fields.push(`${text.companionsLabel}: ${data.companions}`,`${text.totalLabel}: ${data.companions+1}`);
 return [greeting,data.attendance === 'yes' ? text.acceptIntro : text.declineIntro,fields.join('\n'),data.attendance === 'yes' ? text.acceptClosing : text.declineClosing].join('\n\n');
}
export function buildWhatsAppRSVPUrl(phone: string, message: string): string {
 const normalized = normalizeWhatsAppPhone(phone);
 if (!normalized) throw new Error('Número receptor de WhatsApp inválido.');
 const url = new URL(`https://wa.me/${normalized}`);
 url.search = new URLSearchParams({text:message}).toString();
 return url.toString();
}
/** Pure preparation: no navigation, network, persistence, or automatic sends. */
export function prepareWhatsAppRSVP(input: RSVPInput, config: RSVPConfig, context: RSVPMessageContext, now: Date) {
 const validation = validateRSVPInput(input,config.maxCompanions ?? DEFAULT_MAX_COMPANIONS);
 if (!validation.valid) return {status:'invalid' as const,errors:validation.errors};
 const availability = getRSVPAvailability(config,now);
 if (availability !== 'ready') return {status:'unavailable' as const,reason:availability};
 const message = buildWhatsAppRSVPMessage(validation.data,{...context,texts:{...context.texts,...config.texts}});
 return {status:'ready' as const,data:validation.data,message,url:buildWhatsAppRSVPUrl(config.phone!,message)};
}
