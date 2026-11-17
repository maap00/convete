import {existsSync,lstatSync,readdirSync,readFileSync} from 'node:fs';
import {builtInInvitations} from './builtins.ts';
import {resolve,join} from 'node:path';
export interface ArtifactInspection {filesChecked:number;errors:string[];routes:string[]}
const image=/\.(?:webp|avif|jpe?g|png|svg|ico)$/i;
const license=/^fonts\/(?:Cormorant|GreatVibes|Inter)-OFL\.txt$/;
const manifestKeys=new Set(['id','name','short_name','description','start_url','scope','display','display_override','orientation','theme_color','background_color','icons','screenshots','shortcuts','categories','lang','dir','related_applications','prefer_related_applications']);
/** Checks only HTTP/static trees and traces; legitimate Next server/manifests are not banned. */
export function inspectReleaseArtifact(root=process.cwd(),options:{artifacts?:boolean;publicDemo?:boolean}={}):ArtifactInspection {
 const result:ArtifactInspection={filesChecked:0,errors:[],routes:[]};
 const walk=(directory:string,kind:'public'|'static')=>{
  if(!existsSync(directory))return;
  const visit=(dir:string,prefix='')=>{for(const name of readdirSync(dir).sort()){
   const path=join(dir,name),rel=prefix?`${prefix}/${name}`:name,stat=lstatSync(path);result.filesChecked++;
   if(stat.isSymbolicLink()){result.errors.push(`${kind}/${rel}: enlace simbólico no permitido`);continue;}
   if(stat.isDirectory()){if(kind==='public'&&options.publicDemo&&prefix==='invitations'&&!builtInInvitations.some(i=>i.slug===name))result.errors.push(`${kind}/${rel}: directorio ajeno a la demo pública`);if(name.startsWith('.'))result.errors.push(`${kind}/${rel}: directorio temporal/interno`);visit(path,rel);continue;}
   if(kind==='public'){
    const manifest=/^(?:manifest\.json|manifest\.webmanifest)$/i.test(rel);
    if(manifest){try{const v=JSON.parse(readFileSync(path,'utf8'));if(!v||Array.isArray(v)||typeof v!=='object'||Object.keys(v).some(k=>!manifestKeys.has(k)))throw new Error();}catch{result.errors.push(`${kind}/${rel}: manifiesto público inválido o con campos internos`);}continue;}
    if(!(image.test(rel)||/^fonts\/[a-zA-Z0-9_-]+\.woff2$/.test(rel)||license.test(rel)||['robots.txt','sitemap.xml'].includes(rel)))result.errors.push(`${kind}/${rel}: documento no permitido en public`);
   }else if(/(?:^|\/)(?:invitation\.json|preparation-report\.json|README\.md|checklist[^/]*\.md|handoff[^/]*\.json|\.env[^/]*|approval[^/]*\.json)$/i.test(rel)||/(?:^|\/)(?:\.convete|docs|audits)(?:\/|$)/.test(rel))result.errors.push(`${kind}/${rel}: documento interno en estáticos`);
  }};visit(directory);
 };
 walk(resolve(root,'public'),'public');
 if(options.artifacts){
  walk(resolve(root,'.next/static'),'static');walk(resolve(root,'.vercel/output/static'),'static');
  const manifest=resolve(root,'.next/prerender-manifest.json');
  if(!existsSync(manifest))result.errors.push('Falta artefacto de producción .next/prerender-manifest.json');
  else{const v=JSON.parse(readFileSync(manifest,'utf8'));result.routes=Object.keys(v.routes??{}).sort();if(options.publicDemo)for(const route of result.routes)if(route.startsWith('/invitacion/')&&!builtInInvitations.some(i=>route===`/invitacion/${i.slug}`))result.errors.push(`${route}: invitación no prevista en artefacto demo`);}
  const traces=resolve(root,'.next/server');
  const checkTraces=(dir:string)=>{if(!existsSync(dir))return;for(const name of readdirSync(dir)){const file=join(dir,name),stat=lstatSync(file);if(stat.isSymbolicLink()){result.errors.push('Traza simbólica no permitida');continue;}if(stat.isDirectory())checkTraces(file);else if(name.endsWith('.nft.json')){const v=JSON.parse(readFileSync(file,'utf8'));for(const path of v.files??[])if(/(?:^|\/)(?:\.convete|docs\/audits)(?:\/|$)/.test(path)||/preparation-report\.json$/.test(path))result.errors.push(`${name}: traza incorpora documento comercial innecesario`);}}};checkTraces(traces);
 }
 return result;
}
export function assertPublicTree(root=process.cwd(),publicDemo=false):void{const r=inspectReleaseArtifact(root,{publicDemo});if(r.errors.length)throw new Error(`Public contiene archivos internos:\n${r.errors.join('\n')}`);}
