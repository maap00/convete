import * as fs from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {createRequire} from 'node:module';
import type {WeddingInvitation} from '../invitations/types';
import {validateInvitationRegistry} from '../invitations/validation.ts';
import {resolveTheme} from '../../themes/registry.ts';
import {parseRequestJSON} from './input.ts';
import {createSlug,validateSlug} from './slug.ts';
import {requestToInvitation,type ResolvedPhotos} from './transform.ts';
import {discoverInvitations} from '../invitations/discovery.ts';
import {builtInInvitations} from '../invitations/builtins.ts';
// Reuse the image engine already installed and locked by Next.js.
const require=createRequire(import.meta.url);
const sharp:typeof import('sharp')['default']=require(require.resolve('sharp',{paths:[require.resolve('next/package.json')]}));
export interface GenerateOptions {input:string;assets?:string;slug?:string;dryRun?:boolean;fixture?:boolean;root?:string}
export interface GenerationReport {status:'dry-run'|'created';slug:string;couple:string;theme:string;sections:string[];photos:number;warnings:string[];files:string[];route:string;elapsedMs:number;timings:{validationMs:number;assetPreparationMs:number;generationTotalMs:number|null}}
export interface GenerationPlan {invitation:WeddingInvitation;report:GenerationReport;images:{filename:string;data:Buffer}[];target:string;publicRoot:string}
async function exists(path:string){try{await fs.lstat(path);return true;}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return false;throw error;}}
async function safeDirectory(path:string){const stat=await fs.lstat(path);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('assets: se requiere un directorio real, sin enlace simbólico.');return fs.realpath(path);}
export async function planGeneration(options:GenerateOptions):Promise<GenerationPlan>{
 const started=performance.now(),root=resolve(options.root??process.cwd());
 const publicRoot=await safeDirectory(join(root,'public'));const directory=await safeDirectory(join(publicRoot,'invitations'));
 const inputStat=await fs.stat(options.input);if(!inputStat.isFile()||inputStat.size>1024*1024)throw new Error('input: se requiere JSON de hasta 1 MiB.');
 const request=parseRequestJSON(await fs.readFile(options.input,'utf8'));
 const validationMs=Math.round(performance.now()-started);
 const slug=options.slug===undefined?createSlug(request.couple.first,request.couple.second):validateSlug(options.slug);
 const existing=[...builtInInvitations,...discoverInvitations(publicRoot)];
 if(existing.some(i=>i.slug===slug)||await exists(join(directory,slug)))throw new Error(`slug: «${slug}» ya existe; indica otro con --slug. No se sobrescribió nada.`);
 const assetRoot=options.assets?await safeDirectory(resolve(options.assets)):undefined;
 if(!assetRoot&&request.resources.length)throw new Error('assets: faltan los originales; indica --assets con la carpeta del manifiesto.');
 const photos:ResolvedPhotos={},images:GenerationPlan['images']=[],missing:string[]=[];
 for(const [index,resource] of request.resources.entries()){
  const file=join(assetRoot!,resource.filename);
  if(!await exists(file)){missing.push(resource.filename);continue;}
  const stat=await fs.lstat(file),actual=await fs.realpath(file);
  if(stat.isSymbolicLink()||!stat.isFile()||!actual.startsWith(assetRoot!+sep))throw new Error(`resources.${index}: archivo fuera de la carpeta o enlace simbólico: ${resource.filename}`);
  if(stat.size!==resource.size)throw new Error(`resources.${index}.size: el tamaño de ${resource.filename} no coincide con el manifiesto; vuelve a exportarlo si cambió el original.`);
  const data=await fs.readFile(file);if(data.length!==resource.size)throw new Error(`resources.${index}: el archivo cambió durante la lectura.`);
  const image=sharp(data,{limitInputPixels:40000000,failOn:'warning'}),meta=await image.metadata();
  const format={'image/jpeg':'jpeg','image/png':'png','image/webp':'webp'}[resource.mimeType];
  if(meta.format!==format||!meta.width||!meta.height||(meta.pages??1)!==1)throw new Error(`resources.${index}: formato real inválido o imagen animada: ${resource.filename}`);
  const converted=await image.rotate().resize({width:1800,height:1800,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer({resolveWithObject:true});
  const filename=`${resource.destination}-${String(index+1).padStart(2,'0')}.webp`;
  images.push({filename,data:converted.data});photos[resource.id]={src:`/invitations/${slug}/photos/${filename}`,width:converted.info.width,height:converted.info.height,alt:`${request.couple.first} y ${request.couple.second} · ${resource.destination==='main'?'Fotografía principal':resource.destination==='gallery'?`Galería ${index+1}`:resource.destination==='ceremony'?'Ceremonia':'Recepción'}`};
 }
 if(missing.length)throw new Error(`resources: faltan archivos originales: ${missing.join(', ')}`);
 const invitation=requestToInvitation(request,slug,photos);
 if(options.fixture)invitation.demoNotice='Invitación de prueba local con datos ficticios y recursos de demostración. No corresponde a un evento real.';
 validateInvitationRegistry([...existing,invitation]);
 for(const asset of Object.values(resolveTheme(invitation.theme,invitation.personalization).assets)){
  if(!asset)continue;const file=await fs.realpath(join(publicRoot,asset));
  if(!file.startsWith(publicRoot+sep)||!(await fs.stat(file)).isFile())throw new Error('theme: recurso compartido inexistente o fuera de public.');
 }
 const warnings=['Indexación desactivada (noindex); no es control de acceso.','Open Graph reutiliza la fotografía principal; no se creó una composición social ni se comprobó su recorte.','Reconstruye la aplicación o reinicia desarrollo para reconocer la invitación. No se ha publicado en Internet.'];
 if(!request.preferences.sections.welcome)warnings.push('La foto principal se conserva y se usa en SEO; la sección de historia donde aparece está desactivada.');
 if(request.rsvp.enabled)warnings.push('RSVP conserva el receptor proporcionado. Verifica su autorización antes de compartir la invitación.');
 if(request.celebration.colors)warnings.push('Los colores sugeridos se muestran como texto; no se interpretan como códigos de paleta.');
 return {invitation,images,target:join(directory,slug),publicRoot,report:{status:options.dryRun?'dry-run':'created',slug,couple:`${request.couple.first} y ${request.couple.second}`,theme:request.preferences.theme,sections:invitation.sections.filter(s=>s.enabled).map(s=>s.id),photos:images.length,warnings,files:['invitation.json','preparation-report.json',...images.map(i=>`photos/${i.filename}`)].map(f=>`public/invitations/${slug}/${f}`),route:`/invitacion/${slug}`,elapsedMs:Math.round(performance.now()-started),timings:{validationMs,assetPreparationMs:Math.round(performance.now()-started)-validationMs,generationTotalMs:null}}};
}
/** Injectable write primitives let integration tests exercise rollback after partial staging. */
export async function generateInvitation(options:GenerateOptions,io:Pick<typeof fs,'writeFile'|'rename'>=fs):Promise<GenerationReport>{
 const operationStarted=performance.now();const plan=await planGeneration(options);if(options.dryRun)return plan.report;
 const parent=join(plan.publicRoot,'invitations'),lock=join(parent,`.${plan.report.slug}.lock`);
 let locked=false,published=false,stage:string|undefined;
 try{
  await fs.mkdir(lock);locked=true;
  if(await exists(plan.target))throw new Error('slug: colisión antes de publicar.');
  stage=await fs.mkdtemp(join(parent,'.stage-'));await fs.mkdir(join(stage,'photos'));
  for(const image of plan.images)await io.writeFile(join(stage,'photos',image.filename),image.data,{flag:'wx'});
  await io.writeFile(join(stage,'invitation.json'),JSON.stringify(plan.invitation,null,2)+'\n',{flag:'wx'});
  await io.writeFile(join(stage,'preparation-report.json'),JSON.stringify(plan.report,null,2)+'\n',{flag:'wx'});
  if(await exists(plan.target))throw new Error('slug: colisión antes de publicar.');
  await io.rename(stage,plan.target);stage=undefined;published=true;return {...plan.report,timings:{...plan.report.timings,generationTotalMs:Math.round(performance.now()-operationStarted)}};
 }catch(error){throw new Error(`Generación cancelada: ${error instanceof Error?error.message:'fallo de escritura'}. No se publicó una invitación parcial; los archivos preexistentes se conservan.`,{cause:error});}
 finally{
  const pending:string[]=[];
  if(stage)try{await fs.rm(stage,{recursive:true,force:true});}catch{pending.push(stage);}
  if(locked)try{await fs.rmdir(lock);}catch{pending.push(lock);}
  if(pending.length)throw new Error(`${published?'La invitación completa fue creada.':'No se publicó una invitación.'} Limpieza pendiente, conserva y revisa estas rutas: ${pending.join(', ')}`);
 }
}
