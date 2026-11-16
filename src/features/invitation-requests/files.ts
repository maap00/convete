import type {ResourceManifestEntry,ResourceDestination} from './types';
export const MAX_FILE_BYTES=8*1024*1024;
export const MAX_TOTAL_BYTES=80*1024*1024;
export const MAX_GALLERY_PHOTOS=12;
export const acceptedImages='image/jpeg,image/png,image/webp';
const extensions:Record<string,RegExp>={'image/jpeg':/\.jpe?g$/i,'image/png':/\.png$/i,'image/webp':/\.webp$/i};
export function validateImageFile(file:{name:string;type:string;size:number}):string|undefined {
 if(!Object.hasOwn(extensions,file.type)||!extensions[file.type].test(file.name))return 'Selecciona una fotografía JPEG, PNG o WebP con su extensión correcta. SVG, GIF y HEIC no están admitidos.';
 if(!file.name.trim()||file.name.length>180||/[\u0000-\u001f\u007f/\\]/.test(file.name))return 'Usa un nombre de archivo de hasta 180 caracteres, sin rutas ni caracteres de control.';
 if(!Number.isInteger(file.size)||file.size<=0||file.size>MAX_FILE_BYTES)return 'Cada fotografía debe pesar entre 1 byte y 8 MiB.';
}
export function createManifestEntry(file:{name:string;type:string;size:number},destination:ResourceDestination,id:string):ResourceManifestEntry {
 const error=validateImageFile(file);if(error)throw new Error(error);
 return {id,filename:file.name,mimeType:file.type,size:file.size,destination};
}
/** Local header check complements the MIME/extension check; originals never leave the browser. */
export async function checkImageHeader(file:File):Promise<boolean>{
 const b=new Uint8Array(await file.slice(0,12).arrayBuffer());
 if(file.type==='image/jpeg')return b[0]===255&&b[1]===216&&b[2]===255;
 if(file.type==='image/png')return [137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n);
 if(file.type==='image/webp')return String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP';
 return false;
}
