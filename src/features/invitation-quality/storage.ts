import * as fs from 'node:fs/promises';
import {resolve,relative,sep,dirname,extname} from 'node:path';
/** Local workspace boundary; refuses symlinks, including intermediate directories. */
export async function workspacePath(rootInput:string,pathInput:string,createParents=false):Promise<string>{
 const root=await fs.realpath(rootInput),target=resolve(root,pathInput),rel=relative(root,target);
 if(!rel||rel==='..'||rel.startsWith('..'+sep)||resolve(target)===root)throw new Error('ruta: debe estar dentro del proyecto.');
 let current=root;
 for(const part of relative(root,dirname(target)).split(sep).filter(Boolean)){
  current=resolve(current,part);
  if(createParents)try{await fs.mkdir(current,{mode:0o700});}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}
  const stat=await fs.lstat(current);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('ruta: directorio simbólico o no permitido.');
 }
 try{const stat=await fs.lstat(target);if(stat.isSymbolicLink()||!stat.isFile())throw new Error('ruta: archivo simbólico o no permitido.');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 return target;
}
export async function writeNewFile(root:string,path:string,contents:string,privateRecord=false):Promise<void>{
 root=await fs.realpath(root);const target=resolve(root,path),rel=relative(resolve(root),target).split(sep);
 if(privateRecord?rel[0]!=='.convete':!['docs','reports'].includes(rel[0]))throw new Error('output: usa docs/ o reports/ dentro del proyecto; las aprobaciones se reservan en .convete/.');
 if(!['.json','.md','.txt'].includes(extname(target)))throw new Error('output: extensión permitida .json, .md o .txt.');
 const checked=await workspacePath(root,target,true);const handle=await fs.open(checked,'wx',0o600);
 try{await handle.writeFile(contents,'utf8');}catch(error){await handle.close();await fs.unlink(checked);throw error;}finally{await handle.close();}
}
export async function readPrivateDirectory(root:string,directory:string):Promise<string[]>{
 try{const marker=await workspacePath(root,`${directory}/.read-boundary`);void marker;return (await fs.readdir(resolve(root,directory))).filter(name=>/^[a-zA-Z0-9-]+\.json$/.test(name)).sort();}
 catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return [];throw error;}
}
