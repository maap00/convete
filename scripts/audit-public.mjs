/** Passive, bounded HTTP audit of the explicitly authorised project host. */
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import * as fs from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import sharp from 'sharp';
const run=promisify(execFile),base='https://convete.vercel.app',dir=await fs.mkdtemp(join(tmpdir(),'convete-public-'));
const results=[];
async function audit(path){
 const key=String(results.length)+'-'+Math.random().toString(16).slice(2),header=join(dir,key+'.headers'),body=join(dir,key+'.body');
 try{
  const {stdout}=await run('curl',['-sS','--compressed','--max-time','35','--max-filesize','25000000','-D',header,'-o',body,'-w','%{json}',...(path.startsWith('/_next/image')?['-H','Accept: image/webp,image/*;q=0.8']:[]),base+path],{maxBuffer:1024*1024});
  const timing=JSON.parse(stdout),lines=(await fs.readFile(header,'utf8')).split(/\r?\n/),headers=Object.fromEntries(lines.filter(l=>l.includes(':')).map(l=>{const i=l.indexOf(':');return [l.slice(0,i).toLowerCase(),l.slice(i+1).trim()];}));
  const bytes=await fs.readFile(body);const record={path,status:timing.http_code,contentType:headers['content-type'],cacheControl:headers['cache-control'],location:headers.location,https:timing.url_effective.startsWith('https:'),ttfbMs:Math.round(timing.time_starttransfer*1000),totalMs:Math.round(timing.time_total*1000),downloadBytes:timing.size_download,decodedBytes:bytes.length,headers:Object.fromEntries(['strict-transport-security','x-content-type-options','x-frame-options','referrer-policy','content-security-policy','permissions-policy','x-vercel-cache','x-matched-path','server','etag','content-encoding'].filter(k=>headers[k]).map(k=>[k,headers[k]]))};
  if(record.contentType?.includes('text/html')){
   const html=bytes.toString('utf8'),tags=[...html.matchAll(/<(?:meta|link)\b[^>]*>/gi)].map(m=>m[0]);
   record.title=html.match(/<title>([^<]*)<\/title>/)?.[1];record.lang=html.match(/<html[^>]*lang="([^"]+)/)?.[1];
   record.metadata=tags.filter(t=>/description|og:|twitter:|canonical|robots/.test(t));
   record.images=[...html.matchAll(/<img\b[^>]*>/g)].map(m=>{const tag=m[0];return Object.fromEntries(['src','srcSet','alt','width','height','loading','fetchPriority'].map(k=>[k,tag.match(new RegExp(`\\b${k}="([^"]*)"`,'i'))?.[1]]));});
   record.stylesheets=tags.filter(t=>/rel="stylesheet"/.test(t)).map(t=>t.match(/href="([^"]+)/)?.[1]).filter(Boolean);
   record.fontPreloads=tags.filter(t=>/as="font"/.test(t)).map(t=>t.match(/href="([^"]+)/)?.[1]).filter(Boolean);
   record.scripts=[...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1]);
   record.sections=[...html.matchAll(/\bid="(welcome|countdown|venues|itinerary|gallery|dressCode|gifts|rsvp|closing)"/g)].map(m=>m[1]);
   record.fixtureListed=html.includes('fixture-generador-local');record.privateContactMarker=html.includes('pareja@example.com');
  }else if(record.contentType?.startsWith('image/')){try{const m=await sharp(bytes).metadata();record.image={format:m.format,width:m.width,height:m.height};}catch{record.imageError='No se pudo decodificar';}}
  else if(record.contentType?.includes('text/css')){record.fontURLs=[...bytes.toString('utf8').matchAll(/url\(['"]?([^)'"]+\.woff2)['"]?\)/g)].map(m=>new URL(m[1],base+path)).filter(u=>u.origin===base).map(u=>u.pathname);}
  else if(record.contentType?.includes('json')){
   // Inventory only: never persist contents of a potentially private public document.
   let obj;try{obj=JSON.parse(bytes.toString('utf8'));}catch{}record.jsonKeys=obj&&typeof obj==='object'?Object.keys(obj):[];
  }
  results.push(record);return record;
 }catch(error){const record={path,error:error.code==='ENOENT'?'curl no disponible':String(error.message).split('\n')[0]};results.push(record);return record;}
}
try{
 for(const path of ['/','/invitacion/laura-martin','/invitacion/ana-carlos','/solicitar-invitacion','/invitacion/no-existe-auditoria-5-3','/invitacion/fixture-generador-local','/invitations/fixture-generador-local/invitation.json','/invitations/fixture-generador-local/preparation-report.json','/docs/tarea-4.3.md','/docs/examples/solicitud-invitacion-recorrido-4.1.1.json','/invitations/laura-martin/README.md','/invitations/ana-carlos/README.md','/.convete/approvals/laura-martin','/.convete/approvals/laura-martin/','/package.json','/.env','/robots.txt'])await audit(path);
 const assets=new Set(['/invitations/laura-martin/social.jpg','/invitations/ana-carlos/social.jpg']);
 for(const page of results.filter(r=>r.images)){for(const asset of [...(page.scripts??[]),...(page.stylesheets??[]),...(page.fontPreloads??[])])if(asset.startsWith('/'))assets.add(asset);}
 for(const page of results.filter(r=>r.images))for(const img of page.images){if(!img.src)continue;const src=img.src.replaceAll('&amp;','&');if(src.startsWith('/'))assets.add(src);}
 const queue=[...assets];for(let i=0;i<queue.length;i+=4)await Promise.all(queue.slice(i,i+4).map(audit));
 const fonts=[...new Set(results.flatMap(r=>r.fontURLs??[]))];for(let i=0;i<fonts.length;i+=4)await Promise.all(fonts.slice(i,i+4).map(audit));
 await fs.writeFile('docs/audits/tarea-5.3/http.json',JSON.stringify({auditedAt:new Date().toISOString(),origin:base,method:'curl GET con compresión, Accept WebP para optimizador, sin seguir redirecciones; recursos autorizados, respuestas acotadas',results},null,2)+'\n');
 console.log(JSON.stringify(results.map(r=>({path:r.path,status:r.status,error:r.error,ttfbMs:r.ttfbMs,image:r.image})),null,2));
}finally{await fs.rm(dir,{recursive:true,force:true});}
