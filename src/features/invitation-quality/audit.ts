import * as fs from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {builtInInvitations} from '../invitations/builtins.ts';
import {validateInvitation,isLocalAsset} from '../invitations/validation.ts';
import {activeInvitation} from '../invitations/active-view.ts';
import {getVenueVisibility} from '../invitations/sections.ts';
import {resolveTheme} from '../../themes/registry.ts';
import {invitationMetadata,publicOrigin} from '../invitations/metadata.ts';
import {getRSVPAvailability} from '../rsvp/whatsapp.ts';
import {resolveLocationActions} from '../locations/navigation.ts';
import {parseInstant} from '../../lib/dates.ts';
import {validateSlug} from '../invitation-generator/slug.ts';
import {workspacePath} from './storage.ts';
import type {WeddingInvitation,Photo} from '../invitations/types';
import type {AuditReport,AuditedResource} from './types';
const require=createRequire(import.meta.url);
const sharp:typeof import('sharp')['default']=require(require.resolve('sharp',{paths:[require.resolve('next/package.json')]}));
export function canonical(value:unknown):string {
 if(value===null||typeof value!=='object')return JSON.stringify(value)??'null';
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 return '{'+Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';
}
const hash=(data:Buffer|string)=>createHash('sha256').update(data).digest('hex');
export interface AuditOptions {root?:string;now?:Date;origin?:string}
export async function readInvitation(slug:string,root=process.cwd()):Promise<WeddingInvitation>{
 validateSlug(slug);const builtin=builtInInvitations.find(i=>i.slug===slug);if(builtin)return structuredClone(builtin);
 const file=await workspacePath(root,`data/invitations/${slug}/invitation.json`),stat=await fs.stat(file);
 if(stat.size>1024*1024)throw new Error('configuración: supera 1 MiB.');
 let value:WeddingInvitation;try{value=JSON.parse(await fs.readFile(file,'utf8')) as WeddingInvitation;}catch{throw new Error('configuración: JSON inválido.');}
 if(!value||value.slug!==slug)throw new Error('configuración: el slug no coincide con su directorio.');return value;
}
/** Audits one invitation independently; a broken neighbour cannot prevent its report. */
export async function auditExisting(slug:string,options:AuditOptions={}):Promise<AuditReport>{
 const started=performance.now(),root=await fs.realpath(options.root??process.cwd()),now=options.now??new Date();validateSlug(slug);
 if(!Number.isFinite(now.getTime()))throw new Error('now: fecha de revisión inválida.');
 const report:AuditReport={schemaVersion:1,rulesVersion:1,slug,reviewedAt:now.toISOString(),technical:'blocked',readyForReview:false,findings:[],resources:[],sections:[],fixture:false,route:`/invitacion/${slug}`,timings:{auditMs:0,generationPreparationMs:null,humanReviewMinutes:null},recommendations:[]};
 const add=(level:'ERROR'|'WARNING'|'INFO',code:string,field:string,message:string)=>report.findings.push({level,code,field,message});
 let invitation:WeddingInvitation|undefined;
 try{invitation=await readInvitation(slug,root);}catch(error){add('ERROR','CONFIG_READ','configuration',(error as NodeJS.ErrnoException).code==='ENOENT'?'Invitación inexistente o archivo de configuración ausente.':error instanceof Error?error.message:'No se pudo leer la invitación.');}
 let active:WeddingInvitation|undefined;
 if(invitation){
  let visited=0;
  const inspect=(value:unknown,depth=0):void=>{
   if(++visited>20000||depth>32)throw new Error('structure');
   if(!value||typeof value!=='object')return;
   for(const [key,child] of Object.entries(value)){
    if(/^(?:secret|clientSecret|apiKey|api_key|accessToken|refreshToken|password|authorization|privateKey|private_key|commercial|contact|email)$/i.test(key)){
     if(!report.findings.some(f=>f.code==='PRIVATE_DATA'))add('ERROR','PRIVATE_DATA','configuration','Hay campos de contacto privado o credenciales que no pertenecen a la invitación pública. Retíralos antes de entregar.');return;
    }
    inspect(child,depth+1);
   }
  };
  try{inspect(invitation);}catch{add('ERROR','CONFIG_COMPLEXITY','configuration','Estructura demasiado profunda o compleja para auditar con seguridad.');}
 }
 if(invitation)try{
  validateInvitation(invitation,{activeOnly:true});active=activeInvitation(invitation);
  report.id=invitation.id;report.couple=`${invitation.couple.first} y ${invitation.couple.second}`;report.theme=invitation.theme;report.sections=invitation.sections.filter(s=>s.enabled).map(s=>s.id);report.fixture=Boolean(invitation.mode==='demo'||invitation.demoNotice);
 }catch(error){add('ERROR','CONFIG_INVALID','configuration',error instanceof Error?error.message:'Configuración inválida.');}
 const fingerprintParts:Record<string,unknown>={rulesVersion:1,configuration:invitation??null,origin:options.origin??null,assets:{},renderDependencies:{}};
 if(active&&invitation){
  const on=(id:string)=>report.sections.includes(id),venues=getVenueVisibility(active);
  try{report.origin=publicOrigin(options.origin);}catch{add('ERROR','PUBLIC_ORIGIN_INVALID','seo','El origen público configurado no es un origen HTTPS válido.');}
  const resources=new Map<string,{roles:string[];kind:AuditedResource['kind'];required:boolean;photo?:Photo}>();
  const resource=(path:string,role:string,kind:AuditedResource['kind'],required:boolean,photo?:Photo)=>{const old=resources.get(path);resources.set(path,{roles:[...(old?.roles??[]),role],kind:old?.kind==='photo'?'photo':kind,required:Boolean(old?.required||required),photo:old?.photo??photo});};
  if(active.storyPhoto)resource(active.storyPhoto.src,'principal','photo',true,active.storyPhoto);
  else if(on('welcome'))add('INFO','MAIN_OPTIONAL','storyPhoto','La historia no tiene fotografía principal; es opcional en el motor actual.');
  active.photos.forEach((p,i)=>resource(p.src,`galería ${i+1}`,'photo',true,p));
  for(const kind of ['ceremony','reception'] as const)if(venues[kind]&&active[kind].photo)resource(active[kind].photo!.src,kind,'photo',true,active[kind].photo);
  for(const [name,path] of Object.entries(resolveTheme(active.theme,active.personalization).assets))if(path)resource(path,name,'decoration',true);
  resource(active.seo.image??`/invitations/${slug}/social.jpg`,'Open Graph','social',Boolean(report.origin));
  for(const [path,ref] of resources){
   const item:AuditedResource={path,roles:ref.roles,kind:ref.kind,required:ref.required,exists:false,valid:false};report.resources.push(item);
   try{
    if(!isLocalAsset(path,slug,ref.kind==='decoration'))throw new Error('ruta pública no permitida');
    const file=await workspacePath(root,`public${path}`),stat=await fs.stat(file);if(!stat.isFile()||stat.size>20*1024*1024)throw new Error('archivo no regular o superior a 20 MiB');
    const bytes=await fs.readFile(file);item.exists=true;item.bytes=bytes.length;item.sha256=hash(bytes);
    if(ref.kind!=='decoration'||!path.endsWith('.svg')){
     const image=sharp(bytes,{limitInputPixels:40000000,failOn:'warning'}),meta=await image.metadata();
     const extension=path.split('.').at(-1)!.toLowerCase();const expected:Record<string,string>={jpg:'jpeg',jpeg:'jpeg',png:'png',webp:'webp',avif:'heif'};
     if(!Object.hasOwn(expected,extension)||meta.format!==expected[extension]||(meta.pages??1)!==1)throw new Error('formato real incompatible o imagen animada');
     await image.stats();item.width=meta.width;item.height=meta.height;
     if(ref.photo&&(meta.width!==ref.photo.width||meta.height!==ref.photo.height))add('ERROR','IMAGE_DIMENSIONS',path,'Las dimensiones declaradas no coinciden con el archivo.');
     if(ref.kind!=='decoration'&&Math.max(meta.width??0,meta.height??0)<800)add('WARNING','IMAGE_LOW_RESOLUTION',path,'Resolución inferior a 800 px en su lado mayor; revisar nitidez.');
     if(ref.roles.includes('Open Graph')&&((meta.width??0)<1200||(meta.height??0)<630))add('WARNING','SOCIAL_DIMENSIONS',path,'Vista previa menor que 1200 × 630; revisar tamaño y recorte.');
     if(bytes.length>2*1024*1024)add('WARNING','IMAGE_WEIGHT',path,'Imagen superior a 2 MiB; revisar transferencia antes de publicar.');
    }
    item.valid=true;
   }catch{add(ref.required?'ERROR':'WARNING','RESOURCE_INVALID',path,'Recurso ausente, inseguro, corrupto o incompatible. No se modificó.');}
   (fingerprintParts.assets as Record<string,unknown>)[path]=item.sha256??'missing-or-invalid';
  }
  if(on('gallery')&&active.photos.length<3)add('WARNING','GALLERY_FEW','photos','La galería tiene menos de tres fotografías; confirmar que es intencional.');
  if(on('itinerary')&&!active.itinerary.length)add('WARNING','ITINERARY_EMPTY','itinerary','La sección de itinerario está activa sin actividades.');
  if(on('welcome')&&!active.messages.story)add('INFO','STORY_FALLBACK','messages.story','Se utiliza la bienvenida en lugar de una historia adicional.');
  if(on('rsvp')){
   const availability=getRSVPAvailability(active.rsvp,now);
   if(['missing-phone','invalid-phone','invalid-deadline'].includes(availability))add('ERROR','RSVP_INVALID','rsvp','RSVP activo sin receptor o plazo válido.');
   else if(availability==='expired')add('WARNING','RSVP_EXPIRED','rsvp.deadline','El plazo de confirmación terminó; revisar si es una invitación histórica.');
   else add('INFO','RSVP_STATUS','rsvp',availability==='disabled'?'La confirmación está desactivada.':'Receptor con formato válido; titularidad y recepción requieren confirmación humana.');
  }else add('INFO','RSVP_DISABLED','rsvp','RSVP no forma parte de las secciones activas.');
  for(const kind of ['ceremony','reception'] as const)if(venues[kind]){
   const v=active[kind],actions=resolveLocationActions(v);
   if(!v.address?.trim()||!v.city?.trim()||!v.country?.trim())add('WARNING','ADDRESS_REVIEW',kind,'Confirmar dirección, ciudad y país con los anfitriones.');
   add('INFO','NAVIGATION',kind,`Canales configurados: ${[actions.googleMaps?'Google Maps':'',actions.waze?'Waze':''].filter(Boolean).join(', ')||'ninguno'}. No se abrieron enlaces.`);
   if(v.startsAt.slice(0,10)!==active.event.startsAt.slice(0,10))add('WARNING','EVENT_DAY_REVIEW',kind,'El evento tiene una fecha ISO diferente; confirmar el día y la zona. Puede ser intencional.');
  }
  if(on('gifts'))add(active.gifts.url?'INFO':'WARNING',active.gifts.url?'GIFTS_LINK':'GIFTS_NO_LINK','gifts',active.gifts.url?'Lista con enlace válido; confirmar destino y texto del botón.':'Regalos sin enlace: se muestra texto, sin botón ficticio.');
  if(parseInstant(active.event.startsAt).getTime()<now.getTime())add('INFO','HISTORICAL_EVENT','event.startsAt','Fecha pasada: invitación histórica válida; el contador termina en cero.');
  try{report.origin=publicOrigin(options.origin);invitationMetadata(active,options.origin);if(!report.origin)add('WARNING','LOCAL_ONLY','seo','Sin dominio público: preparación local válida; canonical y previsualización pública pendientes.');}
  catch{if(!report.findings.some(f=>f.code==='PUBLIC_ORIGIN_INVALID'))add('ERROR','PUBLIC_ORIGIN_INVALID','seo','El origen público configurado no es un origen HTTPS válido.');}
  if(!active.seo.noIndex)add('WARNING','INDEXABLE','seo.noIndex','Indexación habilitada: confirmar autorización y privacidad.');
  else add('INFO','NOINDEX','seo.noIndex','Indexación desactivada; no protege el acceso al contenido.');
  if(report.fixture)add('WARNING','FIXTURE','demoNotice','Contenido marcado como demostración/prueba. No listo para publicación comercial.');
  // Style/renderer/font changes invalidate approval, not merely image or config edits.
  const dependencyRoots=['src/components/ui','src/components/wedding','src/styles','src/themes','src/features/rsvp','src/features/locations','src/lib','public/fonts'];
  const dependencies=['src/app/layout.tsx','src/features/invitations/validation.ts','src/features/invitations/validate-assets.ts','src/features/invitations/repository.ts','src/features/invitations/active-view.ts','src/features/invitation-quality/audit.ts','src/features/invitations/InvitationRenderer.tsx','src/features/invitations/sections.ts','src/features/invitations/metadata.ts','src/app/globals.css'];
  const walk=async(dir:string)=>{let entries;try{await workspacePath(root,`${dir}/.boundary`);entries=await fs.readdir(resolve(root,dir),{withFileTypes:true});}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return;throw error;}
   for(const e of entries.sort((a,b)=>a.name.localeCompare(b.name))){if(e.isSymbolicLink())throw new Error('Dependencia de render simbólica no permitida.');if(e.isDirectory())await walk(`${dir}/${e.name}`);else if(e.isFile())dependencies.push(`${dir}/${e.name}`);}
  };
  try{for(const dir of dependencyRoots)await walk(dir);for(const path of dependencies.sort())try{const file=await workspacePath(root,path);(fingerprintParts.renderDependencies as Record<string,string>)[path]=hash(await fs.readFile(file));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;(fingerprintParts.renderDependencies as Record<string,string>)[path]='absent';}}
  catch{add('ERROR','RENDER_DEPENDENCY','render','No se pudieron leer con seguridad los recursos compartidos de renderizado.');}
  try{const file=await workspacePath(root,`data/invitations/${slug}/preparation-report.json`);const s=await fs.stat(file);if(s.size<1024*1024){const p=JSON.parse(await fs.readFile(file,'utf8'));if(Number.isFinite(p.elapsedMs)&&p.elapsedMs>=0)report.timings.generationPreparationMs=p.elapsedMs;}}catch{/* Optional historical timing, never inferred. */}
 }
 if(invitation&&!report.findings.some(f=>f.level==='ERROR'))report.fingerprint=hash(canonical(fingerprintParts));
 report.technical=report.findings.some(f=>f.level==='ERROR')?'blocked':'passed';report.readyForReview=report.technical==='passed';
 report.recommendations=report.technical==='blocked'?['Corregir los errores y repetir la auditoría antes de solicitar aprobación.']:['Revisar el checklist con el cliente; los checks automáticos no sustituyen su aprobación.','Confirmar visualización móvil, permisos de fotografías, destinos y receptor RSVP sin enviar mensajes de prueba.'];
 report.timings.auditMs=Math.round(performance.now()-started);return report;
}
