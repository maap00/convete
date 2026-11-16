import {existsSync,lstatSync,readdirSync,readFileSync,realpathSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {isInvitationSlug,validateInvitation} from './validation.ts';
import type {WeddingInvitation} from './types';
/** Server/build-only discovery. Fixed filename, no executable imports or browser filesystem. */
export function discoverInvitations(publicRoot=resolve('public')):WeddingInvitation[] {
 const directory=resolve(publicRoot,'invitations');if(!existsSync(directory))return [];
 if(lstatSync(directory).isSymbolicLink())throw new Error('registry: invitations no puede ser un enlace simbólico.');
 const root=realpathSync(directory),result:WeddingInvitation[]=[];
 for(const entry of readdirSync(root,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  if(!isInvitationSlug(entry.name))continue;
  if(entry.isSymbolicLink())throw new Error(`registry: directorio simbólico no permitido: ${entry.name}`);
  if(!entry.isDirectory())continue;
  const file=resolve(root,entry.name,'invitation.json');if(!existsSync(file))continue;
  const stat=lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>1024*1024||!realpathSync(file).startsWith(root+sep))throw new Error(`registry: configuración insegura: ${entry.name}`);
  const value=JSON.parse(readFileSync(file,'utf8')) as WeddingInvitation;
  if(value.slug!==entry.name)throw new Error(`registry: slug distinto del directorio: ${entry.name}`);
  validateInvitation(value,{activeOnly:true});result.push(value);
 }
 return result;
}
