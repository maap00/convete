import type {WeddingInvitation} from '../invitations/types';
import type {AuditReport,HandoffReport} from './types';
import {getVenueVisibility} from '../invitations/sections.ts';
import {approvalSummary} from './approval.ts';
const inline=(value:string)=>value.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/[\\`*_{}\[\]<>#|]/g,'\\$&');
export function clientChecklist(invitation:WeddingInvitation,report:AuditReport):string {
 if(report.technical!=='passed'||report.slug!==invitation.slug||!report.fingerprint)throw new Error('checklist: primero corrige los errores técnicos.');
 const on=(id:string)=>report.sections.includes(id),venues=getVenueVisibility(invitation);
 const items=['Los nombres están escritos exactamente como queremos.','La fecha de la boda es correcta.'];
 if(venues.ceremony)items.push('El nombre, horario, dirección y cómo llegar a la ceremonia son correctos.');
 if(venues.reception)items.push('El nombre, horario, dirección y cómo llegar a la recepción son correctos.');
 if(report.resources.some(r=>r.exists&&(r.kind==='photo'||r.kind==='social')))items.push('Las fotografías, su orden y sus recortes son correctos; tenemos permiso de uso.');
 items.push('La frase de portada y el mensaje de cierre son correctos.');
 if(on('welcome'))items.push('La bienvenida y nuestra historia dicen lo que queremos compartir.');
 if(invitation.guestInstructions)items.push('Las indicaciones especiales para nuestros invitados son correctas.');
 if(on('itinerary'))items.push('Las actividades y horarios del itinerario son correctos.');
 if(on('dressCode'))items.push('La vestimenta y los colores sugeridos son correctos.');
 if(on('gifts'))items.push('La información de regalos y, si existe, su enlace son correctos.');
 if(on('rsvp')&&invitation.rsvp.enabled)items.push('El receptor de confirmaciones, la fecha límite, el mensaje y el máximo de acompañantes son correctos y están autorizados.');
 if(on('countdown'))items.push('La fecha mostrada y la cuenta regresiva corresponden a nuestra celebración.');
 items.push('El tema y los colores elegidos nos representan.','Revisamos la invitación en un teléfono: textos, botones y fotografías se leen y funcionan.','Revisamos qué nombres, fotografías y ubicaciones serán visibles para quien tenga el enlace.','Aprobamos esta versión del contenido.','Autorizamos por separado su publicación, tras resolver los pendientes de entrega.');
 return `# Revisión de nuestra invitación\n\n${inline(report.couple??'')}\n\nReferencia de esta versión: ${report.fingerprint}\n\nMarquen cada punto después de revisarlo. Esta lista no registra automáticamente su aprobación ni publica la invitación.\n\n${report.fixture?'**EJEMPLO FICTICIO: no representa aprobación de un cliente real.**\n\n':''}${items.map(text=>`- [ ] ${text}`).join('\n')}\n\nObservaciones:\n\nResponsable que confirma:\n\nFecha y hora de confirmación:\n\nSi algo cambia después de revisar, será necesario volver a comprobar la nueva versión.\n`;
}
export async function createHandoff(audit:AuditReport,root=process.cwd()):Promise<HandoffReport>{
 const approval=await approvalSummary(audit,root),blockers:string[]=[];
 if(audit.technical==='blocked')blockers.push('Existen errores técnicos bloqueantes.');
 if(approval.status!=='approved')blockers.push(`Aprobación comercial real vigente pendiente (${approval.status}).`);
 if(!approval.publicationAuthorized)blockers.push('Falta autorización explícita para publicar.');
 if(!approval.warningsAcknowledged)blockers.push('Las advertencias actuales no están confirmadas por una aprobación real vigente.');
 if(!audit.origin)blockers.push('Falta configurar y comprobar el origen público de entrega.');
 if(audit.fixture)blockers.push('Es una demostración/fixture, no una entrega comercial publicable.');
 if(audit.resources.some(r=>r.roles.includes('Open Graph')&&!r.valid))blockers.push('La imagen para compartir no está disponible.');
 const state=audit.technical==='blocked'?'blocked':approval.status!=='approved'?'ready-for-review':blockers.length?'client-approved':'ready-for-publication';
 return {schemaVersion:1,audit,approval,state,publishedAndVerified:false,publicationBlockers:blockers,nextSteps:state==='blocked'?['Corregir errores y repetir auditoría.']:state==='ready-for-review'?['Revisar el checklist con el cliente.','Obtener aprobación explícita y registrar su versión.']:state==='client-approved'?['Resolver los pendientes de publicación indicados y repetir auditoría.']:['Entregar al responsable de publicación con autorización independiente.','Después del despliegue: comprobar URL, HTTPS, recursos, metadatos, móvil y preview público. La auditoría local no verifica publicación.']};
}
export function auditText(r:AuditReport):string{return `Convete · ${r.slug}\nPareja: ${r.couple??'No disponible'}\nIdentificador: ${r.id??'No disponible'}\nTema: ${r.theme??'No disponible'}\nTécnica: ${r.technical}\nLista para revisión: ${r.readyForReview?'sí':'no'}\nHuella: ${r.fingerprint??'no disponible'}\nRecursos: ${r.resources.length}\nAuditoría: ${r.timings.auditMs} ms\n\n${r.findings.map(f=>`${f.level} [${f.code}] ${f.field}: ${f.message}`).join('\n')}\n\n${r.recommendations.join('\n')}\n`;}
export function handoffMarkdown(r:HandoffReport):string {
 const a=r.audit;return `# Informe de entrega · ${inline(a.slug)}\n\nPareja: ${inline(a.couple??'No disponible')}\n\nIdentificador: ${inline(a.id??'No disponible')}\n\nTema: ${inline(a.theme??'No disponible')}\n\nRevisión: ${a.reviewedAt}\n\nEstado técnico: ${a.technical}\n\nAprobación: ${r.approval.status}\n\nEstado comercial: ${r.state}\n\nPublicada y verificada: **no** (no comprobable mediante esta revisión local).\n\nRuta local, no pública: ${a.route}\n\nSecciones: ${a.sections.join(', ')||'ninguna opcional'}\n\nHuella: ${a.fingerprint??'no disponible'}\n\n## Hallazgos\n\n${a.findings.map(f=>`- ${f.level} — ${inline(f.message)}`).join('\n')}\n\n## Recursos\n\n${a.resources.map(f=>`- ${inline(f.path)}: ${f.exists?'presente':'ausente'} · ${f.bytes??'sin medir'} bytes`).join('\n')}\n\n## Tiempos\n\n- Auditoría automática: ${a.timings.auditMs} ms.\n- Preparación del generador registrada: ${a.timings.generationPreparationMs??'no disponible'} ms; no incluye revisión humana.\n- Revisión humana declarada: ${r.approval.humanReviewMinutes??'no medida'} minutos.\n\n## Pendientes de publicación\n\n${r.publicationBlockers.length?r.publicationBlockers.map(v=>`- ${inline(v)}`).join('\n'):'Sin bloqueos locales identificados; no equivale a despliegue autorizado ni verificado.'}\n\n## Próximos pasos\n\n${r.nextSteps.map(v=>`- ${inline(v)}`).join('\n')}\n`;
}
