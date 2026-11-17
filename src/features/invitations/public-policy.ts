import {builtInInvitations} from './builtins.ts';
import {resolveMetadataOrigin} from './metadata.ts';
export interface ReleaseEnvironment {[name:string]:string|undefined;VERCEL_ENV?:string;CONVETE_PUBLIC_DEMO?:string;CONVETE_PUBLIC_ORIGIN?:string;CONVETE_PREVIEW_ORIGIN?:string;VERCEL_URL?:string}
const demoSlugs=new Set(builtInInvitations.map(i=>i.slug));
export function publicDemoMode(env:ReleaseEnvironment):boolean {
 if(env.CONVETE_PUBLIC_DEMO!==undefined&&!['true','false'].includes(env.CONVETE_PUBLIC_DEMO))throw new Error('CONVETE_PUBLIC_DEMO debe ser true o false.');
 return env.CONVETE_PUBLIC_DEMO==='true'||env.CONVETE_PUBLIC_DEMO!=='false'&&['production','preview'].includes(env.VERCEL_ENV??'');
}
export function canExposeInvitation(slug:string,env:ReleaseEnvironment):boolean {return !publicDemoMode(env)||demoSlugs.has(slug);}
function decodePath(value:string):string|undefined {
 try{for(let n=0;n<2&&value.includes('%');n++)value=decodeURIComponent(value);if(/[\\\u0000-\u001f%]/.test(value)||value.split('/').some(p=>p==='..'||p==='.'))return;return value;}catch{return;}
}
/** Only image resources belong in the HTTP surface of an invitation directory. */
export function publicPathAllowed(pathname:string,env:ReleaseEnvironment):boolean {
 const path=decodePath(pathname);if(!path)return false;
 if(path==='/.convete'||path.startsWith('/.convete/'))return false;
 if(path.startsWith('/invitacion/'))return canExposeInvitation(path.split('/')[2],env);
 if(path.startsWith('/invitations/')){
  const slug=path.split('/')[2];return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)&&canExposeInvitation(slug,env)&&/^\/invitations\/[a-z0-9-]+\/[a-zA-Z0-9/_-]+\.(?:webp|avif|jpe?g|png|svg)$/i.test(path);
 }
 return true;
}
export function publicRequestAllowed(pathname:string,imageURL:string|null,env:ReleaseEnvironment):boolean {
 if(!publicPathAllowed(pathname,env))return false;
 if(pathname==='/_next/image'&&imageURL){try{return publicPathAllowed(new URL(imageURL,'https://local.invalid').pathname,env);}catch{return false;}}
 return true;
}
export function validateReleaseEnvironment(env:ReleaseEnvironment):void {
 publicDemoMode(env);
 resolveMetadataOrigin(env);
}
